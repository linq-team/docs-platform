import type { AstroIntegration, AstroIntegrationLogger } from 'astro';
import crypto from 'crypto';
import { readFile } from 'fs/promises';
import path from 'path';
import { getProsePages } from '../shared/getProsePages';
import { getSharedLogger } from '../shared/getSharedLogger';
import { bold } from '../shared/terminalUtils';
import { NormalizedStainlessDocsConfig } from './loadStlDocsConfig';

const DOCS_API_BASE_URL = 'https://api.stainlessapi.com';

export const MAX_BATCH_DOCS = 100;
// Cloud Run has a 32MB request body limit; leave headroom for JSON envelope overhead
export const MAX_BATCH_BYTES = 30 * 1024 * 1024;

// ─── API client ──────────────────────────────────────────────────────

async function docsApiRequest(
  method: string,
  apiPath: string,
  apiKey: string,
  body?: object,
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(`${DOCS_API_BASE_URL}${apiPath}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

// ─── Manifest & diffing ─────────────────────────────────────────────

type LocalDoc = { content: Buffer; sha256: string; source: string };

function sha256(content: Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function buildLocalManifest(pages: string[], outputBasePath: string): Promise<Map<string, LocalDoc>> {
  const docs = new Map<string, LocalDoc>();
  for (const absHtmlPath of pages) {
    const content = await readFile(absHtmlPath);
    const docId = path.relative(outputBasePath, absHtmlPath);
    docs.set(docId, { content, sha256: sha256(content), source: '/' + docId });
  }
  return docs;
}

async function fetchRemoteManifest(
  docsSiteId: string,
  project: string,
  apiKey: string,
  logger: AstroIntegrationLogger,
): Promise<Map<string, string>> {
  try {
    const response = await docsApiRequest(
      'GET',
      `/api/docs-sites/${docsSiteId}/documents?project=${encodeURIComponent(project)}`,
      apiKey,
    );

    if (response.ok) {
      const data = (await response.json()) as {
        documents: { id: string; content_sha256: string }[];
      };
      return new Map(data.documents.map((d) => [d.id, d.content_sha256]));
    }

    logger.error(`Failed to list remote documents (HTTP ${response.status}): ${await response.text()}`);
  } catch (err) {
    logger.error(`Failed to list remote documents: ${err}`);
  }
  return new Map();
}

function diffManifests(
  localDocs: Map<string, LocalDoc>,
  remoteDocs: Map<string, string>,
): { toPut: (LocalDoc & { docId: string })[]; toDelete: string[] } {
  const toPut: (LocalDoc & { docId: string })[] = [];
  for (const [docId, local] of localDocs) {
    if (remoteDocs.get(docId) !== local.sha256) {
      toPut.push({ docId, ...local });
    }
  }

  const toDelete: string[] = [];
  for (const remoteDocId of remoteDocs.keys()) {
    if (!localDocs.has(remoteDocId)) {
      toDelete.push(remoteDocId);
    }
  }

  return { toPut, toDelete };
}

// ─── Batching ────────────────────────────────────────────────────────

export function batchBySize(docs: (LocalDoc & { docId: string })[]): (LocalDoc & { docId: string })[][] {
  const batches: (LocalDoc & { docId: string })[][] = [];
  let current: (LocalDoc & { docId: string })[] = [];
  let currentBytes = 0;

  for (const doc of docs) {
    const docBytes = doc.content.byteLength;

    if (
      current.length > 0 &&
      (current.length >= MAX_BATCH_DOCS || currentBytes + docBytes > MAX_BATCH_BYTES)
    ) {
      batches.push(current);
      current = [];
      currentBytes = 0;
    }

    current.push(doc);
    currentBytes += docBytes;
  }

  if (current.length > 0) batches.push(current);
  return batches;
}

// ─── Import & delete ────────────────────────────────────────────────

type ImportJobResult = { succeeded: number; failed: number; errors: string[] };

async function importDocuments(
  docs: (LocalDoc & { docId: string })[],
  docsSiteId: string,
  project: string,
  apiKey: string,
  logger: AstroIntegrationLogger,
): Promise<ImportJobResult> {
  const totals: ImportJobResult = { succeeded: 0, failed: 0, errors: [] };
  const batches = batchBySize(docs);

  for (const batch of batches) {
    let response: Response;
    try {
      response = await docsApiRequest('POST', `/api/docs-sites/${docsSiteId}/documents/import`, apiKey, {
        project,
        documents: batch.map(({ docId, content, source }) => ({
          id: docId,
          content: content.toString('utf-8'),
          content_type: 'text/html',
          source,
        })),
      });
    } catch (err) {
      logger.error(`Failed to submit import batch: ${err}`);
      totals.failed += batch.length;
      continue;
    }

    if (!response.ok) {
      logger.error(`Failed to submit import batch (HTTP ${response.status}): ${await response.text()}`);
      totals.failed += batch.length;
      continue;
    }

    const { job_id } = (await response.json()) as { job_id: string };
    const result = await pollImportJob(docsSiteId, job_id, apiKey, logger);
    totals.succeeded += result.succeeded;
    totals.failed += result.failed;
    totals.errors.push(...result.errors);
  }

  return totals;
}

async function pollImportJob(
  docsSiteId: string,
  jobId: string,
  apiKey: string,
  logger: AstroIntegrationLogger,
): Promise<ImportJobResult> {
  const maxWait = 5 * 60_000;
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, 2_000));

    let response: Response;
    try {
      response = await docsApiRequest('GET', `/api/docs-sites/${docsSiteId}/documents/jobs/${jobId}`, apiKey);
    } catch (err) {
      logger.error(`Failed to poll import job ${jobId}: ${err}`);
      continue;
    }

    if (!response.ok) {
      logger.error(`Failed to poll import job ${jobId} (HTTP ${response.status}): ${await response.text()}`);
      continue;
    }

    const job = (await response.json()) as {
      status: string;
      succeeded: number;
      failed: number;
      errors: string[] | null;
    };

    if (job.status === 'queued' || job.status === 'processing') continue;

    return { succeeded: job.succeeded, failed: job.failed, errors: job.errors ?? [] };
  }

  logger.error(`Import job ${jobId} timed out after ${maxWait / 1000}s`);
  return { succeeded: 0, failed: 0, errors: [`Job ${jobId} timed out`] };
}

async function deleteDocuments(
  docIds: string[],
  docsSiteId: string,
  project: string,
  apiKey: string,
  logger: AstroIntegrationLogger,
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;

  await Promise.all(
    docIds.map(async (docId) => {
      try {
        const response = await docsApiRequest(
          'DELETE',
          `/api/docs-sites/${docsSiteId}/documents?documentId=${encodeURIComponent(docId)}&project=${encodeURIComponent(project)}`,
          apiKey,
        );
        if (response.ok) {
          succeeded++;
        } else {
          logger.error(`Failed to delete ${docId} (HTTP ${response.status}): ${await response.text()}`);
          failed++;
        }
      } catch (err) {
        logger.error(`Failed to delete ${docId}: ${err}`);
        failed++;
      }
    }),
  );

  return { succeeded, failed };
}

// ─── Sync orchestrator ──────────────────────────────────────────────

async function syncProseDocuments(opts: {
  docsSiteId: string;
  project: string;
  apiKey: string;
  pages: string[];
  outputBasePath: string;
  logger: AstroIntegrationLogger;
}) {
  const { docsSiteId, project, apiKey, pages, outputBasePath, logger } = opts;

  logger.info(bold(`Syncing ${pages.length} prose pages to docs search index`));

  const localDocs = await buildLocalManifest(pages, outputBasePath);
  const remoteDocs = await fetchRemoteManifest(docsSiteId, project, apiKey, logger);
  const { toPut, toDelete } = diffManifests(localDocs, remoteDocs);

  const unchanged = localDocs.size - toPut.length;
  logger.info(bold(`${toPut.length} to upload, ${toDelete.length} to delete, ${unchanged} unchanged`));

  if (toPut.length === 0 && toDelete.length === 0) {
    logger.info('Docs search index is up to date');
    return;
  }

  const uploaded =
    toPut.length > 0
      ? await importDocuments(toPut, docsSiteId, project, apiKey, logger)
      : { succeeded: 0, failed: 0, errors: [] as string[] };

  const deleted =
    toDelete.length > 0
      ? await deleteDocuments(toDelete, docsSiteId, project, apiKey, logger)
      : { succeeded: 0, failed: 0 };

  for (const err of uploaded.errors) {
    logger.error(`Import error: ${err}`);
  }

  const failures = uploaded.failed + deleted.failed;
  if (failures > 0) {
    logger.error(
      `Docs search index sync completed with ${failures} error(s): ${uploaded.succeeded} uploaded, ${deleted.succeeded} deleted`,
    );
  } else {
    logger.info(
      bold(`Docs search index synced: ${uploaded.succeeded} uploaded, ${deleted.succeeded} deleted`),
    );
  }
}

// ─── Astro integration ──────────────────────────────────────────────

export function stainlessDocsVectorProseIndexing(
  config: NormalizedStainlessDocsConfig,
  apiReferenceBasePath: string | null,
): AstroIntegration {
  return {
    name: 'stl-docs-prose-indexing',
    hooks: {
      'astro:build:done': async ({ logger: localLogger, dir }) => {
        const logger = getSharedLogger({ fallback: localLogger });
        const outputBasePath = dir.pathname;

        const project = config.apiReference?.stainlessProject;
        const { STAINLESS_API_KEY: apiKey, STAINLESS_DOCS_SITE_ID: docsSiteId } = process.env;

        if (!apiKey || !project || !docsSiteId) {
          logger.info(
            `Skipping vector prose search indexing: required environment/config variables not set, missing: ${[
              !apiKey && 'STAINLESS_API_KEY',
              !docsSiteId && 'STAINLESS_DOCS_SITE_ID',
              !project && 'stainlessProject in apiReference config',
            ]
              .filter(Boolean)
              .join(', ')}`,
          );
          return;
        }

        const pages = await getProsePages({ apiReferenceBasePath, outputBasePath });
        if (pages.length === 0) {
          logger.info('No prose pages found to index for vector search');
          return;
        }

        await syncProseDocuments({ docsSiteId, project, apiKey, pages, outputBasePath, logger });
      },
    },
  };
}

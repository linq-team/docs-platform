import { describe, expect, it } from 'vitest';
import { batchBySize, MAX_BATCH_BYTES, MAX_BATCH_DOCS } from './proseDocSync';

function makeDoc(docId: string, sizeBytes: number) {
  return {
    docId,
    content: Buffer.alloc(sizeBytes, 'x'),
    sha256: 'fake',
    source: `/${docId}`,
  };
}

describe('batchBySize', () => {
  it('returns empty array for no docs', () => {
    expect(batchBySize([])).toEqual([]);
  });

  it('puts all docs in one batch when under both limits', () => {
    const docs = Array.from({ length: 5 }, (_, i) => makeDoc(`doc-${i}`, 100));
    const batches = batchBySize(docs);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(5);
  });

  it('splits at MAX_BATCH_DOCS', () => {
    const docs = Array.from({ length: MAX_BATCH_DOCS + 10 }, (_, i) => makeDoc(`doc-${i}`, 10));
    const batches = batchBySize(docs);
    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(MAX_BATCH_DOCS);
    expect(batches[1]).toHaveLength(10);
  });

  it('splits when cumulative size exceeds MAX_BATCH_BYTES', () => {
    const docSize = 10 * 1024 * 1024; // 10MB each
    // 4 docs = 40MB > 30MB limit, so should split into [3, 1]
    const docs = Array.from({ length: 4 }, (_, i) => makeDoc(`doc-${i}`, docSize));
    const batches = batchBySize(docs);
    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(3);
    expect(batches[1]).toHaveLength(1);
  });

  it('handles a single doc larger than MAX_BATCH_BYTES', () => {
    const docs = [makeDoc('huge', MAX_BATCH_BYTES + 1)];
    const batches = batchBySize(docs);
    // Still goes into a batch on its own — we can't split a single doc
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(1);
  });

  it('byte limit takes precedence over doc count when hit first', () => {
    // 2 docs of 20MB each = 40MB > 30MB limit, well under 100 doc limit
    const docs = [makeDoc('a', 20 * 1024 * 1024), makeDoc('b', 20 * 1024 * 1024)];
    const batches = batchBySize(docs);
    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(1);
    expect(batches[1]).toHaveLength(1);
  });

  it('creates multiple batches for many large docs', () => {
    const docSize = 8 * 1024 * 1024; // 8MB each
    // 10 docs * 8MB = 80MB, should split into batches of ~3 (24MB each)
    const docs = Array.from({ length: 10 }, (_, i) => makeDoc(`doc-${i}`, docSize));
    const batches = batchBySize(docs);
    // Every batch should be <= MAX_BATCH_BYTES
    for (const batch of batches) {
      const totalBytes = batch.reduce((sum, d) => sum + d.content.byteLength, 0);
      expect(totalBytes).toBeLessThanOrEqual(MAX_BATCH_BYTES);
    }
    // All docs should be accounted for
    const totalDocs = batches.reduce((sum, b) => sum + b.length, 0);
    expect(totalDocs).toBe(10);
  });
});

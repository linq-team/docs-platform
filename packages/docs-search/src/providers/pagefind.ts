import type { GuideResultType } from '../types';
type Pagefind = { search: (query: string) => Promise<PagefindResponse> };
type PagefindResponse = { results: PagefindResult[] };
type PagefindResult = Omit<GuideResultType, 'data'> & { data: () => Promise<GuideResultType['data']> };

async function loadPagefind(path: string): Promise<Pagefind> {
  const url = new URL(path, import.meta.url).href;
  return await import(/* @vite-ignore */ url);
}

export async function guideSearch(
  loadPath: string,
  query: string,
  limit?: number,
): Promise<GuideResultType[]> {
  try {
    const index = await loadPagefind(loadPath);
    const response = await index.search(query);
    const items = limit ? response.results.slice(0, limit) : response.results;
    return Promise.all(items.map((result) => result.data().then((data) => ({ ...result, data }))));
  } catch (error) {
    console.error(error);
    return [];
  }
}

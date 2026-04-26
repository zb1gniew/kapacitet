export type CatalogItem = {
  id: number;
  name: string;
  code?: string | null;
  category?: string | null;
};

export type WorkflowCatalog = {
  skills: CatalogItem[];
  certificates: CatalogItem[];
};

let cachedCatalog: WorkflowCatalog | null = null;
let catalogPromise: Promise<WorkflowCatalog> | null = null;

async function fetchCatalogCollection(
  path: string,
  signal?: AbortSignal,
): Promise<CatalogItem[]> {
  const response = await fetch(path, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load catalog collection from ${path}.`);
  }

  return (await response.json()) as CatalogItem[];
}

export async function fetchCatalog(
  signal?: AbortSignal,
): Promise<WorkflowCatalog> {
  if (cachedCatalog) {
    return cachedCatalog;
  }

  if (catalogPromise && !signal) {
    return catalogPromise;
  }

  const [skills, certificates] = await Promise.all([
    fetchCatalogCollection("/api/catalog/skills", signal),
    fetchCatalogCollection("/api/catalog/certificates", signal),
  ]);

  const catalog = { skills, certificates };
  cachedCatalog = catalog;

  if (!signal) {
    catalogPromise = Promise.resolve(catalog);
  }

  return catalog;
}

import { unstable_cache } from "next/cache";

type Fn = (...args: unknown[]) => Promise<unknown>;

const DEFAULT_TAGS = ["frameid"];

export function createCache<T extends Fn>(
  fn: T,
  keyParts: string[],
  options?: { revalidate?: number; tags?: string[] }
) {
  return unstable_cache(
    fn,
    keyParts,
    {
      revalidate: options?.revalidate ?? 300,
      tags: [...DEFAULT_TAGS, ...(options?.tags ?? [])],
    }
  );
}

export const CACHE_TAGS = {
  templates: "templates",
  themes: "themes",
  sites: "sites",
  content: "content",
  settings: "settings",
} as const;

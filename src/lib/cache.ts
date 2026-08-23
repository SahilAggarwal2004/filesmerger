import { shareTargetStaleEntryMaxAgeMs } from "@/constants";

export const getConsumedMarkerKey = (id: string) => `consumed:${id}`;

export const getShareCacheKey = (id: string) => `/__share__/${id}`;

export async function pruneStaleShareEntries(cache: Cache) {
  const requests = await cache.keys();
  await Promise.all(
    requests.map(async (request) => {
      const response = await cache.match(request);
      const createdAt = response?.headers.get("x-created-at");
      if (createdAt && Date.now() - Number(createdAt) > shareTargetStaleEntryMaxAgeMs) {
        await cache.delete(request);
      }
    }),
  );
}

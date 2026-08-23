import { tryCatchAsync } from "utility-kit";

import { shareTargetCacheName, tools, toolsInfo } from "@/constants";
import { getShareCacheKey, pruneStaleShareEntries } from "@/lib/cache";
import { hasExtension } from "@/lib/utils";
import type { Tool } from "@/types";

const encoder = new TextEncoder();

function createTextFile(title: string, text: string, url: string) {
  let content = "";

  if (title) content += `Title: ${title}\n`;
  if (text) content += `Text: ${text}\n`;
  if (url) content += `Url: ${url}`;

  if (!content) return null;

  return new File([encoder.encode(content)], "shared.txt", { type: "text/plain" });
}

function getShareTarget(files: File[]): Tool {
  const toolsToMatch = tools.filter((tool) => toolsInfo[tool].extensions.length);
  let target: Tool | undefined;

  if (files.length) {
    target = toolsToMatch.find((tool) => files.every((file) => hasExtension(file, toolsInfo[tool].extensions)));
  }

  return target ?? "zip";
}

async function getSharedFiles(request: Request) {
  const form = await request.clone().formData();

  const title = form.get("title")?.toString() ?? "";
  const text = form.get("text")?.toString() ?? "";
  const url = form.get("url")?.toString() ?? "";

  const files = form.getAll("files").filter((value): value is File => value instanceof File);

  const noFiles = files.length === 0;

  if (noFiles) {
    const textFile = createTextFile(title, text, url);
    if (textFile) files.push(textFile);
  }

  return files;
}

self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;
  const { pathname } = new URL(request.url);

  if (request.method !== "POST" || pathname !== "/") return;

  const id = crypto.randomUUID();
  const cacheKey = getShareCacheKey(id);
  const sharedFiles = getSharedFiles(request);

  event.respondWith(
    (async () => {
      const files = await sharedFiles;
      const target = getShareTarget(files);

      return Response.redirect(`${toolsInfo[target].href}?save=true&id=${id}`);
    })(),
  );

  event.waitUntil(
    (async () => {
      const cache = await caches.open(shareTargetCacheName);

      await pruneStaleShareEntries(cache);

      const { success, error } = await tryCatchAsync(async () => {
        const files = await sharedFiles;

        const payload = new FormData();

        for (const file of files) {
          payload.append("files", file);
        }

        await cache.put(cacheKey, new Response(payload, { headers: { "X-Created-At": String(Date.now()) } }));
      });

      if (!success) {
        await cache.put(
          cacheKey,
          new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", "X-Created-At": String(Date.now()) },
          }),
        );
      }
    })(),
  );
});

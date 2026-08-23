import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

import { shareTargetCacheName, shareTargetMaxWaitMs, shareTargetPollIntervalMs, toolsInfo } from "@/constants";
import { getConsumedMarkerKey, getShareCacheKey } from "@/lib/cache";
import { getStorage, setStorage } from "@/lib/storage";
import type { Tool } from "@/types";

export function useShareTargetFiles(tool: Tool) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);

  const { save, id } = router.query;

  useEffect(() => {
    if (!save) return;

    const route = toolsInfo[tool].href;

    if (typeof id !== "string") {
      toast.error("Missing or invalid share link.");
      router.replace(route);
      return;
    }

    if (getStorage(getConsumedMarkerKey(id), false, false)) {
      toast.error("This shared content has already been processed. Please share again.");
      router.replace(route);
      return;
    }

    let cancelled = false;

    const cacheKey = getShareCacheKey(id);
    const deadline = Date.now() + shareTargetMaxWaitMs;

    const poll = async () => {
      while (!cancelled) {
        try {
          const cache = await caches.open(shareTargetCacheName);
          const response = await cache.match(cacheKey);

          if (response) {
            await cache.delete(cacheKey);

            if (cancelled) return;

            setStorage(getConsumedMarkerKey(id), true, false);

            if (!response.ok) {
              const { error } = await response.json().catch(() => ({
                error: "Something went wrong while preparing your file(s).",
              }));

              toast.error(error ?? "Something went wrong while preparing your file(s).");
              router.replace(route);
              return;
            }

            const form = await response.formData();

            const incomingFiles = form.getAll("files").filter((value) => value instanceof File);

            setFiles(incomingFiles);

            await router.replace(route, undefined, { shallow: true });

            return;
          }
        } catch (error) {
          console.error("Error reading shared files:", error);
        }

        if (Date.now() > deadline) {
          toast.error("Taking too long to prepare the shared file(s). Please try again.");
          router.replace(route);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, shareTargetPollIntervalMs));
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [save, id, tool]);

  return files;
}

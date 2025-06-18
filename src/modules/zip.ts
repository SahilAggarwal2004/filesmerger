import { unzip } from "unzipit";
import { makeZip } from "client-zip";
import { FileToProcess, ZipEntry } from "@/types";

let streamSaver;
if (typeof window !== "undefined") {
  import("streamsaver").then((module) => (streamSaver = module.default));
}

function resolveNameCollision(name: string, existingNames: Set<string>): string {
  if (!existingNames.has(name)) {
    existingNames.add(name);
    return name;
  }

  const pathParts = name.split("/");
  const firstPart = pathParts[0];
  const restParts = pathParts.slice(1);

  let counter = 1;
  let fullPath: string;

  do {
    fullPath = [`${firstPart} (${counter})`, ...restParts].join("/");
    counter++;
  } while (existingNames.has(fullPath));

  existingNames.add(fullPath);
  return fullPath;
}

function matchesPattern(fileName: string, pattern: string): boolean {
  if (!pattern.trim()) return true;
  const patterns = pattern.split(",").map((p) => p.trim());
  return patterns.some((p) => {
    if (!p.includes("*")) return fileName.toLowerCase().includes(p.toLowerCase());
    const regexPattern = p.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".");
    const regex = new RegExp(`^${regexPattern}$`, "i");
    return regex.test(fileName);
  });
}

async function processZipFile(file: File, extractTo: string, include: string, existingNames: Set<string>) {
  const zipEntries: ZipEntry[] = [];
  const { entries } = await unzip(file);
  for (const [name, entry] of Object.entries(entries)) {
    if (entry.isDirectory) continue;
    if (!matchesPattern(name, include)) continue;
    const fullPath = extractTo && extractTo !== "." ? `${extractTo}/${name}` : name;
    const resolvedName = resolveNameCollision(fullPath, existingNames);
    const arrayBuffer = await entry.arrayBuffer();
    zipEntries.push({ name: resolvedName, input: new Uint8Array(arrayBuffer), lastModified: entry.lastModDate });
  }
  return zipEntries;
}

async function processRegularFile(file: File, extractTo: string, existingNames: Set<string>): Promise<ZipEntry> {
  const fileName = extractTo ? `${extractTo}/${file.name}` : file.name;
  const resolvedName = resolveNameCollision(fileName, existingNames);
  return { name: resolvedName, input: file, lastModified: new Date(file.lastModified) };
}

export async function mergeZips(filesToProcess: FileToProcess[], onProgress: (current: number, total: number) => void, onSuccess: () => void) {
  const existingNames = new Set<string>();
  const allEntries: ZipEntry[] = [];
  const total = filesToProcess.length;

  for (let i = 0; i < total; i++) {
    const { file, extractTo = "", include = "" } = filesToProcess[i];
    try {
      const isZip = file.type === "application/zip" || file.name.toLowerCase().endsWith(".zip");
      if (isZip) {
        const zipEntries = await processZipFile(file, extractTo || file.name.replace(/\.zip$/i, ""), include, existingNames);
        allEntries.push(...zipEntries);
      } else {
        const entry = await processRegularFile(file, extractTo, existingNames);
        allEntries.push(entry);
      }
      onProgress(i + 1, total);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      throw error;
    }
  }

  const zipStream = makeZip(allEntries);
  const fileStream = streamSaver!.createWriteStream("merged.zip");
  const controller = new AbortController();

  zipStream
    .pipeTo(fileStream, { signal: controller.signal })
    .then(onSuccess)
    .catch(() => alert("Failed to download merged ZIP file."));

  return controller;
}

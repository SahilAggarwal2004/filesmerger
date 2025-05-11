import { sizes } from "../constants";
import { Unit } from "../types";

const { KB, MB, GB } = sizes;

export const bytesToUnit = (bytes: number): Unit => (bytes >= GB ? "GB" : bytes >= MB ? "MB" : bytes >= KB ? "KB" : "B");

export const bytesToSize = (bytes: number, unit: Unit) => bytes / sizes[unit];

export const calcSize = (files: Pick<File, "size">[]) => files.reduce((acc, file) => acc + file.size, 0);

export function download(url: string, name: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
}

export function formatFileSize(bytes: number) {
  const unit = bytesToUnit(bytes);
  return `${bytes && bytesToSize(bytes, unit).toFixed(2)} ${unit}`;
}

export const generateId = () => crypto.randomUUID();

export const minmax = (a: number, b: number, useMin: boolean) => (useMin ? Math.min(a, b) : Math.max(a, b));

export function rangeToPages(range: string) {
  if (!range) return null;
  return range
    .split(",")
    .flatMap((part) => {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((n) => +n.trim());
        const step = start <= end ? 1 : -1;
        return Array.from({ length: Math.abs(end - start) + 1 }, (_, i) => start + i * step - 1);
      }
      return [+part.trim() - 1];
    })
    .filter((n) => !isNaN(n) && n >= 0);
}

export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

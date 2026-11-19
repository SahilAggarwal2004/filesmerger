import { sizes } from "../constants";
import type { Constraint, Unit } from "../types";

const { KB, MB, GB } = sizes;

export const bytesToUnit = (bytes: number): Unit =>
  bytes >= GB ? "GB" : bytes >= MB ? "MB" : bytes >= KB ? "KB" : "B";

export const bytesToSize = (bytes: number, unit: Unit) => bytes / sizes[unit];

export const calcSize = (files: Pick<File, "size">[]) =>
  files.reduce((acc, file) => acc + file.size, 0);

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function download(url: string, name: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
}

export function formatFileSize(bytes: number) {
  const unit = bytesToUnit(bytes);
  return `${bytesToSize(bytes, unit).toFixed(2)} ${unit}`;
}

export const generateId = () => crypto.randomUUID();

export function hasExtension(file: File, extensions: string[]) {
  if (!extensions.length) return false;

  const dot = file.name.lastIndexOf(".");
  return dot !== -1 && extensions.includes(file.name.slice(dot).toLowerCase());
}

export function normalize(
  value: string,
  { min = -Infinity, max = Infinity }: Constraint,
  defaultValue?: number,
) {
  if (!value.trim()) return defaultValue;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;

  return clamp(parsed, min, max);
}

export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

import { sizes } from "../constants";
import { Constraint, Unit } from "../types";

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

export const normalize = (value: string, { min = -Infinity, max = Infinity }: Constraint, defaultValue?: number) => (value ? Math.min(Math.max(+value, min), max) : defaultValue);

export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

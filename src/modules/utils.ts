import { sizes } from "../constants";
import { Unit } from "../types";

const { KB, MB, GB } = sizes;

export const bytesToUnit = (bytes: number): Unit => (bytes >= GB ? "GB" : bytes >= MB ? "MB" : bytes >= KB ? "KB" : "B");

export const bytesToSize = (bytes: number, unit: Unit) => bytes / sizes[unit];

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

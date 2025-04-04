import type { ImageFormat, DimensionStrategy } from "./types";

export const imageFormatDescriptions = {
  jpeg: "JPEG (smaller size, lossy)",
  png: "PNG (larger size, lossless)",
  webp: "WebP (best compression, modern browsers)",
};

export const imageFormats = Object.keys(imageFormatDescriptions) as ImageFormat[];

export const mergeDirections = ["vertical", "horizontal"] as const;

export const sizes = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824 }; // In bytes

export const dimensionStrategyDescriptions = {
  minimum: "Minimum dimensions",
  maximum: "Maximum dimensions",
  original: "Original dimensions with background",
};

export const dimensionStrategies = Object.keys(dimensionStrategyDescriptions) as DimensionStrategy[];
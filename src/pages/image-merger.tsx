/* eslint-disable @next/next/no-img-element */
// pages/image-merger.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import Head from "next/head";
import { ImageFormat, LoadedImage, MergedImage, MergeDirection } from "@/types";
import { download, formatFileSize } from "@/modules/utils";
import { imageFormatDescriptions, imageFormats } from "@/constants";
import { loadImages } from "@/modules/image";

export default function ImageMerger() {
  const [loadedImages, setLoadedImages] = useState<LoadedImage[]>([]);
  const [mergedImage, setMergedImage] = useState<MergedImage>(null);
  const [mergeDirection, setMergeDirection] = useState<MergeDirection>("vertical");
  const [outputFormat, setOutputFormat] = useState<ImageFormat>("jpeg");
  const [quality, setQuality] = useState(0.8);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSize = useMemo(() => loadedImages.reduce((acc, img) => acc + img.size, 0), [loadedImages]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { files } = event.target;
    if (!files?.length) return;
    setLoadedImages([]);
    setMergedImage(null);
    loadImages(files).then((images) => setLoadedImages(images.filter((img) => img !== null)));
  }

  function mergeImages() {
    if (loadedImages.length < 2) return alert("Please select at least 2 images to merge.");

    const isHorizontal = mergeDirection === "horizontal";
    let canvasWidth = 0;
    let canvasHeight = 0;

    loadedImages.forEach(({ element: { width, height } }) => {
      if (isHorizontal) {
        canvasWidth += width;
        canvasHeight = Math.max(canvasHeight, height);
      } else {
        canvasHeight += height;
        canvasWidth = Math.max(canvasWidth, width);
      }
    });

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return alert("Unable to create canvas context. Please try a different browser.");

    let xOffset = 0;
    let yOffset = 0;
    loadedImages.forEach(({ element }) => {
      ctx.drawImage(element, xOffset, yOffset);
      if (isHorizontal) xOffset += element.width;
      else yOffset += element.height;
    });

    canvas.toBlob(
      (blob) => {
        if (blob) setMergedImage({ url: URL.createObjectURL(blob), size: blob.size });
        else alert("Failed to create image. Please try again with different images or format.");
      },
      `image/${outputFormat}`,
      outputFormat === "png" ? undefined : quality
    );
  }

  function clearAll() {
    setLoadedImages([]);
    setMergedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => {
    return () => {
      if (mergedImage) URL.revokeObjectURL(mergedImage.url);
    };
  }, [mergedImage]);

  return (
    <>
      <Head>
        <title>Image Merger | FilesMerger</title>
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <h1 className="text-3xl font-bold text-white">Image Merger</h1>
            </div>

            <div className="p-6 space-y-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select Images</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-700/30 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-8 h-8 text-slate-500 dark:text-slate-400 mb-3"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Select multiple image files</p>
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                  </label>
                </div>
                {totalSize > 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Total size: {formatFileSize(totalSize)}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Merge Direction</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          className="form-radio text-blue-600 focus:ring-blue-500"
                          value="vertical"
                          checked={mergeDirection === "vertical"}
                          onChange={() => setMergeDirection("vertical")}
                        />
                        <span className="ml-2 text-slate-700 dark:text-slate-300">Vertical</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          className="form-radio text-blue-600 focus:ring-blue-500"
                          value="horizontal"
                          checked={mergeDirection === "horizontal"}
                          onChange={() => setMergeDirection("horizontal")}
                        />
                        <span className="ml-2 text-slate-700 dark:text-slate-300">Horizontal</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Output Format</label>
                    <select
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-white"
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value as ImageFormat)}
                    >
                      {imageFormats.map((format) => (
                        <option key={format} value={format}>
                          {imageFormatDescriptions[format]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {outputFormat !== "png" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Quality: {quality}</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {loadedImages.length !== 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Selected Images</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {loadedImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                          <img src={img.element.src} alt={`Preview ${index}`} className="w-full h-full object-contain" />
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <p className="truncate">{img.name}</p>
                          <p>
                            {img.element.width}×{img.element.height} • {formatFileSize(img.size)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  disabled={loadedImages.length < 2}
                  onClick={mergeImages}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg shadow-sm transition-colors disabled:cursor-not-allowed"
                >
                  Merge Images
                </button>
                <button
                  disabled={!mergedImage}
                  onClick={() => download(mergedImage!.url, `merged-image.${outputFormat}`)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg shadow-sm transition-colors disabled:cursor-not-allowed"
                >
                  Download Result
                </button>
                <button
                  disabled={!loadedImages.length}
                  onClick={clearAll}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:bg-slate-100 dark:disabled:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:text-slate-400 dark:disabled:text-slate-600 rounded-lg shadow-sm transition-colors disabled:cursor-not-allowed"
                >
                  Clear All
                </button>
              </div>

              {mergedImage && (
                <>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">File Size Analysis</h3>
                    <div className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                      <p>Original images: {formatFileSize(totalSize)}</p>
                      <p>
                        Merged image: {formatFileSize(mergedImage.size)} ({Math.round((mergedImage.size / totalSize) * 100)}%)
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Merged Result</h3>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 p-4">
                      <img src={mergedImage.url} alt="Merged result" className="max-w-full h-auto mx-auto" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

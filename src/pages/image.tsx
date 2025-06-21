/* eslint-disable no-var */
/* eslint-disable @next/next/no-img-element */
import Head from "next/head";
import { useState, useEffect, useMemo, isValidElement } from "react";
import { BsImages } from "react-icons/bs";
import ReorderList, { ReorderIcon } from "react-reorder-list";

import {
  imageFormatDescriptions,
  imageFormats,
  mergeDirections,
  dimensionStrategies,
  dimensionStrategyDescriptions,
  modes,
  transformOptions,
  transformOptionDescriptions,
  constraints,
} from "@/constants";
import { loadImages, processAdvancedImage } from "@/modules/image";
import { calcSize, download, formatFileSize, minmax, sum, generateId, normalize } from "@/modules/utils";
import { ImageFormat, LoadedImage, MergedImage, MergeDirection, DimensionStrategy, ImageSelections, ProcessedImage, TransformOption } from "@/types";
import FileDropZone from "@/components/FileDropZone";

const { scaleConstraints, targetWidthConstraints, targetHeightConstraints, cropXConstraints, cropYConstraints, cropWidthConstraints, cropHeightConstraints, qualityConstraints } =
  constraints;

export default function ImageMerger() {
  const [loadedImages, setLoadedImages] = useState<LoadedImage[]>([]);
  const [selectedMode, setSelectedMode] = useState<Mode>("simple");
  const [advancedSelections, setAdvancedSelections] = useState<ImageSelections["advanced"]>([]);
  const [mergedImage, setMergedImage] = useState<MergedImage>(null);
  const [mergeDirection, setMergeDirection] = useState<MergeDirection>("vertical");
  const [dimensionStrategy, setDimensionStrategy] = useState<DimensionStrategy>("minimum");
  const [outputFormat, setOutputFormat] = useState<ImageFormat>("jpeg");
  const [quality, setQuality] = useState(0.8);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  const totalSize = useMemo(() => calcSize(loadedImages), [loadedImages]);
  const isOriginal = dimensionStrategy === "original";

  const handleAdvancedUpdate = (id: string, update: Partial<AdvancedSelection<ImageSelections>>) =>
    setAdvancedSelections((prev) => prev.map((sel) => (sel.id === id ? { ...sel, ...update } : sel)));

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { files } = event.target;
    if (files?.length) {
      setMergedImage(null);
      loadImages(files).then((images) => setLoadedImages((prev) => prev.concat(images.filter((img) => img !== null))));
    }
    event.target.value = "";
  }

  function removeFile(id: string) {
    setLoadedImages((prev) => prev.filter((file) => file.id !== id));
    setAdvancedSelections([]);
  }

  function mergeImages() {
    const canvas = document.createElement("canvas");
    const isHorizontal = mergeDirection === "horizontal";
    const isMinimum = dimensionStrategy === "minimum";

    let processedImages: ProcessedImage[];

    if (selectedMode === "simple") processedImages = loadedImages.map(({ element }) => ({ element, width: element.width, height: element.height }));
    else processedImages = advancedSelections.map((selection) => processAdvancedImage(loadedImages[selection.imageIndex].element, selection)).filter((image) => image !== null);

    if (!processedImages.length) return;

    if (isHorizontal) {
      var canvasHeight = isMinimum ? Infinity : 0;
      processedImages.forEach(({ height }) => (canvasHeight = minmax(canvasHeight, height, isMinimum)));
      var widths = processedImages.map(({ width, height }) => (isOriginal ? width : (width * canvasHeight) / height));
      var canvasWidth = sum(widths);
    } else {
      canvasWidth = isMinimum ? Infinity : 0;
      processedImages.forEach(({ width }) => (canvasWidth = minmax(canvasWidth, width, isMinimum)));
      var heights = processedImages.map(({ width, height }) => (isOriginal ? height : (height * canvasWidth) / width));
      canvasHeight = sum(heights);
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return alert("Unable to create canvas context. Please try a different browser.");

    if (isOriginal) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    if (isHorizontal) {
      let offset = 0;
      processedImages.forEach(({ element, height }, index) => {
        if (isOriginal) ctx.drawImage(element, offset, (canvasHeight - height) / 2, widths[index], height);
        else ctx.drawImage(element, offset, 0, widths[index], canvasHeight);
        offset += widths[index];
      });
    } else {
      let offset = 0;
      processedImages.forEach(({ element, width }, index) => {
        if (isOriginal) ctx.drawImage(element, (canvasWidth - width) / 2, offset, width, heights[index]);
        else ctx.drawImage(element, 0, offset, canvasWidth, heights[index]);
        offset += heights[index];
      });
    }

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
    setAdvancedSelections([]);
    setMergedImage(null);
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

      <main className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
              <h1 className="text-3xl font-bold text-white">Image Merger</h1>
            </div>

            <div className="p-5 space-y-8">
              <FileDropZone tool="image" Icon={BsImages} handleFileChange={handleFileChange} totalSize={totalSize} />

              {loadedImages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    {modes.map((mode) => (
                      <button
                        key={mode}
                        className={`px-4 py-2 rounded-lg text-sm font-medium shadow capitalize ${
                          mode === selectedMode ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 dark:text-white"
                        }`}
                        onClick={() => setSelectedMode(mode)}
                      >
                        {mode} Mode
                      </button>
                    ))}
                  </div>

                  {selectedMode === "simple" ? (
                    <div className="space-y-2">
                      <ReorderList
                        useOnlyIconToDrag
                        watchChildrenUpdates
                        animationDuration={200}
                        props={{ className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" }}
                        onPositionChange={({ newItems }) => {
                          const reorderedImages = newItems.flatMap((item) => (isValidElement(item) ? loadedImages.find(({ id }) => item.key?.includes(id))! : []));
                          setLoadedImages(reorderedImages);
                        }}
                      >
                        {loadedImages.map(({ id, element, name, size }, index) => (
                          <div key={id} className="relative group">
                            <ReorderIcon className="absolute top-1 left-1 z-10 cursor-grab rounded-full scale-90 p-1 shadow bg-white/50 dark:bg-slate-900/50" />
                            <button
                              onClick={() => removeFile(id)}
                              className="absolute top-1.5 right-1 z-10 text-red-500 hover:text-red-700 rounded-full w-6 h-6 flex items-center justify-center shadow bg-white/50 dark:bg-slate-900/50"
                              aria-label="Remove image"
                            >
                              ✕
                            </button>
                            <div className="aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                              <img src={element.src} alt={`Preview ${index}`} className="w-full h-full object-contain" />
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <p className="truncate">{name}</p>
                              <p>
                                {element.width}×{element.height} • {formatFileSize(size)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </ReorderList>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ReorderList
                        useOnlyIconToDrag
                        watchChildrenUpdates
                        animationDuration={200}
                        props={{ className: "space-y-2" }}
                        onPositionChange={({ newItems }) => {
                          const reorderedSelections = newItems.flatMap((item) => (isValidElement(item) ? advancedSelections.find(({ id }) => item.key?.includes(id))! : []));
                          setAdvancedSelections(reorderedSelections);
                        }}
                      >
                        {advancedSelections.map(({ id, imageIndex, transformOption, fillColor }) => {
                          const { element } = loadedImages[imageIndex];

                          return (
                            <div key={id} className="flex items-start py-2 border rounded-xl shadow-sm text-sm">
                              <ReorderIcon className="w-5 mt-2 mx-1.5 shrink-0" />
                              <div className="flex-1 space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Image</label>
                                  <select
                                    value={imageIndex}
                                    onChange={(e) => handleAdvancedUpdate(id, { imageIndex: +e.target.value })}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                  >
                                    {loadedImages.map(({ name }, i) => (
                                      <option key={i} value={i}>
                                        {name}
                                      </option>
                                    ))}
                                  </select>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Original: {element.width}×{element.height}px
                                  </p>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Transform Method</label>
                                  <select
                                    value={transformOption}
                                    onChange={(e) => handleAdvancedUpdate(id, { transformOption: e.target.value as TransformOption })}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                  >
                                    {transformOptions.map((option) => (
                                      <option key={option} value={option}>
                                        {transformOptionDescriptions[option]}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {transformOption === "resize" && (
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Scale Factor</label>
                                    <input
                                      type="number"
                                      {...scaleConstraints}
                                      placeholder={`1 (${scaleConstraints.min} - ${scaleConstraints.max})`}
                                      onChange={(e) => handleAdvancedUpdate(id, { scaleFactor: normalize(e.target.value, scaleConstraints, 1) })}
                                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                    />
                                  </div>
                                )}

                                {transformOption === "stretch" && (
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Width (px)</label>
                                      <input
                                        type="number"
                                        {...targetWidthConstraints}
                                        placeholder={element.width.toString()}
                                        onChange={(e) => handleAdvancedUpdate(id, { targetWidth: normalize(e.target.value, targetWidthConstraints) })}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Height (px)</label>
                                      <input
                                        type="number"
                                        {...targetHeightConstraints}
                                        placeholder={element.height.toString()}
                                        onChange={(e) => handleAdvancedUpdate(id, { targetHeight: normalize(e.target.value, targetHeightConstraints) })}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                      />
                                    </div>
                                  </div>
                                )}

                                {transformOption === "crop" && (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Crop Start X (px)</label>
                                        <input
                                          type="number"
                                          {...cropXConstraints}
                                          placeholder="0"
                                          onChange={(e) => handleAdvancedUpdate(id, { cropX: normalize(e.target.value, cropXConstraints) })}
                                          className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Crop Start Y (px)</label>
                                        <input
                                          type="number"
                                          {...cropYConstraints}
                                          placeholder="0"
                                          onChange={(e) => handleAdvancedUpdate(id, { cropY: normalize(e.target.value, cropYConstraints) })}
                                          className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Crop Width (px)</label>
                                        <input
                                          type="number"
                                          {...cropWidthConstraints}
                                          placeholder={element.width.toString()}
                                          onChange={(e) => handleAdvancedUpdate(id, { cropWidth: normalize(e.target.value, cropWidthConstraints) })}
                                          className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Crop Height (px)</label>
                                        <input
                                          type="number"
                                          {...cropHeightConstraints}
                                          placeholder={element.height.toString()}
                                          onChange={(e) => handleAdvancedUpdate(id, { cropHeight: normalize(e.target.value, cropHeightConstraints) })}
                                          className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fill Color</label>
                                      <input
                                        type="color"
                                        value={fillColor}
                                        onChange={(e) => handleAdvancedUpdate(id, { fillColor: e.target.value })}
                                        className="h-8 w-16 rounded border border-slate-300 dark:border-slate-600"
                                      />
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      Leave crop dimensions empty to use full image. Fill color is used when crop area extends beyond image boundaries.
                                    </p>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => setAdvancedSelections((prev) => prev.filter((sel) => sel.id !== id))}
                                className="text-red-500 hover:text-red-700 w-5 mt-2 mx-1.5 shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </ReorderList>
                      <button
                        onClick={() => setAdvancedSelections((prev) => [...prev, { id: generateId(), imageIndex: 0, transformOption: "resize", fillColor: "#ffffff" }])}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg shadow text-sm"
                      >
                        + Add Image Selection
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Merge Direction</label>
                    <div className="flex space-x-4">
                      {mergeDirections.map((direction) => (
                        <label key={direction} className="flex items-center">
                          <input
                            type="radio"
                            className="form-radio text-blue-600 focus:ring-blue-500"
                            value={direction}
                            checked={mergeDirection === direction}
                            onChange={() => setMergeDirection(direction)}
                          />
                          <span className="ml-2 text-slate-700 dark:text-slate-300 capitalize">{direction}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dimension Handling</label>
                    <div className="space-y-2">
                      {dimensionStrategies.map((strategy) => (
                        <label key={strategy} className="flex items-center">
                          <input
                            type="radio"
                            className="form-radio text-blue-600 focus:ring-blue-500"
                            value={strategy}
                            checked={dimensionStrategy === strategy}
                            onChange={() => setDimensionStrategy(strategy)}
                          />
                          <span className="ml-2 text-slate-700 dark:text-slate-300">{dimensionStrategyDescriptions[strategy]}</span>
                        </label>
                      ))}

                      {isOriginal && (
                        <div className="ml-6 mt-2 flex space-x-3 items-center">
                          <label className="block text-sm text-slate-600 dark:text-slate-400">Background Color</label>
                          <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="h-7 w-12 p-0 rounded" />
                        </div>
                      )}
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
                        {...qualityConstraints}
                        value={quality}
                        onChange={(e) => setQuality(normalize(e.target.value, qualityConstraints)!)}
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

              <div className="flex flex-wrap gap-3">
                <button
                  disabled={selectedMode === "simple" ? !loadedImages.length : !advancedSelections.length}
                  onClick={mergeImages}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg shadow-sm transition-colors disabled:cursor-not-allowed"
                >
                  Merge Images
                </button>
                <button
                  disabled={!mergedImage}
                  onClick={() => download(mergedImage!.url, `merged.${outputFormat}`)}
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

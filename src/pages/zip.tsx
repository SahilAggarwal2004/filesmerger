import Head from "next/head";
import { useState, useMemo } from "react";
import { BsFileZip } from "react-icons/bs";
import ReorderList, { ReorderIcon } from "react-reorder-list";

import { modes } from "@/constants";
import { calcSize, formatFileSize, generateId } from "@/lib/utils";
import { FileToProcess, ZipFile, ZipSelections } from "@/types";
import FileDropZone from "@/components/FileDropZone";
import { mergeZips } from "@/lib/zip";

export default function ZipMerger() {
  const [zipFiles, setZipFiles] = useState<ZipFile[]>([]);
  const [selectedMode, setSelectedMode] = useState<Mode>("simple");
  const [simpleSelections, setSimpleSelections] = useState<ZipSelections["simple"]>({});
  const [advancedSelections, setAdvancedSelections] = useState<ZipSelections["advanced"]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [isDownloadComplete, setIsDownloadComplete] = useState(false);

  const totalSize = useMemo(() => calcSize(zipFiles.map(({ file }) => file)), [zipFiles]);

  const handleAdvancedUpdate = (id: string, update: Partial<AdvancedSelection<ZipSelections>>) =>
    setAdvancedSelections((prev) => prev.map((sel) => (sel.id === id ? { ...sel, ...update } : sel)));

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files!);
    if (files.length) {
      setZipFiles((prev) =>
        prev.concat(
          files.map((file) => ({
            id: generateId(),
            file,
            name: file.name,
            size: file.size,
            isZip: file.type === "application/zip" || file.name.toLowerCase().endsWith(".zip"),
          })),
        ),
      );
      setIsDownloadComplete(false);
    }
    event.target.value = "";
  }

  function removeFile(id: string) {
    setZipFiles((prev) => prev.filter((file) => file.id !== id));
    setAdvancedSelections([]);
  }

  async function handleMerge() {
    setIsProcessing(true);
    setProgress(0);
    setIsDownloadComplete(false);
    try {
      let filesToProcess: FileToProcess[] = [];
      if (selectedMode === "simple")
        filesToProcess = zipFiles.map(({ id, file, isZip, name }) => ({
          file,
          isZip,
          extractTo: isZip ? name.replace(/\.zip$/i, "") : simpleSelections[id],
          include: isZip ? simpleSelections[id] : "",
        }));
      else
        filesToProcess = advancedSelections.map(({ fileIndex, extractTo, include }) => {
          const { file, isZip } = zipFiles[fileIndex];
          return { file, isZip, extractTo, include };
        });

      const controller = await mergeZips(
        filesToProcess,
        (current: number, total: number) => setProgress(Math.round((current / total) * 100)),
        () => setIsDownloadComplete(true),
      );

      function unloadHandler() {
        controller.abort();
        window.removeEventListener("beforeunload", unloadHandler);
      }
      window.addEventListener("beforeunload", unloadHandler);
    } catch (error) {
      console.error("Error merging ZIP files:", error);
      alert("Failed to merge ZIP files. Please try again.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }

  function clearAll() {
    setZipFiles([]);
    setSimpleSelections({});
    setAdvancedSelections([]);
    setProgress(0);
    setIsDownloadComplete(false);
  }

  return (
    <>
      <Head>
        <title>ZIP Merger | FilesMerger</title>
      </Head>

      <main className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-5">
              <h1 className="text-3xl font-bold text-white">ZIP Merger</h1>
            </div>

            <fieldset disabled={isProcessing}>
              <div className="block p-5 space-y-8">
                <FileDropZone tool="zip" Icon={BsFileZip} handleFileChange={handleFileChange} totalSize={totalSize} />

                {zipFiles.length > 0 && (
                  <div>
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
                      <div className="space-y-4">
                        <ReorderList
                          useOnlyIconToDrag
                          preserveOrder={false}
                          animationDuration={200}
                          props={{ className: "space-y-2" }}
                          onPositionChange={({ newOrder }) => {
                            const reorderedFiles = newOrder.flatMap((key) => zipFiles.find(({ id }) => key === id) || []);
                            setZipFiles(reorderedFiles);
                          }}
                        >
                          {zipFiles.map(({ id, name, size, isZip }) => (
                            <div key={id} className="flex items-start py-2 border rounded-xl shadow-sm text-sm">
                              <ReorderIcon className="w-5 mt-2 mx-1.5 shrink-0" />
                              <div className="flex-1 space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">File</label>
                                  <div className="flex items-center gap-2 w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white">
                                    <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{name}</span>
                                    {isZip && <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded shrink-0">ZIP</span>}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {formatFileSize(size)} • {isZip ? "Will be extracted" : "Will be added as-is"}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{isZip ? "Include Pattern" : "Folder Path"}</label>
                                    <input
                                      type="text"
                                      placeholder={isZip ? "e.g. *.txt, *.png" : "e.g. documents, images"}
                                      value={simpleSelections[id] ?? ""}
                                      onChange={(e) => setSimpleSelections({ ...simpleSelections, [id]: e.target.value })}
                                      className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                  </div>
                                </div>
                              </div>
                              <button onClick={() => removeFile(id)} className="text-red-500 hover:text-red-700 w-5 mt-2 mx-1.5 shrink-0">
                                ✕
                              </button>
                            </div>
                          ))}
                        </ReorderList>
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">
                          ZIP files are extracted to named folders, other files go to specified folders (root is default). Include patterns filter ZIP contents.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <ReorderList
                          useOnlyIconToDrag
                          preserveOrder={false}
                          animationDuration={200}
                          props={{ className: "space-y-2" }}
                          onPositionChange={({ newOrder }) => {
                            const reorderedSelections = newOrder.flatMap((key) => advancedSelections.find(({ id }) => key === id) || []);
                            setAdvancedSelections(reorderedSelections);
                          }}
                        >
                          {advancedSelections.map(({ id, fileIndex, extractTo = "", include = "" }) => {
                            const isZip = zipFiles[fileIndex]?.isZip;
                            return (
                              <div key={id} className="flex items-start py-2 border rounded-xl shadow-sm text-sm">
                                <ReorderIcon className="w-5 mt-2 mx-1.5 shrink-0" />
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select File</label>
                                    <select
                                      value={fileIndex}
                                      onChange={(e) => handleAdvancedUpdate(id, { fileIndex: +e.target.value })}
                                      className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                    >
                                      {zipFiles.map(({ name, isZip }, i) => (
                                        <option key={i} value={i}>
                                          {name} {isZip ? "(ZIP)" : ""}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{isZip ? "Extract to Folder" : "Folder Path"}</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. documents, images"
                                        value={extractTo}
                                        onChange={(e) => handleAdvancedUpdate(id, { extractTo: e.target.value })}
                                        className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Include Pattern</label>
                                      <input
                                        type="text"
                                        disabled={!isZip}
                                        placeholder="e.g. *.txt, *.png"
                                        value={include}
                                        onChange={(e) => handleAdvancedUpdate(id, { include: e.target.value })}
                                        className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                      />
                                    </div>
                                  </div>
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
                        {advancedSelections.length > 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Files are extracted to specified folders (root is default). Include patterns filter ZIP contents.
                          </p>
                        )}
                        <button
                          onClick={() =>
                            setAdvancedSelections((prev) => [
                              ...prev,
                              {
                                id: generateId(),
                                fileIndex: 0,
                              },
                            ])
                          }
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg shadow text-sm"
                        >
                          + Add File Selection
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isProcessing && progress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>Processing...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleMerge}
                    disabled={(selectedMode === "simple" ? !zipFiles.length : !advancedSelections.length) || isProcessing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? "Processing..." : "Merge & Download"}
                  </button>
                  <button
                    disabled={!zipFiles.length || isProcessing}
                    onClick={clearAll}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg shadow disabled:cursor-not-allowed"
                  >
                    Clear All
                  </button>
                </div>

                {zipFiles.length > 0 && isDownloadComplete && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-2">Download Complete</h3>
                      <p className="text-sm text-green-600 dark:text-green-400">Your merged ZIP file has been downloaded successfully.</p>
                    </div>
                  </div>
                )}
              </div>
            </fieldset>
          </div>
        </div>
      </main>
    </>
  );
}

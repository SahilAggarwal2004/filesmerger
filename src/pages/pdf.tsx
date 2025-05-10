import Head from "next/head";
import { useState, useRef, useEffect, useMemo, isValidElement } from "react";
import { BsFiletypePdf } from "react-icons/bs";
import ReorderList, { ReorderIcon } from "react-reorder-list";

import { modes } from "@/constants";
import { mergePdfs } from "@/modules/pdf";
import { calcSize, download, formatFileSize } from "@/modules/utils";
import { Mode, Selections } from "@/types";

export default function PdfMerger() {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [simpleSelections, setSimpleSelections] = useState<Selections["simple"]>({});
  const [advancedSelections, setAdvancedSelections] = useState<Selections["advanced"]>([]);
  const [selectedMode, setSelectedMode] = useState<Mode>("simple");
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSize = useMemo(() => calcSize(pdfFiles), [pdfFiles]);

  const handleAdvancedUpdate = (id: string, update: Partial<Selections["advanced"][number]>) =>
    setAdvancedSelections((prev) => prev.map((sel) => (sel.id === id ? { ...sel, ...update } : sel)));

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { files } = event.target;
    if (!files?.length) return;
    setPdfFiles(Array.from(files));
    setSimpleSelections({});
    setAdvancedSelections([]);
    setMergedPdfUrl(null);
  }

  async function handleMerge() {
    const [mergedPdf, handleFile] = await mergePdfs();
    if (selectedMode === "simple") for (const file of pdfFiles) await handleFile(file, simpleSelections[file.name]);
    else for (const { pdfIndex, range } of advancedSelections) await handleFile(pdfFiles[pdfIndex], range);
    const blob = new Blob([await mergedPdf.save()], { type: "application/pdf" });
    setMergedPdfUrl(URL.createObjectURL(blob));
  }

  function clearAll() {
    setPdfFiles([]);
    setSimpleSelections({});
    setAdvancedSelections([]);
    setMergedPdfUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => {
    return () => {
      if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
    };
  }, [mergedPdfUrl]);

  return (
    <>
      <Head>
        <title>PDF Merger | FilesMerger</title>
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <h1 className="text-3xl font-bold text-white">PDF Merger</h1>
            </div>

            <div className="p-6 space-y-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select PDFs</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-700/30 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <BsFiletypePdf className="w-8 h-8 text-slate-500 dark:text-slate-400 mb-3 scale-90" />
                      <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Select multiple pdf files</p>
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf" multiple onChange={handleFileChange} />
                  </label>
                </div>
                {totalSize > 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Total size: {formatFileSize(totalSize)}</p>}
              </div>

              {pdfFiles.length > 0 && (
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
                    <div className="space-y-2">
                      {pdfFiles.map(({ name }) => (
                        <div key={name} className="flex gap-2 items-center px-3 py-2 border rounded-xl shadow-sm text-sm w-full">
                          <span className="max-w-1/3 min-w-max p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white">
                            {name}
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. 1-5, 8, 11-13"
                            value={simpleSelections[name] || ""}
                            onChange={(e) => setSimpleSelections({ ...simpleSelections, [name]: e.target.value })}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                          />
                        </div>
                      ))}
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">Leave the range blank to include the entire PDF.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ReorderList
                        useOnlyIconToDrag
                        watchChildrenUpdates
                        animationDuration={150}
                        props={{ className: "space-y-2" }}
                        onPositionChange={({ newItems }) => {
                          const reorderedSelections = newItems.flatMap((item) => (isValidElement(item) ? advancedSelections.find(({ id }) => item.key?.includes(id))! : []));
                          setAdvancedSelections(reorderedSelections);
                        }}
                      >
                        {advancedSelections.map(({ id, pdfIndex, range }) => (
                          <div key={id} className="flex gap-2 items-center px-2.5 py-2 border rounded-xl shadow-sm text-sm w-full">
                            <ReorderIcon />
                            <select
                              value={pdfIndex}
                              onChange={(e) => handleAdvancedUpdate(id, { pdfIndex: +e.target.value })}
                              className="max-w-1/3 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                              {pdfFiles.map((file, i) => (
                                <option key={i} value={i}>
                                  {file.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="e.g. 1-5, 8, 11-13"
                              value={range}
                              onChange={(e) => handleAdvancedUpdate(id, { range: e.target.value })}
                              className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                            <button onClick={() => setAdvancedSelections((prev) => prev.filter((sel) => sel.id !== id))} className="text-red-500 hover:text-red-700 ml-auto mr-1.5">
                              ✕
                            </button>
                          </div>
                        ))}
                      </ReorderList>
                      {advancedSelections.length > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">Leave the range empty to include all pages of the selected PDF.</p>
                      )}
                      <button
                        onClick={() => setAdvancedSelections((prev) => [...prev, { id: crypto.randomUUID(), pdfIndex: 0, range: "" }])}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg shadow text-sm"
                      >
                        + Add Range
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleMerge}
                  disabled={!pdfFiles.length}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                >
                  Merge PDFs
                </button>
                <button
                  disabled={!mergedPdfUrl}
                  onClick={() => download(mergedPdfUrl!, "merged.pdf")}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                >
                  Download Result
                </button>
                <button
                  disabled={!pdfFiles.length}
                  onClick={clearAll}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg shadow"
                >
                  Clear All
                </button>
              </div>

              {mergedPdfUrl && <iframe src={mergedPdfUrl} className="w-full h-96 border mt-4 rounded-lg" title="Merged PDF Preview"></iframe>}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

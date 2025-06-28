import Head from "next/head";
import { useState, useEffect, useMemo, isValidElement } from "react";
import { BsFiletypePdf } from "react-icons/bs";
import ReorderList, { ReorderIcon } from "react-reorder-list";

import { modes, rotationOptions, rotationOptionDescriptions } from "@/constants";
import { mergePdfs } from "@/modules/pdf";
import { calcSize, download, generateId } from "@/modules/utils";
import { PDFFile, PDFSelections } from "@/types";
import FileDropZone from "@/components/FileDropZone";

export default function PdfMerger() {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [selectedMode, setSelectedMode] = useState<Mode>("simple");
  const [simpleSelections, setSimpleSelections] = useState<PDFSelections["simple"]>({});
  const [advancedSelections, setAdvancedSelections] = useState<PDFSelections["advanced"]>([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);

  const totalSize = useMemo(() => calcSize(pdfFiles.map(({ file }) => file)), [pdfFiles]);

  const handleSimpleUpdate = (id: string, update: Partial<SimpleSelection<PDFSelections>>) => setSimpleSelections((prev) => ({ ...prev, [id]: { ...prev[id], ...update } }));

  const handleAdvancedUpdate = (id: string, update: Partial<AdvancedSelection<PDFSelections>>) =>
    setAdvancedSelections((prev) => prev.map((sel) => (sel.id === id ? { ...sel, ...update } : sel)));

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files!);
    if (files.length) {
      setPdfFiles((prev) => prev.concat(files.map((file) => ({ id: generateId(), file }))));
      setMergedPdfUrl(null);
    }
    event.target.value = "";
  }

  function removeFile(id: string) {
    setPdfFiles((prev) => prev.filter((file) => file.id !== id));
    setAdvancedSelections([]);
  }

  async function handleMerge() {
    const [mergedPdf, handleFile] = await mergePdfs();
    if (selectedMode === "simple")
      for (const { id, file } of pdfFiles) {
        const { range, rotation } = simpleSelections[id];
        await handleFile(file, range, rotation);
      }
    else for (const { pdfIndex, range, rotation } of advancedSelections) await handleFile(pdfFiles[pdfIndex].file, range, rotation);
    const blob = new Blob([await mergedPdf.save()], { type: "application/pdf" });
    setMergedPdfUrl(URL.createObjectURL(blob));
  }

  function clearAll() {
    setPdfFiles([]);
    setSimpleSelections({});
    setAdvancedSelections([]);
    setMergedPdfUrl(null);
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

      <main className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
              <h1 className="text-3xl font-bold text-white">PDF Merger</h1>
            </div>

            <div className="p-5 space-y-8">
              <FileDropZone tool="pdf" Icon={BsFiletypePdf} handleFileChange={handleFileChange} totalSize={totalSize} />

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
                    <div className="space-y-4">
                      <ReorderList
                        useOnlyIconToDrag
                        watchChildrenUpdates
                        animationDuration={200}
                        props={{ className: "space-y-2" }}
                        onPositionChange={({ newItems }) => {
                          const reorderedFiles = newItems.flatMap((item) => (isValidElement(item) ? pdfFiles.find(({ id }) => item.key?.includes(id))! : []));
                          setPdfFiles(reorderedFiles);
                        }}
                      >
                        {pdfFiles.map(({ id, file }) => (
                          <div key={id} className="flex items-start py-2 border rounded-xl shadow-sm text-sm">
                            <ReorderIcon className="w-5 mt-2 mx-1.5 shrink-0" />
                            <div className="flex-1 space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">PDF File</label>
                                <span className="block w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white overflow-hidden">
                                  <span className="block whitespace-nowrap overflow-hidden text-ellipsis">{file.name}</span>
                                </span>
                              </div>

                              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Page Range</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. 1-5, 8, 11-13"
                                    value={simpleSelections[id]?.range ?? ""}
                                    onChange={(e) => handleSimpleUpdate(id, { range: e.target.value })}
                                    className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rotation</label>
                                  <select
                                    value={simpleSelections[id]?.rotation}
                                    onChange={(e) => handleSimpleUpdate(id, { rotation: +e.target.value })}
                                    className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                  >
                                    {rotationOptions.map((option) => (
                                      <option key={option} value={option}>
                                        {rotationOptionDescriptions[option]}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                            <button onClick={() => removeFile(id)} className="text-red-500 hover:text-red-700 w-5 mt-2 mx-1.5 shrink-0">
                              ✕
                            </button>
                          </div>
                        ))}
                      </ReorderList>
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">Leave the range blank to include the entire PDF.</p>
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
                        {advancedSelections.map(({ id, pdfIndex, range = "", rotation }) => (
                          <div key={id} className="flex items-start py-2 border rounded-xl shadow-sm text-sm">
                            <ReorderIcon className="w-5 mt-2 mx-1.5 shrink-0" />
                            <div className="flex-1 space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select PDF</label>
                                <select
                                  value={pdfIndex}
                                  onChange={(e) => handleAdvancedUpdate(id, { pdfIndex: +e.target.value })}
                                  className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                >
                                  {pdfFiles.map(({ file }, i) => (
                                    <option key={i} value={i}>
                                      {file.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Page Range</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. 1-5, 8, 11-13"
                                    value={range}
                                    onChange={(e) => handleAdvancedUpdate(id, { range: e.target.value })}
                                    className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rotation</label>
                                  <select
                                    value={rotation}
                                    onChange={(e) => handleAdvancedUpdate(id, { rotation: +e.target.value })}
                                    className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                  >
                                    {rotationOptions.map((option) => (
                                      <option key={option} value={option}>
                                        {rotationOptionDescriptions[option]}
                                      </option>
                                    ))}
                                  </select>
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
                        ))}
                      </ReorderList>
                      {advancedSelections.length > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">Leave the range empty to include all pages of the selected PDF.</p>
                      )}
                      <button
                        onClick={() => setAdvancedSelections((prev) => [...prev, { id: generateId(), pdfIndex: 0, rotation: 0 }])}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg shadow text-sm"
                      >
                        + Add PDF Range
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleMerge}
                  disabled={selectedMode === "simple" ? !pdfFiles.length : !advancedSelections.length}
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

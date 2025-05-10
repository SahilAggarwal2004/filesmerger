import { PDFDocument } from "pdf-lib";
import { rangeToPages } from "./utils";

export async function mergePdfs() {
  const mergedPdf = await PDFDocument.create();

  async function handleFile(file: File, range: string) {
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await PDFDocument.load(fileBytes);
    const selectedPages = rangeToPages(range) || Array.from({ length: pdf.getPageCount() }, (_, i) => i);
    const copiedPages = await mergedPdf.copyPages(pdf, selectedPages);
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return [mergedPdf, handleFile] as const;
}

import { PDFDocument } from "pdf-lib";

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

function rangeToPages(range: string) {
  if (!range) return null;
  return range
    .split(",")
    .flatMap((part) => {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((n) => +n.trim());
        const step = start <= end ? 1 : -1;
        return Array.from({ length: Math.abs(end - start) + 1 }, (_, i) => start + i * step - 1);
      }
      return [+part.trim() - 1];
    })
    .filter((n) => !isNaN(n) && n >= 0);
}

// Reads the text out of a PDF file, right in the browser. The file is never
// uploaded anywhere; only the extracted text is sent with the setup form.

const MAX_FILE_MB = 5;
// Long enough for any normal resume, short enough to keep requests small.
export const MAX_RESUME_CHARS = 15000;

// file: a File from an <input type="file"> or a drag-and-drop
// returns: the resume text. Throws an Error with a user-friendly message.
export async function extractPdfText(file) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("That file isn't a PDF. Please choose a .pdf file.");
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`That PDF is over ${MAX_FILE_MB} MB. Please choose a smaller file.`);
  }

  // Loaded only when someone actually picks a PDF, so the page starts fast.
  // pdf.js does the heavy lifting in a "worker" (a background thread);
  // the ?url import gives Vite's path to that worker file.
  // We use the "legacy" build: the default one needs very new browser
  // features and breaks in slightly older Chrome/Safari versions.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { default: workerUrl } = await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  } catch {
    throw new Error("Couldn't open that PDF. It may be damaged or password protected.");
  }

  // Go page by page and join the bits of text, keeping line breaks.
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    for (const item of content.items) {
      text += item.str + (item.hasEOL ? "\n" : "");
    }
    text += "\n\n";
  }

  text = tidy(text);
  if (!text) {
    throw new Error("Couldn't find any text in this PDF. It might be a scanned image. Try exporting your resume as a PDF from Word or Google Docs.");
  }
  return text.slice(0, MAX_RESUME_CHARS);
}

// Removes extra spaces and blank lines left over from the PDF layout.
function tidy(text) {
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

import { useState } from "react";
import { extractPdfText } from "../pdf.js";

// The resume drop zone. Click to browse, or drag a PDF onto it.
// resume: { name, text } or null. onChange gets the new value (or null to remove).
export default function ResumeUpload({ resume, onChange }) {
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setReading(true);
    setError("");
    try {
      const text = await extractPdfText(file);
      onChange({ name: file.name, text });
    } catch (err) {
      setError(err.message);
    } finally {
      setReading(false);
    }
  }

  // Dragging a file over the page: preventDefault lets us accept the drop
  // instead of the browser opening the PDF in the tab.
  function handleDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  // A resume is loaded: show its name, word count, and a text preview.
  if (resume) {
    const words = resume.text.split(/\s+/).filter(Boolean).length;
    return (
      <div className="resume-done">
        <div className="resume-file">
          <span className="file-icon done">
            <CheckIcon />
          </span>
          <span className="resume-info">
            <strong>{resume.name}</strong>
            <span className="hint">{words} words read</span>
          </span>
          <button type="button" className="link-button" onClick={() => onChange(null)}>
            Remove
          </button>
        </div>
        <details className="resume-preview">
          <summary>Preview the text we read</summary>
          <pre>{resume.text}</pre>
        </details>
      </div>
    );
  }

  return (
    <div>
      <label
        className={`dropzone ${dragging ? "dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="file-icon">
          <FileIcon />
        </span>
        <span className="dropzone-text">
          <strong>
            {reading ? "Reading your resume…" : "Upload your resume"} {!reading && <span className="hint">(PDF, optional)</span>}
          </strong>
          {!reading && (
            <span className="hint">
              Drop it here or <span className="fake-link">browse files</span>
            </span>
          )}
        </span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="visually-hidden"
          disabled={reading}
          onChange={(e) => {
            handleFile(e.target.files[0]);
            e.target.value = ""; // so picking the same file again still triggers onChange
          }}
        />
      </label>
      {error && <p className="error small">{error}</p>}
    </div>
  );
}

function FileIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M12 17v-6" />
      <path d="M9 14l3-3 3 3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

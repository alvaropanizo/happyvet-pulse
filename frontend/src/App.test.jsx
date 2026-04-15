import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";
import uiContent from "./data/uiContent.json";

describe("App", () => {
  it("renders the expected title text", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: uiContent.app.uploadTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(uiContent.recentDocumentsPanel.emptyState)).toBeInTheDocument();
  });

  it("updates selected and recent documents after file selection", () => {
    render(<App />);

    const input = screen.getAllByLabelText(uiContent.uploadPanel.fileInputAriaLabel)[0];
    const file = new File(["demo"], "record.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(file.name);
    expect(screen.getByText(uiContent.documentPreview.title)).toBeInTheDocument();
    expect(screen.getByText(uiContent.uploadPanel.selectedPrefix, { exact: false })).toBeInTheDocument();
  });

  it("shows unsupported preview fallback for unsupported files", () => {
    render(<App />);

    const input = screen.getAllByLabelText(uiContent.uploadPanel.fileInputAriaLabel)[0];
    const file = new File(["binary"], "archive.zip", { type: "application/zip" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(uiContent.documentPreview.unsupportedTitle)).toBeInTheDocument();
    expect(screen.getByText("zip")).toBeInTheDocument();
  });

  it("shows docx fallback message for docx files", () => {
    render(<App />);

    const input = screen.getAllByLabelText(uiContent.uploadPanel.fileInputAriaLabel)[0];
    const file = new File(["docx"], "medical-record.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(uiContent.documentPreview.docxUnsupported)).toBeInTheDocument();
    expect(screen.getByText(uiContent.documentPreview.fileSelectedPrefix, { exact: false })).toBeInTheDocument();
  });
});

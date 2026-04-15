import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import uiContent from "./data/uiContent.json";

describe("App", () => {
  beforeEach(() => {
    if (!global.fetch) {
      global.fetch = vi.fn();
    }

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        filename: "record.txt",
        content_type: "text/plain",
        size_bytes: 4,
        text_preview: "demo",
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders the expected title text", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: uiContent.app.uploadTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(uiContent.recentDocumentsPanel.emptyState)).toBeInTheDocument();
  });

  it("updates selected and recent documents after file selection", async () => {
    render(<App />);

    const input = screen.getAllByLabelText(uiContent.uploadPanel.fileInputAriaLabel)[0];
    const file = new File(["demo"], "record.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(file.name);
    expect(screen.getByText(uiContent.documentPreview.title)).toBeInTheDocument();
    expect(screen.getByText(uiContent.uploadPanel.selectedPrefix, { exact: false })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(uiContent.app.uploadResult.title)).toBeInTheDocument();
    });
  });

  it("renders upload metadata values from successful API response", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: "lab-report.pdf",
        content_type: "application/pdf",
        size_bytes: 128,
        text_preview: "Patient report preview",
      }),
    });

    render(<App />);

    const input = screen.getAllByLabelText(uiContent.uploadPanel.fileInputAriaLabel)[0];
    const file = new File(["pdf"], "lab-report.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const metadataHeading = screen.getByRole("heading", { name: uiContent.app.uploadResult.title });
      const metadataCard = metadataHeading.closest(".card");
      expect(metadataCard).not.toBeNull();

      const metadataScope = within(metadataCard);
      expect(metadataScope.getByText("lab-report.pdf")).toBeInTheDocument();
      expect(metadataScope.getByText("application/pdf")).toBeInTheDocument();
      expect(metadataScope.getByText("128")).toBeInTheDocument();
      expect(metadataScope.getByText("Patient report preview")).toBeInTheDocument();
    });
  });

  it("renders text preview fallback when API returns empty preview", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: "scan.png",
        content_type: "image/png",
        size_bytes: 32,
        text_preview: "",
      }),
    });

    render(<App />);

    const input = screen.getAllByLabelText(uiContent.uploadPanel.fileInputAriaLabel)[0];
    const file = new File(["img"], "scan.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const metadataHeading = screen.getByRole("heading", { name: uiContent.app.uploadResult.title });
      const metadataCard = metadataHeading.closest(".card");
      expect(metadataCard).not.toBeNull();

      const metadataScope = within(metadataCard);
      expect(metadataScope.getByText("scan.png")).toBeInTheDocument();
      expect(metadataScope.getByText("-")).toBeInTheDocument();
    });
  });

  it("shows unsupported preview fallback for unsupported files", async () => {
    render(<App />);

    const input = screen.getAllByLabelText(uiContent.uploadPanel.fileInputAriaLabel)[0];
    const file = new File(["binary"], "archive.zip", { type: "application/zip" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(uiContent.documentPreview.unsupportedTitle)).toBeInTheDocument();
    expect(screen.getByText("zip")).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  it("shows docx fallback message for docx files", async () => {
    render(<App />);

    const input = screen.getAllByLabelText(uiContent.uploadPanel.fileInputAriaLabel)[0];
    const file = new File(["docx"], "medical-record.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(uiContent.documentPreview.docxUnsupported)).toBeInTheDocument();
    expect(screen.getByText(uiContent.documentPreview.fileSelectedPrefix, { exact: false })).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  it("shows API upload error message when upload fails", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Uploaded file is empty." }),
    });

    render(<App />);

    const input = screen.getAllByLabelText(uiContent.uploadPanel.fileInputAriaLabel)[0];
    const file = new File([""], "empty.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText(
          `${uiContent.uploadPanel.uploadErrorPrefix} Uploaded file is empty.`,
          { exact: false },
        ),
      ).toBeInTheDocument();
    });
  });
});

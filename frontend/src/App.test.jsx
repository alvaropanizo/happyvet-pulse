import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import uiContent from "./data/uiContent.json";

describe("App", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_USE_MEDICAL_RECORD_MOCK", "true");

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
    vi.unstubAllEnvs();
    cleanup();
  });

  it("renders the expected title text", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: uiContent.app.uploadTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: uiContent.app.medicalRecord.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("ALYA")).toBeInTheDocument();
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

  it("replaces medical record panel data when scan succeeds", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        record_id: "rec_scan_001",
        source_documents: [],
        patient: {
          name: { value: "MARLEY", confidence: 0.99, edited: false },
          species: { value: "Canino", confidence: 0.98, edited: false },
          breed: { value: "Labrador Retriever", confidence: 0.97, edited: false },
          sex: { value: "Macho", confidence: 0.99, edited: false },
          birth_date: { value: "2019-10-04", confidence: 0.9, edited: false },
          chip_id: { value: "941000024967769", confidence: 0.9, edited: false },
          weight_kg: { value: "30", confidence: 0.8, edited: false },
        },
        owner: {
          name: { value: "Beatriz Abarca", confidence: 0.9, edited: false },
          address: { value: "Madrid", confidence: 0.8, edited: false },
        },
        timeline: [],
        problem_list: [],
        reminders: [],
        review: {
          status: "in_review",
          edited_fields: [],
          last_editor: "scan_service",
          updated_at: null,
        },
      }),
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: uiContent.uploadPanel.scanButton }));

    await waitFor(() => {
      expect(screen.getByText("MARLEY")).toBeInTheDocument();
      expect(screen.getByText("rec_scan_001")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/documents/scan",
      { method: "POST" },
    );
  });

  it("shows scan error message when scan fails", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { code: "SCAN_FAILED", message: "Could not parse selected document." },
      }),
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: uiContent.uploadPanel.scanButton }));

    await waitFor(() => {
      expect(
        screen.getByText(
          `${uiContent.uploadPanel.scanErrorPrefix} Could not parse selected document.`,
          { exact: false },
        ),
      ).toBeInTheDocument();
    });
  });
});

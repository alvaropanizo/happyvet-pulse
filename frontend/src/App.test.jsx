import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("shows only upload panel on first load", () => {
    render(<App />);

    expect(screen.getByText(uiContent.app.uploadHeaderLine1Prefix)).toBeInTheDocument();
    expect(screen.getByText(uiContent.app.uploadHeaderLine2)).toBeInTheDocument();
    expect(screen.getByLabelText(uiContent.app.themeFabAriaLabel)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: uiContent.uploadPanel.primaryLabel })).toBeInTheDocument();
    expect(screen.getByText(uiContent.uploadPanel.footerSupportLine)).toBeInTheDocument();
    expect(screen.getByText(uiContent.uploadPanel.caption)).toBeInTheDocument();
    expect(screen.getByText(uiContent.uploadPanel.samplePillsIntro)).toBeInTheDocument();
    expect(screen.getByText(uiContent.uploadPanel.sampleFiles[0].fileName)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: uiContent.documentPreview.title })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: uiContent.app.medicalRecord.title })).not.toBeInTheDocument();
  });

  it("replaces upload panel with preview and scan button after selecting a file", async () => {
    render(<App />);

    const input = screen.getAllByLabelText(uiContent.uploadPanel.fileInputAriaLabel)[0];
    const file = new File(["demo"], "record.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: uiContent.uploadPanel.scanButton })).toBeInTheDocument();
    });
    expect(screen.getAllByText(uiContent.documentPreview.title).length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { name: uiContent.uploadPanel.primaryLabel })).not.toBeInTheDocument();
  });

  it("shows structured card and hides preview after successful scan", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        medical_record: {
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
        },
        parsing_metadata: {
          engine: "gatekeeper",
          extraction_method: "fast_path",
          latency_ms: 100,
          extracted_char_count: 500,
          meaningful_text: true,
          integrity_score: 1,
          reason: null,
        },
        processor_version: null,
        warnings: [],
        timings_ms: null,
      }),
    });

    render(<App />);
    const input = screen.getAllByLabelText(uiContent.uploadPanel.fileInputAriaLabel)[0];
    const file = new File(["doc"], "scan-source.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: uiContent.uploadPanel.scanButton }));

    await waitFor(() => {
      expect(screen.getByText("MARLEY")).toBeInTheDocument();
      expect(screen.getByText("rec_scan_001")).toBeInTheDocument();
    });

    const scanCallArgs = global.fetch.mock.calls[0];
    expect(scanCallArgs[0]).toBe("http://localhost:8000/api/v1/documents/scan");
    expect(scanCallArgs[1].method).toBe("POST");
    expect(scanCallArgs[1].body).toBeInstanceOf(FormData);
    expect(scanCallArgs[1].body.get("file")).toBe(file);
    expect(screen.queryByText(uiContent.documentPreview.title)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: uiContent.app.medicalRecord.title })).toBeInTheDocument();
  });

  it("shows scan API error message when backend returns parsing failure", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: {
          code: "PARSING_INTEGRITY_LOW",
          message: "Document parsing quality is too low for reliable ingestion.",
        },
      }),
    });

    render(<App />);
    const input = screen.getAllByLabelText(uiContent.uploadPanel.fileInputAriaLabel)[0];
    const file = new File(["doc"], "scan-source.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: uiContent.uploadPanel.scanButton }));

    await waitFor(() => {
      expect(
        screen.getByText(
          `${uiContent.uploadPanel.scanErrorPrefix} Document parsing quality is too low for reliable ingestion.`,
          { exact: false },
        ),
      ).toBeInTheDocument();
    });
  });

  it("supports nested scan response shape with medical_record key", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        medical_record: {
          record_id: "rec_nested_scan_001",
          source_documents: [],
          patient: {
            name: { value: "NALA", confidence: 0.99, edited: false },
            species: { value: "Canino", confidence: 0.98, edited: false },
            breed: { value: "Mestizo", confidence: 0.97, edited: false },
            sex: { value: "Hembra", confidence: 0.99, edited: false },
            birth_date: { value: "2020-02-01", confidence: 0.9, edited: false },
            chip_id: { value: "12345", confidence: 0.9, edited: false },
            weight_kg: { value: "12", confidence: 0.8, edited: false },
          },
          owner: {
            name: { value: "Owner", confidence: 0.9, edited: false },
            address: { value: "Address", confidence: 0.8, edited: false },
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
        },
        parsing_metadata: {
          engine: "gatekeeper",
          extraction_method: "fast_path",
          latency_ms: 110,
          extracted_char_count: 500,
          meaningful_text: true,
          integrity_score: 1,
          reason: null,
        },
      }),
    });

    render(<App />);
    const input = screen.getAllByLabelText(uiContent.uploadPanel.fileInputAriaLabel)[0];
    const file = new File(["doc"], "scan-source.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: uiContent.uploadPanel.scanButton }));

    await waitFor(() => {
      expect(screen.getByText("NALA")).toBeInTheDocument();
      expect(screen.getByText("rec_nested_scan_001")).toBeInTheDocument();
    });
  });

  it("shows reset confirmation modal and returns to upload step when confirmed", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        medical_record: {
          record_id: "rec_reset_001",
          source_documents: [],
          patient: {
            name: { value: "ALYA", confidence: 0.99, edited: false },
            species: { value: "Canino", confidence: 0.98, edited: false },
            breed: { value: "Yorkshire", confidence: 0.97, edited: false },
            sex: { value: "Hembra", confidence: 0.99, edited: false },
            birth_date: { value: "2018-07-05", confidence: 0.9, edited: false },
            chip_id: { value: "00023035139", confidence: 0.9, edited: false },
            weight_kg: { value: "3.2", confidence: 0.8, edited: false },
          },
          owner: {
            name: { value: "Owner", confidence: 0.9, edited: false },
            address: { value: "Address", confidence: 0.8, edited: false },
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
        },
        parsing_metadata: {
          engine: "gatekeeper",
          extraction_method: "fast_path",
          latency_ms: 120,
          extracted_char_count: 500,
          meaningful_text: true,
          integrity_score: 1,
          reason: null,
        },
      }),
    });

    render(<App />);
    const input = screen.getAllByLabelText(uiContent.uploadPanel.fileInputAriaLabel)[0];
    const file = new File(["doc"], "scan-source.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: uiContent.uploadPanel.scanButton }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: uiContent.app.medicalRecord.title })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(uiContent.app.resetFlow.buttonAriaLabel));
    expect(screen.getByText(uiContent.app.resetFlow.confirmMessage)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: uiContent.app.resetFlow.confirmNo }));
    await waitFor(() => {
      expect(screen.queryByText(uiContent.app.resetFlow.confirmMessage)).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(uiContent.app.resetFlow.buttonAriaLabel));
    fireEvent.click(screen.getByRole("button", { name: uiContent.app.resetFlow.confirmYes }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: uiContent.uploadPanel.primaryLabel })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: uiContent.app.medicalRecord.title })).not.toBeInTheDocument();
    });
  });

  it("shows collapsible raw extracted text section after scan", async () => {
    const rawText = "MASCOTA: KAI\nSEXO: Macho\nPESO: 12.4";
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        medical_record: {
          record_id: "rec_raw_001",
          source_documents: [
            {
              document_id: "doc_1",
              filename: "record.txt",
              source_type: "txt",
              language: null,
              uploaded_at: null,
              raw_text: rawText,
              attachments: [],
            },
          ],
          patient: {
            name: { value: "KAI", confidence: 0.8, edited: false },
            species: { value: "Canino", confidence: 0.7, edited: false },
            breed: { value: null, confidence: 0, edited: false },
            sex: { value: "Macho", confidence: 0.7, edited: false },
            birth_date: { value: null, confidence: 0, edited: false },
            chip_id: { value: null, confidence: 0, edited: false },
            weight_kg: { value: "12.4", confidence: 0.7, edited: false },
          },
          owner: {
            name: { value: null, confidence: 0, edited: false },
            address: { value: null, confidence: 0, edited: false },
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
        },
        parsing_metadata: {
          engine: "gatekeeper",
          extraction_method: "fast_path",
          latency_ms: 100,
          extracted_char_count: 500,
          meaningful_text: true,
          integrity_score: 1,
          reason: null,
        },
      }),
    });

    render(<App />);
    const input = screen.getAllByLabelText(uiContent.uploadPanel.fileInputAriaLabel)[0];
    const file = new File(["doc"], "scan-source.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: uiContent.uploadPanel.scanButton }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: uiContent.app.medicalRecord.title })).toBeInTheDocument();
    });

    const details = screen.getByText(uiContent.app.medicalRecord.rawExtractedTextTitle).closest("details");
    expect(details).toBeInTheDocument();
    details.setAttribute("open", "");
    expect(
      screen.getByText((content) => content.includes("MASCOTA: KAI") && content.includes("PESO: 12.4")),
    ).toBeInTheDocument();
  });
});

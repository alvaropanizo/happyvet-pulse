import { describe, expect, it } from "vitest";

import { PREVIEW_TYPES } from "../constants/previewTypes";
import { getFileExtension, getPreviewType } from "./filePreview";

describe("filePreview utils", () => {
  it("extracts file extension safely", () => {
    expect(getFileExtension("record.PDF")).toBe("pdf");
    expect(getFileExtension("no_extension")).toBe("");
  });

  it("classifies preview types", () => {
    expect(getPreviewType(new File(["a"], "scan.png", { type: "image/png" }))).toBe(
      PREVIEW_TYPES.IMAGE,
    );
    expect(getPreviewType(new File(["a"], "report.pdf", { type: "application/pdf" }))).toBe(
      PREVIEW_TYPES.PDF,
    );
    expect(getPreviewType(new File(["a"], "notes.txt", { type: "text/plain" }))).toBe(
      PREVIEW_TYPES.TEXT,
    );
    expect(
      getPreviewType(
        new File(["a"], "record.docx", {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
      ),
    ).toBe(PREVIEW_TYPES.DOCX);
    expect(getPreviewType(new File(["a"], "archive.zip", { type: "application/zip" }))).toBe(
      PREVIEW_TYPES.UNSUPPORTED,
    );
  });
});

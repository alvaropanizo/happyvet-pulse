import fs from "node:fs";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";

import { medicalRecordEmptyState } from "../data/medicalRecordEmptyState";
import { medicalRecordMockData } from "../data/medicalRecordMockData";

function loadJsonSchemaContract() {
  const contractPath = path.resolve(process.cwd(), "../contracts/medical_record.schema.json");
  return JSON.parse(fs.readFileSync(contractPath, "utf-8"));
}

function assertValidContract(validate, payload) {
  const isValid = validate(payload);
  if (!isValid) {
    throw new Error(
      `Payload does not satisfy medical record JSON schema:\n${JSON.stringify(validate.errors, null, 2)}`,
    );
  }
}

describe("medical record shared contract", () => {
  const schema = loadJsonSchemaContract();
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);

  function asEnvelope(medicalRecord) {
    return {
      medical_record: medicalRecord,
      parsing_metadata: {
        engine: "gatekeeper",
        extraction_method: "fast_path",
        latency_ms: 120,
        extracted_char_count: 1200,
        meaningful_text: true,
        integrity_score: 0.95,
        reason: null,
      },
      processor_version: null,
      warnings: [],
      timings_ms: null,
    };
  }

  it("keeps empty frontend medical record state aligned with envelope contract", () => {
    expect(() => assertValidContract(validate, asEnvelope(medicalRecordEmptyState))).not.toThrow();
  });

  it("keeps mock frontend medical record state aligned with envelope contract", () => {
    expect(() => assertValidContract(validate, asEnvelope(medicalRecordMockData))).not.toThrow();
  });

  it("accepts payloads with optional metadata fields populated", () => {
    const payloadWithParsingMetadata = {
      medical_record: medicalRecordMockData,
      parsing_metadata: {
        engine: "gatekeeper",
        extraction_method: "tesseract_fallback",
        latency_ms: 800,
        extracted_char_count: 1240,
        meaningful_text: true,
        integrity_score: 0.96,
        reason: null,
      },
      processor_version: "2.0.0",
      warnings: ["TABLE_PARSING_PARTIAL"],
      timings_ms: 183.2,
    };

    expect(() => assertValidContract(validate, payloadWithParsingMetadata)).not.toThrow();
  });
});

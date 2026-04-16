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

  it("keeps empty frontend medical record state aligned with contract", () => {
    expect(() => assertValidContract(validate, medicalRecordEmptyState)).not.toThrow();
  });

  it("keeps mock frontend medical record state aligned with contract", () => {
    expect(() => assertValidContract(validate, medicalRecordMockData)).not.toThrow();
  });
});

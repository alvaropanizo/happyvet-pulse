export function totalAttachments(sourceDocuments) {
  return (sourceDocuments ?? []).reduce(
    (accumulator, sourceDocument) => accumulator + (sourceDocument.attachments?.length ?? 0),
    0,
  );
}

export function normalizeFieldValue(fieldValue) {
  return {
    value: fieldValue?.value ?? "",
    confidence: fieldValue?.confidence ?? 0,
    edited: fieldValue?.edited ?? false,
    status: fieldValue?.status ?? "empty",
  };
}

export function normalizeMedicalRecord(medicalRecord) {
  return {
    record_id: medicalRecord?.record_id ?? "-",
    review: {
      status: medicalRecord?.review?.status ?? "needs_review",
    },
    patient: {
      name: normalizeFieldValue(medicalRecord?.patient?.name),
      species: normalizeFieldValue(medicalRecord?.patient?.species),
      breed: normalizeFieldValue(medicalRecord?.patient?.breed),
      sex: normalizeFieldValue(medicalRecord?.patient?.sex),
      birth_date: normalizeFieldValue(medicalRecord?.patient?.birth_date),
      chip_id: normalizeFieldValue(medicalRecord?.patient?.chip_id),
      weight_kg: normalizeFieldValue(medicalRecord?.patient?.weight_kg),
    },
    owner: {
      name: normalizeFieldValue(medicalRecord?.owner?.name),
      surname: normalizeFieldValue(medicalRecord?.owner?.surname),
      phone_number: normalizeFieldValue(medicalRecord?.owner?.phone_number),
      email: normalizeFieldValue(medicalRecord?.owner?.email),
      address: normalizeFieldValue(medicalRecord?.owner?.address),
    },
    timeline: (medicalRecord?.timeline ?? []).map((event, index) => ({
      event_id: event?.event_id ?? `event_${index + 1}`,
      status: event?.status ?? "needs_review",
      date: event?.date ?? "",
      event_type: event?.event_type ?? "visit",
      clinic: event?.clinic ?? "",
      title: event?.title?.trim() ? event.title : (event?.event_id ?? `event_${index + 1}`),
      anamnesis: event?.anamnesis ?? "",
      assessment: Array.isArray(event?.assessment) ? event.assessment : [],
      diagnoses: Array.isArray(event?.diagnoses) ? event.diagnoses : [],
      treatments: Array.isArray(event?.treatments) ? event.treatments : [],
      tests: Array.isArray(event?.tests) ? event.tests : [],
      attachments: Array.isArray(event?.attachments) ? event.attachments : [],
      source: event?.source ?? null,
    })),
    source_documents: (medicalRecord?.source_documents ?? []).map((sourceDocument, index) => ({
      document_id: sourceDocument?.document_id ?? `doc_${index + 1}`,
      filename: sourceDocument?.filename ?? "",
      source_type: sourceDocument?.source_type ?? "",
      attachments: sourceDocument?.attachments ?? [],
      raw_text: sourceDocument?.raw_text ?? "",
    })),
  };
}

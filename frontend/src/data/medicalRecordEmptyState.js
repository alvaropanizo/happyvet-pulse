const emptyFieldValue = {
  value: null,
  confidence: 0.0,
  edited: false,
  status: "empty",
};

export const medicalRecordEmptyState = {
  record_id: "rec_demo",
  source_documents: [],
  patient: {
    name: { ...emptyFieldValue },
    species: { ...emptyFieldValue },
    breed: { ...emptyFieldValue },
    sex: { ...emptyFieldValue },
    birth_date: { ...emptyFieldValue },
    chip_id: { ...emptyFieldValue },
    weight_kg: { ...emptyFieldValue },
  },
  owner: {
    name: { ...emptyFieldValue },
    surname: { ...emptyFieldValue },
    phone_number: { ...emptyFieldValue },
    email: { ...emptyFieldValue },
    address: null,
  },
  timeline: [],
  review: {
    status: "needs_review",
    edited_fields: [],
    last_editor: null,
    updated_at: null,
  },
};

const emptyFieldValue = {
  value: null,
  confidence: 0.0,
  edited: false,
};

export const medicalRecordMockData = {
  record_id: "rec_alya_001",
  source_documents: [
    {
      document_id: "doc_alya_2024",
      filename: "alya_history_2024.pdf",
      source_type: "pdf",
      language: "es",
      uploaded_at: "2026-04-15T12:00:00Z",
      raw_text: "Veterinary history for Alya...",
      attachments: [
        {
          attachment_id: "att_feces_001",
          kind: "lab_report",
          name: "Analisis de heces",
          url: null,
          reference_text: "No se observan formas parasitarias ni disbiosis.",
          source_span: { start: 1200, end: 1400 },
        },
      ],
    },
  ],
  patient: {
    name: { value: "ALYA", confidence: 0.99, edited: false },
    species: { value: "Canina", confidence: 0.98, edited: false },
    breed: { value: "Yorkshire Terrier", confidence: 0.97, edited: false },
    sex: { value: "Hembra", confidence: 0.99, edited: false },
    birth_date: { value: "2018-07-05", confidence: 0.93, edited: false },
    chip_id: { value: "00023035139", confidence: 0.9, edited: false },
    weight_kg: { value: "3.2", confidence: 0.7, edited: true },
  },
  owner: {
    name: { value: "Cliente pendiente de normalizacion", confidence: 0.4, edited: false },
    address: { ...emptyFieldValue, edited: false },
  },
  timeline: [
    {
      event_id: "evt_2024_07_17_vac",
      date: "2024-07-17",
      event_type: "vaccination",
      clinic: "Costa Azahar",
      title: "Visita vacunacion/desparasitacion",
      anamnesis: "Acude para poner vacuna tetravalente. Exploracion normal.",
      assessment: ["Paciente estable", "Sin signos de alarma"],
      diagnoses: [{ text: "Seguimiento gastroenteritis hemorragica", status: "suspected" }],
      treatments: [
        {
          medication: "Vacuna tetravalente canina",
          dose: "1 dosis",
          frequency: "unica",
          duration: "1 dia",
        },
      ],
      tests: [],
      attachments: [],
      source: { document_id: "doc_alya_2024", span: { start: 100, end: 420 } },
    },
    {
      event_id: "evt_2024_06_10_consulta",
      date: "2024-06-10",
      event_type: "visit",
      clinic: "Costa Azahar",
      title: "Consulta general por vomitos y diarrea",
      anamnesis: "Vomitos y diarrea sanguinolenta. Sospecha pancreatitis.",
      assessment: ["No deshidratada", "Sin dolor abdominal severo"],
      diagnoses: [{ text: "Gastroenteritis hemorragica", status: "confirmed" }],
      treatments: [
        {
          medication: "Flagyl suspension oral",
          dose: "1.5 ml",
          frequency: "cada 12h",
          duration: "7 dias",
        },
      ],
      tests: [
        {
          test_name: "Analitica gastrointestinal",
          result_summary: "CPLI elevada, hemograma inflamatorio",
          values: [],
        },
      ],
      attachments: ["att_feces_001"],
      source: { document_id: "doc_alya_2024", span: { start: 2200, end: 3600 } },
    },
  ],
  problem_list: [
    {
      problem_id: "prb_gastro_001",
      name: "Gastroenteritis hemorragica recurrente",
      status: "recurrent",
      first_seen: "2024-03-16",
      last_seen: "2024-06-10",
      notes: "Episodios asociados a cambios dieteticos y posible pancreatitis.",
    },
  ],
  reminders: [
    {
      reminder_id: "rem_vac_001",
      type: "vaccination",
      label: "Vacunacion tetravalente canina",
      due_date: "2025-07-17",
      status: "pending",
    },
    {
      reminder_id: "rem_lab_001",
      type: "lab_followup",
      label: "Revision heces tras tratamiento",
      due_date: "2024-07-20",
      status: "done",
    },
  ],
  review: {
    status: "in_review",
    edited_fields: ["patient.weight_kg"],
    last_editor: "vet_reviewer_demo",
    updated_at: "2026-04-15T12:00:00Z",
  },
};

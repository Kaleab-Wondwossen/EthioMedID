import { z } from 'zod';

export const vitalsSchema = z.object({
  heartRate: z.number().int().min(20).max(260),
  systolic:  z.number().int().min(50).max(260),
  diastolic: z.number().int().min(30).max(200),
  tempC:     z.number().min(30).max(45),
  spo2:      z.number().min(50).max(100),
});

export const visitNoteSchema = z.object({
  chiefComplaint: z.string().min(1),
  history:        z.string().optional(),
  exam:           z.string().optional(),
  plan:           z.string().optional(),
});

export const diagnosisSchema = z.object({
  code: z.string().min(1),           // e.g., ICD-10 (A00.0)
  system: z.string().default('ICD-10'),
  display: z.string().optional(),
  clinicalStatus: z.enum(['active','remission','resolved']).optional(),
});

export const labResultSchema = z.object({
  testName: z.string().min(1),
  value:    z.number(),
  unit:     z.string().optional(),
  refRange: z.string().optional(),
  abnormal: z.enum(['H','L','N']).optional(),
});

export const medicationSchema = z.object({
  name: z.string().min(1),
  dose: z.string().optional(),       // e.g., "500 mg"
  route: z.string().optional(),
  frequency: z.string().optional(),  // e.g., "BID"
  startDate: z.coerce.date().optional(),
  endDate:   z.coerce.date().optional(),
});

export const immunizationSchema = z.object({
  vaccine: z.string().min(1),
  date:    z.coerce.date(),
  lot:     z.string().optional(),
});

export const allergySchema = z.object({
  substance: z.string().min(1),
  reaction:  z.string().optional(),
  severity:  z.enum(['mild','moderate','severe']).optional(),
});

export const attachmentSchema = z.object({
  filename: z.string().min(1),
  mime:     z.string().min(1),
  size:     z.number().int().min(0),
  url:      z.string().url().optional(), // later S3
  sha256:   z.string().optional(),
});

export const schemaByType = {
  vitals: vitalsSchema,
  visitNote: visitNoteSchema,
  diagnosis: diagnosisSchema,
  labResult: labResultSchema,
  medication: medicationSchema,
  immunization: immunizationSchema,
  allergy: allergySchema,
  attachment: attachmentSchema,
};

export type RecordType = keyof typeof schemaByType;

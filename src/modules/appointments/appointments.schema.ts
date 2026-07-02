import { z } from 'zod';

// ── Create Appointment (Patient) ─────────────────────────────────────────────
export const createAppointmentSchema = z.object({
  body: z.object({
    doctor_id: z.string().uuid('Invalid doctor ID format'),
    availability_slot_id: z.string().uuid('Invalid slot ID format'),
    appointment_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    reason: z.string().max(500).optional(),
  }),
});

// ── Update Status (Doctor) ───────────────────────────────────────────────────
export const updateAppointmentStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid appointment ID format'),
  }),
  body: z.object({
    status: z.enum(['confirmed', 'completed', 'no_show', 'cancelled'], {
    message: "Status must be confirmed, completed, no_show, or cancelled"
  }),
  }),
});

// ── List Appointments (Patient/Doctor) 
export const listAppointmentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    status: z
      .enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])
      .optional(),
    view: z.enum(['upcoming', 'past']).optional(),
  }),
});

// ── Inferred Types ───────────────────────────────────────────────────────────
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>['body'];
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>['body'];
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsSchema>['query'];
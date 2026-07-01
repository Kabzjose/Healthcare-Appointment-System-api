import { Request, Response } from 'express';
import * as doctorsService from './doctors.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthenticatedRequest } from '../../types';
import {
  CreateDoctorProfileInput,
  UpdateDoctorProfileInput,
  CreateAvailabilitySlotsInput,
  ToggleSlotInput,
  ListDoctorsQuery,
} from './doctors.schema';

// ── POST /doctors/profile ─────────────────────────────────────────────────────
export const createProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const profile = await doctorsService.createProfile(
      req.user.userId,
      req.body as CreateDoctorProfileInput
    );
    return ApiResponse.created(res, 'Doctor profile created', profile);
  }
);

// ── GET /doctors/profile/me
// Doctor views their own profile
export const getMyProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const profile = await doctorsService.getProfileByUserId(req.user.userId);
    return ApiResponse.ok(res, 'Profile fetched', profile);
  }
);

// ── GET /doctors/:profileId
// Anyone (patient, admin) views a specific doctor
export const getDoctorById = asyncHandler(async (req: Request<{ profileId: string }>, res: Response) => {
  const profile = await doctorsService.getProfileById(req.params.profileId);
  return ApiResponse.ok(res, 'Doctor fetched', profile);
});

// ── GET /doctors ──────────────────────────────────────────────────────────────
// Public listing — patients browse available doctors
export const listDoctors = asyncHandler(async (req: Request, res: Response) => {
  const result = await doctorsService.listDoctors(req.query as unknown as ListDoctorsQuery);
  return ApiResponse.ok(res, 'Doctors fetched', result.data, result.meta);
});

// ── PATCH /doctors/profile ────────────────────────────────────────────────────
export const updateProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const profile = await doctorsService.updateProfile(
      req.user.userId,
      req.body as UpdateDoctorProfileInput
    );
    return ApiResponse.ok(res, 'Profile updated', profile);
  }
);

// ── POST /doctors/availability ────────────────────────────────────────────────
export const createAvailabilitySlots = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const slots = await doctorsService.createAvailabilitySlots(
      req.user.userId,
      req.body as CreateAvailabilitySlotsInput
    );
    return ApiResponse.created(res, `${slots.length} slot(s) created`, slots);
  }
);

// ── GET /doctors/:profileId/availability ──────────────────────────────────────
// Patients use this to see what slots a doctor has open
export const getDoctorAvailability = asyncHandler(
  async (req: Request<{ profileId: string }>, res: Response) => {
    const slots = await doctorsService.getAvailabilitySlots(req.params.profileId);
    return ApiResponse.ok(res, 'Availability fetched', slots);
  }
);

// ── GET /doctors/availability/me ──────────────────────────────────────────────
// Doctor views all their own slots (active and inactive)
export const getMyAvailability = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const profile = await doctorsService.getProfileByUserId(req.user.userId);
    const slots = await doctorsService.getAvailabilitySlots(profile.profile_id, false);
    return ApiResponse.ok(res, 'Your availability fetched', slots);
  }
);

// ── PATCH /doctors/availability/:slotId ───────────────────────────────────────
export const toggleSlot = asyncHandler(
  async (req: AuthenticatedRequest & Request<{ slotId: string }>, res: Response) => {
    const slot = await doctorsService.toggleSlot(
      req.params.slotId,
      req.user.userId,
      req.body as ToggleSlotInput
    );
    return ApiResponse.ok(res, `Slot ${slot.is_active ? 'activated' : 'deactivated'}`, slot);
  }
);

// ── DELETE /doctors/availability/:slotId ──────────────────────────────────────
export const deleteSlot = asyncHandler(
  async (req: AuthenticatedRequest & Request<{ slotId: string }>, res: Response) => {
    await doctorsService.deleteSlot(req.params.slotId, req.user.userId);
    return ApiResponse.noContent(res);
  }
);
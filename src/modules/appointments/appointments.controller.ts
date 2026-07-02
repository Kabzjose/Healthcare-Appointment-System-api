import { Request, Response, NextFunction } from 'express';
import * as appointmentService from './appointments.service';
import { AuthenticatedRequest } from '../../types';

// ── Create Appointment ───────────────────────────────────────────────────────
export const createAppointment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const patientId = req.user.userId;
    const appointment = await appointmentService.createAppointment(patientId, req.body);
    
    res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// ── Cancel Appointment ───────────────────────────────────────────────────────
export const cancelAppointment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const patientId = req.user.userId;
    const { id } = req.params;
    const appointmentId = Array.isArray(id) ? id[0] : id;
    
    const appointment = await appointmentService.cancelAppointment(appointmentId, patientId);
    
    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// ── Update Status (Doctor) ───────────────────────────────────────────────────
export const updateAppointmentStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const doctorId = req.user.userId; // Assuming this is the doctor's profile ID or user ID mapped correctly
    const { id } = req.params;
    const appointmentId = Array.isArray(id) ? id[0] : id;
    
    // Note: If req.user.id is the user_id and not the profile_id, 
    // you might need to fetch the profile_id first like in the doctors module.
    const appointment = await appointmentService.updateAppointmentStatus(appointmentId, doctorId, req.body);
    
    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// ── List Appointments ────────────────────────────────────────────────────────
export const getMyAppointments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    
    const result = await appointmentService.listAppointments(userId, role, req.query as any);
    
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// ── Get Single Appointment ───────────────────────────────────────────────────
export const getAppointmentById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const { id } = req.params;
    const appointmentId = Array.isArray(id) ? id[0] : id;
    
    const appointment = await appointmentService.getAppointmentById(appointmentId, userId, role);
    
    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};
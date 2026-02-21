
import React from 'react';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface SurveyData {
  occupation: string;
  environments: string;
  frustrations: string;
  imageDesire: string;
  whyNow: string;
  investmentRange: string;
}

export interface Appointment {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  date: string;
  timeSlot: string;
  status: AppointmentStatus;
  survey: SurveyData;
  createdAt: string;
}

// Renamed from MetricCard to MetricCardProps to avoid conflict with the component name
export interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

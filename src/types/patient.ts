export interface Patient {
  id: string;
  chartNumber: string;
  name: string;
  lastUpdate: string;
  status: string;
  doctor: string;
  symptom: string;
  diagnosis?: string;
  medicalRecords: MedicalRecord[];
}

export interface MedicalRecord {
  id: string;
  date: string;
  condition: string;
  treatment: string;
  dentist: string;
  status: 'done' | 'pending';
  notes?: string;
  tooth?: number;
}

export interface AppointmentHistory {
  id: string;
  date: string;
  treatment: string;
  dentist: string;
  status: 'completed' | 'cancelled' | 'scheduled';
  notes?: string;
}
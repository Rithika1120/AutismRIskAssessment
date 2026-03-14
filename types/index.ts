export type UserRole = 'patient' | 'therapist';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  therapistId?: string;
}

export interface Patient extends User {
  role: 'patient';
  therapistId?: string;
}

export interface Therapist extends User {
  role: 'therapist';
  specialization?: string;
  licenseNumber?: string;
}

export interface AssessmentQuestion {
  id: number;
  question: string;
  category: string;
  options: {
    value: number;
    label: string;
  }[];
}

export interface AssessmentAnswer {
  questionId: number;
  value: number;
}

export interface Assessment {
  id: string;
  patientId: string;
  patientName?: string;
  answers: AssessmentAnswer[];
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  featureImportance: FeatureImportance[];
  completedAt: string;
  notes?: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  contribution: 'positive' | 'negative';
}

export interface Prescription {
  id: string;
  patientId: string;
  therapistId: string;
  therapistName: string;
  medication?: string;
  dosage?: string;
  instructions: string;
  recommendations: string[];
  createdAt: string;
}

export interface PatientProgress {
  patientId: string;
  assessments: Assessment[];
  prescriptions: Prescription[];
}

// API Response types for Flask backend integration
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  role?: UserRole;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Flask API Integration Module
 */

import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Assessment,
  Prescription,
  AssessmentAnswer,
} from "@/types";

// Backend URL
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Always read token from localStorage
const getAuthToken = (): string | null => {
  return (
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken")
  );
};

// Helper API request
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getAuthToken();

  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  // If body is JSON, add content-type
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Attach JWT token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error:
          data?.error ||
          data?.message ||
          `Request failed (${response.status})`,
      };
    }

    return {
      success: data?.success ?? true,
      data: (data?.data ?? data) as T,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
};

// ---------------- AUTH ----------------
export const authApi = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    return apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiRequest<User>("/auth/me");
  },
};

// ---------------- PATIENTS ----------------
export const patientsApi = {
  getAll: async (): Promise<ApiResponse<User[]>> => {
    return apiRequest<User[]>("/patients");
  },

  getById: async (id: string): Promise<ApiResponse<User>> => {
    return apiRequest<User>(`/patients/${id}`);
  },

  getAssessments: async (patientId: string): Promise<ApiResponse<Assessment[]>> => {
    return apiRequest<Assessment[]>(`/patients/${patientId}/assessments`);
  },
};

// ---------------- ASSESSMENTS ----------------
export const assessmentsApi = {
  getAll: async (): Promise<ApiResponse<Assessment[]>> => {
    return apiRequest<Assessment[]>("/assessments");
  },

  getById: async (id: string): Promise<ApiResponse<Assessment>> => {
    return apiRequest<Assessment>(`/assessments/${id}`);
  },

  submit: async (payload: {
    ageGroup: "child" | "adolescent" | "adult";
    model: "lightgbm" | "catboost";
    answers: AssessmentAnswer[];
    meta: {
      age: number;
      gender: string;
      ethnicity: string;
      country: string;
      jaundice: string;
      autism: string;
    };
  }): Promise<ApiResponse<Assessment>> => {
    return apiRequest<Assessment>("/assessments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

// ---------------- PRESCRIPTIONS ----------------
export const prescriptionsApi = {
  getAll: async (): Promise<ApiResponse<Prescription[]>> => {
    return apiRequest<Prescription[]>("/prescriptions");
  },

  getByPatient: async (patientId: string): Promise<ApiResponse<Prescription[]>> => {
    return apiRequest<Prescription[]>(`/patients/${patientId}/prescriptions`);
  },

  create: async (
    prescription: Omit<Prescription, "id" | "createdAt">
  ): Promise<ApiResponse<Prescription>> => {
    return apiRequest<Prescription>("/prescriptions", {
      method: "POST",
      body: JSON.stringify(prescription),
    });
  },
};

// ---------------- ML PREDICTION ----------------
export const predictionApi = {
  predict: async (payload: {
    ageGroup: "child" | "adolescent" | "adult";
    model: "lightgbm" | "catboost";
    answers: AssessmentAnswer[];
    meta: {
      age: number;
      gender: string;
      ethnicity: string;
      country: string;
      jaundice: string;
      autism: string;
    };
  }) => {
    return apiRequest<{
      riskScore: number;
      riskLevel: "low" | "medium" | "high";
      featureImportance: {
        feature: string;
        importance: number;
        contribution: "positive" | "negative";
      }[];
    }>("/predict", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

// ---------------- INVITE ----------------
export const inviteApi = {
  /**
   * Generate a new invite code (therapist only)
   * POST /api/invite
   * Returns: { code: string, expiresAt: string }
   */
  generate: async (): Promise<
    ApiResponse<{ code: string; expiresAt: string }>
  > => {
    return apiRequest<{ code: string; expiresAt: string }>("/invite", {
      method: "POST",
    });
  },

  /**
   * Redeem an invite code (patient side)
   * POST /api/invite/redeem
   * Body: { code: string }
   */
  redeem: async (
    code: string
  ): Promise<ApiResponse<{ message: string; therapistId?: string }>> => {
    return apiRequest<{ message: string; therapistId?: string }>(
      "/invite/redeem",
      {
        method: "POST",
        body: JSON.stringify({ code }),
      }
    );
  },

  /**
   * Validate an invite code without redeeming it
   * GET /api/invite/validate/:code
   */
  validate: async (
    code: string
  ): Promise<ApiResponse<{ valid: boolean; expiresAt?: string }>> => {
    return apiRequest<{ valid: boolean; expiresAt?: string }>(
      `/invite/validate/${code}`
    );
  },
};

export default {
  auth: authApi,
  patients: patientsApi,
  assessments: assessmentsApi,
  prescriptions: prescriptionsApi,
  prediction: predictionApi,
  invite: inviteApi,
};
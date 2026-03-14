import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  patientsApi,
  assessmentsApi,
  prescriptionsApi,
  predictionApi,
  inviteApi,
  apiRequest,
} from "@/lib/api";
import { AssessmentAnswer, Prescription } from "@/types";
import { useAuth } from "@/context/AuthContext";

// Query keys
export const queryKeys = {
  patients: ["patients"] as const,
  patient: (id: string) => ["patients", id] as const,
  patientAssessments: (patientId: string) =>
    ["patients", patientId, "assessments"] as const,
  assessments: ["assessments"] as const,
  assessment: (id: string) => ["assessments", id] as const,
  prescriptions: ["prescriptions"] as const,
  patientPrescriptions: (patientId: string) =>
    ["prescriptions", patientId] as const,
  inviteCodes: ["invite-codes"] as const,
  myTherapist: ["my-therapist"] as const,
};

// ======================= PATIENTS HOOKS =======================

export const usePatients = () => {
  return useQuery({
    queryKey: queryKeys.patients,
    queryFn: async () => {
      const response = await patientsApi.getAll();
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });
};

export const usePatient = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.patient(patientId),
    queryFn: async () => {
      const response = await patientsApi.getById(patientId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    enabled: !!patientId,
  });
};

export const usePatientAssessments = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.patientAssessments(patientId),
    queryFn: async () => {
      const response = await patientsApi.getAssessments(patientId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    enabled: !!patientId,
  });
};

// ======================= ASSESSMENTS HOOKS =======================

export const useAssessments = () => {
  return useQuery({
    queryKey: queryKeys.assessments,
    queryFn: async () => {
      const response = await assessmentsApi.getAll();
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });
};

export const useMyAssessments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.patientAssessments(user?.id || ""),
    queryFn: async () => {
      const response = await assessmentsApi.getAll();
      if (!response.success) throw new Error(response.error);
      return response.data.filter((a: any) => a.patientId === user?.id);
    },
    enabled: !!user?.id,
  });
};

export const useSubmitAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
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
      const response = await assessmentsApi.submit(payload);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments });
    },
  });
};

export const usePrediction = () => {
  return useMutation({
    mutationFn: async (payload: {
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
      const response = await predictionApi.predict(payload);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });
};

// ======================= PRESCRIPTIONS HOOKS =======================

export const usePrescriptions = () => {
  return useQuery({
    queryKey: queryKeys.prescriptions,
    queryFn: async () => {
      const response = await prescriptionsApi.getAll();
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });
};

export const usePatientPrescriptions = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.patientPrescriptions(patientId),
    queryFn: async () => {
      const response = await prescriptionsApi.getByPatient(patientId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    enabled: !!patientId,
  });
};

export const useCreatePrescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prescription: Omit<Prescription, "id" | "createdAt">) => {
      const response = await prescriptionsApi.create(prescription);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions });
    },
  });
};

// ======================= INVITE CODE HOOKS =======================

// ✅ Uses inviteApi.generate() → POST /invite
export const useGetOrCreateInviteCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await inviteApi.generate();
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inviteCodes });
    },
  });
};

// ✅ Also uses inviteApi.generate() — backend replaces old unused codes
export const useForceNewInviteCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await inviteApi.generate();
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inviteCodes });
    },
  });
};

// ✅ Uses inviteApi.redeem()
export const useRedeemInviteCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const response = await inviteApi.redeem(code);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myTherapist });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
    },
  });
};

// ✅ FIXED: Only fires when therapistId exists, fetches therapist by ID
export const useMyTherapist = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.myTherapist,
    queryFn: async () => {
      // No therapistId means not linked — return null immediately
      if (!user?.therapistId) return null;

      const response = await apiRequest(`/auth/therapist/${user.therapistId}`);
      if (!(response as any).success) return null;
      return (response as any)?.data ?? null;
    },
    // ✅ Only runs if patient role AND therapistId is set
    enabled: user?.role === "patient" && !!user?.therapistId,
  });
};
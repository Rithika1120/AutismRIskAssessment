import {
  Assessment,
  AssessmentQuestion,
  Patient,
  Prescription,
  Therapist,
  FeatureImportance,
} from "@/types";

/**
 * =========================================================
 * ✅ Assessment Questions (Base)
 * =========================================================
 */
export const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: 1,
    question: "Does the child make eye contact when spoken to?",
    category: "Social Communication",
    options: [
      { value: 0, label: "Always" },
      { value: 1, label: "Often" },
      { value: 2, label: "Sometimes" },
      { value: 3, label: "Rarely" },
      { value: 4, label: "Never" },
    ],
  },
  {
    id: 2,
    question: "Does the child respond to their name when called?",
    category: "Social Communication",
    options: [
      { value: 0, label: "Always" },
      { value: 1, label: "Often" },
      { value: 2, label: "Sometimes" },
      { value: 3, label: "Rarely" },
      { value: 4, label: "Never" },
    ],
  },
  {
    id: 3,
    question: "Does the child engage in pretend play?",
    category: "Imagination & Play",
    options: [
      { value: 0, label: "Frequently" },
      { value: 1, label: "Sometimes" },
      { value: 2, label: "Rarely" },
      { value: 3, label: "Very rarely" },
      { value: 4, label: "Never" },
    ],
  },
  {
    id: 4,
    question: "Does the child show interest in other children?",
    category: "Social Interaction",
    options: [
      { value: 0, label: "Very interested" },
      { value: 1, label: "Somewhat interested" },
      { value: 2, label: "Occasionally" },
      { value: 3, label: "Rarely" },
      { value: 4, label: "No interest" },
    ],
  },
  {
    id: 5,
    question: "Does the child have repetitive behaviors or movements?",
    category: "Repetitive Behaviors",
    options: [
      { value: 0, label: "Never" },
      { value: 1, label: "Rarely" },
      { value: 2, label: "Sometimes" },
      { value: 3, label: "Often" },
      { value: 4, label: "Very frequently" },
    ],
  },
  {
    id: 6,
    question: "Does the child have difficulty with changes in routine?",
    category: "Flexibility",
    options: [
      { value: 0, label: "No difficulty" },
      { value: 1, label: "Mild difficulty" },
      { value: 2, label: "Moderate difficulty" },
      { value: 3, label: "Significant difficulty" },
      { value: 4, label: "Extreme difficulty" },
    ],
  },
  {
    id: 7,
    question: "Does the child use gestures to communicate?",
    category: "Communication",
    options: [
      { value: 0, label: "Frequently" },
      { value: 1, label: "Often" },
      { value: 2, label: "Sometimes" },
      { value: 3, label: "Rarely" },
      { value: 4, label: "Never" },
    ],
  },
  {
    id: 8,
    question: "Does the child have unusual reactions to sensory stimuli?",
    category: "Sensory Processing",
    options: [
      { value: 0, label: "No unusual reactions" },
      { value: 1, label: "Occasional reactions" },
      { value: 2, label: "Moderate reactions" },
      { value: 3, label: "Frequent reactions" },
      { value: 4, label: "Constant reactions" },
    ],
  },
  {
    id: 9,
    question: "Does the child show appropriate emotional responses?",
    category: "Emotional Regulation",
    options: [
      { value: 0, label: "Always appropriate" },
      { value: 1, label: "Usually appropriate" },
      { value: 2, label: "Sometimes inappropriate" },
      { value: 3, label: "Often inappropriate" },
      { value: 4, label: "Rarely appropriate" },
    ],
  },
  {
    id: 10,
    question: "Does the child have age-appropriate language skills?",
    category: "Language Development",
    options: [
      { value: 0, label: "Above average" },
      { value: 1, label: "Age appropriate" },
      { value: 2, label: "Slightly delayed" },
      { value: 3, label: "Moderately delayed" },
      { value: 4, label: "Significantly delayed" },
    ],
  },
];

/**
 * =========================================================
 * ✅ Age Group Question Sets
 * (For now: same questions for all groups)
 * =========================================================
 */
export const childAssessmentQuestions: AssessmentQuestion[] = assessmentQuestions;
export const adolescentAssessmentQuestions: AssessmentQuestion[] =
  assessmentQuestions;
export const adultAssessmentQuestions: AssessmentQuestion[] = assessmentQuestions;

/**
 * =========================================================
 * ✅ Mock Users
 * =========================================================
 */
export const mockPatients: Patient[] = [
  {
    id: "p1",
    email: "patient1@example.com",
    name: "Alex Johnson",
    role: "patient",
    therapistId: "t1",
    createdAt: "2024-01-15",
  },
  {
    id: "p2",
    email: "patient2@example.com",
    name: "Sam Williams",
    role: "patient",
    therapistId: "t1",
    createdAt: "2024-02-20",
  },
  {
    id: "p3",
    email: "patient3@example.com",
    name: "Jordan Smith",
    role: "patient",
    therapistId: "t1",
    createdAt: "2024-03-10",
  },
];

export const mockTherapists: Therapist[] = [
  {
    id: "t1",
    email: "therapist@example.com",
    name: "Dr. Sarah Chen",
    role: "therapist",
    specialization: "Pediatric Autism Spectrum Disorders",
    licenseNumber: "PSY-12345",
    createdAt: "2023-06-01",
  },
];

/**
 * =========================================================
 * ✅ Feature Importance (Mock)
 * =========================================================
 */
const generateFeatureImportance = (): FeatureImportance[] => [
  { feature: "Social Communication", importance: 0.25, contribution: "positive" },
  { feature: "Repetitive Behaviors", importance: 0.2, contribution: "positive" },
  { feature: "Sensory Processing", importance: 0.18, contribution: "positive" },
  { feature: "Language Development", importance: 0.15, contribution: "negative" },
  { feature: "Social Interaction", importance: 0.12, contribution: "positive" },
  { feature: "Emotional Regulation", importance: 0.1, contribution: "negative" },
];

/**
 * =========================================================
 * ✅ Mock Assessments
 * =========================================================
 */
export const mockAssessments: Assessment[] = [
  {
    id: "a1",
    patientId: "p1",
    patientName: "Alex Johnson",
    answers: [
      { questionId: 1, value: 2 },
      { questionId: 2, value: 2 },
      { questionId: 3, value: 3 },
      { questionId: 4, value: 2 },
      { questionId: 5, value: 3 },
      { questionId: 6, value: 2 },
      { questionId: 7, value: 2 },
      { questionId: 8, value: 2 },
      { questionId: 9, value: 2 },
      { questionId: 10, value: 2 },
    ],
    riskScore: 65,
    riskLevel: "medium",
    featureImportance: generateFeatureImportance(),
    completedAt: "2024-12-01",
  },
  {
    id: "a2",
    patientId: "p1",
    patientName: "Alex Johnson",
    answers: [
      { questionId: 1, value: 2 },
      { questionId: 2, value: 1 },
      { questionId: 3, value: 2 },
      { questionId: 4, value: 2 },
      { questionId: 5, value: 2 },
      { questionId: 6, value: 2 },
      { questionId: 7, value: 1 },
      { questionId: 8, value: 2 },
      { questionId: 9, value: 1 },
      { questionId: 10, value: 2 },
    ],
    riskScore: 52,
    riskLevel: "medium",
    featureImportance: generateFeatureImportance(),
    completedAt: "2024-12-15",
  },
  {
    id: "a3",
    patientId: "p1",
    patientName: "Alex Johnson",
    answers: [
      { questionId: 1, value: 1 },
      { questionId: 2, value: 1 },
      { questionId: 3, value: 2 },
      { questionId: 4, value: 1 },
      { questionId: 5, value: 2 },
      { questionId: 6, value: 1 },
      { questionId: 7, value: 1 },
      { questionId: 8, value: 1 },
      { questionId: 9, value: 1 },
      { questionId: 10, value: 1 },
    ],
    riskScore: 38,
    riskLevel: "low",
    featureImportance: generateFeatureImportance(),
    completedAt: "2025-01-05",
  },
  {
    id: "a4",
    patientId: "p2",
    patientName: "Sam Williams",
    answers: [
      { questionId: 1, value: 3 },
      { questionId: 2, value: 3 },
      { questionId: 3, value: 3 },
      { questionId: 4, value: 3 },
      { questionId: 5, value: 3 },
      { questionId: 6, value: 3 },
      { questionId: 7, value: 3 },
      { questionId: 8, value: 3 },
      { questionId: 9, value: 3 },
      { questionId: 10, value: 3 },
    ],
    riskScore: 78,
    riskLevel: "high",
    featureImportance: generateFeatureImportance(),
    completedAt: "2025-01-10",
  },
  {
    id: "a5",
    patientId: "p3",
    patientName: "Jordan Smith",
    answers: [
      { questionId: 1, value: 1 },
      { questionId: 2, value: 1 },
      { questionId: 3, value: 1 },
      { questionId: 4, value: 1 },
      { questionId: 5, value: 1 },
      { questionId: 6, value: 1 },
      { questionId: 7, value: 1 },
      { questionId: 8, value: 1 },
      { questionId: 9, value: 1 },
      { questionId: 10, value: 2 },
    ],
    riskScore: 28,
    riskLevel: "low",
    featureImportance: generateFeatureImportance(),
    completedAt: "2025-01-08",
  },
];

/**
 * =========================================================
 * ✅ Mock Prescriptions
 * =========================================================
 */
export const mockPrescriptions: Prescription[] = [
  {
    id: "rx1",
    patientId: "p1",
    therapistId: "t1",
    therapistName: "Dr. Sarah Chen",
    instructions:
      "Continue with weekly therapy sessions. Focus on social communication exercises.",
    recommendations: [
      "Increase structured play activities",
      "Practice eye contact exercises daily",
      "Use visual schedules for daily routines",
      "Consider occupational therapy evaluation",
    ],
    createdAt: "2024-12-16",
  },
  {
    id: "rx2",
    patientId: "p2",
    therapistId: "t1",
    therapistName: "Dr. Sarah Chen",
    instructions:
      "Intensive therapy recommended. Refer to speech-language pathologist.",
    recommendations: [
      "Start ABA therapy sessions",
      "Speech therapy 2x per week",
      "Sensory integration activities",
      "Parent training sessions",
    ],
    createdAt: "2025-01-11",
  },
];

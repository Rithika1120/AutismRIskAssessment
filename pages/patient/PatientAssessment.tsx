import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { assessmentQuestions } from "@/lib/mockData";
import { AssessmentAnswer } from "@/types";
import RiskBadge from "@/components/ui/RiskBadge";
import FeatureImportanceChart from "@/components/charts/FeatureImportanceChart";
import { useSubmitAssessment } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import {
  RotateCcw, Home, ChevronRight, ChevronLeft,
  Brain, User, CheckCircle2, AlertCircle, Info
} from "lucide-react";

interface AssessmentResult {
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  featureImportance: {
    feature: string;
    importance: number;
    contribution: "positive" | "negative";
  }[];
}

type AgeGroup = "child" | "adolescent" | "adult";

const getAgeGroup = (age: number): AgeGroup => {
  if (age <= 11) return "child";
  if (age <= 17) return "adolescent";
  return "adult";
};

const CATEGORY_COLORS: Record<string, string> = {
  "Social Communication": "bg-blue-100 text-blue-700",
  "Imagination & Play": "bg-purple-100 text-purple-700",
  "Social Interaction": "bg-indigo-100 text-indigo-700",
  "Repetitive Behaviors": "bg-orange-100 text-orange-700",
  "Flexibility": "bg-yellow-100 text-yellow-700",
  "Communication": "bg-teal-100 text-teal-700",
  "Sensory Processing": "bg-pink-100 text-pink-700",
  "Emotional Regulation": "bg-rose-100 text-rose-700",
  "Language Development": "bg-green-100 text-green-700",
};

const getRiskColor = (level: string) => {
  if (level === "high") return "text-red-600";
  if (level === "medium") return "text-yellow-600";
  return "text-green-600";
};

const getRiskBg = (level: string) => {
  if (level === "high") return "bg-red-50 border-red-200";
  if (level === "medium") return "bg-yellow-50 border-yellow-200";
  return "bg-green-50 border-green-200";
};

const PatientAssessment: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const submitAssessment = useSubmitAssessment();

  const [step, setStep] = useState<"meta" | "questions" | "result">("meta");
  const [meta, setMeta] = useState({
    age: 18,
    gender: "m",
    ethnicity: "Asian",
    country: "India",
    jaundice: "no",
    autism: "no"
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const ageGroup: AgeGroup = getAgeGroup(meta.age);
  const question = assessmentQuestions[currentQuestion];
  const currentAnswer = answers.find((a) => a.questionId === question.id);
  const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100;
  const answeredCount = answers.length;

  const handleAnswer = (value: string) => {
    const newAnswer: AssessmentAnswer = {
      questionId: question.id,
      value: parseInt(value)
    };
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== question.id);
      return [...filtered, newAnswer];
    });
  };

  const handleNext = () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await submitAssessment.mutateAsync({
        ageGroup,
        model: "catboost",
        answers,
        meta
      });

      const assessment = response as any;
      setResult({
        riskScore: Number((assessment?.riskScore ?? 0).toFixed(2)),
        riskLevel: assessment?.riskLevel ?? "low",
        featureImportance: assessment?.featureImportance || []
      });
      setStep("result");
    } catch (error) {
      console.error("ASSESSMENT ERROR:", error);
      toast({
        title: "Submission failed",
        description: "Server error occurred",
        variant: "destructive"
      });
    }
  };

  const handleRestart = () => {
    setStep("meta");
    setCurrentQuestion(0);
    setAnswers([]);
    setResult(null);
  };

  const isSubmitting = submitAssessment.isPending;

  // ── META STEP ──────────────────────────────────────────
  if (step === "meta") {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Hero */}
          <div className="text-center space-y-2 py-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Brain className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Autism Risk Assessment</h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Answer 10 questions to get an AI-powered autism risk prediction with detailed explainability.
            </p>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>This screening tool uses CatBoost AI trained on clinical data. Results are for informational purposes only and not a medical diagnosis.</p>
          </div>

          {/* Form */}
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </div>
              <CardDescription>Provide details for an accurate age-group prediction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Age */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Age <span className="text-red-500">*</span></Label>
                <input
                  type="number"
                  value={meta.age}
                  min={1}
                  max={100}
                  onChange={(e) => setMeta((prev) => ({ ...prev, age: Number(e.target.value) }))}
                  className="w-full border border-input rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
                <p className="text-xs text-muted-foreground">
                  Age group: <span className="font-medium capitalize text-primary">{ageGroup}</span>
                  {" "}({ageGroup === "child" ? "≤11" : ageGroup === "adolescent" ? "12–17" : "18+"} years)
                </p>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Gender</Label>
                <div className="flex gap-3">
                  {[{ value: "m", label: "Male" }, { value: "f", label: "Female" }].map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setMeta((prev) => ({ ...prev, gender: g.value }))}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        meta.gender === g.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input hover:bg-muted"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jaundice & Autism */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Jaundice at birth?</Label>
                  <div className="flex gap-2">
                    {["yes", "no"].map((v) => (
                      <button
                        key={v}
                        onClick={() => setMeta((prev) => ({ ...prev, jaundice: v }))}
                        className={`flex-1 py-2 rounded-lg border text-sm capitalize transition-all ${
                          meta.jaundice === v
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-input hover:bg-muted"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Family autism history?</Label>
                  <div className="flex gap-2">
                    {["yes", "no"].map((v) => (
                      <button
                        key={v}
                        onClick={() => setMeta((prev) => ({ ...prev, autism: v }))}
                        className={`flex-1 py-2 rounded-lg border text-sm capitalize transition-all ${
                          meta.autism === v
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-input hover:bg-muted"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep("questions")}
                className="w-full h-11 text-base"
              >
                Start Assessment
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>

            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // ── RESULT STEP ────────────────────────────────────────
  if (step === "result" && result) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Result header */}
          <div className="text-center space-y-1 py-2">
            <h1 className="text-2xl font-bold">Assessment Complete</h1>
            <p className="text-muted-foreground text-sm">AI-powered autism risk prediction</p>
          </div>

          {/* Risk score card */}
          <Card className={`border-2 shadow-md ${getRiskBg(result.riskLevel)}`}>
            <CardContent className="py-8">
              <div className="text-center space-y-3">
                <div className={`text-6xl font-bold ${getRiskColor(result.riskLevel)}`}>
                  {result.riskScore}%
                </div>
                <RiskBadge level={result.riskLevel} />
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {result.riskLevel === "high"
                    ? "High indicators detected. Please consult a healthcare professional for a formal evaluation."
                    : result.riskLevel === "medium"
                    ? "Some indicators present. Consider discussing with a healthcare provider."
                    : "Low risk indicators. Continue monitoring development as needed."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-card p-3 text-center">
              <p className="text-2xl font-bold">{answeredCount}</p>
              <p className="text-xs text-muted-foreground">Questions answered</p>
            </div>
            <div className="rounded-lg border bg-card p-3 text-center">
              <p className="text-2xl font-bold capitalize">{ageGroup}</p>
              <p className="text-xs text-muted-foreground">Age group</p>
            </div>
            <div className="rounded-lg border bg-card p-3 text-center">
              <p className="text-2xl font-bold">CatBoost</p>
              <p className="text-xs text-muted-foreground">Model used</p>
            </div>
          </div>

          {/* SHAP chart */}
          {result.featureImportance?.length > 0 && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Feature Explainability</CardTitle>
                <CardDescription>What influenced this prediction</CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureImportanceChart features={result.featureImportance} />
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>This result is a screening tool only and does not constitute a medical diagnosis. Always consult a qualified healthcare professional.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleRestart} className="flex-1">
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <Button onClick={() => navigate("/dashboard")} className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>

        </div>
      </Layout>
    );
  }

  // ── QUESTIONS STEP ─────────────────────────────────────
  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Progress header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">
              Question {currentQuestion + 1} of {assessmentQuestions.length}
            </span>
            <span className="text-muted-foreground">
              {answeredCount} answered
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question dots */}
          <div className="flex gap-1.5 flex-wrap">
            {assessmentQuestions.map((_, i) => {
              const isAnswered = answers.some(a => a.questionId === assessmentQuestions[i].id);
              const isCurrent = i === currentQuestion;
              return (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? "w-6 bg-primary"
                      : isAnswered
                      ? "w-2 bg-primary/60"
                      : "w-2 bg-muted-foreground/20"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Question card */}
        <Card className="shadow-md border-0 shadow-slate-200">
          <CardHeader className="pb-3">
            {/* Category badge */}
            {question.category && (
              <span className={`inline-flex w-fit text-xs px-2.5 py-1 rounded-full font-medium ${
                CATEGORY_COLORS[question.category] || "bg-gray-100 text-gray-700"
              }`}>
                {question.category}
              </span>
            )}
            <CardTitle className="text-lg leading-snug mt-2">
              {question.question}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <RadioGroup
              value={currentAnswer?.value?.toString()}
              onValueChange={handleAnswer}
              className="space-y-2"
            >
              {question.options.map((option) => {
                const isSelected = currentAnswer?.value?.toString() === option.value.toString();
                return (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem
                      value={option.value.toString()}
                      className="flex-shrink-0"
                    />
                    <span className={`text-sm ${isSelected ? "font-medium text-primary" : "text-foreground"}`}>
                      {option.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="ml-auto h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </label>
                );
              })}
            </RadioGroup>

            {/* Navigation */}
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              {currentQuestion === assessmentQuestions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !currentAnswer}
                  className="gap-1 min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Get Result
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!currentAnswer}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
};

export default PatientAssessment;
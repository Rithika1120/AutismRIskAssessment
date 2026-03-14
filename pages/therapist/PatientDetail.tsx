import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import RiskBadge from '@/components/ui/RiskBadge';
import RiskScoreChart from '@/components/charts/RiskScoreChart';
import FeatureImportanceChart from '@/components/charts/FeatureImportanceChart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatient, usePatientAssessments, usePatientPrescriptions, useCreatePrescription } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  ClipboardCheck,
  TrendingDown,
  FileText,
  Plus,
  Stethoscope,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

const PatientDetail: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [newPrescription, setNewPrescription] = useState({
    instructions: '',
    recommendation1: '',
    recommendation2: '',
    recommendation3: ''
  });

  // Fetch data from API
  const { data: patient, isLoading: patientLoading } = usePatient(patientId || '');
  const { data: assessments = [], isLoading: assessmentsLoading } = usePatientAssessments(patientId || '');
  const { data: prescriptions = [], isLoading: prescriptionsLoading } = usePatientPrescriptions(patientId || '');
  const createPrescription = useCreatePrescription();
  
  // Sort assessments by date
  const patientAssessments = [...assessments].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
  
  const latestAssessment = patientAssessments[0];
  const previousAssessment = patientAssessments[1];

  // Calculate score trend
  const scoreTrend = previousAssessment && latestAssessment 
    ? previousAssessment.riskScore - latestAssessment.riskScore 
    : 0;

  const handleCreatePrescription = async () => {
    if (!patientId || !user) return;
    
    const recommendations = [
      newPrescription.recommendation1,
      newPrescription.recommendation2,
      newPrescription.recommendation3
    ].filter(Boolean);

    try {
      await createPrescription.mutateAsync({
        patientId,
        therapistId: user.id,
        therapistName: user.name,
        instructions: newPrescription.instructions,
        recommendations
      });
      
      toast({
        title: "Prescription created",
        description: "The prescription has been added successfully."
      });
      
      setPrescriptionDialogOpen(false);
      setNewPrescription({
        instructions: '',
        recommendation1: '',
        recommendation2: '',
        recommendation3: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create prescription. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isLoading = patientLoading || assessmentsLoading || prescriptionsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-32 mb-4" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div>
                  <Skeleton className="h-9 w-48" />
                  <Skeleton className="h-5 w-64 mt-2" />
                </div>
              </div>
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold">Patient not found</h1>
          <Button asChild className="mt-4">
            <Link to="/therapist/patients">Back to Patients</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link to="/therapist/patients">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Patients
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{patient.name}</h1>
                <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {patient.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {format(new Date(patient.createdAt), 'MMM yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Prescription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Prescription</DialogTitle>
                <DialogDescription>
                  Add recommendations and instructions for {patient.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    placeholder="General instructions and notes..."
                    value={newPrescription.instructions}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, instructions: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recommendations</Label>
                  <Input
                    placeholder="Recommendation 1"
                    value={newPrescription.recommendation1}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, recommendation1: e.target.value }))}
                  />
                  <Input
                    placeholder="Recommendation 2"
                    value={newPrescription.recommendation2}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, recommendation2: e.target.value }))}
                  />
                  <Input
                    placeholder="Recommendation 3"
                    value={newPrescription.recommendation3}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, recommendation3: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPrescriptionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePrescription}
                  disabled={createPrescription.isPending}
                >
                  {createPrescription.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Prescription'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Risk Alert */}
        {latestAssessment?.riskLevel === 'high' && (
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">High Risk Assessment</p>
                <p className="text-sm text-muted-foreground">
                  This patient's latest assessment indicates high risk. Immediate attention recommended.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Latest Risk Score"
            value={latestAssessment ? `${latestAssessment.riskScore}%` : 'N/A'}
            icon={ClipboardCheck}
          >
            {latestAssessment && (
              <div className="mt-3">
                <RiskBadge level={latestAssessment.riskLevel} />
              </div>
            )}
          </StatCard>
          
          <StatCard 
            title="Score Change"
            value={scoreTrend > 0 ? `↓ ${scoreTrend}%` : scoreTrend < 0 ? `↑ ${Math.abs(scoreTrend)}%` : '—'}
            subtitle={scoreTrend > 0 ? 'Improvement' : scoreTrend < 0 ? 'Needs attention' : 'No change'}
            icon={TrendingDown}
            trend={scoreTrend !== 0 ? { value: Math.abs(scoreTrend), isPositive: scoreTrend > 0 } : undefined}
          />
          
          <StatCard 
            title="Total Assessments"
            value={patientAssessments.length}
            subtitle="Completed"
            icon={FileText}
          />
          
          <StatCard 
            title="Prescriptions"
            value={prescriptions.length}
            subtitle="Created"
            icon={Stethoscope}
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Progress Chart */}
          <Card className="shadow-clinical">
            <CardHeader>
              <CardTitle>Risk Score Progress</CardTitle>
              <CardDescription>Track how scores change over time</CardDescription>
            </CardHeader>
            <CardContent>
              {patientAssessments.length > 0 ? (
                <RiskScoreChart assessments={patientAssessments} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No assessments yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feature Importance */}
          <Card className="shadow-clinical">
            <CardHeader>
              <CardTitle>Contributing Factors</CardTitle>
              <CardDescription>Features affecting the latest assessment</CardDescription>
            </CardHeader>
            <CardContent>
              {latestAssessment ? (
                <FeatureImportanceChart features={latestAssessment.featureImportance} />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No assessments yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assessment History & Prescriptions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Assessment History */}
          <Card className="shadow-clinical">
            <CardHeader>
              <CardTitle>Assessment History</CardTitle>
              <CardDescription>All completed assessments</CardDescription>
            </CardHeader>
            <CardContent>
              {patientAssessments.length > 0 ? (
                <div className="space-y-3">
                  {patientAssessments.map((assessment) => (
                    <div 
                      key={assessment.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {format(new Date(assessment.completedAt), 'MMMM dd, yyyy')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {assessment.answers.length} questions answered
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{assessment.riskScore}%</p>
                        <RiskBadge level={assessment.riskLevel} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No assessments completed yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescriptions */}
          <Card className="shadow-clinical">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Prescriptions</CardTitle>
                <CardDescription>Recommendations and instructions</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {prescriptions.length > 0 ? (
                <div className="space-y-4">
                  {prescriptions.map((prescription) => (
                    <div 
                      key={prescription.id}
                      className="p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">{prescription.therapistName}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(prescription.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {prescription.instructions}
                      </p>
                      <ul className="space-y-2">
                        {prescription.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                  <p className="mb-3">No prescriptions yet</p>
                  <Button variant="outline" size="sm" onClick={() => setPrescriptionDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Prescription
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PatientDetail;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import RiskBadge from '@/components/ui/RiskBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatients, useAssessments, useGetOrCreateInviteCode, useForceNewInviteCode } from '@/hooks/useApi';
import {
  Users, ClipboardCheck, AlertTriangle, TrendingUp,
  ArrowRight, User, Calendar, Copy, RefreshCw,
  Check, UserPlus, Clock, X
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const TherapistDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: allAssessments = [], isLoading: assessmentsLoading } = useAssessments();
  const getOrCreateCode = useGetOrCreateInviteCode();
  const forceNewCode = useForceNewInviteCode();

  const [inviteData, setInviteData] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const assignedPatients = patients.filter((p: any) => p.therapistId === user?.id);

  const recentAssessments = allAssessments
    .filter((a: any) => assignedPatients.some((p: any) => p.id === a.patientId))
    .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  const highRiskCount = recentAssessments.filter((a: any) => a.riskLevel === 'high').length;
  const avgRiskScore = recentAssessments.length > 0
    ? Math.round(recentAssessments.reduce((sum: number, a: any) => sum + a.riskScore, 0) / recentAssessments.length)
    : 0;

  const isLoading = patientsLoading || assessmentsLoading;

  const handleGetInviteCode = async () => {
    try {
      const result = await getOrCreateCode.mutateAsync();
      setInviteData((result as any)?.data ?? result);
      setShowInviteModal(true);
    } catch (err: any) {
      toast({ title: "Failed to generate code", description: err.message, variant: "destructive" });
    }
  };

  const handleNewCode = async () => {
    try {
      const result = await forceNewCode.mutateAsync();
      setInviteData((result as any)?.data ?? result);
      toast({ title: "New code generated!" });
    } catch (err: any) {
      toast({ title: "Failed to generate code", description: err.message, variant: "destructive" });
    }
  };

  const handleCopy = () => {
    if (inviteData?.code) {
      navigator.clipboard.writeText(inviteData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Code copied to clipboard!" });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-5 w-80 mt-2" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
            <p className="text-muted-foreground mt-1">Manage your patients and track their progress</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGetInviteCode} disabled={getOrCreateCode.isPending}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Patient
            </Button>
            <Button asChild>
              <Link to="/therapist/patients">
                <Users className="mr-2 h-4 w-4" />
                View All Patients
              </Link>
            </Button>
          </div>
        </div>

        {/* Invite Code Modal */}
        {showInviteModal && inviteData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 shadow-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Patient Invite Code
                  </CardTitle>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <CardDescription>Share this code with your patient</CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">

                {/* Code display */}
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Invite Code</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-5xl font-bold font-mono tracking-[0.3em] text-primary">
                      {inviteData.code}
                    </span>
                  </div>

                  {/* Expiry */}
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {inviteData.isExpired
                      ? <span className="text-red-500">Expired</span>
                      : <span>Expires in <strong>{inviteData.minutesLeft} minutes</strong></span>
                    }
                  </div>

                  {/* Used badge */}
                  {inviteData.isUsed && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      <Check className="h-3 w-3" /> Used by {inviteData.patientName}
                    </span>
                  )}
                </div>

                {/* Instructions */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">How to use:</p>
                  <p>1. Share the code above with your patient</p>
                  <p>2. Patient opens their dashboard and clicks <strong>"Enter Invite Code"</strong></p>
                  <p>3. Once redeemed, they'll appear in your Patients list</p>
                  <p className="text-xs pt-1">⏱ Code is valid for 24 hours and single-use only</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={handleCopy}
                    variant={copied ? "outline" : "default"}
                  >
                    {copied ? (
                      <><Check className="mr-2 h-4 w-4 text-green-500" /> Copied!</>
                    ) : (
                      <><Copy className="mr-2 h-4 w-4" /> Copy Code</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNewCode}
                    disabled={forceNewCode.isPending}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${forceNewCode.isPending ? 'animate-spin' : ''}`} />
                    New Code
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
          <StatCard title="Total Patients" value={assignedPatients.length} subtitle="Assigned to you" icon={Users} />
          <StatCard title="Total Assessments" value={recentAssessments.length} subtitle="Completed" icon={ClipboardCheck} />
          <StatCard title="High Risk Cases" value={highRiskCount} subtitle="Require attention" icon={AlertTriangle} />
          <StatCard title="Avg. Risk Score" value={`${avgRiskScore}%`} subtitle="Across all patients" icon={TrendingUp} />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-clinical">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Patients</CardTitle>
                <CardDescription>Quick overview of assigned patients</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/therapist/patients">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {assignedPatients.length > 0 ? (
                <div className="space-y-3">
                  {assignedPatients.slice(0, 5).map((patient: any) => {
                    const latestAssessment = allAssessments
                      .filter((a: any) => a.patientId === patient.id)
                      .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
                    return (
                      <Link
                        key={patient.id}
                        to={`/therapist/patient/${patient.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-sm text-muted-foreground">{patient.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {latestAssessment ? (
                            <>
                              <RiskBadge level={latestAssessment.riskLevel} size="sm" />
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(latestAssessment.completedAt), 'MMM dd')}
                              </p>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">No assessment</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 space-y-3">
                  <div className="flex justify-center">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-7 w-7 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-muted-foreground">No patients assigned yet</p>
                  <Button size="sm" variant="outline" onClick={handleGetInviteCode}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite your first patient
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-clinical">
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>Latest completed assessments from your patients</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAssessments.length > 0 ? (
                <div className="space-y-3">
                  {recentAssessments.slice(0, 5).map((assessment: any) => (
                    <div key={assessment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <ClipboardCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{assessment.patientName || 'Patient'}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(assessment.completedAt), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{assessment.riskScore}%</p>
                        <RiskBadge level={assessment.riskLevel} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No assessments yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* High Risk Alert */}
        {highRiskCount > 0 && (
          <Card className="bg-destructive/5 border-destructive/20 shadow-clinical">
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">High Risk Cases Detected</h3>
                  <p className="text-muted-foreground">
                    {highRiskCount} patient{highRiskCount > 1 ? 's' : ''} require{highRiskCount === 1 ? 's' : ''} immediate attention
                  </p>
                </div>
              </div>
              <Button variant="destructive" asChild>
                <Link to="/therapist/patients">
                  Review Cases <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </Layout>
  );
};

export default TherapistDashboard;
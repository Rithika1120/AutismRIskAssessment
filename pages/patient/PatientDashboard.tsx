import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import RiskBadge from '@/components/ui/RiskBadge';
import RiskScoreChart from '@/components/charts/RiskScoreChart';
import FeatureImportanceChart from '@/components/charts/FeatureImportanceChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMyAssessments, usePatientPrescriptions, useRedeemInviteCode, useMyTherapist } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ClipboardCheck, TrendingDown, Calendar, FileText,
  ArrowRight, Stethoscope, LinkIcon, CheckCircle2,
  Loader2, UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const PatientDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth(); // ✅ added refreshUser
  const { toast } = useToast();

  const { data: assessments = [], isLoading: assessmentsLoading } = useMyAssessments();
  const { data: prescriptions = [], isLoading: prescriptionsLoading } = usePatientPrescriptions(user?.id || '');
  const { data: myTherapist, isLoading: therapistLoading } = useMyTherapist();
  const redeemCode = useRedeemInviteCode();

  const [inviteCode, setInviteCode] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);

  const patientAssessments = assessments;
  const latestAssessment = patientAssessments[0];
  const previousAssessment = patientAssessments[1];
  const patientPrescriptions = prescriptions;

  const scoreTrend =
    previousAssessment && latestAssessment
      ? parseFloat((previousAssessment.riskScore - latestAssessment.riskScore).toFixed(2))
      : 0;

  const isLoading = assessmentsLoading || prescriptionsLoading || therapistLoading;

  const handleRedeemCode = async () => {
    if (!inviteCode.trim()) return;
    try {
      const result = await redeemCode.mutateAsync(inviteCode.trim().toUpperCase());

      // ✅ Refresh user so therapistId updates in AuthContext + localStorage
      await refreshUser();

      toast({
        title: "✅ Linked successfully!",
        description: (result as any)?.message || "You are now linked to your therapist.",
      });
      setInviteCode('');
      setShowInviteInput(false);
    } catch (err: any) {
      toast({
        title: "Failed to redeem code",
        description: err.message || "Invalid or expired code.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-5 w-96 mt-2" />
            </div>
            <Skeleton className="h-10 w-44" />
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
            <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
            <p className="text-muted-foreground mt-1">Track your assessment progress and view recommendations</p>
          </div>
          <Button asChild className="w-fit">
            <Link to="/patient/assessment">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Take New Assessment
            </Link>
          </Button>
        </div>

        {/* Therapist Link Banner */}
        {!myTherapist ? (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="py-4">
              {!showInviteInput ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <LinkIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Not linked to a therapist</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Enter the invite code from your therapist to connect</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => setShowInviteInput(true)}
                  >
                    Enter Invite Code
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <LinkIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter 8-digit code e.g. AB12CD34"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      maxLength={8}
                      className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm uppercase tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-blue-900"
                      onKeyDown={(e) => e.key === 'Enter' && handleRedeemCode()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleRedeemCode}
                      disabled={redeemCode.isPending || inviteCode.length < 6}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {redeemCode.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Link'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setShowInviteInput(false); setInviteCode(''); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Linked to {myTherapist.name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {myTherapist.specialization || 'Your therapist can now view your assessments'}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
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
            value={
              scoreTrend > 0 ? `↓ ${scoreTrend}%`
                : scoreTrend < 0 ? `↑ ${Math.abs(scoreTrend)}%`
                : '—'
            }
            subtitle={
              scoreTrend > 0 ? 'Improvement'
                : scoreTrend < 0 ? 'Needs attention'
                : 'No change'
            }
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
            title="Last Assessment"
            value={latestAssessment ? format(new Date(latestAssessment.completedAt), 'MMM dd') : 'N/A'}
            subtitle={latestAssessment ? format(new Date(latestAssessment.completedAt), 'yyyy') : ''}
            icon={Calendar}
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-clinical">
            <CardHeader>
              <CardTitle>Risk Score Progress</CardTitle>
              <CardDescription>Track how your assessment scores change over time</CardDescription>
            </CardHeader>
            <CardContent>
              {patientAssessments.length > 0 ? (
                <RiskScoreChart assessments={patientAssessments} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Complete an assessment to see your progress
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-clinical">
            <CardHeader>
              <CardTitle>Contributing Factors</CardTitle>
              <CardDescription>Features affecting your latest assessment result</CardDescription>
            </CardHeader>
            <CardContent>
              {latestAssessment ? (
                <FeatureImportanceChart features={latestAssessment.featureImportance} />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  Complete an assessment to see factor analysis
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Prescriptions & History */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-clinical">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Latest Recommendations</CardTitle>
                <CardDescription>From your healthcare provider</CardDescription>
              </div>
              <Stethoscope className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {patientPrescriptions.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{patientPrescriptions[0].therapistName}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(patientPrescriptions[0].createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{patientPrescriptions[0].instructions}</p>
                    <ul className="space-y-2">
                      {patientPrescriptions[0].recommendations.slice(0, 3).map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No recommendations yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-clinical">
            <CardHeader>
              <CardTitle>Assessment History</CardTitle>
              <CardDescription>Your previous assessments</CardDescription>
            </CardHeader>
            <CardContent>
              {patientAssessments.length > 0 ? (
                <div className="space-y-3">
                  {patientAssessments.slice(0, 4).map((assessment) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {format(new Date(assessment.completedAt), 'MMMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">Score: {assessment.riskScore}%</p>
                        </div>
                      </div>
                      <RiskBadge level={assessment.riskLevel} size="sm" />
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
        </div>

        {/* CTA */}
        {patientAssessments.length > 0 && (
          <Card className="bg-primary/5 border-primary/20 shadow-clinical">
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
              <div>
                <h3 className="text-lg font-semibold">Track Your Progress</h3>
                <p className="text-muted-foreground">Take regular assessments to monitor changes over time</p>
              </div>
              <Button asChild>
                <Link to="/patient/assessment">
                  Start Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </Layout>
  );
};

export default PatientDashboard;
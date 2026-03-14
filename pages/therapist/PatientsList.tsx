import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import RiskBadge from '@/components/ui/RiskBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { usePatients, useAssessments } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { 
  Search, 
  User, 
  ArrowUpDown,
  Eye,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

type SortField = 'name' | 'riskScore' | 'lastAssessment';
type SortOrder = 'asc' | 'desc';

const PatientsList: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Fetch data from API
  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: assessments = [], isLoading: assessmentsLoading } = useAssessments();

  // Get assigned patients with their latest assessment data
  const patientsWithData = patients
    .filter(p => p.therapistId === user?.id)
    .map(patient => {
      const patientAssessments = assessments.filter(a => a.patientId === patient.id);
      const latestAssessment = patientAssessments.sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )[0];
      
      return {
        ...patient,
        assessmentCount: patientAssessments.length,
        latestAssessment,
        riskScore: latestAssessment?.riskScore ?? null,
        riskLevel: latestAssessment?.riskLevel ?? null,
        lastAssessmentDate: latestAssessment?.completedAt ?? null
      };
    });

  // Filter by search query
  const filteredPatients = patientsWithData.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort patients
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'riskScore':
        comparison = (a.riskScore ?? -1) - (b.riskScore ?? -1);
        break;
      case 'lastAssessment':
        const dateA = a.lastAssessmentDate ? new Date(a.lastAssessmentDate).getTime() : 0;
        const dateB = b.lastAssessmentDate ? new Date(b.lastAssessmentDate).getTime() : 0;
        comparison = dateA - dateB;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className="h-4 w-4" />
    </button>
  );

  const isLoading = patientsLoading || assessmentsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-5 w-64 mt-2" />
            </div>
          </div>
          <Skeleton className="h-16" />
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold">Patients</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor your assigned patients
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-clinical">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card className="shadow-clinical animate-slide-up">
          <CardHeader>
            <CardTitle>Patient List</CardTitle>
            <CardDescription>
              {sortedPatients.length} patient{sortedPatients.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      <SortButton field="name">Patient</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton field="riskScore">Latest Risk</SortButton>
                    </TableHead>
                    <TableHead>Assessments</TableHead>
                    <TableHead>
                      <SortButton field="lastAssessment">Last Assessment</SortButton>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPatients.length > 0 ? (
                    sortedPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-sm text-muted-foreground">{patient.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {patient.riskLevel ? (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{patient.riskScore}%</span>
                              <RiskBadge level={patient.riskLevel} size="sm" />
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{patient.assessmentCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {patient.lastAssessmentDate ? (
                            format(new Date(patient.lastAssessmentDate), 'MMM dd, yyyy')
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/therapist/patient/${patient.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <p className="text-muted-foreground">No patients found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientsList;

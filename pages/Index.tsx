import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { 
  Activity, 
  Shield, 
  Users, 
  TrendingUp, 
  ClipboardCheck, 
  Brain,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const Index: React.FC = () => {
  const features = [
    {
      icon: ClipboardCheck,
      title: 'Comprehensive Assessment',
      description: 'Research-backed questionnaire covering social communication, behavior patterns, and development milestones.'
    },
    {
      icon: Brain,
      title: 'ML-Powered Analysis',
      description: 'Advanced machine learning model analyzes responses to provide accurate risk assessment with feature importance.'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Monitor assessment scores over time with visual charts showing improvement and areas needing attention.'
    },
    {
      icon: Users,
      title: 'Therapist Portal',
      description: 'Healthcare providers can manage patients, review assessments, and provide personalized recommendations.'
    }
  ];

  const benefits = [
    'Evidence-based screening methodology',
    'Secure and confidential data handling',
    'Real-time risk assessment results',
    'Detailed feature importance analysis',
    'Progress visualization over time',
    'Direct therapist communication'
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5 rounded-3xl" />
        <div className="relative max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            Trusted by healthcare professionals
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Autism Risk Assessment
            <span className="block text-gradient mt-2">Made Simple & Accurate</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            A comprehensive, ML-powered screening tool that helps families and healthcare providers 
            identify autism spectrum disorder risk with confidence.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link to="/register">
                Start Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <Link to="/login">
                I'm a Healthcare Provider
              </Link>
            </Button>
          </div>
        </div>
      </section>

  

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need for
            <span className="text-gradient"> Comprehensive Screening</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform combines clinical expertise with advanced technology to deliver 
            accurate, actionable insights.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="assessment-card group hover:border-primary/30"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-card rounded-3xl border border-border">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Choose <span className="text-gradient">AutiScreen?</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We've built a platform that prioritizes accuracy, privacy, and ease of use 
                for both families and healthcare professionals.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl gradient-hero opacity-10" />
              <div className="absolute inset-4 bg-card rounded-xl border border-border shadow-clinical-lg p-6 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="h-8 w-8 text-primary" />
                  <span className="text-xl font-semibold">Risk Assessment</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Social Communication</span>
                      <span className="font-medium">25%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill bg-warning" style={{ width: '25%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Behavior Patterns</span>
                      <span className="font-medium">18%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill bg-accent" style={{ width: '18%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Sensory Processing</span>
                      <span className="font-medium">15%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill bg-primary" style={{ width: '15%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Take the first step towards understanding autism spectrum disorder risk. 
            Our assessment takes only 15 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link to="/register">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <Link to="/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { Assessment } from '@/types';
import { format } from 'date-fns';

interface RiskScoreChartProps {
  assessments: Assessment[];
}

const RiskScoreChart: React.FC<RiskScoreChartProps> = ({ assessments }) => {
  const data = assessments
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .map(assessment => ({
      date: format(new Date(assessment.completedAt), 'MMM dd'),
      score: assessment.riskScore,
      fullDate: format(new Date(assessment.completedAt), 'MMMM dd, yyyy')
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const riskLevel = data.score >= 70 ? 'High' : data.score >= 40 ? 'Medium' : 'Low';
      const riskColor = data.score >= 70 ? 'text-risk-high' : data.score >= 40 ? 'text-warning' : 'text-success';
      
      return (
        <div className="bg-card border border-border rounded-lg shadow-clinical-lg p-3">
          <p className="text-sm font-medium">{data.fullDate}</p>
          <p className="text-2xl font-bold text-primary">{data.score}%</p>
          <p className={`text-sm font-medium ${riskColor}`}>
            {riskLevel} Risk
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            domain={[0, 100]} 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={70} stroke="hsl(var(--risk-high))" strokeDasharray="5 5" label={{ value: 'High Risk', fill: 'hsl(var(--risk-high))', fontSize: 10 }} />
          <ReferenceLine y={40} stroke="hsl(var(--warning))" strokeDasharray="5 5" label={{ value: 'Medium', fill: 'hsl(var(--warning))', fontSize: 10 }} />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="hsl(221, 83%, 53%)"
            fill="url(#riskGradient)"
            strokeWidth={3}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="hsl(221, 83%, 53%)"
            strokeWidth={3}
            dot={{ fill: 'hsl(221, 83%, 53%)', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8, fill: 'hsl(221, 83%, 53%)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiskScoreChart;

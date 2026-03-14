import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { FeatureImportance } from '@/types';

interface FeatureImportanceChartProps {
  features: FeatureImportance[];
}

const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ features }) => {
  if (!features || features.length === 0) return null;

  const data = features
    .sort((a, b) => Math.abs((b as any).shapValue ?? b.importance) - Math.abs((a as any).shapValue ?? a.importance))
    .map(feature => ({
      name: feature.feature,
      // ✅ Use absolute SHAP value for bar width — NOT multiplied by 100
      importance: parseFloat(Math.abs((feature as any).shapValue ?? feature.importance).toFixed(3)),
      contribution: feature.contribution,
      shapValue: (feature as any).shapValue ?? 0,
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const isPositive = d.contribution === 'positive';
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 max-w-[220px]">
          <p className="text-sm font-semibold mb-1">{d.name}</p>
          <p className="text-xs text-muted-foreground mb-1">
            SHAP value:{' '}
            <span className={`font-bold ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
              {d.shapValue > 0 ? '+' : ''}{d.shapValue.toFixed(3)}
            </span>
          </p>
          <p className={`text-xs font-medium ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
            {isPositive ? '▲ Increases autism risk' : '▼ Decreases autism risk'}
          </p>
        </div>
      );
    }
    return null;
  };

  const positiveCount = data.filter(d => d.contribution === 'positive').length;
  const negativeCount = data.filter(d => d.contribution === 'negative').length;
  const maxVal = Math.max(...data.map(d => d.importance));

  return (
    <div className="w-full space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold">SHAP Feature Explainability</h3>
          <p className="text-xs text-muted-foreground">Why this risk score was predicted</p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            Risk factors ({positiveCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            Protective ({negativeCount})
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 70, left: 130, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              horizontal={false}
              vertical={true}
            />
            <XAxis
              type="number"
              domain={[0, maxVal * 1.2]}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickFormatter={(value) => value.toFixed(2)}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              width={125}
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="importance"
              radius={[0, 4, 4, 0]}
              maxBarSize={28}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.contribution === 'positive'
                    ? 'rgb(239, 68, 68)'
                    : 'rgb(34, 197, 94)'}
                  fillOpacity={0.85}
                />
              ))}
              <LabelList
                dataKey="importance"
                position="right"
                formatter={(value: number) => value.toFixed(3)}
                style={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SHAP value cards */}
      <div className="grid grid-cols-2 gap-2">
        {data.map((item, i) => (
          <div
            key={i}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-xs border ${
              item.contribution === 'positive'
                ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
            }`}
          >
            <span className="font-medium truncate mr-2">{item.name}</span>
            <span className={`font-bold whitespace-nowrap ${
              item.contribution === 'positive' ? 'text-red-600' : 'text-green-600'
            }`}>
              {item.shapValue > 0 ? '+' : ''}{item.shapValue.toFixed(3)}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">How to read this:</p>
        <p>🔴 <strong>Red bars</strong> — pushing risk score <strong>higher</strong></p>
        <p>🟢 <strong>Green bars</strong> — pushing risk score <strong>lower</strong></p>
        <p className="pt-1">SHAP values show exact impact of each feature on this prediction.</p>
      </div>

    </div>
  );
};

export default FeatureImportanceChart;
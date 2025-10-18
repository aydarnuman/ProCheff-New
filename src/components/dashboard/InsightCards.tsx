"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Insight {
  title: string;
  description: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

interface Props {
  insights: Insight[];
}

export function InsightCards({ insights }: Props) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
      margin: '24px 0'
    }}>
      {insights.map((insight, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              {insight.trend === 'up' ? '📈' : insight.trend === 'down' ? '📉' : '➡️'}
              {insight.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981', marginBottom: '8px' }}>
              {insight.value}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '8px' }}>
              {insight.change}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#F1F5F9' }}>
              {insight.description}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

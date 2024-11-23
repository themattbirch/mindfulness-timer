import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { Session } from '../../utils/storage';

interface StatisticsChartProps {
  data: Session[];
  view: 'daily' | 'weekly' | 'monthly';
}

export function StatisticsChart({ data, view }: StatisticsChartProps) {
  const processData = (sessions: Session[]) => {
    if (view === 'daily') {
      return sessions.slice(-7); // Last 7 days
    }
    
    // Group by week or month
    const grouped = sessions.reduce((acc, session) => {
      const date = new Date(session.date);
      const key = view === 'weekly'
        ? `Week ${Math.ceil(date.getDate() / 7)}`
        : date.toLocaleString('default', { month: 'short' });
      
      if (!acc[key]) {
        acc[key] = {
          name: key,
          minutes: 0,
          breaks: 0
        };
      }
      
      acc[key].minutes += session.duration;
      acc[key].breaks += session.completedBreaks;
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(grouped).slice(-6); // Last 6 weeks/months
  };

  const chartData = processData(data);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name"
          fontSize={12}
          tick={{ fill: 'currentColor' }}
        />
        <YAxis 
          fontSize={12}
          tick={{ fill: 'currentColor' }}
          label={{ 
            value: 'Minutes', 
            angle: -90, 
            position: 'insideLeft',
            fill: 'currentColor'
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
        <Bar 
          dataKey="minutes" 
          fill="#3B82F6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
} 
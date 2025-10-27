import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#fb7185', '#22d3ee', '#f59e0b', '#4ade80', '#94a3b8'];

interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

// Componente consolidado que contiene TODOS los gráficos
export default function PlayerStatsCharts({
  minedData,
  killedData,
  customData,
}: {
  minedData: ChartData[];
  killedData: ChartData[];
  customData: ChartData[];
}) {
  const [mined, setMined] = useState(minedData);
  const [killed, setKilled] = useState(killedData);
  const [custom, setCustom] = useState(customData);

  useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      const { minedTop, killedTop, customTop } = event.detail;
      
      if (minedTop) setMined(minedTop);
      if (killedTop) setKilled(killedTop);
      if (customTop) setCustom(customTop);
    };

    window.addEventListener('updateCharts', handleUpdate as EventListener);
    
    return () => {
      window.removeEventListener('updateCharts', handleUpdate as EventListener);
    };
  }, []);

  return (
    <>
      {/* Grid de gráficos principales */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Bar Chart - Bloques Minados */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 min-w-0">
          <div className="mb-3 text-sm font-medium">Top Bloques Minados</div>
          <div>
            <ResponsiveContainer width="100%" height={288}>
              <BarChart data={mined}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  cursor={false}
                  contentStyle={{ 
                    background: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    color: '#f3f4f6'
                  }}
                  labelStyle={{ color: '#e5e7eb', fontWeight: 500 }}
                  itemStyle={{ color: '#22d3ee' }}
                />
                <Bar dataKey="value" fill="#22d3ee" activeBar={{ fill: '#0891b2' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Mobs Eliminados */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 min-w-0">
          <div className="mb-3 text-sm font-medium">Top Mobs Eliminados</div>
          <div>
            <ResponsiveContainer width="100%" height={288}>
              <PieChart>
                <Pie data={killed} dataKey="value" nameKey="name" outerRadius={90} innerRadius={40}>
                  {killed.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    color: '#f3f4f6'
                  }}
                  labelStyle={{ color: '#e5e7eb', fontWeight: 500 }}
                  itemStyle={{ color: '#f3f4f6' }}
                />
                <Legend wrapperStyle={{ color: '#e5e7eb' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bar Chart - Custom Stats */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 min-w-0">
        <div className="mb-3 text-sm font-medium">Custom Stats (Top)</div>
        <div>
          <ResponsiveContainer width="100%" height={288}>
            <BarChart data={custom}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                cursor={false}
                contentStyle={{ 
                  background: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#f3f4f6'
                }}
                labelStyle={{ color: '#e5e7eb', fontWeight: 500 }}
                itemStyle={{ color: '#34d399' }}
              />
              <Bar dataKey="value" fill="#34d399" activeBar={{ fill: '#059669' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

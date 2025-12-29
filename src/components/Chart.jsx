// Chart.jsx - Chart visualization component using Recharts
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Format large numbers for display
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
};

// Format currency
const formatCurrency = (num) => {
  return `PKR ${formatNumber(num)}`;
};

export default function Chart({ chartData, chartType }) {
  if (!chartData || !chartData.data || chartData.data.length === 0) {
    return null;
  }

  const { data, xAxis, yAxis } = chartData;
  
  // Determine which keys are numeric for multiple series
  const numericKeys = Object.keys(data[0] || {}).filter(key => 
    key !== 'name' && key !== xAxis && typeof data[0][key] === 'number'
  );

  if (chartType === 'line' || chartData.type === 'line') {
    return (
      <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
          📈 Line Chart
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={xAxis || 'x'} 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatNumber}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
            />
            <Legend />
            {numericKeys.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              />
            ))}
            {numericKeys.length === 0 && yAxis && (
              <Line
                type="monotone"
                dataKey={yAxis}
                stroke={COLORS[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === 'bar' || chartData.type === 'bar') {
    return (
      <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
          📊 Bar Chart
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={xAxis || 'name'} 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatNumber}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
            />
            <Legend />
            {numericKeys.length > 0 ? (
              numericKeys.map((key, idx) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={COLORS[idx % COLORS.length]}
                  name={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                />
              ))
            ) : (
              <Bar dataKey={yAxis || 'value'} fill={COLORS[0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === 'pie' || chartData.type === 'pie') {
    // Ensure data has 'name' and 'value' keys for pie chart
    const pieData = data.map(item => ({
      name: item.name || item[xAxis] || 'Item',
      value: item.value || item[yAxis] || 0
    })).filter(item => item.value > 0); // Filter out zero values
    
    if (pieData.length === 0) {
      return null;
    }
    
    return (
      <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
          🥧 Pie Chart
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => {
                // Show percentage and truncated name
                const shortName = name.length > 20 ? name.substring(0, 17) + '...' : name;
                return `${shortName}: ${(percent * 100).toFixed(1)}%`;
              }}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                const item = pieData.find(d => d.name === value);
                if (item) {
                  const shortName = value.length > 30 ? value.substring(0, 27) + '...' : value;
                  return `${shortName} (${formatCurrency(item.value)})`;
                }
                return value;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}


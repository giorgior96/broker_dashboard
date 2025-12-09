import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const Charts = ({ boats }) => {
    // Process data for charts
    // 1. Price Distribution (Histogram-ish) or Top Brands

    // Group by Brand for this example
    const brandCounts = {};
    boats.forEach(b => {
        const brand = b.Builder || "Unknown";
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });

    // Sort and take top 5
    const data = Object.entries(brandCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-6">Boats by Builder</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: '#F3F4F6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1e3a8a' : '#3b82f6'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Charts;

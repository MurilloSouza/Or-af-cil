import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { BudgetItem } from '../../types';
import { useLocalization } from '../../LanguageContext';

const COLORS = ['#8B5CF6', '#58595B', '#A78BFA', '#1e293b', '#64748b', '#a9a9a9'];

// FIX: Define the props interface for the DashboardTab component.
interface DashboardTabProps {
    items: BudgetItem[];
    markupPercentage: number;
    roundUpQuantity: boolean;
}

const KpiCard: React.FC<{ title: string, value: string | number, color: string }> = ({ title, value, color }) => (
    <div className="bg-white dark:bg-gray-700/50 p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: color }}>
        <h3 className="text-sm font-medium text-subtle dark:text-gray-400 uppercase tracking-wider">{title}</h3>
        <p className="mt-2 text-3xl font-bold text-text dark:text-gray-100">{value}</p>
    </div>
);

const DashboardTab: React.FC<DashboardTabProps> = ({ items, markupPercentage, roundUpQuantity }) => {
    const { t, formatCurrency } = useLocalization();
    
    const { totalCost, totalWithMarkup, totalItems, pieData, barData } = useMemo(() => {
        if (!items || items.length === 0) {
            return { totalCost: 0, totalWithMarkup: 0, totalItems: 0, pieData: [], barData: [] };
        }

        const MARKUP_FACTOR = 1 + markupPercentage / 100;
        const getFinalQuantity = (quantity: number) => roundUpQuantity ? Math.ceil(quantity) : quantity;

        const totalCost = items.reduce((acc, item) => acc + getFinalQuantity(item.quantity) * item.unitPrice, 0);
        const totalWithMarkup = items.reduce((acc, item) => acc + getFinalQuantity(item.quantity) * (item.unitPrice * MARKUP_FACTOR), 0);
        const totalItems = items.length;

        const sectorCosts = items.reduce((acc, item) => {
            const finalValue = getFinalQuantity(item.quantity) * (item.unitPrice * MARKUP_FACTOR);
            const sector = item.sector || 'Sem Setor';
            acc[sector] = (acc[sector] || 0) + finalValue;
            return acc;
        }, {} as Record<string, number>);

        const pieData = Object.entries(sectorCosts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => Number(b.value) - Number(a.value));

        const itemCosts = items.map(item => ({
            name: item.description.length > 25 ? `${item.description.substring(0, 22)}...` : item.description,
            value: getFinalQuantity(item.quantity) * (item.unitPrice * MARKUP_FACTOR)
        }));

        const barData = itemCosts
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        
        return { totalCost, totalWithMarkup, totalItems, pieData, barData };
    }, [items, markupPercentage, roundUpQuantity]);


    if (items.length === 0) {
        return (
            <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in text-center">
                 <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-4">{t('dashboard.title')}</h2>
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">{t('dashboard.empty.title')}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('dashboard.empty.description')}</p>
            </div>
        );
    }
  
    return (
        <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in space-y-8">
            <h2 className="text-2xl font-bold text-text dark:text-gray-100">{t('dashboard.title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title={t('dashboard.totalCost')} value={formatCurrency(totalCost)} color="#58595B" />
                <KpiCard title={t('dashboard.finalValue')} value={formatCurrency(totalWithMarkup)} color="#8B5CF6" />
                <KpiCard title={t('dashboard.totalItems')} value={totalItems} color="#A78BFA" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-700/50 p-4 rounded-lg shadow-md">
                     <h3 className="text-lg font-semibold text-text dark:text-gray-200 mb-4">{t('dashboard.costBySector')}</h3>
                     <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                 <div className="lg:col-span-3 bg-white dark:bg-gray-700/50 p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-text dark:text-gray-200 mb-4">{t('dashboard.top5Expensive')}</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <XAxis type="number" tickFormatter={(value) => formatCurrency(Number(value))} />
                                <YAxis type="category" dataKey="name" width={120} interval={0} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Bar dataKey="value" fill="#8B5CF6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;
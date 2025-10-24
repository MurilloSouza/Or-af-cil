import React, { useState, useMemo } from 'react';
import { CalculatedItem } from '../../types';

interface QuadrosTabProps {
  onAddToBudget: (items: CalculatedItem[], sector: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

// Data constants
const djComumCorrentes = [6, 10, 13, 15, 16, 20, 25, 32, 40, 50, 63, 70, 80, 100, 125, 160, 200, 225, 250, 300, 315, 350, 400, 450, 500, 630, 700, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6300];
const djComumPolos = ['1P', '1P+N', '2P', '3P', '3P+N', '4P'];
const drSensibilidades = [10, 30, 100, 300, 500];
const drCorrentes = [25, 32, 40, 63, 80, 100, 125];
const drPolos = ['2P', '4P'];
const drTipos = ['AC', 'A', 'F', 'B'];
const adicionais = [
    { code: 'BARR_TERRA', description: 'Barramento Terra' },
    { code: 'BARR_NEUTRO', description: 'Barramento Neutro' },
    { code: 'DPS', description: 'DPS' }
];

interface DjComumRow { id: string; corrente: number | ''; polo: string; quantidade: number | ''; }
interface DjDrRow { id: string; sensibilidade: number | ''; corrente: number | ''; polo: string; tipo: string; quantidade: number | ''; }

const inputClasses = "w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100";
const labelClasses = "text-xs font-medium text-gray-500 dark:text-gray-400";


const QuadrosTab: React.FC<QuadrosTabProps> = ({ onAddToBudget, showToast }) => {
    const [djComumRows, setDjComumRows] = useState<DjComumRow[]>([{ id: `c-${Date.now()}`, corrente: '', polo: '', quantidade: '' }]);
    const [djDrRows, setDjDrRows] = useState<DjDrRow[]>([{ id: `d-${Date.now()}`, sensibilidade: '', corrente: '', polo: '', tipo: '', quantidade: '' }]);
    const [adicionaisQtys, setAdicionaisQtys] = useState<Record<string, number | ''>>({});
    const [templates, setTemplates] = useState({
        comum: 'Disjuntor [corrente]A [polo]',
        dr: 'Disjuntor DR [sensibilidade]mA [corrente]A [polo] Tipo [tipo]'
    });

    const handleDjComumChange = (id: string, field: keyof Omit<DjComumRow, 'id'>, value: string | number) => {
        const parsedValue = typeof value === 'string' && field !== 'polo' ? (parseInt(value, 10) || '') : value;
        setDjComumRows(rows => rows.map(row => row.id === id ? { ...row, [field]: parsedValue } : row));
    };
    const addDjComumRow = () => setDjComumRows(rows => [...rows, { id: `c-${Date.now()}`, corrente: '', polo: '', quantidade: '' }]);
    const removeDjComumRow = (id: string) => setDjComumRows(rows => rows.length > 1 ? rows.filter(row => row.id !== id) : rows);
    
    const handleDjDrChange = (id: string, field: keyof Omit<DjDrRow, 'id'>, value: string | number) => {
        const parsedValue = typeof value === 'string' && !['polo', 'tipo'].includes(field) ? (parseInt(value, 10) || '') : value;
        setDjDrRows(rows => rows.map(row => row.id === id ? { ...row, [field]: parsedValue } : row));
    };
    const addDjDrRow = () => setDjDrRows(rows => [...rows, { id: `d-${Date.now()}`, sensibilidade: '', corrente: '', polo: '', tipo: '', quantidade: '' }]);
    const removeDjDrRow = (id: string) => setDjDrRows(rows => rows.length > 1 ? rows.filter(row => row.id !== id) : rows);
    
    const handleAdicionalChange = (code: string, value: string) => {
        const numValue = parseInt(value, 10);
        setAdicionaisQtys(prev => ({ ...prev, [code]: isNaN(numValue) || numValue < 0 ? '' : numValue }));
    };
    
    const handleClear = () => {
        setDjComumRows([{ id: `c-${Date.now()}`, corrente: '', polo: '', quantidade: '' }]);
        setDjDrRows([{ id: `d-${Date.now()}`, sensibilidade: '', corrente: '', polo: '', tipo: '', quantidade: '' }]);
        setAdicionaisQtys({});
        showToast('Campos limpos!', 'success');
    };

    const itemsToAdd = useMemo(() => {
        const items: CalculatedItem[] = [];

        djComumRows.forEach(row => {
            if (row.corrente && row.polo && Number(row.quantidade) > 0) {
                const name = templates.comum
                    .replace('[corrente]', String(row.corrente))
                    .replace('[polo]', row.polo);
                items.push({ nome: name, quantidade: Number(row.quantidade), grandeza: 'un' });
            }
        });

        djDrRows.forEach(row => {
             if (row.sensibilidade && row.corrente && row.polo && row.tipo && Number(row.quantidade) > 0) {
                const name = templates.dr
                    .replace('[sensibilidade]', String(row.sensibilidade))
                    .replace('[corrente]', String(row.corrente))
                    .replace('[polo]', row.polo)
                    .replace('[tipo]', row.tipo);
                items.push({ nome: name, quantidade: Number(row.quantidade), grandeza: 'un' });
            }
        });

        Object.entries(adicionaisQtys).forEach(([code, quantity]) => {
            if (Number(quantity) > 0) {
                const adicional = adicionais.find(a => a.code === code);
                if (adicional) items.push({ nome: adicional.description, quantidade: Number(quantity), grandeza: 'un' });
            }
        });

        return items;
    }, [djComumRows, djDrRows, adicionaisQtys, templates]);

    const handleAddToBudget = () => {
        if (itemsToAdd.length > 0) {
            onAddToBudget(itemsToAdd, 'Quadros');
            showToast(`${itemsToAdd.length} tipo(s) de item adicionado(s) ao orçamento.`, 'success');
        } else {
            showToast('Nenhum item válido para adicionar.', 'error');
        }
    };

    return (
        <div className="space-y-8 pb-24">
            <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
                <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">Disjuntores Comuns</legend>
                <div className="space-y-3 mt-4">
                    {djComumRows.map(row => (
                        <div key={row.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                            <div>
                                <label className={labelClasses}>Corrente (A)</label>
                                <select value={row.corrente} onChange={e => handleDjComumChange(row.id, 'corrente', e.target.value)} className={inputClasses}>
                                    <option value="">Selecione</option>
                                    {djComumCorrentes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className={labelClasses}>Polos</label>
                                <select value={row.polo} onChange={e => handleDjComumChange(row.id, 'polo', e.target.value)} className={inputClasses}>
                                    <option value="">Selecione</option>
                                    {djComumPolos.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Quantidade</label>
                                <input type="number" min="0" value={row.quantidade} onChange={e => handleDjComumChange(row.id, 'quantidade', e.target.value)} className={inputClasses} placeholder="0" />
                            </div>
                             <button onClick={() => removeDjComumRow(row.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-full disabled:opacity-50" disabled={djComumRows.length <= 1}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                    ))}
                    <button onClick={addDjComumRow} className="w-full text-sm text-primary-dark dark:text-primary-light border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mt-2">
                        + Adicionar Disjuntor
                    </button>
                </div>
            </fieldset>

            <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
                <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">Disjuntores Diferenciais Residuais (DR)</legend>
                 <div className="space-y-3 mt-4">
                    {djDrRows.map(row => (
                        <div key={row.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-3 items-end">
                            <div><label className={labelClasses}>Sensib. (mA)</label><select value={row.sensibilidade} onChange={e => handleDjDrChange(row.id, 'sensibilidade', e.target.value)} className={inputClasses}><option value="">Selecione</option>{drSensibilidades.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                            <div><label className={labelClasses}>Corrente (A)</label><select value={row.corrente} onChange={e => handleDjDrChange(row.id, 'corrente', e.target.value)} className={inputClasses}><option value="">Selecione</option>{drCorrentes.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            <div><label className={labelClasses}>Polos</label><select value={row.polo} onChange={e => handleDjDrChange(row.id, 'polo', e.target.value)} className={inputClasses}><option value="">Selecione</option>{drPolos.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                            <div><label className={labelClasses}>Tipo</label><select value={row.tipo} onChange={e => handleDjDrChange(row.id, 'tipo', e.target.value)} className={inputClasses}><option value="">Selecione</option>{drTipos.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                            <div><label className={labelClasses}>Quantidade</label><input type="number" min="0" value={row.quantidade} onChange={e => handleDjDrChange(row.id, 'quantidade', e.target.value)} className={inputClasses} placeholder="0" /></div>
                             <button onClick={() => removeDjDrRow(row.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-full disabled:opacity-50" disabled={djDrRows.length <= 1}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg></button>
                        </div>
                    ))}
                    <button onClick={addDjDrRow} className="w-full text-sm text-primary-dark dark:text-primary-light border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mt-2">+ Adicionar Disjuntor DR</button>
                </div>
            </fieldset>

            <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
                <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">Adicionais</legend>
                <div className="space-y-4 mt-4 max-w-sm">
                    {adicionais.map(ad => (
                        <div key={ad.code} className="flex justify-between items-center"><label className="text-sm font-medium text-gray-700 dark:text-gray-300">{ad.description}</label><input type="number" min="0" value={adicionaisQtys[ad.code] || ''} onChange={e => handleAdicionalChange(ad.code, e.target.value)} className={`${inputClasses} w-24`} placeholder="0" /></div>
                    ))}
                </div>
            </fieldset>

            <details className="border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700/50">
                <summary className="cursor-pointer p-3 font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-md">Personalizar Fórmulas</summary>
                <div className="p-4 border-t border-gray-200 dark:border-gray-600 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Disjuntor Comum</label>
                        <input type="text" value={templates.comum} onChange={e => setTemplates(t => ({...t, comum: e.target.value}))} className={inputClasses} />
                        <p className="text-xs text-subtle dark:text-gray-400 mt-1">Use [corrente] e [polo].</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Disjuntor DR</label>
                        <input type="text" value={templates.dr} onChange={e => setTemplates(t => ({...t, dr: e.target.value}))} className={inputClasses} />
                        <p className="text-xs text-subtle dark:text-gray-400 mt-1">Use [sensibilidade], [corrente], [polo], e [tipo].</p>
                    </div>
                </div>
            </details>
            
            <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
                <button 
                    onClick={handleAddToBudget}
                    disabled={itemsToAdd.length === 0}
                    className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-5 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Adicionar itens calculados ao orçamento"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Adicionar ao Orçamento</span>
                </button>
                <button 
                    onClick={handleClear}
                    className="bg-gray-200 hover:bg-gray-300 text-text dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100 font-bold py-2 px-3 rounded-full shadow-md transition-colors duration-300 text-sm"
                    title="Limpar todos os campos de entrada"
                >
                    Limpar Campos
                </button>
            </div>
        </div>
    );
};

export default QuadrosTab;
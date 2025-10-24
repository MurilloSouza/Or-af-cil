import React, { useState, useMemo } from 'react';
import { CalculatedItem } from '../../types';

interface EletricaAcabamentoTabProps {
  onAddToBudget: (items: CalculatedItem[], sector: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

type Option = 'amperage' | 'color' | 'size';
type Amperage = '10A' | '20A';
type Color = 'Branca' | 'Vermelha' | 'Preta';
type Size = '4x2' | '4x4';

interface AcabamentoConfig { id: string; name: string; options: Option[]; }
interface AcabamentoRowState { quantity: number | ''; amperage: Amperage | ''; color: Color | ''; size: Size | ''; }
type FormulaConfig = Record<string, Partial<Record<Size, Record<string, number>>>>;

const initialAcabamentoItems: AcabamentoConfig[] = [
  { id: 'TOMADA_SIMPLES', name: 'Tomada Simples', options: ['amperage', 'color', 'size'] }, { id: 'TOMADA_DUPLA', name: 'Tomada Dupla', options: ['amperage', 'color', 'size'] }, { id: 'TOMADA_TRIPLA', name: 'Tomada Tripla', options: ['amperage', 'color', 'size'] }, { id: 'INT_SIMPLES_TOMADA', name: 'Interruptor Simples c/ Tomada', options: ['amperage', 'color', 'size'] }, { id: 'INT_SIMPLES', name: 'Interruptor Simples', options: ['color', 'size'] }, { id: 'INT_DUPLO_TOMADA', name: 'Interruptor Duplo c/ Tomada', options: ['amperage', 'color', 'size'] }, { id: 'INT_DUPLO', name: 'Interruptor Duplo', options: ['color', 'size'] }, { id: 'INT_TRIPLO', name: 'Interruptor Triplo', options: ['color', 'size'] }, { id: 'INT_PARALELO', name: 'Interruptor Paralelo', options: ['color', 'size'] }, { id: 'INT_BIVOLT', name: 'Interruptor Bivolt', options: ['color', 'size'] }, { id: 'RJ45_SIMPLES', name: '1 RJ-45', options: ['color', 'size'] }, { id: 'RJ45_DUPLO', name: '2 RJ-45', options: ['color', 'size'] }, { id: 'CEGA', name: 'Cega', options: ['color', 'size'] }, { id: 'TOMADA_RJ45', name: 'Tomada + 1 RJ-45', options: ['amperage', 'color', 'size'] }, { id: 'TOMADA_PAINEL_BR_10A', name: 'Tomada Painel BR 10A', options: [] }, { id: 'TOMADA_PAINEL_PT_10A', name: 'Tomada Painel PT 10A', options: [] }, { id: 'TOMADA_PAINEL_VM_10A', name: 'Tomada Painel VM 10A', options: [] }, { id: 'TOMADA_HASTE_LONGA_10A', name: 'Tomada Haste Longa 10A', options: [] }, { id: 'TOMADA_HASTE_CURTA_PISO_10A', name: 'Tomada Haste Curta Piso 10A', options: [] }, { id: 'TOMADA_IND_16A_MONO', name: 'Tomada Industrial 16A Mono', options: [] }, { id: 'TOMADA_IND_32A_MONO', name: 'Tomada Industrial 32A Mono', options: [] },
];
const initialFormulas: FormulaConfig = {
    TOMADA_SIMPLES:       { '4x2': { 'Bastidor': 1, 'Modulo Tomada Pezzi': 1, 'Modulo Cego': 2 }, '4x4': { 'Bastidor': 1, 'Modulo Tomada Pezzi': 1, 'Modulo Cego': 5 } }, TOMADA_DUPLA:       { '4x2': { 'Bastidor': 1, 'Modulo Tomada Pezzi': 2, 'Modulo Cego': 1 }, '4x4': { 'Bastidor': 1, 'Modulo Tomada Pezzi': 2, 'Modulo Cego': 4 } }, TOMADA_TRIPLA:      { '4x2': { 'Bastidor': 1, 'Modulo Tomada Pezzi': 3 }, '4x4': { 'Bastidor': 1, 'Modulo Tomada Pezzi': 3, 'Modulo Cego': 3 } }, INT_SIMPLES_TOMADA: { '4x2': { 'Bastidor': 1, 'Modulo Tomada Pezzi': 1, 'Modulo Cego': 1, 'Interruptor Simples': 1 }, '4x4': { 'Bastidor': 1, 'Modulo Tomada Pezzi': 1, 'Modulo Cego': 4, 'Interruptor Simples': 1 } }, INT_SIMPLES:        { '4x2': { 'Bastidor': 1, 'Modulo Cego': 2, 'Interruptor Simples': 1 }, '4x4': { 'Bastidor': 1, 'Modulo Cego': 5, 'Interruptor Simples': 1 } }, INT_DUPLO_TOMADA:   { '4x2': { 'Bastidor': 1, 'Modulo Tomada Pezzi': 1, 'Modulo Cego': 0, 'Interruptor Simples': 2 }, '4x4': { 'Bastidor': 1, 'Modulo Tomada Pezzi': 1, 'Modulo Cego': 3, 'Interruptor Simples': 2 } }, INT_DUPLO:          { '4x2': { 'Bastidor': 1, 'Interruptor Simples': 2, 'Modulo Cego': 1 }, '4x4': { 'Bastidor': 1, 'Interruptor Simples': 4, 'Modulo Cego': 2 } }, INT_TRIPLO:         { '4x2': { 'Bastidor': 1, 'Interruptor Simples': 3 }, '4x4': { 'Bastidor': 1, 'Modulo Cego': 3, 'Interruptor Simples': 3 } }, INT_PARALELO:       { '4x2': { 'Bastidor': 1, 'Modulo Cego': 2, 'Interruptor Paralelo': 1 }, '4x4': { 'Bastidor': 1, 'Modulo Cego': 5, 'Interruptor Paralelo': 1 } }, INT_BIVOLT:         { '4x2': { 'Bastidor': 1, 'Modulo Cego': 2, 'Interruptor Bivolt': 1 }, '4x4': { 'Bastidor': 1, 'Modulo Cego': 5, 'Interruptor Bivolt': 1 } }, RJ45_SIMPLES:       { '4x2': { 'Bastidor': 1, 'Modulo Cego': 2, 'Módulo RJ-45 Pezzi': 1 }, '4x4': { 'Bastidor': 1, 'Modulo Cego': 5, 'Módulo RJ-45 Pezzi': 1 } }, RJ45_DUPLO:         { '4x2': { 'Bastidor': 1, 'Modulo Cego': 1, 'Módulo RJ-45 Pezzi': 2 }, '4x4': { 'Bastidor': 1, 'Modulo Cego': 4, 'Módulo RJ-45 Pezzi': 2 } }, CEGA:               { '4x2': { 'Bastidor Pezzi cego': 1, 'Modulo Cego': 3 }, '4x4': { 'Bastidor Pezzi cego': 1, 'Modulo Cego': 6 } }, TOMADA_RJ45:        { '4x2': { 'Bastidor': 1, 'Modulo Tomada Pezzi': 1, 'Modulo Cego': 1, 'Módulo RJ-45 Pezzi': 1 }, '4x4': { 'Bastidor': 1, 'Modulo Tomada Pezzi': 1, 'Modulo Cego': 4, 'Módulo RJ-45 Pezzi': 1 } },
};

const defaultState: AcabamentoRowState = { quantity: '', amperage: '', color: '', size: '' };
const inputClasses = "w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600/50 disabled:cursor-not-allowed";
const thClasses = "px-2 py-3 text-xs font-semibold text-text dark:text-gray-200 uppercase tracking-wider text-left sticky top-0 bg-gray-100 dark:bg-gray-700";

const EletricaAcabamentoTab: React.FC<EletricaAcabamentoTabProps> = ({ onAddToBudget, showToast }) => {
    const [acabamentoItems, setAcabamentoItems] = useState<AcabamentoConfig[]>(initialAcabamentoItems);
    const [formulas, setFormulas] = useState<FormulaConfig>(initialFormulas);
    const [rows, setRows] = useState<Record<string, AcabamentoRowState>>(() => acabamentoItems.reduce((acc, item) => ({...acc, [item.id]: {...defaultState}}), {}));

    const handleInputChange = (id: string, field: keyof AcabamentoRowState, value: string) => {
        const numValue = field === 'quantity' ? (parseInt(value, 10) || '') : value;
        setRows(prev => ({...prev, [id]: { ...prev[id], [field]: numValue as any }}));
    };
    
    const calculatedResults = useMemo((): CalculatedItem[] => {
        const aggregatedItems: Record<string, number> = {};
        acabamentoItems.forEach(itemConfig => {
            const state = rows[itemConfig.id];
            const quantity = Number(state.quantity);
            if (quantity > 0) {
                const formulaSet = formulas[itemConfig.id]?.[state.size || ''];
                if (formulaSet) { // Composite item
                    if (!state.size) return;
                    for (const component in formulaSet) {
                        const multiplier = formulaSet[component];
                        if (!multiplier) continue;
                        let finalName = component;
                        if (component.startsWith('Bastidor')) { finalName = component.includes('cego') ? `Placa Cega ${state.size} c/ Suporte ${state.color || ''}` : `Placa ${state.size} c/ Suporte ${state.color || ''}`; } 
                        else if (component.includes('Tomada')) { finalName = `${component} ${state.amperage || ''} ${state.color || ''}`; } 
                        else if (component.includes('Interruptor') || component.includes('RJ-45') || component === 'Modulo Cego') { finalName = `${component} ${state.color || ''}`; }
                        finalName = finalName.trim().replace(/\s+/g, ' ');
                        aggregatedItems[finalName] = (aggregatedItems[finalName] || 0) + (quantity * multiplier);
                    }
                } else { // Direct item
                    let finalName = `${itemConfig.name}`;
                    const options_str = [state.amperage, state.color, state.size].filter(Boolean).join(' ');
                    if(options_str) finalName += ` ${options_str}`;
                    aggregatedItems[finalName] = (aggregatedItems[finalName] || 0) + quantity;
                }
            }
        });
        return Object.entries(aggregatedItems).filter(([, qty]) => qty > 0).map(([name, qty]) => ({ nome: name, quantidade: qty, grandeza: 'un' }));
    }, [rows, formulas, acabamentoItems]);

    const handleClear = () => {
        setRows(acabamentoItems.reduce((acc, item) => ({...acc, [item.id]: {...defaultState}}), {}));
        showToast('Campos limpos!', 'success');
    };

    const handleAddToBudget = () => {
        if (calculatedResults.length > 0) {
            onAddToBudget(calculatedResults, 'Elétrica Acabamento');
            showToast(`${calculatedResults.length} tipo(s) de item adicionado(s) ao orçamento.`, 'success');
        } else {
            showToast('Nenhum item válido para adicionar.', 'error');
        }
    };
    
    const handleAddNewItem = () => {
      const newId = `CUSTOM_${Date.now()}`;
      setAcabamentoItems(prev => [...prev, {id: newId, name: 'Novo Item', options: ['size', 'color']}]);
      setFormulas(prev => ({...prev, [newId]: { '4x2': {}, '4x4': {}}}));
      setRows(prev => ({...prev, [newId]: {...defaultState}}));
    }
    
    const handleUpdateItem = (id: string, field: 'name' | 'options', value: any) => {
        setAcabamentoItems(prev => prev.map(item => item.id === id ? {...item, [field]: value} : item));
    }

    const handleDeleteItem = (id: string) => {
        setAcabamentoItems(prev => prev.filter(item => item.id !== id));
        const newFormulas = {...formulas}; delete newFormulas[id]; setFormulas(newFormulas);
        const newRows = {...rows}; delete newRows[id]; setRows(newRows);
    }

    const handleFormulaChange = (itemId: string, size: Size, compIndex: number, field: 'name' | 'qty', value: string) => {
        setFormulas(prev => {
            const newFormulas = JSON.parse(JSON.stringify(prev));
            const formula = newFormulas[itemId][size];
            if(!formula) return prev;
            
            const components = Object.entries(formula);
            const [oldName, oldQty] = components[compIndex];
            
            if(field === 'name') {
                delete newFormulas[itemId][size][oldName];
                newFormulas[itemId][size][value] = oldQty;
            } else {
                newFormulas[itemId][size][oldName] = Number(value) || 0;
            }
            return newFormulas;
        })
    }

    const handleAddFormulaComponent = (itemId: string, size: Size) => {
        setFormulas(prev => {
            const newFormulas = JSON.parse(JSON.stringify(prev));
            newFormulas[itemId][size]['Novo Componente'] = 1;
            return newFormulas;
        })
    }

    const handleRemoveFormulaComponent = (itemId: string, size: Size, compName: string) => {
        setFormulas(prev => {
            const newFormulas = JSON.parse(JSON.stringify(prev));
            delete newFormulas[itemId][size][compName];
            return newFormulas;
        })
    }


    return (
        <div className="space-y-8 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="overflow-auto max-h-[60vh] relative md:col-span-1">
                    <table className="w-full text-left table-auto border-collapse">
                        <thead className="bg-gray-100 dark:bg-gray-700"><tr><th className={thClasses}>Descrição</th><th className={`${thClasses} w-32`}>Amperagem</th><th className={`${thClasses} w-32`}>Cor</th><th className={`${thClasses} w-32`}>Tamanho</th><th className={`${thClasses} w-28`}>Quantidade</th></tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {acabamentoItems.map(item => {
                                const state = rows[item.id] || defaultState;
                                const has = (opt: Option) => item.options.includes(opt);
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-2 px-2 text-sm font-medium text-gray-800 dark:text-gray-200">{item.name}</td>
                                        <td className="p-1"><select value={state.amperage} onChange={e => handleInputChange(item.id, 'amperage', e.target.value)} disabled={!has('amperage')} className={inputClasses}><option value="">N/A</option><option value="10A">10A</option><option value="20A">20A</option></select></td>
                                        <td className="p-1"><select value={state.color} onChange={e => handleInputChange(item.id, 'color', e.target.value)} disabled={!has('color')} className={inputClasses}><option value="">Selecione</option><option value="Branca">Branca</option><option value="Vermelha">Vermelha</option><option value="Preta">Preta</option></select></td>
                                        <td className="p-1"><select value={state.size} onChange={e => handleInputChange(item.id, 'size', e.target.value)} disabled={!has('size')} className={inputClasses}><option value="">Selecione</option><option value="4x2">4x2</option><option value="4x4">4x4</option></select></td>
                                        <td className="p-1"><input type="number" min="0" value={state.quantity} onChange={e => handleInputChange(item.id, 'quantity', e.target.value)} className={inputClasses} placeholder="0" /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                 <div className="space-y-6 md:col-span-1">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-text dark:text-gray-200 mb-4">Itens a serem Adicionados</h3>
                        {calculatedResults.length > 0 ? (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-600 max-h-[45vh] overflow-y-auto">{calculatedResults.map((result, index) => (<li key={`${result.nome}-${index}`} className="py-3 flex justify-between items-center"><span className="text-text dark:text-gray-100 font-medium text-sm">{result.nome}</span><span className="text-primary-dark dark:text-primary-light font-bold text-lg">{result.quantidade}<span className="text-sm font-normal text-subtle dark:text-gray-400 ml-1">{result.grandeza}</span></span></li>))}</ul>
                        ) : (<p className="text-subtle dark:text-gray-400 text-center py-4">Nenhum item calculado.</p>)}
                    </div>
                </div>
            </div>
            
             <details className="border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700/50">
                <summary className="cursor-pointer p-3 font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-md">Personalizar Acabamentos e Fórmulas</summary>
                <div className="p-4 border-t border-gray-200 dark:border-gray-600 space-y-4">
                    {acabamentoItems.map(item => (
                        <details key={item.id} className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
                            <summary className="cursor-pointer p-2 flex justify-between items-center"><input type="text" value={item.name} onChange={e => handleUpdateItem(item.id, 'name', e.target.value)} onClick={e=>e.stopPropagation()} className={`${inputClasses} w-1/3`} /> <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 text-xs">Excluir</button></summary>
                            <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                                <div className="flex gap-4 items-center">
                                    <label className="text-sm">Opções:</label>
                                    {(['amperage', 'color', 'size'] as Option[]).map(opt => (
                                        <div key={opt}><input type="checkbox" id={`${item.id}-${opt}`} checked={item.options.includes(opt)} onChange={e => { const newOpts = e.target.checked ? [...item.options, opt] : item.options.filter(o => o !== opt); handleUpdateItem(item.id, 'options', newOpts); }} /><label htmlFor={`${item.id}-${opt}`} className="ml-1 text-sm">{opt}</label></div>
                                    ))}
                                </div>
                                {formulas[item.id] && <div className="grid grid-cols-2 gap-4">
                                    {(['4x2', '4x4'] as Size[]).map(size => (
                                        <div key={size}>
                                            <h4 className="font-semibold text-sm mb-2">{size} Componentes</h4>
                                            <div className="space-y-1">{Object.entries(formulas[item.id]?.[size] || {}).map(([comp, qty], idx) => (
                                                <div key={comp} className="flex gap-1 items-center">
                                                    <input type="text" value={comp} onChange={e => handleFormulaChange(item.id, size, idx, 'name', e.target.value)} className={`${inputClasses} text-xs`} />
                                                    <input type="number" value={qty} onChange={e => handleFormulaChange(item.id, size, idx, 'qty', e.target.value)} className={`${inputClasses} w-16 text-xs`} />
                                                    <button onClick={() => handleRemoveFormulaComponent(item.id, size, comp)} className="text-red-500 text-xs">x</button>
                                                </div>
                                            ))}<button onClick={() => handleAddFormulaComponent(item.id, size)} className="text-xs text-primary-dark mt-1">+ Componente</button></div>
                                        </div>
                                    ))}
                                </div>}
                            </div>
                        </details>
                    ))}
                     <button onClick={handleAddNewItem} className="w-full text-sm text-primary-dark dark:text-primary-light border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mt-2">+ Adicionar Novo Tipo de Acabamento</button>
                </div>
            </details>

            <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
                <button 
                    onClick={handleAddToBudget}
                    disabled={calculatedResults.length === 0}
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

export default EletricaAcabamentoTab;
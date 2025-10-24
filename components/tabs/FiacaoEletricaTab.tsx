import React, { useState, useMemo } from 'react';
import { CalculatedItem } from '../../types';

interface FiacaoEletricaTabProps {
  onAddToBudget: (items: CalculatedItem[], sector: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const wireGauges = ['1,5mm', '2,5mm', '4,0mm', '6,0mm', '10,0mm', '16,0mm', '25,0mm', '35,0mm', '50,0mm', '70,0mm', '95,0mm'];
const phaseColorsOptions = { 1: ['Vermelho'], 2: ['Vermelho', 'Preto'], 3: ['Vermelho', 'Preto', 'Branco'] };

type CircuitType = 'Monofásico' | 'Bifásico' | 'Trifásico';
const initialTerminalConfig: Record<string, Partial<Record<CircuitType, { pino: number, olhal: number }>>> = {
  '1,5mm': { Monofásico: { pino: 1, olhal: 2 } }, '2,5mm': { Monofásico: { pino: 1, olhal: 2 }, Bifásico: { pino: 2, olhal: 1 }, Trifásico: { pino: 3, olhal: 2 } }, '4,0mm': { Monofásico: { pino: 1, olhal: 2 }, Bifásico: { pino: 2, olhal: 1 }, Trifásico: { pino: 3, olhal: 2 } }, '6,0mm': { Monofásico: { pino: 1, olhal: 2 }, Bifásico: { pino: 2, olhal: 1 }, Trifásico: { pino: 3, olhal: 2 } }, '10,0mm': { Monofásico: { pino: 1, olhal: 2 }, Bifásico: { pino: 2, olhal: 1 }, Trifásico: { pino: 3, olhal: 2 } }, '16,0mm': { Monofásico: { pino: 1, olhal: 2 }, Bifásico: { pino: 2, olhal: 1 }, Trifásico: { pino: 3, olhal: 2 } }, '25,0mm': { Trifásico: { pino: 3, olhal: 2 } }, '35,0mm': { Trifásico: { pino: 3, olhal: 2 } }, '50,0mm': { Trifásico: { pino: 3, olhal: 2 } }, '70,0mm': { Trifásico: { pino: 3, olhal: 2 } }, '95,0mm': { Trifásico: { pino: 3, olhal: 2 } }
};

interface FiacaoRowState { fase: number | ''; retorno: number | ''; neutro: number | ''; terra: number | ''; mono: number | ''; bi: number | ''; tri: number | ''; }

const inputClasses = "w-full text-center px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600/50 disabled:cursor-not-allowed";
const thClasses = "px-2 py-3 text-xs font-semibold text-text dark:text-gray-200 uppercase tracking-wider text-center";
const initialRowState: FiacaoRowState = { fase: '', retorno: '', neutro: '', terra: '', mono: '', bi: '', tri: '' };

const FiacaoEletricaTab: React.FC<FiacaoEletricaTabProps> = ({ onAddToBudget, showToast }) => {
    const [rows, setRows] = useState<Record<string, FiacaoRowState>>(() => wireGauges.reduce((acc, gauge) => ({ ...acc, [gauge]: { ...initialRowState } }), {} as Record<string, FiacaoRowState>));
    const [numPhaseColors, setNumPhaseColors] = useState<1 | 2 | 3>(1);
    const [terminalConfig, setTerminalConfig] = useState(initialTerminalConfig);

    const handleInputChange = (gauge: string, field: keyof FiacaoRowState, value: string) => {
        const numValue = parseInt(value, 10);
        setRows(prev => ({ ...prev, [gauge]: { ...(prev[gauge] || initialRowState), [field]: isNaN(numValue) || numValue < 0 ? '' : numValue } }));
    };

    const handleTerminalConfigChange = (gauge: string, type: CircuitType, terminal: 'pino' | 'olhal', value: string) => {
        const numValue = parseInt(value, 10);
        setTerminalConfig(prev => {
            const newConfig = JSON.parse(JSON.stringify(prev));
            if (!newConfig[gauge]) newConfig[gauge] = {};
            if (!newConfig[gauge][type]) newConfig[gauge][type] = { pino: 0, olhal: 0};
            newConfig[gauge][type][terminal] = isNaN(numValue) || numValue < 0 ? 0 : numValue;
            return newConfig;
        });
    }
    
    const handleClear = () => {
        setRows(wireGauges.reduce((acc, gauge) => ({ ...acc, [gauge]: { ...initialRowState } }), {} as Record<string, FiacaoRowState>));
        setNumPhaseColors(1);
        showToast('Campos limpos!', 'success');
    };

    const itemsToAdd = useMemo(() => {
        const items: CalculatedItem[] = [];
        const colors = phaseColorsOptions[numPhaseColors];

        Object.entries(rows).forEach(([gauge, data]) => {
            // FIX: Spreading `initialRowState` ensures all properties are present for destructuring, even if `data` is partial or undefined.
            const { fase, retorno, neutro, terra, mono, bi, tri } = Object.assign({}, initialRowState, data);
            const numMono = Number(mono) || 0; const numBi = Number(bi) || 0; const numTri = Number(tri) || 0;
            const totalCircuits = numMono + numBi + numTri;

            if (totalCircuits > 0) {
                const faseLength = (Number(fase) || 0) * totalCircuits;
                if (faseLength > 0) {
                    const phaseLengthPerColor = faseLength / colors.length;
                    if (phaseLengthPerColor > 0) colors.forEach(color => items.push({ nome: `Fio Fase ${color} ${gauge}`, quantidade: parseFloat(phaseLengthPerColor.toFixed(2)), grandeza: 'metros' }));
                }
                const retornoLength = (Number(retorno) || 0) * totalCircuits;
                if (retornoLength > 0) items.push({ nome: `Fio Retorno Amarelo ${gauge}`, quantidade: retornoLength, grandeza: 'metros' });
                const neutroLength = (Number(neutro) || 0) * totalCircuits;
                if (neutroLength > 0) items.push({ nome: `Fio Neutro Azul ${gauge}`, quantidade: neutroLength, grandeza: 'metros' });
                const terraLength = (Number(terra) || 0) * totalCircuits;
                if (terraLength > 0) items.push({ nome: `Fio Terra Verde ${gauge}`, quantidade: terraLength, grandeza: 'metros' });
                
                const config = terminalConfig[gauge];
                let totalPinos = 0, totalOlhais = 0;
                if (config) {
                    if (numMono > 0 && config.Monofásico) { totalPinos += numMono * config.Monofásico.pino; totalOlhais += numMono * config.Monofásico.olhal; }
                    if (numBi > 0 && config.Bifásico) { totalPinos += numBi * config.Bifásico.pino; totalOlhais += numBi * config.Bifásico.olhal; }
                    if (numTri > 0 && config.Trifásico) { totalPinos += numTri * config.Trifásico.pino; totalOlhais += numTri * config.Trifásico.olhal; }
                }
                if (totalPinos > 0) items.push({ nome: `Terminal Pino ${gauge}`, quantidade: totalPinos, grandeza: 'un' });
                if (totalOlhais > 0) items.push({ nome: `Terminal Olhal ${gauge}`, quantidade: totalOlhais, grandeza: 'un' });
            }
        });
        return items;
    }, [rows, numPhaseColors, terminalConfig]);

    const handleAddToBudget = () => {
        if (itemsToAdd.length > 0) {
            onAddToBudget(itemsToAdd, 'Fiação Elétrica');
            showToast(`${itemsToAdd.length} tipo(s) de item adicionado(s) ao orçamento.`, 'success');
        } else {
            showToast('Nenhum item com quantidade maior que zero para adicionar.', 'error');
        }
    };

    return (
        <div className="space-y-8 pb-24">
            <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
                <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">Configuração Geral</legend>
                 <div className="mt-2 max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cores de Fases</label>
                    <select value={numPhaseColors} onChange={e => setNumPhaseColors(Number(e.target.value) as 1 | 2 | 3)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                        <option value={1}>1 Cor (Vermelho)</option><option value={2}>2 Cores (Vermelho, Preto)</option><option value={3}>3 Cores (Vermelho, Preto, Branco)</option>
                    </select>
                </div>
            </fieldset>

            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto border-collapse">
                   <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th rowSpan={2} className={`${thClasses} border dark:border-gray-600`}>Bitola</th>
                            <th colSpan={4} className={`${thClasses} border dark:border-gray-600`}>Metragem Média por Circuito (m)</th>
                            <th colSpan={3} className={`${thClasses} border dark:border-gray-600`}>Quantidade de Circuitos por Tipo</th>
                        </tr>
                        <tr>
                            <th className={thClasses + " border dark:border-gray-600"}>Fase</th><th className={thClasses + " border dark:border-gray-600"}>Retorno</th><th className={thClasses + " border dark:border-gray-600"}>Neutro</th><th className={thClasses + " border dark:border-gray-600"}>Terra</th>
                            <th className={thClasses + " border dark:border-gray-600"}>Monofásico</th><th className={thClasses + " border dark:border-gray-600"}>Bifásico</th><th className={thClasses + " border dark:border-gray-600"}>Trifásico</th>
                        </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {wireGauges.map(gauge => {
                            const config = terminalConfig[gauge] || {};
                            const rowData = rows[gauge] || initialRowState;
                            return (
                                <tr key={gauge} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="py-2 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 border dark:border-gray-600">{gauge}</td>
                                    <td className="p-1 border dark:border-gray-600"><input type="number" min="0" value={rowData.fase} onChange={e => handleInputChange(gauge, 'fase', e.target.value)} className={inputClasses} placeholder="0" /></td>
                                    <td className="p-1 border dark:border-gray-600"><input type="number" min="0" value={rowData.retorno} onChange={e => handleInputChange(gauge, 'retorno', e.target.value)} className={inputClasses} placeholder="0" /></td>
                                    <td className="p-1 border dark:border-gray-600"><input type="number" min="0" value={rowData.neutro} onChange={e => handleInputChange(gauge, 'neutro', e.target.value)} className={inputClasses} placeholder="0" /></td>
                                    <td className="p-1 border dark:border-gray-600"><input type="number" min="0" value={rowData.terra} onChange={e => handleInputChange(gauge, 'terra', e.target.value)} className={inputClasses} placeholder="0" /></td>
                                    <td className="p-1 border dark:border-gray-600"><input type="number" min="0" disabled={!config.Monofásico} value={rowData.mono} onChange={e => handleInputChange(gauge, 'mono', e.target.value)} className={inputClasses} placeholder="0" /></td>
                                    <td className="p-1 border dark:border-gray-600"><input type="number" min="0" disabled={!config.Bifásico} value={rowData.bi} onChange={e => handleInputChange(gauge, 'bi', e.target.value)} className={inputClasses} placeholder="0" /></td>
                                    <td className="p-1 border dark:border-gray-600"><input type="number" min="0" disabled={!config.Trifásico} value={rowData.tri} onChange={e => handleInputChange(gauge, 'tri', e.target.value)} className={inputClasses} placeholder="0" /></td>
                                </tr>
                            );
                        })}
                   </tbody>
                </table>
            </div>
            
            <details className="border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700/50">
                <summary className="cursor-pointer p-3 font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-md">Personalizar Fórmulas de Terminais</summary>
                <div className="p-4 border-t border-gray-200 dark:border-gray-600 overflow-x-auto">
                    <table className="w-full text-left table-auto border-collapse">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className={thClasses}>Bitola</th>
                                <th colSpan={2} className={thClasses}>Monofásico</th>
                                <th colSpan={2} className={thClasses}>Bifásico</th>
                                <th colSpan={2} className={thClasses}>Trifásico</th>
                            </tr>
                             <tr>
                                <th className={thClasses}></th>
                                <th className={thClasses}>Pino</th><th className={thClasses}>Olhal</th>
                                <th className={thClasses}>Pino</th><th className={thClasses}>Olhal</th>
                                <th className={thClasses}>Pino</th><th className={thClasses}>Olhal</th>
                            </tr>
                        </thead>
                         <tbody>
                            {wireGauges.map(gauge => (
                                <tr key={gauge}>
                                    <td className="py-2 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 border dark:border-gray-600">{gauge}</td>
                                    {(['Monofásico', 'Bifásico', 'Trifásico'] as CircuitType[]).map(type => {
                                        const config = terminalConfig[gauge]?.[type];
                                        return (
                                            <React.Fragment key={type}>
                                                <td className="p-1 border dark:border-gray-600"><input type="number" min="0" value={config?.pino ?? ''} onChange={e => handleTerminalConfigChange(gauge, type, 'pino', e.target.value)} className={inputClasses} /></td>
                                                <td className="p-1 border dark:border-gray-600"><input type="number" min="0" value={config?.olhal ?? ''} onChange={e => handleTerminalConfigChange(gauge, type, 'olhal', e.target.value)} className={inputClasses} /></td>
                                            </React.Fragment>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
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

export default FiacaoEletricaTab;
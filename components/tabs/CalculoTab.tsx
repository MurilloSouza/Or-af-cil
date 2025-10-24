import React, { useState, useMemo } from 'react';
import { CalculatedItem, CalculoInputState, FormulaItem, FormulaVariable, CalculationGroup } from '../../types';
import EletricaTab from './EletricaTab';
import MaoDeObraTab from './MaoDeObraTab';
import { runCalculationEngine } from '../../utils';
import { useLocalization } from '../../LanguageContext';
import { useSubscription } from '../../SubscriptionContext';

// Props para a aba de cálculo principal
interface CalculoTabProps {
  groups: CalculationGroup[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  inputs: CalculoInputState;
  setInputs: (inputs: CalculoInputState) => void;
  onAddToBudget: (items: CalculatedItem[], sector: string) => void;
  onAddGroup: (name?: string) => void;
  onDeleteGroup: (groupId: string | null) => void;
  onUpdateGroupName: (groupId: string | null, name: string) => void;
  onAddFormula: (groupId: string | null) => void;
  onUpdateFormula: (groupId: string | null, id: string, field: keyof Omit<FormulaItem, 'id'>, value: string) => void;
  onDeleteFormula: (groupId: string | null, id: string) => void;
  onAddVariable: (groupId: string | null, isInfo: boolean) => void;
  onUpdateVariable: (groupId: string | null, id: string, field: keyof Omit<FormulaVariable, 'id'>, value: string | string[]) => void;
  onDeleteVariable: (groupId: string | null, id: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

// Componente do botão da sub-aba
const SubTabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => {
    const baseClasses = "px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors";
    const activeClasses = "bg-primary text-white shadow-sm";
    const inactiveClasses = "bg-gray-100 dark:bg-gray-700/50 text-text dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600";
    return (
        <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {label}
        </button>
    );
};

// Componente interno para a aba "Geral" (antiga CalculoTab)
const CalculoGeralTab: React.FC<CalculoTabProps> = ({
  groups, activeGroupId, setActiveGroupId, inputs, setInputs, onAddToBudget,
  onAddGroup, onDeleteGroup, onUpdateGroupName, onAddFormula, onUpdateFormula,
  onDeleteFormula, onAddVariable, onUpdateVariable, onDeleteVariable, showToast,
}) => {
  const { t } = useLocalization();
  const { plan, planDetails } = useSubscription();
  const [isCustomizeOpen, setCustomizeOpen] = useState(false);
  const [lastFocusedFormula, setLastFocusedFormula] = useState<string | null>(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const activeGroup = useMemo(() => groups.find(g => g.id === activeGroupId), [groups, activeGroupId]);

  const calculatedResults = useMemo(() => {
    if (!activeGroup) return [];

    const allItems = runCalculationEngine(activeGroup, inputs);
    
    return activeGroup.formulas.map(formula => {
      const resultItem = allItems.find(item => item.nome.startsWith(formula.name));
      const quantity = resultItem ? resultItem.quantidade : 0;
      const finalName = resultItem ? resultItem.nome : formula.name;
      return {
        id: formula.id,
        nome: finalName,
        quantidade: quantity,
        grandeza: formula.unit
      };
    });
  }, [activeGroup, inputs]);


  const allItemsToAdd = useMemo(() => {
    if (!activeGroup) return [];
    return runCalculationEngine(activeGroup, inputs);
  }, [activeGroup, inputs]);

  const handleInputChange = (code: string, value: string | number) => setInputs({ ...inputs, [code]: value });
  
  const handleVariableClick = (code: string) => {
    if (!lastFocusedFormula) { 
        showToast("Click on the formula field you want to edit first.", "error"); 
        return; 
    }
    const targetFormula = activeGroup?.formulas.find(f => f.id === lastFocusedFormula);
    if (targetFormula) onUpdateFormula(activeGroupId, lastFocusedFormula, 'value', `${targetFormula.value}[${code}]`);
  };

  const handleClearInputs = () => {
    if (activeGroup) setInputs(activeGroup.variables.filter(v => !v.isFormulaResult).reduce((acc, v) => ({ ...acc, [v.code]: '' }), {} as CalculoInputState));
  };

  const handleAddToBudgetGeral = () => {
    if (allItemsToAdd.length > 0 && activeGroup) {
        onAddToBudget(allItemsToAdd, activeGroup.name);
        showToast(`${allItemsToAdd.length} items added to the budget!`, 'success');
    } else {
        showToast('No items with quantity greater than zero to add.', 'error');
    }
  };
  
  const handleConfirmAddGroup = () => {
      onAddGroup(newGroupName);
      setNewGroupName("");
      setIsAddingGroup(false);
  };

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-400";
  const smallInputClasses = "text-sm px-2 py-1 " + inputClasses;

  const infoVariables = useMemo(() => activeGroup?.variables.filter(v => v.isInfo && !v.isFormulaResult) || [], [activeGroup]);
  const parameterVariables = useMemo(() => activeGroup?.variables.filter(v => !v.isInfo && !v.isFormulaResult) || [], [activeGroup]);

  const handleInfoDepChange = (variable: FormulaVariable, infoCode: string, isChecked: boolean) => {
    const currentDeps = variable.infoDependencies || [];
    let newDeps;
    if (isChecked) {
        newDeps = [...currentDeps, infoCode];
    } else {
        newDeps = currentDeps.filter(code => code !== infoCode);
    }
    onUpdateVariable(activeGroupId, variable.id, 'infoDependencies', newDeps);
  };
  
  // FIX: Corrected logic for checking group limit. The previous check used an invalid plan name 'basic'
  // and had flawed logic. This now correctly checks if the number of groups is less than the maximum allowed by the current plan.
  const canAddGroup = planDetails.features.addGroups && groups.length < planDetails.maxGroups;

  return (
    <div className="space-y-6 pb-24">
       <div className="flex flex-wrap justify-between items-center gap-4">
        <h3 className="text-xl font-bold text-text dark:text-gray-100">{t('calculator.generalCalculations')}</h3>
        
        {isAddingGroup ? (
             <div className="flex items-center gap-2">
                <input 
                    type="text" 
                    value={newGroupName} 
                    onChange={(e) => setNewGroupName(e.target.value)} 
                    placeholder={t('calculator.addGroup.placeholder')} 
                    className={`${inputClasses} text-sm py-2`}
                    autoFocus 
                />
                <button onClick={handleConfirmAddGroup} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg text-sm">{t('calculator.save')}</button>
                <button onClick={() => setIsAddingGroup(false)} className="bg-gray-200 hover:bg-gray-300 text-text dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100 font-bold py-2 px-3 rounded-lg text-sm">{t('calculator.cancel')}</button>
            </div>
        ) : (
            <div className="flex items-center gap-2">
               <select 
                 value={activeGroupId || ''} 
                 onChange={e => setActiveGroupId(e.target.value)}
                 className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light"
               >
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
               </select>
               <button onClick={() => setIsAddingGroup(true)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg text-sm disabled:bg-gray-400 disabled:cursor-not-allowed" title={canAddGroup ? t('calculator.addGroup.button') : t('subscription.upgradeRequired.message', { plan: plan })} disabled={!canAddGroup}>+</button>
               <button onClick={() => onDeleteGroup(activeGroupId)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg text-sm" title={t('calculator.deleteGroup.button')}>-</button>
            </div>
        )}
      </div>
      {!activeGroup ? (<p>Select or create a group.</p>) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inputs and Results */}
                <div className="space-y-6">
                    {infoVariables.length > 0 && (
                        <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
                            <h3 className="font-medium text-gray-800 dark:text-gray-200">{t('calculator.generalInfo')}</h3>
                            <div className="space-y-4 mt-4">
                                {infoVariables.map(v => (
                                    <div key={v.id}>
                                        <label htmlFor={v.code} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{v.description}</label>
                                        <input type="text" id={v.code} value={inputs[v.code] || ''} onChange={e => handleInputChange(v.code, e.target.value)} className={`${inputClasses} mt-1`} placeholder="Ex: 100x50, Smooth, etc." />
                                    </div>
                                ))}
                            </div>
                        </fieldset>
                    )}
                    <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">{t('calculator.calculationParams')}</h3>
                        <div className="space-y-4 mt-4">
                            {parameterVariables.map(v => (
                                <div key={v.id}>
                                    <label htmlFor={v.code} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{v.description}</label>
                                    <input type="number" id={v.code} value={inputs[v.code] || ''} onChange={e => handleInputChange(v.code, e.target.value)} className={`${inputClasses} mt-1`} placeholder="0" />
                                </div>
                            ))}
                             {parameterVariables.length === 0 && (
                                <p className="text-sm text-subtle dark:text-gray-400">{t('calculator.noParams')}</p>
                            )}
                        </div>
                    </fieldset>
                </div>
                <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-text dark:text-gray-200 mb-4">{t('calculator.results')}</h3>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                        {calculatedResults.map((result) => (
                            <li key={result.id} className="py-3 flex justify-between items-center">
                                <span className="text-text dark:text-gray-100 font-medium">{result.nome}</span>
                                <span className="text-primary-dark dark:text-primary-light font-bold text-lg">
                                {typeof result.quantidade === 'number' && !isNaN(result.quantidade) ? result.quantidade.toFixed(2) : t('calculator.error')}
                                <span className="text-sm font-normal text-subtle dark:text-gray-400 ml-1">{result.grandeza}</span>
                                </span>
                            </li>
                        ))}
                        </ul>
                    </div>
                </div>
            </div>
             {/* Customize section */}
             {planDetails.features.addCustomizeFormulas && (
                <details className="border border-gray-200 dark:border-gray-700 rounded-md" onToggle={(e) => setCustomizeOpen((e.target as HTMLDetailsElement).open)}>
                    <summary className="cursor-pointer p-4 font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-t-md list-none flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isCustomizeOpen ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        {t('calculator.customize')}
                    </summary>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-8">
                        <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('calculator.groupName')}</label>
                        <input type="text" value={activeGroup.name} onChange={e => onUpdateGroupName(activeGroupId, e.target.value)} className={`${inputClasses} mt-1`}/>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('calculator.inputVars')}</h4>
                            <div className="space-y-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md">
                                {activeGroup.variables.filter(v => !v.isFormulaResult).map(v => (
                                    <div key={v.id} className="grid grid-cols-[1.5fr_2fr_2fr_auto] gap-2 items-center">
                                        <input type="text" value={v.code} onChange={e => onUpdateVariable(activeGroupId, v.id, 'code', e.target.value)} placeholder={t('calculator.codePlaceholder')} className={smallInputClasses} />
                                        <input type="text" value={v.description} onChange={e => onUpdateVariable(activeGroupId, v.id, 'description', e.target.value)} placeholder={t('calculator.descPlaceholder')} className={smallInputClasses} />
                                        
                                        {v.isInfo ? (
                                            <div className="text-xs text-center text-subtle dark:text-gray-400 p-1 bg-gray-100 dark:bg-gray-800 rounded-md">{t('calculator.infoField')}</div>
                                        ) : (
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 p-1 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800" title={t('calculator.linkInfo')}>
                                                {infoVariables.map(infoVar => (
                                                    <div key={infoVar.id} className="flex items-center text-xs">
                                                        <input
                                                            type="checkbox"
                                                            id={`dep-${v.id}-${infoVar.id}`}
                                                            checked={v.infoDependencies?.includes(infoVar.code) || false}
                                                            onChange={e => handleInfoDepChange(v, infoVar.code, e.target.checked)}
                                                            className="h-3 w-3 text-primary rounded border-gray-300 focus:ring-primary-light"
                                                        />
                                                        <label htmlFor={`dep-${v.id}-${infoVar.id}`} className="ml-1 text-gray-700 dark:text-gray-300">[{infoVar.code}]</label>
                                                    </div>
                                                ))}
                                                {infoVariables.length === 0 && <span className="text-xs text-subtle dark:text-gray-400 px-1">{t('calculator.noInfoToLink')}</span>}
                                            </div>
                                        )}
                                        <button onClick={() => onDeleteVariable(activeGroupId, v.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => onAddVariable(activeGroupId, false)} className="text-sm text-primary-dark dark:text-primary-light hover:underline">{t('calculator.addParam')}</button>
                                <button onClick={() => onAddVariable(activeGroupId, true)} className="text-sm text-green-600 dark:text-green-400 hover:underline">{t('calculator.addInfo')}</button>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('calculator.resultFormulas')}</h4>
                            <div className="space-y-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md">
                            {activeGroup.formulas.map(f => (
                                    <div key={f.id} className="grid grid-cols-[1.5fr_2.5fr_1fr_auto] gap-2 items-center">
                                        <input type="text" value={f.name} onChange={e => onUpdateFormula(activeGroupId, f.id, 'name', e.target.value)} placeholder={t('calculator.itemNamePlaceholder')} className={smallInputClasses} />
                                        <input type="text" value={f.value} onChange={e => onUpdateFormula(activeGroupId, f.id, 'value', e.target.value)} placeholder={t('calculator.formulaPlaceholder')} className={smallInputClasses} onFocus={() => setLastFocusedFormula(f.id)} />
                                        <input type="text" value={f.unit} onChange={e => onUpdateFormula(activeGroupId, f.id, 'unit', e.target.value)} placeholder={t('calculator.unitPlaceholder')} className={smallInputClasses} />
                                        <button onClick={() => onDeleteFormula(activeGroupId, f.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                                    </div>
                            ))}
                            </div>
                            <div className="flex gap-2 mt-2 items-start">
                                <button onClick={() => onAddFormula(activeGroupId)} className="text-sm text-primary-dark dark:text-primary-light hover:underline flex-shrink-0 mt-1">{t('calculator.addFormula')}</button>
                                <div className="flex flex-wrap gap-2 pl-4 border-l border-gray-300 dark:border-gray-600">
                                    {activeGroup.variables.map(v => (
                                        <button 
                                            key={v.id} 
                                            onClick={() => handleVariableClick(v.code)} 
                                            className={`text-xs px-2 py-0.5 rounded-full transition-colors ${v.isFormulaResult ? 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-300' : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 hover:bg-primary hover:text-white'}`} 
                                            title={v.description}
                                        >
                                            [{v.code}]
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-subtle dark:text-gray-400 mt-2 px-1">
                            {t('calculator.formulaHint')}
                            </p>
                        </div>
                    </div>
                </details>
             )}
             {/* Action Buttons */}
            <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
                <button 
                    onClick={handleAddToBudgetGeral}
                    disabled={allItemsToAdd.length === 0}
                    className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-5 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    title={t('calculator.addToBudget')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{t('calculator.addToBudget')}</span>
                </button>
                <button 
                    onClick={handleClearInputs}
                    className="bg-gray-200 hover:bg-gray-300 text-text dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100 font-bold py-2 px-3 rounded-full shadow-md transition-colors duration-300 text-sm"
                    title={t('calculator.clearFields')}
                >
                    {t('calculator.clearFields')}
                </button>
            </div>
        </>
      )}
    </div>
  );
};


// Componente principal da aba de cálculo que gerencia as sub-abas
const CalculoTab: React.FC<CalculoTabProps> = (props) => {
    const { t } = useLocalization();
    const [activeSubTab, setActiveSubTab] = useState<'geral' | 'eletrica' | 'maoDeObra'>('geral');
    
    const { onAddToBudget, showToast } = props;

    const renderSubContent = () => {
        switch (activeSubTab) {
            case 'geral':
                return <CalculoGeralTab {...props} />;
            case 'eletrica':
                return <EletricaTab onAddToBudget={onAddToBudget} showToast={showToast} />;
            case 'maoDeObra':
                return <MaoDeObraTab onAddToBudget={onAddToBudget} showToast={showToast} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 pb-4">
                <SubTabButton label={t('calculator.general')} isActive={activeSubTab === 'geral'} onClick={() => setActiveSubTab('geral')} />
                <SubTabButton label={t('calculator.electrical')} isActive={activeSubTab === 'eletrica'} onClick={() => setActiveSubTab('eletrica')} />
                <SubTabButton label={t('calculator.labor')} isActive={activeSubTab === 'maoDeObra'} onClick={() => setActiveSubTab('maoDeObra')} />
            </div>
            <div className="pt-2">
                {renderSubContent()}
            </div>
        </div>
    );
};

export default CalculoTab;
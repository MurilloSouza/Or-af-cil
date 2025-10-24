import React, { useState, useMemo } from 'react';
import { CalculatedItem } from '../../types';
import { useLocalization } from '../../LanguageContext';

interface MaoDeObraTabProps {
  onAddToBudget: (items: CalculatedItem[], sector: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

interface TecnicoRow {
  id: string;
  description: string;
  quantity: number | '';
  dailyRate: number | '';
}

interface AdicionalRow {
  id: string;
  description: string;
  dailyValue: number | '';
  enabled: boolean;
}

const initialAdicionaisData: { id: string; dailyValue: number }[] = [
    { id: 'noturno', dailyValue: 120 }, { id: 'veiculo', dailyValue: 100 }, { id: 'estadia', dailyValue: 500 }, { id: 'distancia', dailyValue: 50 }, { id: 'refeicao', dailyValue: 30 }, { id: 'ferramentas', dailyValue: 250 }, { id: 'andaime', dailyValue: 400 }, { id: 'ptas', dailyValue: 200 }, { id: 'epis', dailyValue: 850 }, { id: 'certificacoes', dailyValue: 600 },
];

const inputClasses = "w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100";

const MaoDeObraTab: React.FC<MaoDeObraTabProps> = ({ onAddToBudget, showToast }) => {
  const { t, formatCurrency } = useLocalization();

  const getInitialAdicionais = (): AdicionalRow[] => {
      return initialAdicionaisData.map(item => ({
        id: item.id,
        description: t(`calculator.labor.additionals.${item.id}`),
        dailyValue: item.dailyValue,
        enabled: false,
      }))
  }

  const [tempoObra, setTempoObra] = useState<number | ''>(6);
  const [tecnicos, setTecnicos] = useState<TecnicoRow[]>([
    { id: `tec-${Date.now()}`, description: t('calculator.labor.technician'), quantity: 5, dailyRate: 80 },
  ]);
  const [adicionais, setAdicionais] = useState<AdicionalRow[]>(getInitialAdicionais());
  
  // Re-initialize descriptions on language change
  React.useEffect(() => {
    setAdicionais(getInitialAdicionais());
  }, [t]);


  const handleTecnicoChange = (id: string, field: keyof Omit<TecnicoRow, 'id'>, value: string) => {
    const isText = field === 'description';
    const parsedValue = isText ? value : (parseInt(value, 10) || '');
    setTecnicos(rows => rows.map(row => (row.id === id ? { ...row, [field]: parsedValue } : row)));
  };

  const addTecnicoRow = () => {
    setTecnicos(rows => [...rows, { id: `tec-${Date.now()}`, description: '', quantity: '', dailyRate: '' }]);
  };

  const removeTecnicoRow = (id: string) => {
    setTecnicos(rows => (rows.length > 1 ? rows.filter(row => row.id !== id) : rows));
  };
  
  const handleAdicionalChange = (id: string, field: 'dailyValue' | 'enabled', value: string | boolean) => {
      setAdicionais(rows => rows.map(row => {
          if (row.id === id) {
              if (field === 'enabled') return { ...row, enabled: value as boolean };
              const parsedValue = parseInt(value as string, 10) || '';
              return { ...row, dailyValue: parsedValue };
          }
          return row;
      }))
  };

  const { totalTecnicos, totalAdicionais, valorTotal, valorDiaria } = useMemo(() => {
    const dias = Number(tempoObra) || 0;
    const totalTecnicos = tecnicos.reduce((acc, tec) => {
      const q = Number(tec.quantity) || 0;
      const r = Number(tec.dailyRate) || 0;
      return acc + q * r * dias;
    }, 0);

    const totalAdicionais = adicionais.reduce((acc, ad) => {
      if (ad.enabled) {
        return acc + (Number(ad.dailyValue) || 0) * dias;
      }
      return acc;
    }, 0);
    
    const valorTotal = totalTecnicos + totalAdicionais;
    const valorDiaria = dias > 0 ? valorTotal / dias : 0;
    
    return { totalTecnicos, totalAdicionais, valorTotal, valorDiaria };
  }, [tempoObra, tecnicos, adicionais]);

  const itemsToAdd = useMemo(() => {
      const items: CalculatedItem[] = [];
      if (totalTecnicos > 0) {
          items.push({ nome: t('calculator.labor.totalLaborCost'), quantidade: totalTecnicos, grandeza: 'R$' });
      }
      if (totalAdicionais > 0) {
          items.push({ nome: t('calculator.labor.totalAdditionalCost'), quantidade: totalAdicionais, grandeza: 'R$' });
      }
      return items;
  }, [totalTecnicos, totalAdicionais, t]);


  const handleClear = () => {
    setTempoObra('');
    setTecnicos([{ id: `tec-${Date.now()}`, description: t('calculator.labor.technician'), quantity: '', dailyRate: '' }]);
    setAdicionais(getInitialAdicionais().map(ad => ({...ad, enabled: false})));
    showToast('Fields cleared!', 'success');
  };

  const handleAddToBudget = () => {
    if (itemsToAdd.length === 0) {
      showToast('No calculated cost to add.', 'error');
      return;
    }
    onAddToBudget(itemsToAdd, t('calculator.labor'));

    showToast(`${itemsToAdd.length} cost(s) added to the budget!`, 'success');
  };


  return (
    <div className="space-y-8 pb-24">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            {/* Mão de Obra */}
            <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
                <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">{t('calculator.labor.teamAndDuration')}</legend>
                <div className="space-y-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('calculator.labor.workTime')}</label>
                        <input type="number" value={tempoObra} onChange={e => setTempoObra(parseInt(e.target.value) || '')} className={`${inputClasses} mt-1 max-w-xs`} placeholder="0"/>
                    </div>
                    <div className="space-y-2">
                        {tecnicos.map(tec => (
                             <div key={tec.id} className="grid grid-cols-[1fr_100px_120px_auto] gap-3 items-end">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('calculator.labor.description')}</label>
                                    <input type="text" value={tec.description} onChange={e => handleTecnicoChange(tec.id, 'description', e.target.value)} className={inputClasses} placeholder={t('calculator.labor.technician')} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('calculator.labor.quantity')}</label>
                                    <input type="number" min="0" value={tec.quantity} onChange={e => handleTecnicoChange(tec.id, 'quantity', e.target.value)} className={inputClasses} placeholder="0" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('calculator.labor.dailyRate')}</label>
                                    <input type="number" min="0" value={tec.dailyRate} onChange={e => handleTecnicoChange(tec.id, 'dailyRate', e.target.value)} className={inputClasses} placeholder="0.00" />
                                </div>
                                <button onClick={() => removeTecnicoRow(tec.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-full disabled:opacity-50" disabled={tecnicos.length <= 1}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                     <button onClick={addTecnicoRow} className="w-full text-sm text-primary-dark dark:text-primary-light border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mt-2">
                        {t('calculator.labor.addProfessional')}
                    </button>
                </div>
            </fieldset>

            {/* Adicionais */}
             <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
                <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">{t('calculator.labor.additionalCosts')}</legend>
                <div className="space-y-3 mt-4">
                    {adicionais.map(ad => (
                         <div key={ad.id} className="grid grid-cols-[1fr_120px_auto] gap-4 items-center">
                            <label htmlFor={`check-${ad.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none">
                                {ad.description}
                            </label>
                            <input type="number" value={ad.dailyValue} onChange={e => handleAdicionalChange(ad.id, 'dailyValue', e.target.value)} className={inputClasses} placeholder="0.00" disabled={!ad.enabled} />
                            <input id={`check-${ad.id}`} type="checkbox" checked={ad.enabled} onChange={e => handleAdicionalChange(ad.id, 'enabled', e.target.checked)} className="h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary-light" />
                        </div>
                    ))}
                </div>
            </fieldset>
        </div>

        <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg shadow-inner">
                <h3 className="text-lg font-bold text-text dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-600">{t('calculator.labor.costSummary')}</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center"><span className="text-subtle dark:text-gray-400">{t('calculator.labor.totalLabor')}:</span><span className="font-semibold text-text dark:text-gray-200">{formatCurrency(totalTecnicos)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-subtle dark:text-gray-400">{t('calculator.labor.totalAdditionals')}:</span><span className="font-semibold text-text dark:text-gray-200">{formatCurrency(totalAdicionais)}</span></div>
                </div>
                <div className="mt-4 pt-4 border-t-2 border-primary dark:border-primary-light">
                    <div className="flex justify-between items-center text-lg"><span className="font-bold text-text dark:text-gray-100">{t('calculator.labor.totalValue')}:</span><span className="font-extrabold text-primary-dark dark:text-primary-light text-xl">{formatCurrency(valorTotal)}</span></div>
                    <div className="flex justify-between items-center text-md mt-1"><span className="font-semibold text-text dark:text-gray-100">{t('calculator.labor.dailyValue')}:</span><span className="font-bold text-secondary dark:text-gray-300">{formatCurrency(valorDiaria)}</span></div>
                </div>
            </div>
        </div>
      </div>

      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
            <button 
                onClick={handleAddToBudget}
                disabled={itemsToAdd.length === 0}
                className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-5 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                title={t('calculator.addToBudget')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{t('calculator.addToBudget')}</span>
            </button>
            <button 
                onClick={handleClear}
                className="bg-gray-200 hover:bg-gray-300 text-text dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100 font-bold py-2 px-3 rounded-full shadow-md transition-colors duration-300 text-sm"
                title={t('calculator.clearFields')}
            >
                {t('calculator.clearFields')}
            </button>
        </div>
    </div>
  );
};

export default MaoDeObraTab;
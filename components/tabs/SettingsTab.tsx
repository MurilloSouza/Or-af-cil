import React, { useState, useEffect, useRef } from 'react';
import { CalculationGroup } from '../../types';
import { useLocalization } from '../../LanguageContext';
import { languages, Language } from '../../localization';
import { supportedCurrencies } from '../../LanguageContext';

interface SettingsTabProps {
  markup: number;
  onMarkupChange: (value: number) => void;
  roundUp: boolean;
  onRoundUpChange: (value: boolean) => void;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  isUsingDefaultApiKey: boolean;
  calculationGroups: CalculationGroup[];
  onInitiateFormulaImport: (fileContent: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 disabled:bg-gray-200 dark:disabled:bg-gray-700/50 disabled:cursor-not-allowed";

const SettingsTab: React.FC<SettingsTabProps> = ({ 
  markup, onMarkupChange, roundUp, onRoundUpChange, apiKey, onApiKeyChange, isUsingDefaultApiKey,
  calculationGroups, onInitiateFormulaImport, showToast
}) => {
  const { t, language, setLanguage, currency, setCurrency } = useLocalization();
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);
  
  const handleSaveApiKey = () => {
    onApiKeyChange(localApiKey);
  }
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  }
  
  const handleExportClick = () => {
    handleExportFormulas();
  }

  const handleExportFormulas = () => {
    try {
      const dataStr = JSON.stringify(calculationGroups, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'budget_generator_formulas.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export formulas:", error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
            onInitiateFormulaImport(text);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    reader.onerror = () => {
        console.error("Error reading file");
    };
    reader.readAsText(file);
  };
  
  const currencyNames: Record<string, string> = {
      BRL: 'Real Brasileiro (BRL)',
      USD: 'Dólar Americano (USD)',
      EUR: 'Euro (EUR)',
      GBP: 'Libra Esterlina (GBP)',
      JPY: 'Iene Japonês (JPY)'
  }

  return (
    <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-4">{t('settings.title')}</h2>
        
        <div className="space-y-6">
          
          <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
            <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">{t('settings.language')}</legend>
            <div className="mt-4">
               <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.language')}
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className={inputClasses + " max-w-xs"}
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          </fieldset>

          <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
            <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">{t('settings.financial')}</legend>
            <div className="mt-4">
              <label htmlFor="markup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.markup')}
              </label>
              <input
                type="number"
                id="markup"
                name="markup"
                min="0"
                className={inputClasses + " w-1/4"}
                value={markup}
                onChange={(e) => onMarkupChange(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 40"
              />
              <p className="mt-2 text-sm text-subtle dark:text-gray-400">
                {t('settings.markup.description')}
              </p>
            </div>
            <div className="mt-6">
                <label htmlFor="currency-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('settings.financial.currency')}
                </label>
                <select
                    id="currency-select"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={inputClasses + " max-w-xs"}
                >
                    {supportedCurrencies.map(code => (
                        <option key={code} value={code}>{currencyNames[code] || code}</option>
                    ))}
                </select>
                <p className="mt-2 text-sm text-subtle dark:text-gray-400">
                    {t('settings.financial.currencyDescription')}
                </p>
            </div>
          </fieldset>

          <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
            <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">{t('settings.budget')}</legend>
            <div className="mt-4">
               <div className="flex items-center">
                  <input
                    id="roundUp"
                    name="roundUp"
                    type="checkbox"
                    className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary-light"
                    checked={roundUp}
                    onChange={(e) => onRoundUpChange(e.target.checked)}
                  />
                  <label htmlFor="roundUp" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                    {t('settings.roundUp')}
                  </label>
                </div>
                <p className="mt-2 text-sm text-subtle dark:text-gray-400">
                  {t('settings.roundUp.description')}
                </p>
            </div>
          </fieldset>
          
          <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
            <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">{t('settings.ai')}</legend>
            <div className="mt-4">
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.apiKey.label')}
              </label>
              <div className="flex items-center gap-2">
                <input
                    type="password"
                    id="api-key"
                    name="api-key"
                    className={inputClasses}
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder={t('settings.apiKey.placeholder')}
                />
                <button onClick={handleSaveApiKey} className="bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    {t('settings.apiKey.save')}
                </button>
              </div>
               {isUsingDefaultApiKey && (
                  <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/50 p-2 rounded-md border border-yellow-200 dark:border-yellow-800">
                    {t('settings.apiKey.warning')}
                  </p>
                )}
              <p className="mt-2 text-sm text-subtle dark:text-gray-400">
                {t('settings.apiKey.description')}
              </p>
            </div>
          </fieldset>
          
          <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
            <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">{t('settings.formulas')}</legend>
            <div className="mt-4 flex flex-wrap gap-4">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
              <button onClick={handleExportClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  {t('settings.formulas.export')}
              </button>
              <button onClick={handleImportClick} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  {t('settings.formulas.import')}
              </button>
            </div>
            <p className="mt-2 text-sm text-subtle dark:text-gray-400">
              {t('settings.formulas.description')}
            </p>
          </fieldset>
        </div>

      </div>
    </div>
  );
};

export default SettingsTab;
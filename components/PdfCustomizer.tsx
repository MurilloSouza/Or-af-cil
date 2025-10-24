import React, { useState, useEffect } from 'react';
import { PdfSettings } from '../types';
import { useLocalization } from '../LanguageContext';


interface PdfCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings: PdfSettings;
  onSave: (settings: PdfSettings) => void;
}

const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100";
const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

const PdfCustomizer: React.FC<PdfCustomizerProps> = ({ isOpen, onClose, initialSettings, onSave }) => {
  const { t } = useLocalization();
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleChange = (field: keyof PdfSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-text dark:text-gray-100">{t('pdf.customize.title')}</h2>
           <button onClick={onClose} className="text-subtle dark:text-gray-400 hover:text-gray-800 dark:hover:text-white" aria-label="Fechar">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Form fields */}
          <div>
            <label htmlFor="pdf-title" className={labelClasses}>{t('pdf.customize.docTitle')}</label>
            <input type="text" id="pdf-title" value={settings.title} onChange={e => handleChange('title', e.target.value)} className={inputClasses} />
          </div>
          <div>
            <label htmlFor="pdf-header" className={labelClasses}>{t('pdf.customize.headerText')}</label>
            <input type="text" id="pdf-header" value={settings.customHeaderText} onChange={e => handleChange('customHeaderText', e.target.value)} className={inputClasses} />
          </div>
          <div>
            <label htmlFor="pdf-footer" className={labelClasses}>{t('pdf.customize.footerText')}</label>
            <input type="text" id="pdf-footer" value={settings.customFooterText} onChange={e => handleChange('customFooterText', e.target.value)} className={inputClasses} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pdf-color" className={labelClasses}>{t('pdf.customize.primaryColor')}</label>
              <input type="color" id="pdf-color" value={settings.primaryColor} onChange={e => handleChange('primaryColor', e.target.value)} className="w-full h-10 p-1 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="pdf-font" className={labelClasses}>{t('pdf.customize.font')}</label>
              <select id="pdf-font" value={settings.font} onChange={e => handleChange('font', e.target.value as any)} className={inputClasses}>
                <option value="helvetica">Helvetica (Default)</option>
                <option value="times">Times New Roman</option>
                <option value="courier">Courier</option>
              </select>
            </div>
          </div>
          <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
            <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">{t('pdf.customize.sections')}</legend>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input type="checkbox" id="pdf-summary" checked={settings.showSummaryPage} onChange={e => handleChange('showSummaryPage', e.target.checked)} className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary-light" />
                <label htmlFor="pdf-summary" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">{t('pdf.customize.includeSummary')}</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="pdf-details" checked={settings.showDetailsPage} onChange={e => handleChange('showDetailsPage', e.target.checked)} className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary-light" />
                <label htmlFor="pdf-details" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">{t('pdf.customize.includeDetails')}</label>
              </div>
            </div>
          </fieldset>
        </div>
        <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
          <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-text dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100 font-bold py-2 px-4 rounded-lg transition-colors">{t('calculator.cancel')}</button>
          <button onClick={handleSave} className="bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-lg transition-colors">{t('pdf.customize.saveAndClose')}</button>
        </div>
      </div>
    </div>
  );
};

export default PdfCustomizer;
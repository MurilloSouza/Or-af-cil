import React, { useState } from 'react';
import QuadrosTab from './QuadrosTab';
import FiacaoEletricaTab from './FiacaoEletricaTab';
import EletricaAcabamentoTab from './EletricaAcabamentoTab';
import { CalculatedItem } from '../../types';
import { useLocalization } from '../../LanguageContext';


interface EletricaTabProps {
  onAddToBudget: (items: CalculatedItem[], sector: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

type EletricaSubTab = 'quadros' | 'fiacao' | 'acabamento';

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

const EletricaTab: React.FC<EletricaTabProps> = ({ onAddToBudget, showToast }) => {
    const { t } = useLocalization();
    const [activeSubTab, setActiveSubTab] = useState<EletricaSubTab>('quadros');

    const renderSubContent = () => {
        switch (activeSubTab) {
            case 'quadros':
                return <QuadrosTab onAddToBudget={onAddToBudget} showToast={showToast} />;
            case 'fiacao':
                return <FiacaoEletricaTab onAddToBudget={onAddToBudget} showToast={showToast} />;
            case 'acabamento':
                return <EletricaAcabamentoTab onAddToBudget={onAddToBudget} showToast={showToast} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 pb-4">
                <SubTabButton label={t('calculator.electrical.panels')} isActive={activeSubTab === 'quadros'} onClick={() => setActiveSubTab('quadros')} />
                <SubTabButton label={t('calculator.electrical.wiring')} isActive={activeSubTab === 'fiacao'} onClick={() => setActiveSubTab('fiacao')} />
                <SubTabButton label={t('calculator.electrical.finishing')} isActive={activeSubTab === 'acabamento'} onClick={() => setActiveSubTab('acabamento')} />
            </div>
            <div className="pt-2">
                {renderSubContent()}
            </div>
        </div>
    );
};

export default EletricaTab;
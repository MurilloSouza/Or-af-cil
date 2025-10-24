import React, { useRef } from 'react';
import { PricingItem } from '../../types';
import { useLocalization } from '../../LanguageContext';

declare var XLSX: any;

interface PricingTabProps {
  data: PricingItem[];
  setData: React.Dispatch<React.SetStateAction<PricingItem[]>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100";

const PricingTab: React.FC<PricingTabProps> = ({ data, setData, showToast }) => {
    const { t } = useLocalization();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpdate = (id: string, field: keyof Omit<PricingItem, 'id'>, value: string | number) => {
        setData(currentData =>
            currentData.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleDelete = (id: string) => {
        setData(currentData => currentData.filter(item => item.id !== id));
    };

    const handleAddItem = () => {
        const newItem: PricingItem = {
            id: `manual-${Date.now()}`,
            description: '',
            unitPrice: 0
        };
        setData(currentData => [newItem, ...currentData]);
    };
    
    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (typeof XLSX === 'undefined') {
            showToast("Import functionality is unavailable. Check your internet connection.", "error");
            if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const fileData = e.target?.result;
                const workbook = XLSX.read(fileData, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                const newPricingData: PricingItem[] = json.map((row, index) => {
                    const keys = Object.keys(row);
                    const descKey = keys.find(k => k.toLowerCase().includes('desc') || k.toLowerCase().includes('item') || k.toLowerCase().includes('produto')) || keys[0];
                    const priceKey = keys.find(k => k.toLowerCase().includes('preço') || k.toLowerCase().includes('price') || k.toLowerCase().includes('valor')) || keys[1];
                    
                    const description = String(row[descKey] || '').trim();
                    const unitPrice = parseFloat(String(row[priceKey] || '0').replace(',', '.'));

                    if(description && !isNaN(unitPrice)) {
                        return { id: `import-${Date.now()}-${index}`, description, unitPrice };
                    }
                    return null;
                }).filter((item): item is PricingItem => item !== null);

                if (newPricingData.length === 0) {
                    showToast("No valid items found in the spreadsheet. Check the column names (e.g., 'Description', 'Price').", 'error');
                    return;
                }
                
                setData(currentData => {
                    const existingDescriptions = new Set(currentData.map(item => item.description.toLowerCase()));
                    const uniqueNewItems = newPricingData.filter(newItem => !existingDescriptions.has(newItem.description.toLowerCase()));
                    return [...currentData, ...uniqueNewItems];
                });

                showToast(`${newPricingData.length} items imported! Duplicate items were ignored.`, 'success');

            } catch (error) {
                console.error("Error importing file:", error);
                showToast("Failed to import file. Check if the format is correct.", "error");
            } finally {
                if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleExport = () => {
        if (typeof XLSX === 'undefined') {
            showToast("Export functionality is unavailable. Check your internet connection.", "error");
            return;
        }
        if (data.length === 0) {
            showToast("There is no data to export.", "error");
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(data.map(({id, ...rest}) => rest));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Pricing Base');
        XLSX.writeFile(workbook, 'pricing_base.xlsx');
    };

    return (
        <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text dark:text-gray-100">{t('pricing.title')}</h2>
                <p className="text-subtle dark:text-gray-400 mt-2">
                    {t('pricing.description')}
                </p>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
                <button onClick={handleAddItem} className="bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    {t('pricing.addItem')}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" style={{ display: 'none' }} />
                <button onClick={() => fileInputRef.current?.click()} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    {t('pricing.import')}
                </button>
                <button onClick={handleExport} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    {t('pricing.export')}
                </button>
            </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-sm font-semibold text-text dark:text-gray-200 uppercase tracking-wider">{t('pricing.table.description')}</th>
                            <th className="px-4 py-3 text-sm font-semibold text-text dark:text-gray-200 uppercase tracking-wider w-48">{t('pricing.table.unitPrice')}</th>
                            <th className="px-4 py-3 text-sm font-semibold text-text dark:text-gray-200 uppercase tracking-wider w-24 text-center">{t('budget.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {data.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-2">
                                    <input type="text" value={item.description} onChange={(e) => handleUpdate(item.id, 'description', e.target.value)} className={inputClasses}/>
                                </td>
                                <td className="px-4 py-2">
                                     <input type="number" value={item.unitPrice} onChange={(e) => handleUpdate(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className={`${inputClasses} text-right`}/>
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr><td colSpan={3} className="text-center py-10 text-subtle dark:text-gray-400">{t('pricing.table.noItems')}</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
    );
};

export default PricingTab;
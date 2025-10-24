import React, { useMemo, useState } from 'react';
import { BudgetItem, SavedBudget, PdfSettings } from '../../types';
import PdfCustomizer from '../PdfCustomizer';
import { useLocalization } from '../../LanguageContext';
import { useSubscription } from '../../SubscriptionContext';

declare var XLSX: any;

interface BudgetsTabProps {
  items: BudgetItem[];
  markupPercentage: number;
  onUpdateItem: (id: number, field: keyof Omit<BudgetItem, 'id'>, value: string | number) => void;
  onDeleteItem: (id: number) => void;
  onAutoPrice: () => void;
  budgetTitle: string;
  roundUpQuantity: boolean;
  showToast: (message: string, type?: 'success' | 'error') => void;
  savedBudgets: SavedBudget[];
  activeBudgetId: string | null;
  onLoadBudget: (id: string) => void;
  onSaveOrUpdate: () => void;
  onDeleteBudget: (id: string) => void;
  onNewBudget: () => void;
  pdfSettings: PdfSettings;
  setPdfSettings: React.Dispatch<React.SetStateAction<PdfSettings>>;
}

const BudgetsTab: React.FC<BudgetsTabProps> = ({
  items,
  markupPercentage,
  onUpdateItem,
  onDeleteItem,
  onAutoPrice,
  budgetTitle,
  roundUpQuantity,
  showToast,
  savedBudgets,
  activeBudgetId,
  onLoadBudget,
  onSaveOrUpdate,
  onDeleteBudget,
  onNewBudget,
  pdfSettings,
  setPdfSettings,
}) => {
  const { t, formatCurrency } = useLocalization();
  const { plan, planDetails } = useSubscription();
  const [isPdfCustomizerOpen, setPdfCustomizerOpen] = useState(false);

  const { totalCost, totalWithMarkup, sectorSubtotals } = useMemo(() => {
    const MARKUP_FACTOR = 1 + markupPercentage / 100;
    const getFinalQuantity = (quantity: number) => roundUpQuantity ? Math.ceil(quantity) : quantity;
    
    const sectorSubtotals: Record<string, { cost: number, final: number }> = {};
    
    let totalCost = 0;
    let totalWithMarkup = 0;

    items.forEach(item => {
      const finalQuantity = getFinalQuantity(item.quantity);
      const itemCost = finalQuantity * item.unitPrice;
      const itemFinal = itemCost * MARKUP_FACTOR;
      
      totalCost += itemCost;
      totalWithMarkup += itemFinal;
      
      const sector = item.sector || t('budget.table.noSector', {defaultValue: 'Uncategorized'});
      if (!sectorSubtotals[sector]) {
        sectorSubtotals[sector] = { cost: 0, final: 0 };
      }
      sectorSubtotals[sector].cost += itemCost;
      sectorSubtotals[sector].final += itemFinal;
    });

    return { totalCost, totalWithMarkup, sectorSubtotals };
  }, [items, markupPercentage, roundUpQuantity, t]);

  const handleExportPdf = () => {
    // Robust check for jsPDF and autoTable plugin
    const jspdfGlobal = (window as any).jspdf;
    if (typeof jspdfGlobal === 'undefined' || typeof jspdfGlobal.jsPDF !== 'function') {
      showToast("PDF functionality is unavailable. Check your internet connection.", "error");
      return;
    }

    if (items.length === 0) {
      showToast("Empty budget. Add items to export.", "error");
      return;
    }
    
    const { jsPDF } = jspdfGlobal;
    const doc = new jsPDF();
    
    // Check if the autoTable plugin is attached to the instance
    if (typeof (doc as any).autoTable !== 'function') {
        showToast("PDF functionality is unavailable (autoTable plugin). Check your connection.", "error");
        return;
    }
    
    const { primaryColor, title, showSummaryPage, showDetailsPage, customHeaderText, customFooterText, font } = pdfSettings;

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let y = 15;

    // Header
    const drawHeader = () => {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont(font);
      doc.text(customHeaderText, 15, y);
      y += 5;
    };

    // Footer
    const drawFooter = () => {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(customFooterText, 15, pageHeight - 10);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - 25, pageHeight - 10);
        }
    };

    // Summary Page
    if (showSummaryPage) {
        drawHeader();
        y += 5;
        doc.setFontSize(18);
        doc.setFont(font, 'bold');
        doc.setTextColor(primaryColor);
        doc.text(title, pageWidth / 2, y, { align: 'center' });
        y += 5;
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text(budgetTitle, pageWidth / 2, y, { align: 'center' });
        y += 15;

        doc.setFontSize(12);
        doc.setFont(font, 'bold');
        doc.text('Summary by Sector', 15, y);
        y += 7;

        let summaryTableFinalY = y;
        (doc as any).autoTable({
            startY: y,
            head: [['Sector', 'Total Cost', 'Final Value (w/ Markup)']],
            body: Object.entries(sectorSubtotals).map(([sector, totals]) => [
                sector,
                formatCurrency((totals as any).cost),
                formatCurrency((totals as any).final)
            ]),
            theme: 'grid',
            headStyles: { fillColor: primaryColor },
            didDrawPage: (data: any) => {
              summaryTableFinalY = data.cursor.y;
            }
        });

        y = summaryTableFinalY + 15;
        doc.setFontSize(14);
        doc.setFont(font, 'bold');
        doc.text('Overall Summary', 15, y);
        y += 10;
        doc.setFontSize(12);
        doc.setFont(font, 'normal');
        doc.text(`Total Item Cost: ${formatCurrency(totalCost)}`, 15, y);
        y += 7;
        doc.text(`Markup Percentage: ${markupPercentage}%`, 15, y);
        y += 10;
        doc.setFontSize(14);
        doc.setFont(font, 'bold');
        doc.text(`Final Budget Value: ${formatCurrency(totalWithMarkup)}`, 15, y);
    }

    // Details Pages
    if (showDetailsPage) {
        Object.entries(sectorSubtotals).forEach(([sector, totals], index) => {
            if (index > 0 || showSummaryPage) {
                doc.addPage();
            }
            y = 15;
            drawHeader();
            y += 5;
            doc.setFontSize(16);
            doc.setFont(font, 'bold');
            doc.setTextColor(primaryColor);
            doc.text(`Details: ${sector}`, 15, y);
            y += 10;

            const sectorItems = items.filter(item => (item.sector || t('budget.table.noSector', {defaultValue: 'Uncategorized'})) === sector);
            const getFinalQuantity = (quantity: number) => roundUpQuantity ? Math.ceil(quantity) : quantity;
            const MARKUP_FACTOR = 1 + markupPercentage / 100;
            
            let detailTableFinalY = y;
            (doc as any).autoTable({
                startY: y,
                head: [['Description', 'Qty.', 'Unit Price (Cost)', 'Unit Price (Final)', 'Subtotal (Final)']],
                body: sectorItems.map(item => [
                    item.description,
                    getFinalQuantity(item.quantity).toFixed(2),
                    formatCurrency(item.unitPrice),
                    formatCurrency(item.unitPrice * MARKUP_FACTOR),
                    formatCurrency(getFinalQuantity(item.quantity) * item.unitPrice * MARKUP_FACTOR),
                ]),
                theme: 'striped',
                headStyles: { fillColor: primaryColor },
                didDrawPage: (data: any) => {
                  detailTableFinalY = data.cursor.y;
                }
            });
            
            doc.setFontSize(10);
            doc.setFont(font, 'bold');
            doc.text(`Subtotal (Cost): ${formatCurrency((totals as any).cost)}`, 15, detailTableFinalY + 10);
            doc.text(`Subtotal (Final): ${formatCurrency((totals as any).final)}`, 15, detailTableFinalY + 15);
        });
    }

    drawFooter();
    doc.save(`${budgetTitle.replace(/ /g, '_')}.pdf`);
  };

  const handleExportXlsx = () => {
    if (typeof XLSX === 'undefined') {
      showToast("Excel functionality is unavailable. Check your internet connection.", "error");
      return;
    }

    if (items.length === 0) {
      showToast("Empty budget. Add items to export.", "error");
      return;
    }

    const MARKUP_FACTOR = 1 + markupPercentage / 100;
    const getFinalQuantity = (quantity: number) => roundUpQuantity ? Math.ceil(quantity) : quantity;

    const dataForExport = items.map(item => {
      const finalQuantity = getFinalQuantity(item.quantity);
      const unitPrice = item.unitPrice;
      const finalUnitPrice = unitPrice * MARKUP_FACTOR;
      const finalSubtotal = finalQuantity * finalUnitPrice;

      return {
        'Description': item.description,
        'Sector': item.sector || 'N/A',
        'Quantity': finalQuantity,
        'Unit Price (Cost)': unitPrice,
        'Unit Price (Final)': finalUnitPrice,
        'Subtotal (Final)': finalSubtotal,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget');
    
    const columnWidths = [
      { wch: 50 }, // Description
      { wch: 20 }, // Sector
      { wch: 15 }, // Quantity
      { wch: 25 }, // Unit Price (Cost)
      { wch: 25 }, // Unit Price (Final)
      { wch: 25 }, // Subtotal (Final)
    ];
    worksheet['!cols'] = columnWidths;

    const fileName = `${budgetTitle.replace(/ /g, '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showToast("Budget exported to Excel successfully!", "success");
  };
  
  const handleCustomizePdfClick = () => {
    if (!planDetails.features.customizePdf) {
        showToast(t('subscription.upgradeRequired.message', { plan: plan }), 'error');
        return;
    }
    setPdfCustomizerOpen(true);
  }

  const inputClasses = "w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100";
  
  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
        {/* Main Content */}
        <div className="flex-grow lg:w-3/4">
            <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-sm font-semibold text-text dark:text-gray-200 uppercase tracking-wider">{t('budget.table.description')}</th>
                                <th className="px-4 py-3 text-sm font-semibold text-text dark:text-gray-200 uppercase tracking-wider w-32">{t('budget.table.sector')}</th>
                                <th className="px-4 py-3 text-sm font-semibold text-text dark:text-gray-200 uppercase tracking-wider w-24 text-right">{t('budget.table.quantity')}</th>
                                <th className="px-4 py-3 text-sm font-semibold text-text dark:text-gray-200 uppercase tracking-wider w-36 text-right">{t('budget.table.unitCost')}</th>
                                <th className="px-4 py-3 text-sm font-semibold text-text dark:text-gray-200 uppercase tracking-wider w-36 text-right">{t('budget.table.unitFinal')}</th>
                                <th className="px-4 py-3 text-sm font-semibold text-text dark:text-gray-200 uppercase tracking-wider w-36 text-right">{t('budget.table.subtotal')}</th>
                                <th className="px-4 py-3 text-sm font-semibold text-text dark:text-gray-200 uppercase tracking-wider w-20 text-center">{t('budget.table.actions')}</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {items.map(item => {
                                const finalUnitPrice = item.unitPrice * (1 + markupPercentage / 100);
                                const finalSubtotal = item.quantity * finalUnitPrice;
                                return (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-2"><input type="text" value={item.description} onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)} className={inputClasses} /></td>
                                    <td className="px-4 py-2"><input type="text" value={item.sector} onChange={(e) => onUpdateItem(item.id, 'sector', e.target.value)} className={inputClasses} /></td>
                                    <td className="px-4 py-2"><input type="number" value={item.quantity} onChange={(e) => onUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className={`${inputClasses} text-right`} /></td>
                                    <td className="px-4 py-2"><input type="number" value={item.unitPrice} onChange={(e) => onUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className={`${inputClasses} text-right`} /></td>
                                    <td className="px-4 py-2 text-right font-medium text-text dark:text-gray-200">{formatCurrency(finalUnitPrice)}</td>
                                    <td className="px-4 py-2 text-right font-medium text-text dark:text-gray-200">{formatCurrency(finalSubtotal)}</td>
                                    <td className="px-4 py-2 text-center"><button onClick={() => onDeleteItem(item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button></td>
                                </tr>
                                );
                            })}
                            {items.length === 0 && (<tr><td colSpan={7} className="text-center py-10 text-subtle dark:text-gray-400">{t('budget.table.noItems')}</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-1/4 space-y-6">
            {/* Totals */}
            <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-3">
                 <h3 className="text-lg font-bold text-text dark:text-gray-100 border-b dark:border-gray-700 pb-2">{t('budget.summary.title')}</h3>
                 <div className="flex justify-between items-center text-sm"><span className="text-subtle dark:text-gray-400">{t('budget.summary.totalCost')}</span><span className="font-semibold text-text dark:text-gray-200">{formatCurrency(totalCost)}</span></div>
                 <div className="flex justify-between items-center text-sm"><span className="text-subtle dark:text-gray-400">{t('budget.summary.markup', { markupPercentage })}</span><span className="font-semibold text-text dark:text-gray-200">{formatCurrency(totalWithMarkup - totalCost)}</span></div>
                 <div className="pt-2 border-t dark:border-gray-700 flex justify-between items-center text-lg"><span className="font-bold text-text dark:text-gray-100">{t('budget.summary.finalValue')}</span><span className="font-extrabold text-primary-dark dark:text-primary-light">{formatCurrency(totalWithMarkup)}</span></div>
            </div>
            {/* Actions */}
            <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-3">
                 <h3 className="text-lg font-bold text-text dark:text-gray-100 border-b dark:border-gray-700 pb-2">{t('budget.actions.title')}</h3>
                 <button onClick={onAutoPrice} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!planDetails.features.pricing} title={!planDetails.features.pricing ? t('subscription.upgradeRequired.message', { plan: plan }) : ''}>{t('budget.actions.autoPrice')}</button>
                 <button onClick={handleCustomizePdfClick} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!planDetails.features.customizePdf} title={!planDetails.features.customizePdf ? t('subscription.upgradeRequired.message', { plan: plan }) : ''}>{t('budget.actions.customizePdf')}</button>
                 <button onClick={handleExportPdf} className="w-full bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-lg transition-colors">{t('budget.actions.exportPdf')}</button>
                 <button onClick={handleExportXlsx} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">{t('budget.actions.exportXlsx')}</button>
            </div>
            {/* Budgets */}
             <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-md p-4">
                 <h3 className="text-lg font-bold text-text dark:text-gray-100 border-b dark:border-gray-700 pb-2 mb-3">{t('budget.myBudgets.title')}</h3>
                 <div className="space-y-2 max-h-48 overflow-y-auto">
                     {savedBudgets.map(b => (
                         <div key={b.id} className={`p-2 rounded-md flex justify-between items-center ${activeBudgetId === b.id ? 'bg-primary-light/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                            <span className="text-sm font-medium text-text dark:text-gray-200 truncate pr-2">{b.name}</span>
                            <div className="flex-shrink-0 flex gap-1">
                                <button onClick={() => onLoadBudget(b.id)} className="text-green-600 hover:text-green-800" title={t('budget.myBudgets.load')}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg></button>
                                <button onClick={() => onDeleteBudget(b.id)} className="text-red-500 hover:text-red-700" title={t('budget.myBudgets.delete')}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                            </div>
                         </div>
                     ))}
                 </div>
                 <div className="mt-4 flex gap-2">
                     <button onClick={onNewBudget} className="flex-1 bg-gray-200 hover:bg-gray-300 text-text dark:bg-gray-600 dark:hover:bg-gray-500 font-bold py-2 px-4 rounded-lg transition-colors text-sm">{t('budget.myBudgets.new')}</button>
                     <button onClick={onSaveOrUpdate} className="flex-1 bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">{t('budget.myBudgets.save')}</button>
                 </div>
            </div>
        </div>
        <PdfCustomizer 
            isOpen={isPdfCustomizerOpen}
            onClose={() => setPdfCustomizerOpen(false)}
            initialSettings={pdfSettings}
            onSave={(newSettings) => {
                setPdfSettings(newSettings);
                showToast('PDF settings saved!', 'success');
            }}
        />
    </div>
  );
};

export default BudgetsTab;
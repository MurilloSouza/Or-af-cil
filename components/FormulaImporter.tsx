import React, { useState, useEffect, useMemo } from 'react';
import { ImportCandidate, CalculationGroup, FormulaItem } from '../types';
import { useLocalization } from '../LanguageContext';


type FormulaDiff = {
  formula: FormulaItem;
  status: 'new' | 'updated';
};

type GroupDiff = {
  group: CalculationGroup;
  status: 'new' | 'updated';
  formulaDiffs: FormulaDiff[];
};

interface FormulaImporterProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: ImportCandidate[];
  onConfirm: (selection: Record<string, Record<string, boolean>>) => void;
  existingGroups: CalculationGroup[];
}

const FormulaImporter: React.FC<FormulaImporterProps> = ({ isOpen, onClose, candidates, onConfirm, existingGroups }) => {
  const { t } = useLocalization();
  const [selection, setSelection] = useState<Record<string, Record<string, boolean>>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const diffedCandidates = useMemo((): GroupDiff[] => {
    if (!isOpen) return [];
    
    const existingGroupsMap = new Map(existingGroups.map(g => [g.name.toLowerCase().trim(), g]));

    return candidates.map(candidate => {
      const existingGroup = existingGroupsMap.get(candidate.group.name.toLowerCase().trim());
      // FIX: The type of `existingGroup` could be `unknown` if data is malformed. This check ensures `formulas` is a safe-to-access array.
      const existingFormulasMap = new Map(((existingGroup as CalculationGroup)?.formulas ?? []).map(f => [f.name, f]));

      const formulaDiffs = candidate.group.formulas.map(importedFormula => {
        const existingFormula = existingFormulasMap.get(importedFormula.name);
        let status: 'new' | 'updated' | 'unchanged' = 'unchanged';

        if (!existingFormula) {
          status = 'new';
        } else if (JSON.stringify(importedFormula) !== JSON.stringify(existingFormula)) {
          status = 'updated';
        }
        
        return { formula: importedFormula, status };
      }).filter((diff): diff is FormulaDiff => diff.status !== 'unchanged');

      return { ...candidate, formulaDiffs };
    }).filter(c => c.formulaDiffs.length > 0 || c.status === 'new');
  }, [isOpen, candidates, existingGroups]);

  useEffect(() => {
    if (isOpen) {
      const initialSelection: Record<string, Record<string, boolean>> = {};
      diffedCandidates.forEach(candidate => {
        initialSelection[candidate.group.id] = {};
        candidate.formulaDiffs.forEach(diff => {
          initialSelection[candidate.group.id][diff.formula.id] = true;
        });
      });
      setSelection(initialSelection);
      setExpandedGroups(new Set(diffedCandidates.map(c => c.group.id)));
    }
  }, [isOpen, diffedCandidates]);

  if (!isOpen) return null;

  const handleToggleFormula = (groupId: string, formulaId: string) => {
    setSelection(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [formulaId]: !prev[groupId]?.[formulaId]
      }
    }));
  };

  const handleToggleGroup = (groupId: string, select: boolean) => {
    const groupDiff = diffedCandidates.find(c => c.group.id === groupId);
    if (!groupDiff) return;

    setSelection(prev => {
        const newGroupSelection: Record<string, boolean> = {};
        groupDiff.formulaDiffs.forEach(diff => {
            newGroupSelection[diff.formula.id] = select;
        });
        return { ...prev, [groupId]: newGroupSelection };
    });
  };
  
  const handleConfirm = () => {
    onConfirm(selection);
  };
  
  const handleSelectAll = (select: boolean) => {
    const newSelection: Record<string, Record<string, boolean>> = {};
    diffedCandidates.forEach(candidate => {
      newSelection[candidate.group.id] = {};
      candidate.formulaDiffs.forEach(diff => {
        newSelection[candidate.group.id][diff.formula.id] = select;
      });
    });
    setSelection(newSelection);
  }

  const getStatusBadge = (status: 'new' | 'updated') => {
    if (status === 'new') {
      return <span className="text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">{t('import.status.new')}</span>;
    }
    return <span className="text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-0.5 rounded-full">{t('import.status.updated')}</span>;
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-text dark:text-gray-100">{t('import.title')}</h2>
          <p className="text-sm text-subtle dark:text-gray-400 mt-1">
            {t('import.description')}
          </p>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
            <div className="flex gap-4">
                <button onClick={() => handleSelectAll(true)} className="text-sm text-primary-dark dark:text-primary-light hover:underline">{t('import.selectAll')}</button>
                <button onClick={() => handleSelectAll(false)} className="text-sm text-primary-dark dark:text-primary-light hover:underline">{t('import.deselectAll')}</button>
            </div>
            {diffedCandidates.length === 0 ? (
                 <p className="text-center text-subtle dark:text-gray-400 py-8">{t('import.noChanges')}</p>
            ) : (
                diffedCandidates.map(({ group, status, formulaDiffs }) => {
                    const isGroupSelected = formulaDiffs.every(diff => selection[group.id]?.[diff.formula.id]);
                    return (
                        <details key={group.id} className="border dark:border-gray-700 rounded-md" open={expandedGroups.has(group.id)} onToggle={e => setExpandedGroups(prev => { const newSet = new Set(prev); (e.target as HTMLDetailsElement).open ? newSet.add(group.id) : newSet.delete(group.id); return newSet; })}>
                            <summary className="cursor-pointer p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 list-none">
                                <input
                                    type="checkbox"
                                    checked={isGroupSelected}
                                    onChange={(e) => handleToggleGroup(group.id, e.target.checked)}
                                    onClick={e => e.stopPropagation()}
                                    className="h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary-light"
                                />
                                <span className="font-semibold text-lg text-text dark:text-gray-200">{group.name}</span>
                                {getStatusBadge(status)}
                            </summary>
                            <div className="p-3 border-t dark:border-gray-600 bg-gray-50/50 dark:bg-gray-900/30">
                                <div className="space-y-2">
                                    {formulaDiffs.map(({ formula, status: formulaStatus }) => (
                                         <div key={formula.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-white dark:hover:bg-gray-700">
                                             <input
                                                type="checkbox"
                                                id={`import-${formula.id}`}
                                                checked={!!selection[group.id]?.[formula.id]}
                                                onChange={() => handleToggleFormula(group.id, formula.id)}
                                                className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary-light"
                                            />
                                            <label htmlFor={`import-${formula.id}`} className="flex-grow font-medium text-sm text-gray-800 dark:text-gray-200">
                                                {formula.name}
                                                <span className="text-xs text-subtle dark:text-gray-400 ml-2 block sm:inline">({formula.value})</span>
                                            </label>
                                            {getStatusBadge(formulaStatus)}
                                         </div>
                                    ))}
                                </div>
                            </div>
                        </details>
                    );
                })
            )}
        </div>
        <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
          <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-text dark:bg-gray-600 dark:hover:bg-gray-500 font-bold py-2 px-4 rounded-lg">{t('calculator.cancel')}</button>
          <button onClick={handleConfirm} className="bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed">{t('import.importSelected')}</button>
        </div>
      </div>
    </div>
  );
};

export default FormulaImporter;
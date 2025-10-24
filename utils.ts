import { CalculationGroup, CalculoInputState, CalculatedItem, FormulaVariable } from './types';

// This function was moved from CalculoTab.tsx to be shared
const evaluateFormula = (formulaValue: string, variableValues: { [key:string]: number }, resolvedValues: { [key:string]: number }): number => {
    try {
      if (!formulaValue?.trim()) return 0;

      // Melhora a compatibilidade da fórmula, permitindo o uso de chaves {} para agrupamento, similar a parênteses ().
      const sanitizedFormula = formulaValue.replace(/\{/g, '(').replace(/\}/g, ')');

      let expression = sanitizedFormula.replace(/\[([^\]]+)\]/g, (_, code) => {
        const val = resolvedValues[code] ?? variableValues[code] ?? 0;
        return String(Number(val));
      });

      expression = expression.trim();
      if (expression === '') return 0;

      // Adiciona validações para evitar a avaliação de expressões incompletas ou inválidas que ocorrem durante a digitação,
      // prevenindo erros de sintaxe no console.
      if (
        /[\+\-\*\/]$/.test(expression) || // Termina com operador
        (expression.match(/\(/g) || []).length !== (expression.match(/\)/g) || []).length || // Parênteses desbalanceados
        /^[\*\/]/.test(expression) || // Começa com * ou /
        /[\+\-\*\/]{2,}/.test(expression) // Operadores duplicados
      ) {
          return NaN;
      }
      
      // Usar o construtor de Função para avaliar a expressão de forma segura, com acesso às funções de Math.
      // Isso garante que a ordem das operações (PEMDAS) seja respeitada.
      return new Function('Math', `return ${expression}`)(Math);
    } catch (e) {
      // Este catch serve como uma segurança final. As validações acima devem prevenir a maioria dos erros.
      // O console.error é removido para não poluir o console do usuário.
      return NaN;
    }
};

export const runCalculationEngine = (group: CalculationGroup, inputs: CalculoInputState): CalculatedItem[] => {
    if (!group) return [];
    
    // 1. Create variableValues from inputs
    const variableValues: { [key: string]: number } = {};
    group.variables.forEach(v => {
        if (!v.isFormulaResult) variableValues[v.code] = Number(inputs[v.code]) || 0;
    });

    // 2. Resolve formulas into resolvedValues
    const resolvedValues: { [key: string]: number } = {};
    const formulasToResolve = [...group.formulas];
    let iterations = 0;
    const maxIterations = group.formulas.length + 5;
    while (formulasToResolve.length > 0 && iterations < maxIterations) {
        const remainingFormulas: any[] = [];
        let resolvedInThisPass = false;
        for (const formula of formulasToResolve) {
            const formulaVar = group.variables.find(v => v.formulaId === formula.id);
            if (!formulaVar) continue;
            const result = evaluateFormula(formula.value, variableValues, resolvedValues);
            if (!isNaN(result)) {
                resolvedValues[formulaVar.code] = result;
                resolvedInThisPass = true;
            } else {
                remainingFormulas.push(formula);
            }
        }
        if (!resolvedInThisPass && remainingFormulas.length > 0) {
            remainingFormulas.forEach(f => {
                const formulaVar = group.variables.find(v => v.formulaId === f.id);
                if (formulaVar) resolvedValues[formulaVar.code] = NaN;
            });
            break;
        }
        formulasToResolve.splice(0, formulasToResolve.length, ...remainingFormulas);
        iterations++;
    }

    // 3. Create formulaItems (calculated results)
    const formulaItems: CalculatedItem[] = group.formulas.map(formula => {
      const formulaVar = group.variables.find(v => v.formulaId === formula.id);
      const quantity = formulaVar ? resolvedValues[formulaVar.code] : NaN;
      let itemName = formula.name;

      // Handle multiple info dependencies for formula results
      if (formulaVar?.infoDependencies && formulaVar.infoDependencies.length > 0) {
        const infoValues = formulaVar.infoDependencies
            .map(depCode => inputs[depCode])
            .filter(Boolean) // Remove empty/null values
            .join(' ');
        if (infoValues) itemName = `${itemName} ${infoValues}`;
      }
      
      return { nome: itemName, quantidade: isNaN(quantity) ? 0 : Math.max(0, quantity), grandeza: formula.unit };
    }).filter(r => Number(r.quantidade) > 0);

    // 4. Create parameterItems (direct inputs)
    const parameterItems: CalculatedItem[] = [];
    const inputParameters = group.variables.filter(v => !v.isFormulaResult && !v.isInfo);
    inputParameters.forEach((param) => {
      const quantity = Number(inputs[param.code]);
      if (!isNaN(quantity) && quantity > 0) {
         let itemName = param.description;
         
         // Handle multiple info dependencies for parameters
         if (param.infoDependencies && param.infoDependencies.length > 0) {
             const infoValues = param.infoDependencies
                .map(depCode => inputs[depCode])
                .filter(Boolean)
                .join(' ');
             if (infoValues) itemName = `${itemName} ${infoValues}`;
         }
         
         const unit = (param as any).unit || 'un'; // Assume 'un' if not specified

         const spec1 = inputs[param.code + '_SPEC1'];
         const spec2 = inputs[param.code + '_SPEC2'];
         const specs = [spec1, spec2].filter(s => s && String(s).trim() !== '').join('; ');
         if (specs) itemName += ` (${specs})`;

        parameterItems.push({ nome: itemName, quantidade: quantity, grandeza: unit });
      }
    });

    // 5. Return combined list
    return [...parameterItems, ...formulaItems];
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to read blob as Base64."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
};
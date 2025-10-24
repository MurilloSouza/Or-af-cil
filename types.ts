// FIX: Removed self-import of 'Tab' which caused a name conflict and circular dependency.
export enum Tab {
  Dashboard = 'DASHBOARD',
  Budget = 'BUDGET',
  Calculo = 'CALCULO',
  Precificacao = 'PRECIFICACAO',
  Subscriptions = 'SUBSCRIPTIONS',
  Settings = 'SETTINGS',
}

export type SubscriptionPlan = 'free' | 'basic' | 'basic-plus' | 'premium' | 'lifetime';
export type BillingCycle = 'monthly' | 'annual';

export interface BudgetItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  sector: string;
}

export interface PricingItem {
  id: string;
  description: string;
  unitPrice: number;
}

export interface SavedBudget {
  id: string;
  name: string;
  budgetItems: BudgetItem[];
  markupPercentage: number;
  roundUpQuantity: boolean;
}


export interface CalculatedItem {
  nome: string;
  quantidade: number | string;
  grandeza: string;
}

export interface CalculoInputState {
  [key:string]: number | string;
}

export interface FormulaItem {
  id: string;
  name: string;
  value: string;
  unit: string;
}

export interface FormulaVariable {
  id:string;
  code: string;
  description: string;
  isFormulaResult?: boolean;
  formulaId?: string;
  isInfo?: boolean;
  infoDependencies?: string[]; // Array de códigos de variáveis de info
  // FIX: Add optional 'unit' property to allow specifying units for input variables.
  unit?: string;
}

export interface CalculationGroup {
  id:string;
  name: string;
  variables: FormulaVariable[];
  formulas: FormulaItem[];
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  file?: {
    name: string;
    type: string;
  };
}

export interface AiCalcItem {
  groupName: string;
  variables: { code: string; value: number }[];
}

export interface AiBudgetItem {
  description: string;
  quantity: number;
  sector: string;
}

export interface AiParsedResponse {
  calculate?: AiCalcItem[];
  budget?: AiBudgetItem[];
  answer?: string;
}

export interface PdfSettings {
  primaryColor: string;
  title: string;
  showSummaryPage: boolean;
  showDetailsPage: boolean;
  customHeaderText: string;
  customFooterText: string;
  font: 'helvetica' | 'times' | 'courier';
}

export interface ImportCandidate {
  group: CalculationGroup;
  status: 'new' | 'updated';
}

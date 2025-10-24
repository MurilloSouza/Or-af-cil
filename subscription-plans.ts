// =================================================================================
// The checkout is now handled by Stripe.
// You MUST create products and prices in your Stripe dashboard and replace
// the placeholder `price_...` IDs below with your actual Stripe Price IDs.
// =================================================================================

import { SubscriptionPlan } from './types';

export interface PlanDetails {
  name: string;
  prices?: {
    monthly: number;
    annual: number;
  };
  price?: number; // For free or one-time
  priceIds?: {
    monthly?: string;
    annual?: string;
    oneTime?: string;
  };
  maxBudgets: number;
  maxItemsPerBudget: number;
  maxGroups: number;
  features: {
    pricing: boolean;
    aiAssistant: boolean;
    importExportFormulas: boolean;
    exportPdfExcel: boolean;
    customizePdf: boolean;
    dashboard: boolean;
    addCustomizeFormulas: boolean;
    addGroups: boolean;
    futureFeatures?: boolean;
  };
}

export const subscriptionPlans: Record<SubscriptionPlan, PlanDetails> = {
  free: {
    name: "Free",
    price: 0,
    maxBudgets: 1,
    maxItemsPerBudget: 10,
    maxGroups: Infinity, // Cannot add new ones, but can use existing
    features: {
      pricing: false,
      aiAssistant: false,
      importExportFormulas: false,
      exportPdfExcel: true,
      customizePdf: false,
      dashboard: true,
      addCustomizeFormulas: false,
      addGroups: false,
    },
  },
  basic: {
    name: "Basic",
    prices: {
        monthly: 4.99,
        annual: 49.99 
    },
    priceIds: {
        monthly: 'price_0KxBDm589O8KAxCGMgG7scjb', // Example ID updated
        annual: 'price_REPLACE_WITH_BASIC_ANNUAL_ID'
    },
    maxBudgets: 5,
    maxItemsPerBudget: 20,
    maxGroups: 5,
    features: {
      pricing: true,
      aiAssistant: false,
      importExportFormulas: false,
      exportPdfExcel: true,
      customizePdf: false,
      dashboard: true,
      addCustomizeFormulas: true,
      addGroups: true,
    },
  },
  'basic-plus': {
    name: "Basic+",
    prices: {
        monthly: 9.99,
        annual: 99.99
    },
    priceIds: {
        monthly: 'price_REPLACE_WITH_BASIC_PLUS_MONTHLY_ID',
        annual: 'price_REPLACE_WITH_BASIC_PLUS_ANNUAL_ID'
    },
    maxBudgets: 25,
    maxItemsPerBudget: 30,
    maxGroups: 10,
    features: {
      pricing: true,
      aiAssistant: false,
      importExportFormulas: true,
      exportPdfExcel: true,
      customizePdf: true,
      dashboard: true,
      addCustomizeFormulas: true,
      addGroups: true,
    },
  },
  premium: {
    name: "Premium",
    prices: {
        monthly: 19.99,
        annual: 199.99
    },
    priceIds: {
        monthly: 'price_REPLACE_WITH_PREMIUM_MONTHLY_ID',
        annual: 'price_REPLACE_WITH_PREMIUM_ANNUAL_ID'
    },
    maxBudgets: Infinity,
    maxItemsPerBudget: Infinity,
    maxGroups: Infinity,
    features: {
      pricing: true,
      aiAssistant: true,
      importExportFormulas: true,
      exportPdfExcel: true,
      customizePdf: true,
      dashboard: true,
      addCustomizeFormulas: true,
      addGroups: true,
      futureFeatures: true,
    },
  },
  lifetime: {
      name: "Lifetime",
      price: 249.99,
      priceIds: {
        oneTime: 'price_REPLACE_WITH_LIFETIME_ID'
      },
      maxBudgets: Infinity,
      maxItemsPerBudget: Infinity,
      maxGroups: Infinity,
      features: {
        pricing: true,
        aiAssistant: true,
        importExportFormulas: true,
        exportPdfExcel: true,
        customizePdf: true,
        dashboard: true,
        addCustomizeFormulas: true,
        addGroups: true,
        futureFeatures: true,
      },
  }
};
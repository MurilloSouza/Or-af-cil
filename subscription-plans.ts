// =================================================================================
// The checkout is now handled by Stripe.
// You MUST create products and prices in your Stripe dashboard and replace
// the placeholder `price_..._REPLACE_ME` IDs below with your actual Stripe Price IDs.
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
    maxItemsPerBudget: 25,
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
  'basic-plus': {
    name: "Basic+",
    prices: {
        monthly: 9.99,
        annual: 78.00
    },
    priceIds: {
        monthly: 'price_BASIC_PLUS_MONTHLY_REPLACE_ME',
        annual: 'price_BASIC_PLUS_ANNUAL_REPLACE_ME'
    },
    maxBudgets: 25,
    maxItemsPerBudget: 100,
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
        annual: 155.00
    },
    priceIds: {
        monthly: 'price_PREMIUM_MONTHLY_REPLACE_ME',
        annual: 'price_PREMIUM_ANNUAL_REPLACE_ME'
    },
    maxBudgets: 100,
    maxItemsPerBudget: 500,
    maxGroups: 50,
    features: {
      pricing: true,
      aiAssistant: true,
      importExportFormulas: true,
      exportPdfExcel: true,
      customizePdf: true,
      dashboard: true,
      addCustomizeFormulas: true,
      addGroups: true,
      futureFeatures: false,
    },
  },
  'premium-plus': {
    name: "Premium+",
    prices: {
        monthly: 27.99,
        annual: 220.00
    },
    priceIds: {
        monthly: 'price_PREMIUM_PLUS_MONTHLY_REPLACE_ME',
        annual: 'price_PREMIUM_PLUS_ANNUAL_REPLACE_ME'
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
      price: 1350.00,
      priceIds: {
        oneTime: 'price_LIFETIME_REPLACE_ME'
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
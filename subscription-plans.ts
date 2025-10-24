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
        monthly: 'https://buy.stripe.com/cNiaEXb4a3zv0Ep7la1gs03',
        annual: 'https://buy.stripe.com/00w14nfkq5HDgDn8pe1gs05'
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
        monthly: 'https://buy.stripe.com/7sY00jegm8TPgDnaxm1gs04',
        annual: 'https://buy.stripe.com/28E3cvfkqda5evfcFu1gs06'
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
        monthly: 'https://buy.stripe.com/00wfZhb4aee91It34U1gs02',
        annual: 'https://buy.stripe.com/bJe14nc8e6LH2MxgVK1gs07'
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
        oneTime: 'https://buy.stripe.com/14AcN57RY9XT72NgVK1gs08'
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
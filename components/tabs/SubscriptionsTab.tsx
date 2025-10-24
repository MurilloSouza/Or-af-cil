import React from 'react';
import { useSubscription } from '../../SubscriptionContext';
import { useLocalization } from '../../LanguageContext';
import { SubscriptionPlan, BillingCycle } from '../../types';
import { subscriptionPlans } from '../../subscription-plans';
import { useAuth } from '../../AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const createStripeCheckoutSession = httpsCallable(functions, 'createStripeCheckoutSession');


const FeatureItem: React.FC<{ available: boolean; text: string }> = ({ available, text }) => (
  <li className={`flex items-start gap-3 ${available ? 'text-text dark:text-gray-200' : 'text-subtle dark:text-gray-400 line-through'}`}>
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 flex-shrink-0 mt-0.5 ${available ? 'text-green-500' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
      {available ? (
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      ) : (
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      )}
    </svg>
    <span>{text}</span>
  </li>
);

const PlanCard: React.FC<{
  planType: SubscriptionPlan;
  billingCycle: BillingCycle;
  isActive: boolean;
  onSelect: () => Promise<void>;
}> = ({ planType, billingCycle, isActive, onSelect }) => {
  const { t, formatCurrency } = useLocalization();
  const { user } = useAuth();
  const cardDetails = subscriptionPlans[planType];
  const [isLoading, setIsLoading] = React.useState(false);

  const getPrice = () => {
    if (planType === 'free' || planType === 'lifetime') {
        return cardDetails.price !== undefined ? formatCurrency(cardDetails.price) : '';
    }
    if (cardDetails.prices) {
        const price = billingCycle === 'annual' ? cardDetails.prices.annual : cardDetails.prices.monthly;
        return formatCurrency(price);
    }
    return '';
  };
  
  const getBillingText = () => {
    if (planType === 'free') return null;
    if (planType === 'lifetime') return t('subscription.lifetime.price');
    return billingCycle === 'annual' ? t('subscription.year') : t('subscription.month');
  }
  
  const handleSelect = async () => {
      setIsLoading(true);
      await onSelect();
      setIsLoading(false);
  }

  const isLifetime = planType === 'lifetime';
  const isPremiumPlus = planType === 'premium-plus';
  const shouldBeDisabled = isActive || !user || isLoading;

  let buttonText = t('subscription.selectPlan');
  if (isActive) buttonText = t('subscription.currentPlan');
  if (!user) buttonText = t('subscription.loginRequired');
  if (isLoading) buttonText = t('toasts.redirectingToCheckout');


  return (
    <div className="relative">
        {planType === 'basic-plus' && (
            <div className="absolute top-0 right-0 -mt-3 mr-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg transform rotate-6">
                {t('subscription.bestValue')}
            </div>
        )}
        {isPremiumPlus && (
            <div className="absolute top-0 right-0 -mt-3 mr-3 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg transform rotate-6">
                {t('subscription.mostComplete')}
            </div>
        )}
        <div className={`border-2 rounded-lg p-6 flex flex-col h-full ${isActive ? 'border-primary shadow-2xl scale-105' : isLifetime ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : isPremiumPlus ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700'} transition-all`}>
            <h3 className={`text-2xl font-bold ${isLifetime ? 'text-yellow-600 dark:text-yellow-300' : isPremiumPlus ? 'text-indigo-600 dark:text-indigo-400' : 'text-primary dark:text-primary-light'}`}>{t(`subscription.plan.${planType}`)}</h3>
            <p className="mt-2 text-4xl font-extrabold text-text dark:text-gray-100">
                {getPrice()}<span className="text-lg font-medium text-subtle dark:text-gray-400 ml-1">{getBillingText()}</span>
            </p>
            <div className="mt-6 space-y-4 flex-grow">
                <div>
                <h4 className="font-semibold text-text dark:text-gray-200">{t('subscription.limits')}</h4>
                <ul className="mt-2 space-y-2 text-sm">
                    <FeatureItem available={true} text={cardDetails.maxBudgets === Infinity ? t('subscription.unlimited') + ' ' + t('subscription.budgets', { count: '' }).trim() : t('subscription.budgets', { count: cardDetails.maxBudgets })} />
                    <FeatureItem available={true} text={cardDetails.maxItemsPerBudget === Infinity ? t('subscription.unlimited') + ' ' + t('subscription.itemsPerBudget', { count: '' }).trim() : t('subscription.itemsPerBudget', { count: cardDetails.maxItemsPerBudget })} />
                </ul>
                </div>
                <div>
                <h4 className="font-semibold text-text dark:text-gray-200 mt-4">{t('subscription.features')}</h4>
                <ul className="mt-2 space-y-2 text-sm">
                    <FeatureItem available={cardDetails.features.pricing} text={t('subscription.feature.pricing')} />
                    <FeatureItem available={cardDetails.features.aiAssistant} text={t('subscription.feature.aiAssistant')} />
                    <FeatureItem available={cardDetails.features.importExportFormulas} text={t('subscription.feature.importExportFormulas')} />
                    <FeatureItem available={cardDetails.features.exportPdfExcel} text={t('subscription.feature.exportPdfExcel')} />
                    <FeatureItem available={cardDetails.features.customizePdf} text={t('subscription.feature.customizePdf')} />
                    <FeatureItem available={cardDetails.features.dashboard} text={t('subscription.feature.dashboard')} />
                    <FeatureItem available={cardDetails.features.addCustomizeFormulas} text={t('subscription.feature.addCustomizeFormulas')} />
                    <FeatureItem available={cardDetails.features.addGroups} text={cardDetails.maxGroups === Infinity ? t('subscription.feature.addGroups') : t('subscription.feature.addGroupsLimited', {count: cardDetails.maxGroups})} />
                    {cardDetails.features.futureFeatures && <FeatureItem available={true} text={t('subscription.feature.future')} />}
                </ul>
                </div>
            </div>
            <button
                onClick={handleSelect}
                disabled={shouldBeDisabled}
                className={`mt-8 w-full py-3 px-4 rounded-lg font-bold transition-colors disabled:cursor-not-allowed
                        ${isActive ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400' : isLifetime ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : isPremiumPlus ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-primary text-white hover:bg-primary-light'}`}
            >
                {buttonText}
            </button>
        </div>
    </div>
  );
};

const SubscriptionsTab: React.FC = () => {
  const { t } = useLocalization();
  const { plan, setPlan, billingCycle, setBillingCycle } = useSubscription();
  const { user } = useAuth();
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toastElement = document.createElement('div');
    toastElement.className = `fixed bottom-5 right-5 px-4 py-2 rounded-md text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} shadow-lg animate-fade-in z-[100]`;
    toastElement.textContent = message;
    document.body.appendChild(toastElement);
    setTimeout(() => {
        toastElement.remove();
    }, 3000);
  };

  const handleSelectPlan = async (newPlan: SubscriptionPlan) => {
    if (plan === newPlan || !user) return;

    if (newPlan === 'free') {
      // Cancellation should be handled via the Stripe Customer Portal, which users can access from the Settings tab.
      // This button is disabled for the active plan, so this case is mostly theoretical for a logged-in user.
      return;
    }

    const cardDetails = subscriptionPlans[newPlan];
    let priceId: string | undefined;

    if (newPlan === 'lifetime') {
        priceId = cardDetails.priceIds?.oneTime;
    } else {
        priceId = billingCycle === 'annual' ? cardDetails.priceIds?.annual : cardDetails.priceIds?.monthly;
    }
    
    if (!priceId || priceId.includes('REPLACE_ME')) {
        showToast(t('toasts.checkoutNotConfigured'), 'error');
        console.error(`Stripe Price ID for ${newPlan} (${billingCycle}) is not configured.`);
        return;
    }

    try {
        const payload = {
            priceId,
            planType: newPlan,
            successUrl: window.location.href + '?success=true',
            cancelUrl: window.location.href + '?cancel=true',
        };
        
        const { data } = await createStripeCheckoutSession(payload) as { data: { sessionId: string } };

        const stripe = (window as any).Stripe(
          // Replace with your actual Stripe Publishable Key.
          'pk_live_YOUR_PUBLISHABLE_KEY_REPLACE_ME'
        );
        
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        showToast((error as Error).message || "An unexpected error occurred.", 'error');
    }
  };

  return (
    <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-text dark:text-gray-100">{t('subscription.title')}</h2>
      </div>
      
      <div className="flex justify-center items-center gap-4">
        <span className={`font-medium ${billingCycle === 'monthly' ? 'text-primary dark:text-primary-light' : 'text-subtle dark:text-gray-400'}`}>{t('subscription.billing.monthly')}</span>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={billingCycle === 'annual'} onChange={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')} className="sr-only peer" />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
        </label>
        <div className="flex items-center">
             <span className={`font-medium ${billingCycle === 'annual' ? 'text-primary dark:text-primary-light' : 'text-subtle dark:text-gray-400'}`}>{t('subscription.billing.annual')}</span>
             <span className="ml-2 text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">{t('subscription.billing.annualDiscount')}</span>
        </div>
      </div>
      
       {!user && (
          <p className="text-center text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 p-3 rounded-md">
            {t('subscription.loginRequired')}
          </p>
        )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 items-stretch">
        <PlanCard planType="free" billingCycle={billingCycle} isActive={plan === 'free'} onSelect={() => handleSelectPlan('free')} />
        <PlanCard planType="basic-plus" billingCycle={billingCycle} isActive={plan === 'basic-plus'} onSelect={() => handleSelectPlan('basic-plus')} />
        <PlanCard planType="premium" billingCycle={billingCycle} isActive={plan === 'premium'} onSelect={() => handleSelectPlan('premium')} />
        <PlanCard planType="premium-plus" billingCycle={billingCycle} isActive={plan === 'premium-plus'} onSelect={() => handleSelectPlan('premium-plus')} />
        <PlanCard planType="lifetime" billingCycle={billingCycle} isActive={plan === 'lifetime'} onSelect={() => handleSelectPlan('lifetime')} />
      </div>
    </div>
  );
};

export default SubscriptionsTab;
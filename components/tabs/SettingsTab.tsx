import React, { useState, useEffect, useRef } from 'react';
import { CalculationGroup } from '../../types';
import { useLocalization } from '../../LanguageContext';
import { languages, Language } from '../../localization';
import { useSubscription } from '../../SubscriptionContext';
import { useAuth } from '../../AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const createStripePortalSession = httpsCallable(functions, 'createStripePortalSession');

interface SettingsTabProps {
  markup: number;
  onMarkupChange: (value: number) => void;
  roundUp: boolean;
  onRoundUpChange: (value: boolean) => void;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  isUsingDefaultApiKey: boolean;
  calculationGroups: CalculationGroup[];
  onInitiateFormulaImport: (fileContent: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 disabled:bg-gray-200 dark:disabled:bg-gray-700/50 disabled:cursor-not-allowed";

const AuthForm: React.FC = () => {
    const { t } = useLocalization();
    const { signUpWithEmail, signInWithEmail } = useAuth();
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (authMode === 'signup') {
            if (password !== confirmPassword) {
                setError(t('settings.account.error.passwordsDoNotMatch'));
                return;
            }
            try {
                await signUpWithEmail(email, password);
            } catch (err: any) {
                setError(err.message);
            }
        } else {
            try {
                await signInWithEmail(email, password);
            } catch (err: any) {
                setError(err.message);
            }
        }
    };
    
    const isLogin = authMode === 'login';

    return (
        <div className="max-w-md mx-auto">
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                <button 
                    onClick={() => { setAuthMode('login'); setError(null); }} 
                    className={`flex-1 py-2 text-sm font-medium focus:outline-none ${isLogin ? 'text-primary border-b-2 border-primary' : 'text-subtle hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    {t('settings.account.login')}
                </button>
                <button 
                    onClick={() => { setAuthMode('signup'); setError(null); }}
                    className={`flex-1 py-2 text-sm font-medium focus:outline-none ${!isLogin ? 'text-primary border-b-2 border-primary' : 'text-subtle hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    {t('settings.account.signup')}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm text-center bg-red-100 dark:bg-red-900/50 p-2 rounded-md">{error}</p>}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.account.email')}</label>
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(null); }} className={inputClasses + " mt-1"} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.account.password')}</label>
                    <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(null); }} className={inputClasses + " mt-1"} required />
                </div>
                {!isLogin && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.account.confirmPassword')}</label>
                        <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(null); }} className={inputClasses + " mt-1"} required />
                    </div>
                )}
                <button type="submit" className="w-full bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    {isLogin ? t('settings.account.login') : t('settings.account.signup')}
                </button>
            </form>
        </div>
    );
}

const SettingsTab: React.FC<SettingsTabProps> = ({ 
  markup, onMarkupChange, roundUp, onRoundUpChange, apiKey, onApiKeyChange, isUsingDefaultApiKey,
  calculationGroups, onInitiateFormulaImport, showToast
}) => {
  const { t, language, setLanguage } = useLocalization();
  const { plan, planDetails } = useSubscription();
  const { user, logout } = useAuth();
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);
  
  const handleSaveApiKey = () => {
    onApiKeyChange(localApiKey);
  }
  
  const handleImportClick = () => {
    if (!planDetails.features.importExportFormulas) {
        alert(t('subscription.upgradeRequired.message', { plan: plan }));
        return;
    }
    fileInputRef.current?.click();
  }
  
  const handleExportClick = () => {
    if (!planDetails.features.importExportFormulas) {
        alert(t('subscription.upgradeRequired.message', { plan: plan }));
        return;
    }
    handleExportFormulas();
  }

  const handleExportFormulas = () => {
    try {
      const dataStr = JSON.stringify(calculationGroups, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'budget_generator_formulas.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export formulas:", error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
            onInitiateFormulaImport(text);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    reader.onerror = () => {
        console.error("Error reading file");
    };
    reader.readAsText(file);
  };
  
  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
        const { data } = await createStripePortalSession({
            returnUrl: window.location.href,
        }) as { data: { url: string } };

        window.location.href = data.url;
    } catch (error) {
        console.error("Error creating portal session:", error);
        showToast(t('toasts.portalError'), 'error');
    } finally {
        setIsPortalLoading(false);
    }
  };


  return (
    <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-4">{t('settings.title')}</h2>
        
        <div className="space-y-6">
          
          <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
            <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">{t('settings.account.title')}</legend>
            <div className="mt-4">
                {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{t('settings.account.loggedInAs')} <span className="font-semibold">{user.email}</span></p>
                          <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">{t('settings.account.logout')}</button>
                      </div>
                      {plan !== 'free' && (
                        <div>
                          <button 
                            onClick={handleManageSubscription}
                            disabled={isPortalLoading}
                            className="w-full bg-secondary hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isPortalLoading ? t('toasts.redirectingToCheckout') : t('settings.account.manageSubscription')}
                          </button>
                        </div>
                      )}
                    </div>
                ) : (
                   <AuthForm />
                )}
            </div>
          </fieldset>
          
          <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
            <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">{t('settings.language')}</legend>
            <div className="mt-4">
               <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.language')}
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className={inputClasses + " max-w-xs"}
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          </fieldset>

          <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
            <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">{t('settings.financial')}</legend>
            <div className="mt-4">
              <label htmlFor="markup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.markup')}
              </label>
              <input
                type="number"
                id="markup"
                name="markup"
                min="0"
                className={inputClasses + " w-1/4"}
                value={markup}
                onChange={(e) => onMarkupChange(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 40"
              />
              <p className="mt-2 text-sm text-subtle dark:text-gray-400">
                {t('settings.markup.description')}
              </p>
            </div>
          </fieldset>

          <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
            <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">{t('settings.budget')}</legend>
            <div className="mt-4">
               <div className="flex items-center">
                  <input
                    id="roundUp"
                    name="roundUp"
                    type="checkbox"
                    className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary-light"
                    checked={roundUp}
                    onChange={(e) => onRoundUpChange(e.target.checked)}
                  />
                  <label htmlFor="roundUp" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                    {t('settings.roundUp')}
                  </label>
                </div>
                <p className="mt-2 text-sm text-subtle dark:text-gray-400">
                  {t('settings.roundUp.description')}
                </p>
            </div>
          </fieldset>
          
          <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md" disabled={!planDetails.features.aiAssistant}>
            <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">{t('settings.ai')}</legend>
            <div className={`mt-4 ${!planDetails.features.aiAssistant ? 'opacity-50' : ''}`}>
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.apiKey.label')}
              </label>
              <div className="flex items-center gap-2">
                <input
                    type="password"
                    id="api-key"
                    name="api-key"
                    className={inputClasses}
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder={t('settings.apiKey.placeholder')}
                    disabled={!planDetails.features.aiAssistant}
                />
                <button onClick={handleSaveApiKey} className="bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400" disabled={!planDetails.features.aiAssistant}>
                    {t('settings.apiKey.save')}
                </button>
              </div>
               {isUsingDefaultApiKey && planDetails.features.aiAssistant && (
                  <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/50 p-2 rounded-md border border-yellow-200 dark:border-yellow-800">
                    {t('settings.apiKey.warning')}
                  </p>
                )}
              <p className="mt-2 text-sm text-subtle dark:text-gray-400">
                {planDetails.features.aiAssistant ? t('settings.apiKey.description') : t('subscription.upgradeRequired.message', { plan: plan })}
              </p>
            </div>
          </fieldset>
          
          <fieldset className="border border-gray-200 dark:border-gray-700 p-4 rounded-md">
            <legend className="px-2 font-medium text-gray-800 dark:text-gray-200">{t('settings.formulas')}</legend>
            <div className={`mt-4 flex flex-wrap gap-4 ${!planDetails.features.importExportFormulas ? 'opacity-50' : ''}`}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
              <button onClick={handleExportClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!planDetails.features.importExportFormulas} title={!planDetails.features.importExportFormulas ? t('subscription.upgradeRequired.message', { plan: plan }) : ''}>
                  {t('settings.formulas.export')}
              </button>
              <button onClick={handleImportClick} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!planDetails.features.importExportFormulas} title={!planDetails.features.importExportFormulas ? t('subscription.upgradeRequired.message', { plan: plan }) : ''}>
                  {t('settings.formulas.import')}
              </button>
            </div>
            <p className="mt-2 text-sm text-subtle dark:text-gray-400">
              {t('settings.formulas.description')}
            </p>
          </fieldset>
        </div>

      </div>
    </div>
  );
};

export default SettingsTab;

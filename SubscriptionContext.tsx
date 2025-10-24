import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { SubscriptionPlan, BillingCycle } from './types';
import { subscriptionPlans, PlanDetails } from './subscription-plans';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface SubscriptionContextType {
  plan: SubscriptionPlan;
  setPlan: (plan: SubscriptionPlan) => void;
  billingCycle: BillingCycle;
  setBillingCycle: (cycle: BillingCycle) => void;
  planDetails: PlanDetails;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Change default plan to 'premium' for testing all features
  const [plan, setPlanState] = useState<SubscriptionPlan>('premium');
  const [billingCycle, setBillingCycleState] = useState<BillingCycle>('monthly');
  
  useEffect(() => {
    let unsubscribe = () => {};

    if (user) {
      // Set up a real-time listener for the user's document in Firestore.
      const userDocRef = doc(db, 'users', user.uid);
      unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          // This will be overridden by Stripe webhooks in production
          if (userData.plan && Object.keys(subscriptionPlans).includes(userData.plan)) {
            setPlanState(userData.plan as SubscriptionPlan);
          } else {
            // If user exists but has no plan, default to premium for testing
            setPlanState('premium');
          }
          if (userData.billingCycle) {
            setBillingCycleState(userData.billingCycle as BillingCycle);
          }
        } else {
            // If the user exists but has no document, default to premium for testing
            setPlanState('premium');
        }
      });
    } else {
      // For logged-out users, revert to localStorage or default to premium.
      try {
        const storedPlan = localStorage.getItem('app_subscription_plan');
        if (storedPlan && Object.keys(subscriptionPlans).includes(storedPlan)) {
            setPlanState(storedPlan as SubscriptionPlan);
        } else {
            setPlanState('premium'); // Default to premium
        }
        const storedCycle = localStorage.getItem('app_billing_cycle');
         if (storedCycle && (storedCycle === 'monthly' || storedCycle === 'annual')) {
              setBillingCycleState(storedCycle as BillingCycle);
          }
      } catch(e) {
          console.error("Could not read from localStorage", e);
          setPlanState('premium'); // Default to premium on error
      }
    }
    
    // Cleanup the listener when the user logs out or the component unmounts.
    return () => unsubscribe();
  }, [user]);
  
  // This function now only handles local state changes for testing.
  const setPlan = (newPlan: SubscriptionPlan) => {
    setPlanState(newPlan);
    localStorage.setItem('app_subscription_plan', newPlan);
    // Sync the selected plan to Firestore for persistence across devices during testing.
    // In production, the webhook would handle this for paid plans.
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, { plan: newPlan }, { merge: true });
    }
  };
  
  const setBillingCycle = (newCycle: BillingCycle) => {
      setBillingCycleState(newCycle);
      localStorage.setItem('app_billing_cycle', newCycle);
      if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          setDoc(userDocRef, { billingCycle: newCycle }, { merge: true });
      }
  }
  
  const planDetails = useMemo(() => subscriptionPlans[plan], [plan]);

  const value = { plan, setPlan, billingCycle, setBillingCycle, planDetails };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

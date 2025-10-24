import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { SubscriptionPlan, BillingCycle } from './types';
import { subscriptionPlans, PlanDetails } from './subscription-plans';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

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
  
  const [plan, setPlanState] = useState<SubscriptionPlan>('free');
  const [billingCycle, setBillingCycleState] = useState<BillingCycle>('monthly');
  
  useEffect(() => {
    let unsubscribe = () => {};

    if (user) {
      // Set up a real-time listener for the user's document in Firestore.
      const userDocRef = doc(db, 'users', user.uid);
      unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.plan && Object.keys(subscriptionPlans).includes(userData.plan)) {
            setPlanState(userData.plan as SubscriptionPlan);
          } else {
            setPlanState('free'); // Default to free if no plan in DB
          }
           if (userData.billingCycle) {
            setBillingCycleState(userData.billingCycle as BillingCycle);
          }
        } else {
            // User is logged in but has no document, default to free
            setPlanState('free');
        }
      });
    } else {
      // For logged-out users, revert to localStorage or default.
      try {
        const storedPlan = localStorage.getItem('app_subscription_plan');
        if (storedPlan && Object.keys(subscriptionPlans).includes(storedPlan)) {
            setPlanState(storedPlan as SubscriptionPlan);
        } else {
            setPlanState('free');
        }
        const storedCycle = localStorage.getItem('app_billing_cycle');
         if (storedCycle && (storedCycle === 'monthly' || storedCycle === 'annual')) {
              setBillingCycleState(storedCycle as BillingCycle);
          }
      } catch(e) {
          console.error("Could not read from localStorage", e);
          setPlanState('free');
      }
    }
    
    // Cleanup the listener when the user logs out or the component unmounts.
    return () => unsubscribe();
  }, [user]);
  
  // This function is now just for local state changes (e.g., for logged-out users)
  // The actual plan for logged-in users is controlled by Firestore.
  const setPlan = (newPlan: SubscriptionPlan) => {
    if (!user) {
      setPlanState(newPlan);
      localStorage.setItem('app_subscription_plan', newPlan);
    }
    // For logged-in users, this function does nothing, as the plan is managed by webhooks.
    // It can be used for optimistic UI updates if desired, but Firestore is the source of truth.
  };
  
  const setBillingCycle = (newCycle: BillingCycle) => {
      setBillingCycleState(newCycle);
      if (!user) {
          localStorage.setItem('app_billing_cycle', newCycle);
      }
      // We don't write this to Firestore as it's a preference, not a state of subscription
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

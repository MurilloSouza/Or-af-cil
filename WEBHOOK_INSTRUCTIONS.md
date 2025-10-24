# Stripe Integration Instructions for Firebase

> [!IMPORTANT]
> **Action Required: Update Stripe Price IDs**
> You MUST replace all placeholder Price IDs (e.g., `price_REPLACE_WITH_...`) in **two** files:
> 1.  `subscription-plans.ts` (for the frontend)
> 2.  `functions/src/index.ts` (in the `planMap` constant within the backend code below)
>
> The application will not work correctly until you replace these placeholders with the actual Price IDs from your Stripe Dashboard.

To securely activate user subscriptions **only after a successful payment**, you need a backend service that communicates with Stripe. This guide explains how to set up three **Firebase Cloud Functions** to handle the entire subscription lifecycle.

1.  **Callable Function (`createStripeCheckoutSession`):** The frontend calls this function to create a secure payment link for the user.
2.  **Webhook Handler (`stripeWebhook`):** Stripe sends notifications (webhooks) to this function after events like successful payments or cancellations. This function then updates the user's subscription plan in your Firestore database.
3.  **Callable Function (`createStripePortalSession`):** The frontend calls this function to get a secure link to the Stripe Customer Portal, where users can manage their subscriptions.

---

### Step 1: Set up Firebase Cloud Functions

If you haven't already, set up Firebase Cloud Functions in your project.

1.  **Install Firebase CLI:**
    ```bash
    npm install -g firebase-tools
    ```

2.  **Initialize Cloud Functions:** In your project's root directory, run:
    ```bash
    firebase init functions
    ```
    Select **TypeScript** when prompted. This will create a `functions` folder.

3.  **Install Dependencies:** Navigate into the `functions` directory and install the necessary libraries:
    ```bash
    cd functions
    npm install stripe firebase-admin firebase-functions express
    ```
    
---

### Step 1.5: Configure Firestore Security Rules

The `permission-denied` error occurs because your database rules are too restrictive. You must allow authenticated users to read and write to their own data.

1.  In the Firebase Console, go to **Build > Firestore Database**.
2.  Select the **Rules** tab.
3.  Replace the existing rules with the following:

    ```
    rules_version = '2';

    service cloud.firestore {
      match /databases/{database}/documents {
        // Allow users to read and write ONLY their own user document.
        // The user document is used to store their subscription plan.
        match /users/{userId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```
4. Click **Publish**.

---

### Step 2: Write the Cloud Function Code

Replace the contents of `functions/src/index.ts` with the following code. It contains all three necessary functions.

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

// --- CONFIGURATION ---
// Set your Stripe secret key and webhook secret in your Firebase environment.
// Run these commands in your terminal from your project's root directory:
//
// firebase functions:config:set stripe.secret="sk_test_..."
// firebase functions:config:set stripe.webhook_secret="whsec_..."
//
const stripe = new Stripe(functions.config().stripe.secret, {
  apiVersion: "2024-06-20",
});
const webhookSecret = functions.config().stripe.webhook_secret;

// --- 1. CALLABLE FUNCTION: Create a Stripe Checkout Session ---
export const createStripeCheckoutSession = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "You must be logged in to subscribe.");
    }

    const { priceId, planType, successUrl, cancelUrl } = data;
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;

    functions.logger.info(`Creating checkout for user ${userId} (${userEmail}) for plan '${planType}' with price ${priceId}.`);

    try {
      // Check if user already has a Stripe Customer ID
      const userDoc = await db.collection("users").doc(userId).get();
      const stripeCustomerId = userDoc.data()?.stripeCustomerId;

      const mode = planType === 'lifetime' ? 'payment' : 'subscription';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: mode,
        customer: stripeCustomerId, // Use existing customer if available
        customer_email: stripeCustomerId ? undefined : userEmail, // Only pass email if creating a new customer
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: userId, // Link session to Firebase user
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return { sessionId: session.id };
    } catch (error) {
      functions.logger.error("Stripe session creation failed:", error);
      throw new functions.https.HttpsError("internal", "Could not create a checkout session.");
    }
  }
);

// --- 2. CALLABLE FUNCTION: Create a Stripe Customer Portal Session ---
export const createStripePortalSession = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "You must be logged in to manage your subscription.");
    }
    
    const userId = context.auth.uid;
    const { returnUrl } = data;

    try {
      const userDoc = await db.collection("users").doc(userId).get();
      const stripeCustomerId = userDoc.data()?.stripeCustomerId;

      if (!stripeCustomerId) {
        throw new functions.https.HttpsError("not-found", "No active subscription found for this user.");
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
      });
      
      return { url: portalSession.url };

    } catch (error) {
      functions.logger.error(`Portal session creation for user ${userId} failed:`, error);
      throw new functions.https.HttpsError("internal", "Could not create a customer portal session.");
    }
  }
);


// --- 3. WEBHOOK HANDLER: Manages subscription state changes ---
const app = express();

app.post("/", express.raw({ type: "application/json" }), async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err: any) {
      functions.logger.error("Stripe webhook signature verification failed.", err);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    functions.logger.info(`Received Stripe event: ${event.type}`);

    const planMap: { [key: string]: string } = {
        // --- Add your RECURRING plan Price IDs here ---
        "price_0KxBDm589O8KAxCGMgG7scjb": "basic", // Example ID updated
        "price_REPLACE_WITH_BASIC_ANNUAL_ID": "basic",
        "price_REPLACE_WITH_BASIC_PLUS_MONTHLY_ID": "basic-plus",
        "price_REPLACE_WITH_BASIC_PLUS_ANNUAL_ID": "basic-plus",
        "price_REPLACE_WITH_PREMIUM_MONTHLY_ID": "premium",
        "price_REPLACE_WITH_PREMIUM_ANNUAL_ID": "premium",
        // --- Add your ONE-TIME plan Price IDs here ---
        "price_REPLACE_WITH_LIFETIME_ID": "lifetime",
    };

    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.client_reference_id;
            const stripeCustomerId = session.customer;

            if (!userId || !stripeCustomerId) {
                functions.logger.error("Webhook missing userId or customerId.", session);
                res.status(400).send("Webhook Error: Missing user or customer ID.");
                return;
            }
            
            // Save the Stripe customer ID to the user's document
            const userDocRef = db.collection("users").doc(userId);
            await userDocRef.set({ stripeCustomerId }, { merge: true });
            functions.logger.info(`Saved stripeCustomerId for user ${userId}.`);

            // Now, handle the subscription/payment itself to grant the plan
            if (session.mode === 'subscription') {
                const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                const priceId = subscription.items.data[0].price.id;
                const newPlan = planMap[priceId];
                if (newPlan) {
                    await userDocRef.set({ plan: newPlan }, { merge: true });
                    functions.logger.info(`SUCCESS: Granted subscription plan '${newPlan}' to user ${userId}.`);
                }
            } else if (session.mode === 'payment') {
                 const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
                 const priceId = lineItems.data[0].price?.id;
                 if (priceId) {
                     const newPlan = planMap[priceId];
                     if (newPlan) {
                         await userDocRef.set({ plan: newPlan }, { merge: true });
                         functions.logger.info(`SUCCESS: Granted one-time plan '${newPlan}' to user ${userId}.`);
                     }
                 }
            }
        } else if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as Stripe.Subscription;
            const stripeCustomerId = subscription.customer as string;

            // Find the user with this customer ID
            const usersQuery = db.collection("users").where("stripeCustomerId", "==", stripeCustomerId).limit(1);
            const userSnapshot = await usersQuery.get();

            if (!userSnapshot.empty) {
                const userId = userSnapshot.docs[0].id;
                await db.collection("users").doc(userId).set({ plan: 'free' }, { merge: true });
                functions.logger.info(`SUCCESS: User ${userId} subscription ended. Downgraded to 'free'.`);
            }
        }
        
        res.status(200).send("Webhook processed.");
    } catch (error) {
        functions.logger.error("Error processing webhook:", error);
        res.status(500).send("Internal Server Error.");
    }
});

export const stripeWebhook = functions.https.onRequest(app);
```

---

### Step 3: Deploy and Configure the Webhook

1.  **Deploy your functions:** From your project's root directory, run:
    ```bash
    firebase deploy --only functions
    ```

2.  **Get your Webhook URL:** After deployment, the Firebase CLI will output the URL for your webhook function. It will look like this: `https://us-central1-your-project-id.cloudfunctions.net/stripeWebhook`.

3.  **Set up the Webhook in Stripe:**
    *   Go to your [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks).
    *   Click **"Add endpoint"**.
    *   Paste your Firebase Function URL into the **"Endpoint URL"** field.
    *   Click **"+ Select events"** and add the following events:
        *   `checkout.session.completed`
        *   `customer.subscription.deleted`
    *   Click **"Add endpoint"**.

4.  **Get Your Webhook Secret:**
    *   On the webhook details page, find the **"Signing secret"** and click to reveal it.
    *   Copy this secret (it starts with `whsec_...`).
    *   Go back to your terminal and run the Firebase CLI command from Step 2 to set this secret in your environment.

You are all set! Your app will now use Stripe for checkout, allow users to manage their billing, and your backend will securely manage subscription status based on payment events.
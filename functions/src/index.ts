// --- IMPORTS ---
import { onCall, onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express, { Request, Response } from "express";
import Stripe from "stripe";
import cors from "cors";

admin.initializeApp();
const db = admin.firestore();

// --- CONFIGURAÇÃO STRIPE ---
const stripeSecret = process.env.STRIPE_SECRET as string;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

let stripe: Stripe;
const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(stripeSecret, { apiVersion: "2025-09-30.clover" });
  }
  return stripe;
};

// --- 1️⃣ Callable Function: Create Stripe Checkout Session ---
export const createStripeCheckoutSession = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to subscribe."
    );
  }

  const stripe = getStripe();
  const { priceId, planType, successUrl, cancelUrl } = request.data;
  const userId = request.auth.uid;
  const userEmail = request.auth.token.email;

  logger.info(`Creating checkout for user ${userId} (${userEmail})`);

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    const stripeCustomerId = userDoc.data()?.stripeCustomerId;

    const mode = planType === "lifetime" ? "payment" : "subscription";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode,
      customer: stripeCustomerId,
      customer_email: stripeCustomerId ? undefined : userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return { sessionId: session.id };
  } catch (error) {
    logger.error("Stripe session creation failed:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Could not create a checkout session."
    );
  }
});

// --- 2️⃣ Callable Function: Create Stripe Portal Session ---
export const createStripePortalSession = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to manage your subscription."
    );
  }

  const stripe = getStripe();
  const userId = request.auth.uid;
  const { returnUrl } = request.data;

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    const stripeCustomerId = userDoc.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
      throw new functions.https.HttpsError(
        "not-found",
        "No active subscription found for this user."
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: portalSession.url };
  } catch (error) {
    logger.error(`Portal session creation failed:`, error);
    throw new functions.https.HttpsError(
      "internal",
      "Could not create a customer portal session."
    );
  }
});

// --- 3️⃣ Webhook Handler (Stripe) ---
const app = express();

// Configura CORS apenas para testes externos (opcional)
app.use(cors({ origin: true }));

app.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response): Promise<void> => { // <- aqui
    const stripe = getStripe();
    const signature = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err: any) {
      logger.error("Stripe webhook signature verification failed.", err);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    logger.info(`Received Stripe event: ${event.type}`);

    const planMap: { [key: string]: string } = {
      "price_REPLACE_WITH_BASIC_ANNUAL_ID": "basic",
      "price_REPLACE_WITH_BASIC_PLUS_MONTHLY_ID": "basic-plus",
      "price_REPLACE_WITH_BASIC_PLUS_ANNUAL_ID": "basic-plus",
      "price_REPLACE_WITH_PREMIUM_MONTHLY_ID": "premium",
      "price_REPLACE_WITH_PREMIUM_ANNUAL_ID": "premium",
      "price_REPLACE_WITH_LIFETIME_ID": "lifetime",
    };

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const stripeCustomerId = session.customer;

        if (!userId || !stripeCustomerId) {
          logger.error("Webhook missing userId or customerId.", session);
          res.status(400).send("Webhook Error: Missing user or customer ID.");
          return;
        }

        const userDocRef = db.collection("users").doc(userId);
        await userDocRef.set({ stripeCustomerId }, { merge: true });

        if (session.mode === "subscription") {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const priceId = subscription.items.data[0].price.id;
          const newPlan = planMap[priceId];
          if (newPlan) await userDocRef.set({ plan: newPlan }, { merge: true });
        } else if (session.mode === "payment") {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const priceId = lineItems.data[0].price?.id;
          const newPlan = priceId ? planMap[priceId] : undefined;
          if (newPlan) await userDocRef.set({ plan: newPlan }, { merge: true });
        }
      } else if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;

        const userSnapshot = await db
          .collection("users")
          .where("stripeCustomerId", "==", stripeCustomerId)
          .limit(1)
          .get();

        if (!userSnapshot.empty) {
          const userId = userSnapshot.docs[0].id;
          await db.collection("users").doc(userId).set({ plan: "free" }, { merge: true });
        }
      }

      res.status(200).send("Webhook processed.");
      return; // <- garante que TypeScript veja retorno em todos os caminhos
    } catch (error) {
      logger.error("Error processing webhook:", error);
      res.status(500).send("Internal Server Error.");
      return; // <- garante retorno
    }
  }
);


export const stripeWebhook = onRequest(app);

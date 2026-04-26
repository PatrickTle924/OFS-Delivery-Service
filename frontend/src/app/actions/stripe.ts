"use server";

import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-04-22.dahlia", // Always pin your version
});

type CheckoutLineItem = {
  product: {
    name: string;
    price: number;
  };
  quantity: number;
};

type CheckoutPayload = {
  items: CheckoutLineItem[];
  deliveryFee: number;
  deliveryInfo: {
    fullName: string;
    addressLine1: string;
    city: string;
  };
  delivery_lat: number;
  delivery_lng: number;
  total_weight: number;
};

export async function createCheckoutSession(payload: any) {
  const origin = (await headers()).get("origin");

  // 1. Map your cart items to Stripe's format
  const lineItems = (payload as CheckoutPayload).items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.product.name,
      },
      unit_amount: Math.round(item.product.price * 100), // Stripe expects cents
    },
    quantity: item.quantity,
  }));

  // 2. Add Delivery Fee as a line item if applicable
  if ((payload as CheckoutPayload).deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Delivery Fee" },
        unit_amount: Math.round((payload as CheckoutPayload).deliveryFee * 100),
      },
      quantity: 1,
    });
  }

  // 1. We cast the configuration to 'any' or the specific Stripe type
  // to bypass the literal string mismatch
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    ui_mode: "embedded_page" as any, // The 'any' cast here is the escape hatch
    mode: "payment",
    line_items: lineItems,
    metadata: {
      fullName: (payload as CheckoutPayload).deliveryInfo.fullName,
      address: `${(payload as CheckoutPayload).deliveryInfo.addressLine1}, ${(payload as CheckoutPayload).deliveryInfo.city}`,
      lat: (payload as CheckoutPayload).delivery_lat.toString(),
      lng: (payload as CheckoutPayload).delivery_lng.toString(),
      totalWeight: (payload as CheckoutPayload).total_weight.toString(),
    },
    return_url: `${origin || process.env.NEXT_PUBLIC_APP_URL}/user/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
  };

  const session = await stripe.checkout.sessions.create(sessionParams);

  return {
    clientSecret: session.client_secret,
    sessionId: session.id,
  };
}

export async function verifyCheckoutSession(sessionId: string) {
  if (!sessionId) {
    throw new Error("Missing Stripe session id.");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return {
    id: session.id,
    status: session.status,
    paymentStatus: session.payment_status,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
  };
}

import Stripe from "stripe";

// Use placeholder during build time - actual key required at runtime
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_placeholder_for_build",
  {
    apiVersion: "2025-02-24.acacia",
  }
);

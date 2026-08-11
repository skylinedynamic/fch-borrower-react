import { loadStripe } from '@stripe/stripe-js/pure';
import type { Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;
let currentKey: string | null = null;

export const getStripe = async (publicKey?: string) => {
  if (publicKey) {
    if (!stripePromise || currentKey !== publicKey) {
      currentKey = publicKey;
      stripePromise = loadStripe(publicKey);
    }
    return stripePromise;
  }

  if (stripePromise && currentKey) {
    return stripePromise;
  }

  console.warn('Stripe publishable key was not provided to getStripe().');
  return null;
};

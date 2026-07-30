import { loadStripe } from '@stripe/stripe-js/pure';
import type { Stripe } from '@stripe/stripe-js';
import { fetchSettings } from '../modules/settings/services';

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

  if (!stripePromise) {
    try {
      const response = await fetchSettings();
      const settings = response.data?.data || response.data || {};
      const mode = settings.payment_mode || 'sandbox';
      const key = settings[`stripe_key_${mode}`];
      
      if (!key) {
        console.error(`Stripe public key not found for mode: ${mode}`);
        return null;
      }
      
      currentKey = key;
      stripePromise = loadStripe(key);
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      return null;
    }
  }
  return stripePromise;
};

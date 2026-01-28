import { loadStripe } from '@stripe/stripe-js';

// Using a singleton pattern to only load Stripe once
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
    if (!stripePromise) {
        // You should verify the environment variable name matches your Vite config.
        // Usually VITE_STRIPE_PUBLISHABLE_KEY or REACT_APP_STRIPE_PUBLISHABLE_KEY
        const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''; // Fallback for safety
        if (key) {
            stripePromise = loadStripe(key);
        } else {
            console.warn('Stripe publishable key is missing in environment variables');
            // Retaining null/re-returning promise might fail silently or throw in components
        }
    }
    return stripePromise;
};

declare global {
  interface Window {
    FlutterwaveCheckout?: (options: any) => any;
  }
}

let flutterwaveScriptPromise: Promise<void> | null = null;

export function loadFlutterwaveScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.FlutterwaveCheckout) return Promise.resolve();

  if (flutterwaveScriptPromise) return flutterwaveScriptPromise;

  flutterwaveScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.flutterwave.com/v3.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Flutterwave script")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Flutterwave script"));
    document.head.appendChild(script);
  });

  return flutterwaveScriptPromise;
}

export type FlutterwaveCheckoutCustomer = {
  email: string;
  name?: string;
  phonenumber?: string;
};

export type FlutterwaveCheckoutConfig = {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url?: string;
  customer: FlutterwaveCheckoutCustomer;
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: Record<string, any>;
  payment_options?: string;
  callback?: (data: any) => void;
  onclose?: () => void;
};

export async function openFlutterwaveCheckout(config: FlutterwaveCheckoutConfig): Promise<void> {
  await loadFlutterwaveScript();

  if (!window.FlutterwaveCheckout) {
    throw new Error("Flutterwave is not loaded. Please refresh and try again.");
  }

  window.FlutterwaveCheckout(config as any);
}


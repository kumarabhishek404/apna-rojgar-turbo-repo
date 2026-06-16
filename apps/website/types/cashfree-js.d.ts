declare module "@cashfreepayments/cashfree-js" {
  export type CashfreeMode = "sandbox" | "production";

  export type CashfreeCheckoutOptions = {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_modal" | "_top";
  };

  export type CashfreeCheckoutResult = {
    error?: { message?: string };
    redirect?: boolean;
    paymentDetails?: { paymentMessage?: string };
  };

  export type CashfreeInstance = {
    checkout: (options: CashfreeCheckoutOptions) => Promise<CashfreeCheckoutResult>;
  };

  export function load(options: { mode: CashfreeMode }): Promise<CashfreeInstance>;
}

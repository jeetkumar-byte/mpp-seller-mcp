import type {
  CredentialEnvelope,
  KitActionContext,
} from '../keydris/types.js';

export type PaymentContext = {
  transaction_type: 'spend' | 'refund';
  amount: string;
  currency: string;
  method: 'CARD';
};

export type ApprovedPaymentContext = PaymentContext & {
  payment_connection_id: string;
};

export type PaymentReference = {
  challenge_id?: string;
  spt_id?: string;
};

export type PaymentAuthorization = {
  payment: PaymentContext;
  reference?: PaymentReference;
};

export type PaymentConnectionEvidence = {
  role: 'buyer' | 'seller';
  payment_method_id?: string;
  network_business_profile?: string;
};

export type PaymentRedemption =
  | {
      ok: true;
      credentials: CredentialEnvelope[];
      decisionId?: string;
      approvedPayment?: ApprovedPaymentContext;
      paymentConnection?: PaymentConnectionEvidence;
    }
  | { ok: false; problem: string };

export type TargetMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

export type KitTarget = {
  host: string;
  path: string;
  method: TargetMethod;
};

export type PaymentKitReaderOptions = {
  gatewayUrl: string;
  allowInsecureGatewayUrl?: boolean;
  tokenHeader?: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
};

export type PaymentKitReader = {
  readonly tokenHeader: string;
  callsATool(body: unknown): boolean;
  redeem(
    body: unknown,
    source?: {
      header?: string;
      target?: KitTarget;
      authorization?: PaymentAuthorization;
    },
  ): Promise<PaymentRedemption | undefined>;
};

export type { CredentialEnvelope, KitActionContext };

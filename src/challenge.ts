import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { stripeChallengeSchema, type StripeChallenge } from './payments.js';

const payloadSchema = stripeChallengeSchema
  .omit({ id: true })
  .extend({
    sku: z.string().min(1),
    quantity: z.number().int().positive(),
  });

type ChallengePayload = z.infer<typeof payloadSchema>;

function signature(encoded: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(encoded).digest();
}

function signaturesMatch(encoded: string, encodedMac: string, secret: string): boolean {
  // Compare the canonical encoded values instead of decoding the received MAC.
  // Some serverless runtimes do not implement Buffer's `base64url` decoder
  // consistently even though encoding is supported.
  const expected = Buffer.from(
    signature(encoded, secret).toString('base64url'),
    'utf8',
  );
  const received = Buffer.from(encodedMac, 'utf8');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function issueChallenge(
  payload: ChallengePayload,
  secret: string,
): StripeChallenge {
  if (secret.length < 32) {
    throw new Error('SELLER_CHALLENGE_SIGNING_SECRET must be at least 32 characters');
  }
  const unsigned = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = signature(unsigned, secret).toString('base64url');
  return stripeChallengeSchema.parse({
    id: `ch_${unsigned}.${mac}`,
    method: payload.method,
    intent: payload.intent,
    amount: payload.amount,
    currency: payload.currency,
    networkId: payload.networkId,
    expiresAt: payload.expiresAt,
  });
}

export function verifyChallenge(id: string, secret: string): ChallengePayload {
  const match = /^ch_([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(id);
  if (!match) throw new Error('The challenge id is malformed.');

  const [, encoded, encodedMac] = match;
  if (!signaturesMatch(encoded, encodedMac, secret)) {
    throw new Error('The challenge signature is invalid.');
  }
  return payloadSchema.parse(JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')));
}

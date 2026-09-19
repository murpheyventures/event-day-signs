/** Vendor-neutral boundary for paid printed-offer fulfillment. */
export type FulfillmentJobStatus =
  | 'pending'
  | 'submitted'
  | 'fulfilled'
  | 'failed'
  | 'cancelled';

export interface FulfillmentAddress {
  name?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

export interface FulfillmentLine {
  sku: string;
  quantity: number;
  variant_id?: string;
}

export interface SubmitFulfillmentInput {
  idempotencyKey: string;
  externalReference: string;
  lines: FulfillmentLine[];
  shipTo: FulfillmentAddress;
}

export interface FulfillmentSubmission {
  provider: string;
  externalOrderId: string;
  status: 'submitted' | 'fulfilled';
}

export interface FulfillmentProvider {
  readonly name: string;
  submit(input: SubmitFulfillmentInput): Promise<FulfillmentSubmission>;
  getStatus(externalOrderId: string): Promise<FulfillmentJobStatus>;
  cancel?(externalOrderId: string): Promise<void>;
}

/** Guards the provider boundary from empty or non-positive fulfillment lines. */
export function validateFulfillmentInput(input: SubmitFulfillmentInput): void {
  if (!input.idempotencyKey.trim()) throw new Error('Fulfillment idempotency key is required.');
  if (!input.externalReference.trim()) throw new Error('Fulfillment reference is required.');
  if (input.lines.length === 0) throw new Error('Fulfillment requires at least one line.');
  for (const line of input.lines) {
    if (!line.sku.trim()) throw new Error('Fulfillment line SKU is required.');
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new Error('Fulfillment line quantity must be a positive integer.');
    }
  }
}

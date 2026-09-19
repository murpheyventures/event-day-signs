import { describe, expect, it } from 'vitest';
import { validateFulfillmentInput } from './provider';

const valid = {
  idempotencyKey: 'ord_123:item_1',
  externalReference: 'ord_123',
  lines: [{ sku: 'poster-small', quantity: 1 }],
  shipTo: { line1: '1 Main St', city: 'Boston', postal_code: '02108', country: 'US' },
};

describe('fulfillment provider contract', () => {
  it('accepts a complete printed submission', () => {
    expect(() => validateFulfillmentInput(valid)).not.toThrow();
  });

  it.each([
    ['missing idempotency key', { ...valid, idempotencyKey: '' }],
    ['missing lines', { ...valid, lines: [] }],
    ['invalid quantity', { ...valid, lines: [{ sku: 'x', quantity: 0 }] }],
    ['missing sku', { ...valid, lines: [{ sku: ' ', quantity: 1 }] }],
  ])('%s', (_label, input) => {
    expect(() => validateFulfillmentInput(input)).toThrow();
  });
});

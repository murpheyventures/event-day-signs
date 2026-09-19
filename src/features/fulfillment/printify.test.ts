import { describe, expect, it, vi } from 'vitest';
import { createPrintifyProvider } from './printify';

const input = {
  idempotencyKey: 'fjob_test_1',
  externalReference: 'ord_test_1',
  lines: [{ sku: '123456', variant_id: '789', quantity: 1 }],
  shipTo: { name: 'Event Day Signs', line1: '1 Main St', city: 'Austin', state: 'TX', postal_code: '78701', country: 'US' },
};

describe('Printify fulfillment adapter', () => {
  it('refuses live submission unless explicitly enabled', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const provider = createPrintifyProvider({ apiToken: 'test', shopId: 'shop', fetcher });

    await expect(provider.submit(input)).rejects.toThrow(/submission is disabled/i);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('submits the provider-neutral input with the idempotent external reference', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'printify-order-1', status: 'on-hold' }), { status: 200 }),
    );
    const provider = createPrintifyProvider({
      apiToken: 'test',
      shopId: 'shop',
      baseUrl: 'https://printify.test',
      allowLiveSubmit: true,
      fetcher,
    });

    await expect(provider.submit(input)).resolves.toEqual({
      provider: 'printify',
      externalOrderId: 'printify-order-1',
      status: 'submitted',
    });
    expect(fetcher).toHaveBeenCalledWith(
      'https://printify.test/v1/shops/shop/orders.json',
      expect.objectContaining({ method: 'POST', body: expect.stringContaining('ord_test_1') }),
    );
  });

  it('maps provider status to the fulfillment port', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'printify-order-1', status: 'fulfilled' }), { status: 200 }),
    );
    const provider = createPrintifyProvider({ apiToken: 'test', shopId: 'shop', fetcher });

    await expect(provider.getStatus('printify-order-1')).resolves.toBe('fulfilled');
  });
});

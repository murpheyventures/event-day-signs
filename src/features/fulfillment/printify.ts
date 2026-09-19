import {
  validateFulfillmentInput,
  type FulfillmentJobStatus,
  type FulfillmentProvider,
  type FulfillmentSubmission,
  type SubmitFulfillmentInput,
} from './provider.ts';

export interface PrintifyProviderOptions {
  apiToken: string;
  shopId: string;
  /** Printify's API host. Override this only for a controlled test double. */
  baseUrl?: string;
  /** Production submissions remain opt-in, including in staging. */
  allowLiveSubmit?: boolean;
  fetcher?: typeof fetch;
}

interface PrintifyOrder {
  id: string;
  status: string;
}

const PRINTIFY_API = 'https://api.printify.com';

function endpoint(baseUrl: string, shopId: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}/v1/shops/${encodeURIComponent(shopId)}/orders${path}`;
}

function statusOf(status: string): FulfillmentJobStatus {
  switch (status.toLowerCase()) {
    case 'fulfilled':
    case 'delivered':
      return 'fulfilled';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'failed':
      return 'failed';
    default:
      return 'submitted';
  }
}

async function readOrder(response: Response): Promise<PrintifyOrder> {
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Printify request failed (${response.status}): ${detail}`);
  }
  return (await response.json()) as PrintifyOrder;
}

/**
 * Printify's HTTP adapter. It is deliberately inert by default: a missing
 * explicit opt-in is a deployment safety boundary, not a configuration typo.
 */
export function createPrintifyProvider(options: PrintifyProviderOptions): FulfillmentProvider {
  const fetcher = options.fetcher ?? fetch;
  const baseUrl = options.baseUrl ?? PRINTIFY_API;
  const headers = {
    Authorization: `Bearer ${options.apiToken}`,
    'Content-Type': 'application/json',
  };

  return {
    name: 'printify',

    async submit(input: SubmitFulfillmentInput): Promise<FulfillmentSubmission> {
      validateFulfillmentInput(input);
      if (!options.allowLiveSubmit) {
        throw new Error('Printify submission is disabled; enable the explicit staging/live guard first.');
      }

      const order = await readOrder(
        await fetcher(endpoint(baseUrl, options.shopId, '.json'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            external_id: input.externalReference,
            label: input.externalReference,
            line_items: input.lines.map((line) => ({
              product_id: line.sku,
              variant_id: line.variant_id ? Number(line.variant_id) : undefined,
              quantity: line.quantity,
            })),
            address_to: {
              first_name: input.shipTo.name ?? '',
              address1: input.shipTo.line1,
              address2: input.shipTo.line2 ?? '',
              city: input.shipTo.city,
              region: input.shipTo.state ?? '',
              zip: input.shipTo.postal_code,
              country: input.shipTo.country,
            },
          }),
        }),
      );

      return {
        provider: 'printify',
        externalOrderId: order.id,
        status: statusOf(order.status) === 'fulfilled' ? 'fulfilled' : 'submitted',
      };
    },

    async getStatus(externalOrderId: string): Promise<FulfillmentJobStatus> {
      if (!externalOrderId.trim()) throw new Error('Printify order id is required.');
      const order = await readOrder(
        await fetcher(endpoint(baseUrl, options.shopId, `/${encodeURIComponent(externalOrderId)}.json`), {
          headers: { Authorization: `Bearer ${options.apiToken}` },
        }),
      );
      return statusOf(order.status);
    },
  };
}

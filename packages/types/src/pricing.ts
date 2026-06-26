export type GadgetType = "phone" | "laptop" | "other";

export interface PricingTier {
  minKobo: number;
  maxKobo: number;
}

export interface PricingConfig {
  gadgets: {
    phone: PricingTier;
    laptop: PricingTier;
    other: PricingTier;
  };
  grocery: { baseKobo: number; percentBps: number };
  food: { baseKobo: number };
  laundry: { baseKobo: number };
  other: { baseKobo: number };
  urgent: { minMultiplier: number; maxMultiplier: number };
}

/** PRD defaults — admin can override in dashboard. */
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  gadgets: {
    phone: { minKobo: 80_000, maxKobo: 200_000 },
    laptop: { minKobo: 300_000, maxKobo: 400_000 },
    other: { minKobo: 150_000, maxKobo: 350_000 }
  },
  grocery: { baseKobo: 120_000, percentBps: 500 },
  food: { baseKobo: 120_000 },
  laundry: { baseKobo: 150_000 },
  other: { baseKobo: 120_000 },
  urgent: { minMultiplier: 1.5, maxMultiplier: 2.0 }
};

export interface DeliveryQuoteInput {
  category: "gadgets" | "food" | "grocery" | "laundry" | "other";
  gadgetType?: GadgetType;
  orderValueKobo?: number;
  urgent?: boolean;
}

export function calculateDeliveryFee(
  config: PricingConfig,
  input: DeliveryQuoteInput
): { deliveryFeeKobo: number; urgentMultiplier: number } {
  let baseKobo: number;

  switch (input.category) {
    case "gadgets": {
      const tier = config.gadgets[input.gadgetType ?? "phone"];
      baseKobo = Math.round((tier.minKobo + tier.maxKobo) / 2);
      break;
    }
    case "grocery": {
      const orderValue = Math.max(0, input.orderValueKobo ?? 0);
      const percentFee = Math.round((orderValue * config.grocery.percentBps) / 10_000);
      baseKobo = config.grocery.baseKobo + percentFee;
      break;
    }
    case "food":
      baseKobo = config.food.baseKobo;
      break;
    case "laundry":
      baseKobo = config.laundry.baseKobo;
      break;
    case "other":
      baseKobo = config.other.baseKobo;
      break;
    default:
      baseKobo = config.other.baseKobo;
  }

  const urgentMultiplier = input.urgent ? config.urgent.minMultiplier : 1;
  const deliveryFeeKobo = Math.round(baseKobo * urgentMultiplier);

  return { deliveryFeeKobo, urgentMultiplier };
}

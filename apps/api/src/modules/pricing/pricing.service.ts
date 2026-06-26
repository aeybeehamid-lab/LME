import {
  DEFAULT_PRICING_CONFIG,
  DeliveryQuoteInput,
  PricingConfig,
  calculateDeliveryFee
} from "@lme/types";
import { pool } from "../../db";
import { AppError } from "../../middleware/errorHandler";

const PRICING_KEY = "pricing";

function deepMergePricing(
  current: PricingConfig,
  patch: Partial<PricingConfig>
): PricingConfig {
  return {
    gadgets: {
      phone: { ...current.gadgets.phone, ...patch.gadgets?.phone },
      laptop: { ...current.gadgets.laptop, ...patch.gadgets?.laptop },
      other: { ...current.gadgets.other, ...patch.gadgets?.other }
    },
    grocery: { ...current.grocery, ...patch.grocery },
    food: { ...current.food, ...patch.food },
    laundry: { ...current.laundry, ...patch.laundry },
    other: { ...current.other, ...patch.other },
    urgent: { ...current.urgent, ...patch.urgent }
  };
}

function validateConfig(config: PricingConfig): void {
  const tiers = [
    config.gadgets.phone,
    config.gadgets.laptop,
    config.gadgets.other
  ];
  for (const tier of tiers) {
    if (tier.minKobo < 0 || tier.maxKobo < tier.minKobo) {
      throw new AppError(400, "Invalid gadget price range.", "INVALID_PRICING");
    }
  }
  if (config.grocery.baseKobo < 0 || config.grocery.percentBps < 0) {
    throw new AppError(400, "Invalid grocery pricing.", "INVALID_PRICING");
  }
  for (const base of [config.food.baseKobo, config.laundry.baseKobo, config.other.baseKobo]) {
    if (base < 0) throw new AppError(400, "Invalid category base fee.", "INVALID_PRICING");
  }
  if (
    config.urgent.minMultiplier < 1 ||
    config.urgent.maxMultiplier < config.urgent.minMultiplier
  ) {
    throw new AppError(400, "Invalid urgent multiplier range.", "INVALID_PRICING");
  }
}

export async function getPricingConfig(): Promise<PricingConfig> {
  const result = await pool.query<{ value: PricingConfig }>(
    `SELECT value FROM platform_settings WHERE setting_key = $1`,
    [PRICING_KEY]
  );
  const row = result.rows[0];
  if (!row) return DEFAULT_PRICING_CONFIG;
  return deepMergePricing(DEFAULT_PRICING_CONFIG, row.value);
}

export async function updatePricingConfig(input: {
  patch: Partial<PricingConfig>;
  updatedBy: string;
}): Promise<PricingConfig> {
  const current = await getPricingConfig();
  const next = deepMergePricing(current, input.patch);
  validateConfig(next);

  await pool.query(
    `INSERT INTO platform_settings (setting_key, value, updated_by, updated_at)
     VALUES ($1, $2::jsonb, $3, NOW())
     ON CONFLICT (setting_key)
     DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
    [PRICING_KEY, JSON.stringify(next), input.updatedBy]
  );

  return next;
}

export async function quoteDeliveryFee(input: DeliveryQuoteInput) {
  const config = await getPricingConfig();
  const quote = calculateDeliveryFee(config, input);
  return { ...quote, config };
}

export async function assertCustomerDeliveryFee(input: DeliveryQuoteInput & {
  deliveryFeeKobo: number;
}): Promise<{ deliveryFeeKobo: number; urgentMultiplier: number }> {
  const { deliveryFeeKobo, urgentMultiplier } = await quoteDeliveryFee(input);
  if (Math.abs(input.deliveryFeeKobo - deliveryFeeKobo) > 1) {
    throw new AppError(
      400,
      `Delivery fee mismatch. Expected ₦${(deliveryFeeKobo / 100).toLocaleString("en-NG")} for current pricing.`,
      "FEE_MISMATCH"
    );
  }
  return { deliveryFeeKobo, urgentMultiplier };
}

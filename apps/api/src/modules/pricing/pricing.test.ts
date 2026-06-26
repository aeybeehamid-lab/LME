import { describe, expect, it } from "vitest";
import { DEFAULT_PRICING_CONFIG, calculateDeliveryFee } from "@lme/types";

describe("calculateDeliveryFee", () => {
  it("quotes phone gadget at midpoint of admin range", () => {
    const { deliveryFeeKobo } = calculateDeliveryFee(DEFAULT_PRICING_CONFIG, {
      category: "gadgets",
      gadgetType: "phone"
    });
    expect(deliveryFeeKobo).toBe(140_000);
  });

  it("adds grocery percent to base", () => {
    const { deliveryFeeKobo } = calculateDeliveryFee(DEFAULT_PRICING_CONFIG, {
      category: "grocery",
      orderValueKobo: 1_000_000
    });
    expect(deliveryFeeKobo).toBe(170_000);
  });

  it("applies urgent multiplier", () => {
    const { deliveryFeeKobo, urgentMultiplier } = calculateDeliveryFee(
      DEFAULT_PRICING_CONFIG,
      { category: "food", urgent: true }
    );
    expect(urgentMultiplier).toBe(1.5);
    expect(deliveryFeeKobo).toBe(180_000);
  });
});

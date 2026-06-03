import { config } from "../../config";
import { AppError } from "../../middleware/errorHandler";

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function initializePaystackCheckout(input: {
  email: string;
  amountKobo: number;
  reference: string;
  metadata?: Record<string, string>;
}): Promise<{ authorizationUrl: string; accessCode: string } | null> {
  if (!config.paystackSecretKey || config.paystackSecretKey.includes("replace")) {
    return null;
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.paystackSecretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      currency: "NGN",
      metadata: input.metadata,
      callback_url: config.paystackCallbackUrl || undefined
    })
  });

  const payload = (await response.json()) as PaystackInitResponse;
  if (!response.ok || !payload.status || !payload.data?.authorization_url) {
    throw new AppError(
      502,
      payload.message || "Paystack initialization failed.",
      "PAYSTACK_ERROR"
    );
  }

  return {
    authorizationUrl: payload.data.authorization_url,
    accessCode: payload.data.access_code
  };
}

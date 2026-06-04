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

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    paid_at?: string;
  };
}

/** Confirms payment after customer returns from Paystack (webhook may lag or be unreachable locally). */
export async function verifyPaystackTransaction(
  reference: string
): Promise<{ status: "success" | "failed" | "pending" } | null> {
  if (!config.paystackSecretKey || config.paystackSecretKey.includes("replace")) {
    return null;
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${config.paystackSecretKey}` }
    }
  );

  const payload = (await response.json()) as PaystackVerifyResponse;
  if (!response.ok || !payload.status || !payload.data) {
    throw new AppError(
      502,
      payload.message || "Paystack verification failed.",
      "PAYSTACK_ERROR"
    );
  }

  const paystackStatus = payload.data.status;
  if (paystackStatus === "success") return { status: "success" };
  if (paystackStatus === "failed" || paystackStatus === "abandoned") {
    return { status: "failed" };
  }
  return { status: "pending" };
}

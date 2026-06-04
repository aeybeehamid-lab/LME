import * as WebBrowser from "expo-web-browser";
import {
  devConfirmPayment,
  fetchOrderById,
  initializePayment,
  verifyPayment
} from "./api";

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

/** Poll Paystack verify after customer returns from checkout (webhook may lag). */
async function pollPaymentVerification(orderId: string, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    const result = await verifyPayment(orderId);
    if (result.verified) return result;
    if (i < attempts - 1) await sleep(2000);
  }
  throw new Error(
    "Payment not confirmed yet. If you completed payment, wait a moment and tap Pay again or Refresh."
  );
}

/**
 * Start Paystack checkout in the device browser, then verify with our API.
 * Falls back to dev confirm when PAYSTACK_SECRET_KEY is not configured.
 */
export async function completeOrderPayment(orderId: string, amountKobo: number) {
  const idempotencyKey = `init:${orderId}`;
  const { payment } = await initializePayment(orderId, amountKobo, idempotencyKey);

  if (payment.paystackLive && payment.authorizationUrl) {
    await WebBrowser.openBrowserAsync(payment.authorizationUrl, {
      dismissButtonStyle: "close",
      showTitle: true
    });
    const verified = await pollPaymentVerification(orderId);
    return {
      mode: "paystack" as const,
      orderStatus: verified.orderStatus
    };
  }

  await devConfirmPayment(orderId);
  const { order } = await fetchOrderById(orderId);
  return { mode: "dev" as const, orderStatus: order.status };
}

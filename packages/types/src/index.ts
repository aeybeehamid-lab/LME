export type UserRole = "customer" | "rider" | "executive" | "ops_assistant";

export type OrderStatus =
  | "created"
  | "payment_pending"
  | "payment_confirmed"
  | "posted_to_job_board"
  | "rider_assigned"
  | "picked_up"
  | "en_route"
  | "delivered"
  | "escalated"
  | "cancelled"
  | "refunded";

export type OrderCategory = "gadgets" | "food" | "grocery" | "laundry" | "other";

export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export interface AuthUser {
  id: string;
  phone: string;
  role: UserRole;
  name?: string;
}

export interface Order {
  id: string;
  customerId: string;
  riderId?: string;
  category: OrderCategory;
  status: OrderStatus;
  deliveryFeeKobo: number;
  urgentMultiplier: number;
  pickupAddress: string;
  dropoffAddress: string;
  itemDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  paystackReference: string;
  amountKobo: number;
  status: PaymentStatus;
  idempotencyKey: string;
  createdAt: string;
}

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ["payment_pending", "cancelled"],
  payment_pending: ["payment_confirmed", "cancelled"],
  payment_confirmed: ["posted_to_job_board", "cancelled"],
  posted_to_job_board: ["rider_assigned", "escalated", "cancelled"],
  rider_assigned: ["picked_up", "escalated", "cancelled"],
  picked_up: ["en_route", "cancelled"],
  en_route: ["delivered", "cancelled"],
  delivered: [],
  escalated: ["rider_assigned", "refunded", "cancelled"],
  cancelled: [],
  refunded: []
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function riderCommissionKobo(deliveryFeeKobo: number): number {
  return Math.round(deliveryFeeKobo * 0.25);
}

export function lmeRevenueKobo(deliveryFeeKobo: number): number {
  return Math.round(deliveryFeeKobo * 0.75);
}

export * from "./pricing";

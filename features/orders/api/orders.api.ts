import { apiRequest, type Order, type OrderPaymentStatus, type PaymentInstructions } from "@/lib/api-client";

export const listMyOrders = () => apiRequest<Order[]>("/orders/?limit=100");
export const getOrderPaymentStatus = (orderId: string) => apiRequest<OrderPaymentStatus>(`/orders/${orderId}/payment-status`);
export const getOrderPaymentInstructions = (orderId: string) => apiRequest<PaymentInstructions>(`/orders/${orderId}/payment-instructions`);

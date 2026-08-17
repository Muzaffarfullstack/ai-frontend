import { apiRequest as request } from "@/lib/api-client";

export const getAdminResource = <T,>(path: string) => request<T>(path);
export const mutateAdminResource = <T = void,>(path: string, init: RequestInit) => request<T>(path, init);
export const apiRequest = mutateAdminResource;
export const getAdminOrderPaymentStatus = <T,>(orderId: string) => request<T>(`/admin/orders/${orderId}/payment-status`);

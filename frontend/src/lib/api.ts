import axios from 'axios';
import config from '@/config';
import {
  buildLoginRedirect,
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  persistAuthSession,
} from '@/lib/auth';
import type {
  ApiResponse,
  BookingDetails,
  VoucherResult,
  PaymentInfo,
} from '@/types';

// ─── Axios Instance ───────────────────────────────────────────
const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

const refreshClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage if available
api.interceptors.request.use((req) => {
  const token = getAccessToken();
  if (token && req.headers) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const backendMessage = error?.response?.data?.message;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !String(originalRequest.url || '').includes('/auth/login') &&
      !String(originalRequest.url || '').includes('/auth/refresh-token')
    ) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        originalRequest._retry = true;
        try {
          const { data } = await refreshClient.post('/auth/refresh-token', {
            refreshToken,
          });

          const nextAccessToken = data?.accessToken;
          if (nextAccessToken) {
            persistAuthSession({
              accessToken: nextAccessToken,
              refreshToken,
            });

            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
            return api(originalRequest);
          }
        } catch {
          // Fall through to session clear + login redirect
        }
      }

      clearAuthSession();
      if (typeof window !== 'undefined') {
        const redirectPath = `${window.location.pathname}${window.location.search}`;
        window.location.href = buildLoginRedirect(redirectPath);
      }
    }

    if (backendMessage) {
      return Promise.reject(new Error(backendMessage));
    }

    return Promise.reject(error);
  }
);

// ─── Booking APIs ─────────────────────────────────────────────
export async function getBookingDetails(bookingId: string): Promise<BookingDetails> {
  const { data } = await api.get<ApiResponse<BookingDetails>>(
    `/bookings/${bookingId}/details`
  );
  if (!data.success || !data.data) throw new Error(data.message ?? 'Không thể tải thông tin booking');
  return data.data;
}

export async function applyVoucher(
  bookingId: string,
  voucherCode: string
): Promise<VoucherResult> {
  try {
    const { data } = await api.post<ApiResponse<VoucherResult>>(
      '/bookings/apply-voucher',
      { booking_id: bookingId, voucher_code: voucherCode }
    );
    if (!data.success || !data.data) throw new Error(data.message ?? 'Không thể áp dụng voucher');
    return data.data;
  } catch (error: any) {
    // KAN-catch-error: Capture error message from backend if available
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

// ─── Payment APIs ─────────────────────────────────────────────
export async function createVnpayPayment(
  bookingId: string
): Promise<string> {
  const { data } = await api.post<{ success: boolean; url: string; message?: string }>(
    '/payments/create',
    { booking_id: bookingId }
  );
  if (!data.success || !data.url) throw new Error(data.message ?? 'Không thể tạo link thanh toán');
  return data.url;
}

export async function getPaymentStatus(bookingId: string): Promise<PaymentInfo> {
  const { data } = await api.get<{ success: boolean; data: PaymentInfo; message?: string }>(
    `/payments/${bookingId}/status`
  );
  if (!data.success || !data.data) throw new Error(data.message ?? 'Không thể tải trạng thái thanh toán');
  return data.data;
}

export async function verifyVnpayReturn(
  queryString: string
): Promise<{ success: boolean; code: string; message: string }> {
  const { data } = await api.get<{ success: boolean; code: string; message: string }>(
    `/payments/vnpay_return?${queryString}`
  );
  return data;
}

export async function mockConfirmPayment(
  bookingId: string,
  status: 'SUCCESS' | 'FAILED'
): Promise<void> {
  await api.post('/payments/mock-confirm', {
    booking_id: bookingId,
    status,
  });
}

export default api;

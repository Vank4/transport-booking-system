import axios from 'axios';
import config from '@/config';
import {
  buildLoginRedirect,
  clearAuthSession,
  getRefreshToken,
  getValidAccessToken,
  persistAuthSession,
} from '@/lib/auth';
import type {
  ApiResponse,
  BookingDetails,
  VoucherResult,
  PaymentInfo,
} from '@/types';

const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

const refreshClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message ??
      fallback
    );
  }

  return error instanceof Error ? error.message : fallback;
};

api.interceptors.request.use(async (req) => {
  const token = await getValidAccessToken();
  if (token && req.headers) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;
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

          const nextAccessToken =
            data?.accessToken ?? data?.data?.accessToken ?? null;

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
          // Fall through to session clear + login redirect.
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

export async function getBookingDetails(bookingId: string): Promise<BookingDetails> {
  try {
    const { data } = await api.get<ApiResponse<BookingDetails>>(
      `/bookings/${bookingId}/details`
    );
    if (!data.success || !data.data) throw new Error(data.message ?? 'Khong the tai thong tin booking');
    return data.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Khong the tai thong tin booking'));
  }
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
    if (!data.success || !data.data) throw new Error(data.message ?? 'Khong the ap dung voucher');
    return data.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Khong the ap dung voucher'));
  }
}

export async function createVnpayPayment(bookingId: string): Promise<string> {
  try {
    const { data } = await api.post<{ success: boolean; url: string; message?: string }>(
      '/payments/create',
      { booking_id: bookingId }
    );
    if (!data.success || !data.url) throw new Error(data.message ?? 'Khong the tao link thanh toan');
    return data.url;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Khong the tao link thanh toan'));
  }
}

export async function createPaypalPayment(bookingId: string): Promise<string> {
  try {
    const { data } = await api.post<{ success: boolean; url: string; message?: string }>(
      '/payments/paypal/create',
      { booking_id: bookingId }
    );
    if (!data.success || !data.url) throw new Error(data.message ?? 'Khong the tao link PayPal');
    return data.url;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Khong the tao link PayPal'));
  }
}

export async function capturePaypalPayment(
  bookingId: string,
  orderId: string,
  payerId?: string | null
): Promise<PaymentInfo> {
  try {
    const { data } = await api.post<{ success: boolean; data: PaymentInfo; message?: string }>(
      '/payments/paypal/capture',
      { booking_id: bookingId, order_id: orderId, payer_id: payerId ?? null }
    );
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Khong the xac nhan thanh toan PayPal');
    }
    return data.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Khong the xac nhan thanh toan PayPal'));
  }
}

export async function getPaymentStatus(bookingId: string): Promise<PaymentInfo> {
  try {
    const { data } = await api.get<{ success: boolean; data: PaymentInfo; message?: string }>(
      `/payments/${bookingId}/status`
    );
    if (!data.success || !data.data) throw new Error(data.message ?? 'Khong the tai trang thai thanh toan');
    return data.data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Khong the tai trang thai thanh toan'));
  }
}

export async function verifyVnpayReturn(
  queryString: string
): Promise<{ success: boolean; code: string; message: string }> {
  try {
    const { data } = await api.get<{ success: boolean; code: string; message: string }>(
      `/payments/vnpay_return?${queryString}`
    );
    return data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Khong the xac minh ket qua VNPay'));
  }
}

export async function mockConfirmPayment(
  bookingId: string,
  status: 'SUCCESS' | 'FAILED'
): Promise<void> {
  try {
    await api.post('/payments/mock-confirm', {
      booking_id: bookingId,
      status,
    });
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Khong the xac nhan thanh toan gia lap'));
  }
}

export async function savePassengerInfo(
  bookingId: string,
  data: {
    passengers: Array<{
      seat_id: string;
      passenger_name: string;
      passenger_id_card: string;
      date_of_birth?: string;
      gender?: 'MALE' | 'FEMALE' | 'OTHER';
      passenger_type: 'ADULT' | 'CHILD' | 'INFANT';
      contact_info: {
        phone: string;
        email: string;
      };
    }>;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const { data: response } = await api.post<{ success: boolean; message: string }>(
      `/passengers/${bookingId}/passengers`,
      data
    );
    if (!response.success) throw new Error(response.message ?? 'Khong the luu thong tin hanh khach');
    return response;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Khong the luu thong tin hanh khach'));
  }
}

export default api;

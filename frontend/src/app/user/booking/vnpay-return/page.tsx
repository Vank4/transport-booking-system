'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, Home, FileText, Loader2,
  Copy, Check, CreditCard, Calendar, Hash, ArrowRight,
} from 'lucide-react';
import { getPaymentStatus, getBookingDetails, verifyVnpayReturn } from '@/lib/api';
import { useBookingStore } from '@/store/bookingStore';
import type { PaymentInfo, BookingDetails } from '@/types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getMethodName(method: string): string {
  const names: Record<string, string> = {
    VNPAY: 'VNPay',
    MOMO: 'MoMo',
    PAYPAL: 'PayPal',
    MOCK: 'Mock (Test)',
  };
  return names[method] ?? method;
}

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const isMock = searchParams.get('mock') === 'true';
  const queryString = searchParams.toString();

  // VNPay return params
  const vnpResponseCode = searchParams.get('vnp_ResponseCode');

  const vnpOrderInfo = searchParams.get('vnp_OrderInfo');
  const vnpAmount = searchParams.get('vnp_Amount');
  const vnpTxnRef = searchParams.get('vnp_TxnRef');
  const vnpBankTranNo = searchParams.get('vnp_BankTranNo');
  const vnpPayDate = searchParams.get('vnp_PayDate');

  const { reset } = useBookingStore();

  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const isSuccess = payment?.status === 'SUCCESS';

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!bookingId && !vnpResponseCode) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        // If coming from VNPay redirect, verify the return first.
        // Use the serialized query string so the effect depends on a stable primitive.
        if (vnpResponseCode && !isMock) {
          await verifyVnpayReturn(queryString).catch(() => {});
        }

        if (bookingId) {
          const paymentData = await getPaymentStatus(bookingId);
          if (!cancelled) setPayment(paymentData);

          try {
            const bookingData = await getBookingDetails(bookingId);
            if (!cancelled) setBooking(bookingData);
          } catch {}
        } else if (vnpResponseCode) {
          const code = vnpOrderInfo ? vnpOrderInfo.split(' ').pop() : '';
          const rawAmount = parseInt(vnpAmount || '0');
          const amount = rawAmount > 0 ? rawAmount / 100 : 0;

          let formattedDate = new Date().toISOString();
          if (vnpPayDate && vnpPayDate.length === 14) {
            const year = vnpPayDate.substring(0, 4);
            const month = vnpPayDate.substring(4, 6);
            const day = vnpPayDate.substring(6, 8);
            const hour = vnpPayDate.substring(8, 10);
            const min = vnpPayDate.substring(10, 12);
            const sec = vnpPayDate.substring(12, 14);
            formattedDate = `${year}-${month}-${day}T${hour}:${min}:${sec}Z`;
          }

          if (!cancelled) {
            setPayment({
              _id: vnpTxnRef || '',
              booking_id: '',
              method: 'VNPAY',
              amount: amount,
              status: vnpResponseCode === '00' ? 'SUCCESS' : 'FAILED',
              transaction_id: vnpBankTranNo || '',
              paid_at: formattedDate,
              createdAt: formattedDate,
              updatedAt: formattedDate,
            });

            if (code && code !== 'hang') {
              setBooking({
                booking_summary: { code, type: 'FLIGHT', status: vnpResponseCode === '00' ? 'CONFIRMED' : 'FAILED' } as any,
                financials: { total_amount: amount } as any,
                passengers: []
              });
            }
          }
        }
      } catch {
        // Intentionally swallow here so the page can still render fallback details.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
      reset();
    };
  }, [bookingId, vnpResponseCode, isMock, queryString, vnpOrderInfo, vnpAmount, vnpTxnRef, vnpBankTranNo, vnpPayDate, reset]);

  const handleCopyCode = () => {
    const code = booking?.booking_summary.code ?? '';
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ─── Loading State ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-14 h-14 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Đang xác nhận giao dịch...</p>
          <p className="text-sm text-gray-400 mt-1">Vui lòng không đóng trang này</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg"
      >
        {/* Result card */}
        <div className="card text-center overflow-hidden">
          {/* Status icon with decorative background */}
          <div className={`
            relative -mx-6 -mt-6 px-6 pt-12 pb-8 mb-6
            ${isSuccess
              ? 'bg-gradient-to-b from-emerald-50 to-white'
              : 'bg-gradient-to-b from-red-50 to-white'
            }
          `}>
            {/* Decorative circles */}
            <div className="absolute inset-0 overflow-hidden">
              <div className={`
                absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10
                ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}
              `} />
              <div className={`
                absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-5
                ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}
              `} />
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative"
            >
              {isSuccess ? (
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto shadow-lg shadow-red-100">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative mt-5"
            >
              <h1 className={`text-2xl font-bold ${isSuccess ? 'text-emerald-700' : 'text-red-700'}`}>
                {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
              </h1>
              <p className="text-gray-500 mt-2 text-sm">
                {isSuccess
                  ? 'Cảm ơn bạn! Vé của bạn đã được xác nhận.'
                  : 'Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức khác.'}
              </p>
            </motion.div>
          </div>

          {/* Payment details */}
          {payment && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4 mb-6"
            >
              {/* Booking code */}
              {booking && (
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Hash className="w-4 h-4" />
                    <span>Mã đặt vé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-600 text-lg">
                      {booking.booking_summary.code}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Transaction ID */}
              {payment.transaction_id && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Mã giao dịch
                  </span>
                  <span className="font-mono text-sm text-gray-700">{payment.transaction_id}</span>
                </div>
              )}

              {/* Payment method */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Phương thức
                </span>
                <span className="font-medium text-sm text-gray-700">{getMethodName(payment.method)}</span>
              </div>

              {/* Amount */}
              {payment.amount > 0 && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500">Số tiền</span>
                  <span className="text-lg font-bold gradient-text">{formatCurrency(payment.amount)}</span>
                </div>
              )}

              {/* Date */}
              {payment.paid_at && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Thời gian
                  </span>
                  <span className="text-sm text-gray-700">{formatDateTime(payment.paid_at)}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            {isSuccess ? (
              <>
                <button
                  onClick={() => router.push(`/user/bookings/${bookingId}`)}
                  className="btn-primary w-full"
                >
                  <FileText className="w-4 h-4" />
                  Xem chi tiết booking
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="btn-secondary w-full"
                >
                  <Home className="w-4 h-4" />
                  Về trang chủ
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push(`/user/booking/payment?bookingId=${bookingId}`)}
                  className="btn-primary w-full"
                >
                  <ArrowRight className="w-4 h-4" />
                  Thử lại
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="btn-secondary w-full"
                >
                  <Home className="w-4 h-4" />
                  Về trang chủ
                </button>
              </>
            )}
          </motion.div>
        </div>

        {/* Footer note */}
        {/* Footer note: HIDDEN PER REQUEST */}
        {/* {isSuccess && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs text-gray-400 mt-4"
          >
            Email xác nhận đã được gửi đến hộp thư của bạn.
            Vui lòng kiểm tra email để xem thông tin vé.
          </motion.p>
        )} */}
      </motion.div>
    </div>
  );
}

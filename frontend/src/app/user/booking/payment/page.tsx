'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Loader2, AlertCircle, Shield, Lock,
  CreditCard, Wallet, Smartphone, Bug, ExternalLink,
  Receipt,
} from 'lucide-react';
import BookingSteps from '@/components/booking/BookingSteps';
import { getBookingDetails, createVnpayPayment, mockConfirmPayment } from '@/lib/api';
import { useBookingStore } from '@/store/bookingStore';
import type { BookingDetails, PaymentMethod } from '@/types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  badge?: string;
}

const isDev = process.env.NODE_ENV === 'development';

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'VNPAY',
    name: 'VNPay',
    description: 'Thanh toán qua cổng VNPay: thẻ ATM, Visa, MasterCard, mã QR',
    icon: <CreditCard className="w-6 h-6" />,
    available: true,
  },
  {
    id: 'MOMO',
    name: 'MoMo',
    description: 'Thanh toán qua ví điện tử MoMo',
    icon: <Smartphone className="w-6 h-6" />,
    available: false,
    badge: 'Sắp ra mắt',
  },
  {
    id: 'PAYPAL',
    name: 'PayPal',
    description: 'Thanh toán quốc tế qua PayPal',
    icon: <Wallet className="w-6 h-6" />,
    available: false,
    badge: 'Sắp ra mắt',
  },
  ...(isDev
    ? [
        {
          id: 'MOCK' as PaymentMethod,
          name: 'Mock (Dev Only)',
          description: 'Giả lập thanh toán thành công cho dev/test',
          icon: <Bug className="w-6 h-6" />,
          available: true,
          badge: 'DEV',
        },
      ]
    : []),
];

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const { bookingData, setBookingData, setPaymentMethod, voucherResult } = useBookingStore();

  const [booking, setBooking] = useState<BookingDetails | null>(bookingData);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('VNPAY');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!bookingData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (bookingData) {
      setBooking(bookingData);
      setPageLoading(false);
      return;
    }
    if (!bookingId) {
      setPageLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await getBookingDetails(bookingId);
        if (!cancelled) {
          setBooking(data);
          setBookingData(data);
        }
      } catch {
        if (!cancelled) setError('Không thể tải thông tin booking');
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId, bookingData, setBookingData]);

  const handlePayment = async () => {
    if (!bookingId || !agreedTerms) return;

    setLoading(true);
    setError(null);
    setPaymentMethod(selectedMethod);

    try {
      if (selectedMethod === 'VNPAY') {
        const paymentUrl = await createVnpayPayment(bookingId);
        window.location.href = paymentUrl;
      } else if (selectedMethod === 'MOCK') {
        await mockConfirmPayment(bookingId, 'SUCCESS');
        router.push(`/user/booking/vnpay-return?bookingId=${bookingId}&mock=true`);
      } else {
        setError('Phương thức thanh toán chưa được hỗ trợ');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi xử lý thanh toán';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = voucherResult?.final_total ?? booking?.financials.total_amount ?? 0;

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push(`/user/booking/checkout?bookingId=${bookingId}`)}
              className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Thanh toán</h1>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600">
              <Shield className="w-3.5 h-3.5" />
              <span className="font-medium">Thanh toán bảo mật</span>
            </div>
          </div>
          <BookingSteps currentStep={3} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-2">Chọn phương thức thanh toán</h2>
              <p className="text-sm text-gray-500 mb-6">Chọn cách bạn muốn thanh toán cho chuyến đi</p>

              <div className="space-y-3">
                {PAYMENT_OPTIONS.map((option) => {
                  const isSelected = selectedMethod === option.id;
                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => option.available && setSelectedMethod(option.id)}
                      disabled={!option.available}
                      whileTap={option.available ? { scale: 0.99 } : {}}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200
                        ${isSelected
                          ? 'border-brand-500 bg-brand-50/50 shadow-glow'
                          : option.available
                            ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            : 'border-gray-100 bg-gray-50/50 opacity-60 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'border-brand-500' : 'border-gray-300'}
                      `}>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2.5 h-2.5 rounded-full bg-brand-500"
                          />
                        )}
                      </div>

                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center
                        ${isSelected ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500'}
                      `}>
                        {option.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{option.name}</span>
                          {option.badge && (
                            <span className={`badge text-[10px] ${
                              option.badge === 'DEV' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {option.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{option.description}</p>
                      </div>

                      {isSelected && option.available && (
                        <ExternalLink className="w-4 h-4 text-brand-500 flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card"
            >
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 mt-0.5 cursor-pointer"
                />
                <div className="text-sm text-gray-600 leading-relaxed">
                  <span>Tôi đã đọc và đồng ý với </span>
                  <span className="text-brand-500 font-medium hover:underline">Điều khoản sử dụng</span>
                  <span> và </span>
                  <span className="text-brand-500 font-medium hover:underline">Chính sách hoàn/hủy vé</span>
                  <span>. Tôi xác nhận thông tin đặt vé là chính xác.</span>
                </div>
              </label>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-gray-900">Tóm tắt đơn hàng</h3>
              </div>

              {booking && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mã đặt vé</span>
                    <span className="font-mono font-semibold text-brand-600">
                      {booking.booking_summary.code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Loại vé</span>
                    <span className="font-medium">
                      {booking.booking_summary.type === 'FLIGHT' ? 'Máy bay' : 'Tàu hỏa'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Số hành khách</span>
                    <span className="font-medium">{booking.passengers.length} người</span>
                  </div>

                  {voucherResult && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Giảm giá ({voucherResult.voucher_code})</span>
                      <span className="font-medium">-{formatCurrency(voucherResult.discount_amount)}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-bold text-gray-900">Tổng thanh toán</span>
                    <span className="text-xl font-bold gradient-text">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <button
                onClick={handlePayment}
                disabled={!agreedTerms || loading}
                className="btn-primary w-full text-base py-4"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Thanh toán {formatCurrency(totalAmount)}
                  </>
                )}
              </button>

              <button
                onClick={() => router.push(`/user/booking/checkout?bookingId=${bookingId}`)}
                className="btn-secondary w-full"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </button>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Lock className="w-3 h-3" />
              <span>Mã hóa SSL 256-bit · Thanh toán an toàn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Tag, Loader2, AlertCircle, HeadphonesIcon } from 'lucide-react';
import BookingSteps from '@/components/booking/BookingSteps';
import TripDetailsCard from '@/components/booking/TripDetailsCard';
import PassengerList from '@/components/booking/PassengerList';
import PriceBreakdown from '@/components/booking/PriceBreakdown';
import CountdownTimer from '@/components/booking/CountdownTimer';
import { getBookingDetails } from '@/lib/api';
import { useBookingStore } from '@/store/bookingStore';
import type { BookingDetails } from '@/types';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const { setBookingId, setBookingData, bookingData: storeData, voucherResult } = useBookingStore();

  const [booking, setBooking] = useState<BookingDetails | null>(storeData);
  const [loading, setLoading] = useState(!storeData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!bookingId) {
      setError('Không tìm thấy mã booking trong URL');
      setLoading(false);
      return;
    }

    setBookingId(bookingId);

    if (storeData) {
      setBooking(storeData);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        if (!cancelled) setLoading(true);
        const data = await getBookingDetails(bookingId);
        if (!cancelled) {
          setBooking(data);
          setBookingData(data);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải thông tin booking';
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId, storeData, setBookingId, setBookingData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Đang tải thông tin đặt vé...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không thể tải thông tin</h2>
          <p className="text-gray-500 mb-6">{error ?? 'Booking không tồn tại'}</p>
          <button onClick={() => router.back()} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        </motion.div>
      </div>
    );
  }

  const { booking_summary, financials, passengers } = booking;

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-800" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Xác nhận đặt vé</h1>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-brand-600 rounded-full text-sm font-semibold hover:bg-orange-100 transition-colors">
              <HeadphonesIcon className="w-4 h-4" />
              Hỗ trợ 24/7
            </button>
          </div>

          <BookingSteps currentStep={2} />
        </div>
      </div>

      {booking.booking_summary.expires_at && (
        <CountdownTimer expiresAt={booking.booking_summary.expires_at} />
      )}

      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TripDetailsCard booking={booking_summary} />
            <PassengerList passengers={passengers} />
          </div>

          <div className="space-y-6">
            <PriceBreakdown
              passengers={passengers}
              financials={financials}
              voucherResult={voucherResult}
            />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <button
                onClick={() => router.push(`/user/booking/voucher?bookingId=${bookingId}`)}
                className="btn-outline w-full"
              >
                <Tag className="w-4 h-4" />
                {voucherResult ? 'Thay đổi mã giảm giá' : 'Áp dụng mã giảm giá'}
              </button>

              <button
                onClick={() => router.push(`/user/booking/payment?bookingId=${bookingId}`)}
                className="btn-primary w-full text-base py-4"
                disabled={booking_summary.status !== 'PENDING' && booking_summary.status !== 'WAITING_PAYMENT'}
              >
                <CreditCard className="w-5 h-5" />
                Tiến hành thanh toán
              </button>

              <button
                onClick={() => router.back()}
                className="btn-secondary w-full"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại chỉnh sửa
              </button>
            </motion.div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Lưu ý:</strong> Vé được giữ trong thời gian giới hạn.
                Vui lòng hoàn tất thanh toán trước khi hết thời gian giữ chỗ để tránh mất ghế.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Đang tải trang...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

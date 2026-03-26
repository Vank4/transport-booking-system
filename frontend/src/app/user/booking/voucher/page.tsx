'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Tag, Loader2, AlertCircle,
  CheckCircle, XCircle, Sparkles,
} from 'lucide-react';
import BookingSteps from '@/components/booking/BookingSteps';
import { applyVoucher, getBookingDetails } from '@/lib/api';
import { useBookingStore } from '@/store/bookingStore';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export default function VoucherPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const { bookingData, setBookingData, voucherResult, setVoucherResult } = useBookingStore();

  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!bookingData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(
    voucherResult ? `Mã ${voucherResult.voucher_code} đã được áp dụng!` : null
  );

  useEffect(() => {
    let cancelled = false;

    if (bookingData || !bookingId) {
      setPageLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await getBookingDetails(bookingId);
        if (!cancelled) setBookingData(data);
      } catch {
        // Ignore - user should go back to checkout
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId, bookingData, setBookingData]);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim() || !bookingId) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await applyVoucher(bookingId, voucherCode.trim());
      setVoucherResult(result);
      setSuccess(`Mã "${result.voucher_code}" áp dụng thành công! Bạn tiết kiệm ${formatCurrency(result.discount_amount)}`);

      const updated = await getBookingDetails(bookingId);
      setBookingData(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể áp dụng mã giảm giá';
      setError(message);
      setVoucherResult(null);
    } finally {
      setLoading(false);
    }
  };

  const totalBeforeDiscount = voucherResult?.old_total ?? bookingData?.financials.total_amount ?? 0;
  const totalAfterDiscount = voucherResult?.final_total ?? bookingData?.financials.total_amount ?? 0;
  const discountAmount = voucherResult?.discount_amount ?? 0;

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
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push(`/user/booking/checkout?bookingId=${bookingId}`)}
              className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Áp dụng mã giảm giá</h1>
          </div>
          <BookingSteps currentStep={2} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Nhập mã giảm giá</h2>
              <p className="text-sm text-gray-500">Nhập mã khuyến mại để được giảm giá cho chuyến đi</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="VD: TET2024, SALE50..."
              className="input-field flex-1 font-mono uppercase tracking-wider"
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyVoucher()}
            />
            <button
              onClick={handleApplyVoucher}
              disabled={loading || !voucherCode.trim()}
              className="btn-primary px-8"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Áp dụng
                </>
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
              >
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700"
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card"
        >
          <h3 className="font-semibold text-gray-900 mb-5">Chi tiết giá</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Giá gốc</span>
              <span className="font-medium text-gray-800">{formatCurrency(totalBeforeDiscount)}</span>
            </div>

            {discountAmount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl"
              >
                <span className="flex items-center gap-2 text-emerald-700">
                  <Tag className="w-4 h-4" />
                  Giảm giá ({voucherResult?.voucher_code})
                </span>
                <span className="font-bold text-emerald-700">-{formatCurrency(discountAmount)}</span>
              </motion.div>
            )}

            <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">Tổng thanh toán</span>
              <span className="text-2xl font-bold gradient-text">{formatCurrency(totalAfterDiscount)}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-4 bg-amber-50 border border-amber-100 rounded-xl"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 leading-relaxed space-y-1">
              <p><strong>Lưu ý khi sử dụng mã giảm giá:</strong></p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Mỗi booking chỉ áp dụng được một mã giảm giá</li>
                <li>Mã có thể yêu cầu giá trị đơn hàng tối thiểu</li>
                <li>Vui lòng kiểm tra hạn sử dụng của mã</li>
                <li>Mã đã hết lượt sử dụng sẽ không thể áp dụng</li>
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <button
            onClick={() => router.push(`/user/booking/checkout?bookingId=${bookingId}`)}
            className="btn-secondary flex-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
          <button
            onClick={() => router.push(`/user/booking/payment?bookingId=${bookingId}`)}
            className="btn-primary flex-1"
          >
            Tiếp tục thanh toán
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

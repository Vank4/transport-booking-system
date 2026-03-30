"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function AdminBookingDetailsPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const bookingId = unwrappedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bookingData, setBookingData] = useState<any>(null);
  
  const statusOptions = ["PENDING", "WAITING_PAYMENT", "CONFIRMED", "CANCELLED", "EXPIRED"];
  const [status, setStatus] = useState("");

  const fetchBooking = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/admin/bookings/${bookingId}`);
      setBookingData(res.data.data);
      setStatus(res.data.data.booking.status);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Lỗi tải thông tin đơn hàng");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const handleUpdateStatus = async () => {
    if (!window.confirm(`Xác nhận chuyển trạng thái đơn hàng sang ${status}?`)) return;
    try {
      setIsSaving(true);
      await api.put(`/admin/bookings/${bookingId}/status`, { status });
      alert("Cập nhật trạng thái thành công!");
      fetchBooking(); // refresh
    } catch (err: any) {
      alert(err?.response?.data?.message || "Lỗi khi cập nhật.");
      setStatus(bookingData?.booking?.status); // Khôi phục lại
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">hourglass_empty</span>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <span className="material-symbols-outlined text-4xl text-red-500">error</span>
        <p className="text-red-500">{error || "Không tìm thấy dữ liệu"}</p>
        <Link href="/admin/bookings" className="text-orange-500 hover:underline">Quay lại danh sách</Link>
      </div>
    );
  }

  const { booking, tripDetails, tickets, payments } = bookingData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="flex flex-col max-w-[1000px] mx-auto flex-1 gap-6 pb-12">
      <div className="flex flex-col gap-2">
        <Link href="/admin/bookings" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-orange-500 w-fit transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại danh sách
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
            Chi tiết Đơn hàng: <span className="text-orange-600 uppercase">{booking.booking_code}</span>
          </h1>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Trạng thái:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border-0 py-2 pl-3 pr-8 text-slate-900 bg-slate-50 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm font-bold shadow-sm"
            >
              {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <button
              onClick={handleUpdateStatus}
              disabled={isSaving || status === booking.status}
              className="flex items-center justify-center rounded-lg px-4 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-sm font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition"
            >
              {isSaving ? "Cập nhật..." : "Lưu"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Thông tin Tổng quan Khách & Hệ thống */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 flex flex-col gap-4">
            <h3 className="font-bold text-lg border-b border-slate-100 dark:border-slate-800 pb-2">Người đặt vé</h3>
            {booking.user_id ? (
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white">{booking.user_id.full_name}</span>
                    <span className="text-sm text-slate-500">{booking.user_id.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">call</span>
                  {booking.user_id.phone || "N/A"}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                 <span className="material-symbols-outlined text-3xl text-slate-300">incognito</span>
                 <span className="mt-2 text-sm font-medium text-slate-500">Khách vãng lai</span>
              </div>
            )}
            
            <hr className="border-slate-100 dark:border-slate-800" />
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Loại Đặt chỗ:</span>
              <span className="font-bold">{booking.booking_type === "FLIGHT" ? "HÀNG KHÔNG" : "ĐƯỜNG SẮT"}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Ngày tạo đơn:</span>
              <span className="font-medium">{formatDate(booking.created_at)}</span>
            </div>
            {booking.expires_at && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Hạn thanh toán:</span>
                <span className="font-medium text-red-500">{formatDate(booking.expires_at)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-slate-500">TỔNG TIỀN:</span>
              <span className="font-black text-xl text-orange-600">{formatCurrency(booking.total_amount)}</span>
            </div>
            {booking.voucher_applied && (
              <div className="flex justify-between items-center text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg mt-2 font-semibold border border-green-100">
                <span>Voucher đã dùng:</span>
                <span className="uppercase">{booking.voucher_applied}</span>
              </div>
            )}
          </div>
        </div>

        {/* Thông tin Chi tiết Chuyến đi & Vé */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-5 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500">directions_boat_filled</span> {/* generic */}
                  Chi tiết Lịch trình
                </h3>
             </div>
             <div className="p-5 flex flex-col gap-4">
                {booking.booking_type === "FLIGHT" && tripDetails ? (
                   <div className="flex flex-col gap-4">
                     <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-black">{tripDetails.departure_airport_id?.iata_code}</span>
                          <span className="text-xs text-slate-500">{tripDetails.departure_airport_id?.city}</span>
                        </div>
                        <div className="flex flex-col items-center px-4 flex-1">
                          <span className="text-xs font-semibold text-slate-400 mb-1">{tripDetails.airline_id?.name} ({tripDetails.flight_number})</span>
                          <div className="w-full border-t-2 border-dashed border-slate-300 dark:border-slate-600 relative">
                             <span className="material-symbols-outlined absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-50 dark:bg-[#121b2f] px-2 text-slate-400 rotate-90">flight</span>
                          </div>
                        </div>
                         <div className="flex flex-col items-center">
                          <span className="text-2xl font-black">{tripDetails.arrival_airport_id?.iata_code}</span>
                          <span className="text-xs text-slate-500">{tripDetails.arrival_airport_id?.city}</span>
                        </div>
                     </div>
                     <div className="flex justify-between text-sm w-full font-medium">
                        <span>Khởi hành: <span className="text-slate-600 dark:text-slate-300">{formatDate(tripDetails.departure_time)}</span></span>
                        <span>Đến nơi: <span className="text-slate-600 dark:text-slate-300">{formatDate(tripDetails.arrival_time)}</span></span>
                     </div>
                   </div>
                ) : booking.booking_type === "TRAIN" && tripDetails ? (
                   <div className="flex flex-col gap-4">
                     <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <div className="flex flex-col items-start w-[100px]">
                          <span className="text-lg font-black">{tripDetails.departure_station_id?.city}</span>
                          <span className="text-xs text-slate-500">{tripDetails.departure_station_id?.name}</span>
                        </div>
                        <div className="flex flex-col items-center px-4 flex-1">
                          <span className="text-xs font-semibold text-slate-400 mb-1">{tripDetails.train_id?.name}</span>
                          <div className="w-full border-t-2 border-dashed border-slate-300 dark:border-slate-600 relative">
                             <span className="material-symbols-outlined absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-emerald-50 dark:bg-[#0d221c] px-2 text-slate-400">train</span>
                          </div>
                        </div>
                         <div className="flex flex-col items-end w-[100px]">
                          <span className="text-lg font-black">{tripDetails.arrival_station_id?.city}</span>
                          <span className="text-xs text-slate-500">{tripDetails.arrival_station_id?.name}</span>
                        </div>
                     </div>
                     <div className="flex justify-between text-sm w-full font-medium">
                        <span>Cất chuyến: <span className="text-slate-600 dark:text-slate-300">{formatDate(tripDetails.departure_time)}</span></span>
                        <span>Tới bến: <span className="text-slate-600 dark:text-slate-300">{formatDate(tripDetails.arrival_time)}</span></span>
                     </div>
                   </div>
                ) : (
                  <div className="text-slate-500 italic">Dữ liệu chuyến đi không còn tồn tại do đã bị xoá.</div>
                )}
             </div>
          </div>

          {/* Danh sách Hành khách (Vé) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500">groups</span>
                  Danh sách Hành khách ({tickets.length})
                </h3>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left whitespace-nowrap">
                 <thead className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase text-slate-500">
                   <tr>
                     <th className="px-5 py-3 font-semibold">Hành khách</th>
                     <th className="px-5 py-3 font-semibold">CCCD / CMND</th>
                     <th className="px-5 py-3 font-semibold text-center">Ghế / Hạng</th>
                     <th className="px-5 py-3 font-semibold text-right">Giá tiền</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800 pb-2">
                   {tickets.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-slate-500 italic">Chưa có vé được xuất.</td>
                      </tr>
                   ) : tickets.map((t: any) => (
                      <tr key={t._id}>
                        <td className="px-5 py-4">
                           <div className="flex flex-col">
                             <span className="font-bold text-slate-900 dark:text-white uppercase">{t.passenger_name}</span>
                             <span className="text-[10px] text-slate-500">{t.passenger_type} • {t.gender || "N/A"}</span>
                           </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium">{t.passenger_id_card}</td>
                        <td className="px-5 py-4 text-center">
                           <div className="flex flex-col items-center">
                             <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-sm font-bold border border-slate-200 dark:border-slate-700">{t.seat_id?.seat_number || 'N/A'}</span>
                             <span className="text-[10px] text-slate-500 mt-1 uppercase">{t.seat_id?.class}</span>
                           </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                           <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(t.final_price)}</span>
                        </td>
                      </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>

          {/* Lịch sử giao dịch */}
          {payments && payments.length > 0 && (
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-500">payments</span>
                      Lịch sử Giao dịch
                    </h3>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {payments.map((payment: any) => (
                    <div key={payment._id} className="flex justify-between items-center border border-slate-100 dark:border-slate-800 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">Giao dịch {payment.method}</span>
                        <span className="text-[11px] text-slate-400 font-mono mt-0.5">{payment.transaction_id || payment._id}</span>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className={`font-bold text-sm ${payment.status === 'SUCCESS' ? 'text-green-600' : payment.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'}`}>
                           {formatCurrency(payment.amount)}
                         </span>
                         <span className="text-[10px] text-slate-500">
                           {payment.status} • {formatDate(payment.created_at)}
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}

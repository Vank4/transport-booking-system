'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import config from '@/config';
import {
  Plane, ChevronLeft, Info, Users, Briefcase,
  ShieldCheck, CheckCircle2, Loader2
} from 'lucide-react';

// --- HÀM FORMAT TIỆN ÍCH ---
function formatCurrency(value?: number | null) {
  return `${(value ?? 0).toLocaleString("vi-VN")} VND`;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(parsed);
}

function formatTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--:--";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit", minute: "2-digit",
  }).format(parsed);
}

function getDurationLabel(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return "--";
  const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());
  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} phút`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}p`;
}

export default function FlightDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [flight, setFlight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFareIndex, setSelectedFareIndex] = useState(0);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await axios.get(`${config.apiBaseUrl}/flights/${id}`);
        if (response.data.success) setFlight(response.data.data);
      } catch (err) {
        console.error("Lỗi lấy chi tiết:", err);
      } finally { setLoading(false); }
    };
    fetchDetail();
  }, [id]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#eef4fb]">
      <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
    </div>
  );

  if (!flight) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#eef4fb]">
      <div className="rounded-[24px] border border-slate-200 bg-white px-10 py-12 text-center shadow-sm">
        <Plane className="mx-auto h-12 w-12 text-slate-300 mb-4" />
        <p className="text-xl font-black text-slate-900">Không tìm thấy thông tin chuyến bay</p>
        <button onClick={() => router.back()} className="mt-6 text-sky-600 font-bold hover:underline">Quay lại trang tìm kiếm</button>
      </div>
    </div>
  );

  // 🔥 ĐÃ FIX CONFLICT: Giữ nguyên logic mới dùng `selectedFareIndex`
  const fares: any[] = flight.fares || [];
  const selectedFare = fares[selectedFareIndex] || fares[0] || null;
  const currentPrice = selectedFare ? (selectedFare.promo_price ?? selectedFare.base_price) : 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#edf4fb_38%,#e8eef6_100%)] pt-4 pb-12 text-slate-900">
      <div className="max-w-[1140px] mx-auto px-4 md:px-5">

        {/* --- BREADCRUMB --- */}
        <div className="flex items-center gap-2 text-[0.85rem] font-semibold text-slate-500 mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-sky-600 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Quay lại kết quả
          </button>
          <span className="text-slate-300">|</span>
          <span className="text-slate-800">Chi tiết chuyến bay</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">

          {/* --- CỘT TRÁI: CHI TIẾT --- */}
          <div className="space-y-6">

            {/* 1. Header & Tuyến bay */}
            <section className="rounded-[24px] border border-slate-200/90 bg-white/95 p-6 md:p-8 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur-sm">
              <div className="mb-8">
                <h1 className="text-[1.8rem] font-black tracking-tight text-slate-950">Chi tiết hành trình</h1>
                <p className="mt-1.5 text-[0.95rem] text-slate-600">
                  Mã chuyến: <span className="font-bold text-slate-800">{flight.flight_number}</span> • {formatDate(flight.departure_time)}
                </p>
              </div>

              {/* Timeline chuyến bay */}
              <div className="relative rounded-[20px] border border-slate-100 bg-slate-50/50 p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  
                  {/* Hãng bay */}
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white border border-slate-200 text-sky-600 shadow-sm font-black text-xl italic">
                      {flight.airline_id?.iata_code || "FL"}
                    </div>
                    <div>
                      <p className="text-[1.1rem] font-black text-slate-950">{flight.airline_id?.name}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Airbus A321</span>
                      </div>
                    </div>
                  </div>

                  {/* Giờ bay */}
                  <div className="flex flex-1 items-center gap-4 w-full">
                    <div className="text-center w-20">
                      <p className="text-2xl font-black text-slate-950">{formatTime(flight.departure_time)}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{flight.departure_airport_id?.iata_code}</p>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center">
                      <span className="text-[11px] font-bold text-slate-400 mb-2">{getDurationLabel(flight.departure_time, flight.arrival_time)}</span>
                      <div className="w-full flex items-center">
                        <div className="h-2 w-2 rounded-full border-2 border-sky-400 bg-white"></div>
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-sky-200 via-sky-400 to-sky-200 border-dashed"></div>
                        <Plane className="h-5 w-5 text-sky-500 mx-2" />
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-sky-200 via-sky-400 to-sky-200"></div>
                        <div className="h-2 w-2 rounded-full bg-sky-500"></div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">Bay thẳng</span>
                    </div>

                    <div className="text-center w-20">
                      <p className="text-2xl font-black text-slate-950">{formatTime(flight.arrival_time)}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{flight.arrival_airport_id?.iata_code}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Tiện ích & Hành lý */}
            <section className="rounded-[24px] border border-slate-200/90 bg-white/95 p-6 md:p-8 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur-sm">
              <h3 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-sky-600" /> Hành lý & Tiện ích
              </h3>
              {selectedFare ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-3 items-start p-4 rounded-[16px] border border-slate-100 bg-slate-50/50">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Hành lý xách tay</p>
                    <p className="text-xs text-slate-500 mt-1">{selectedFare.carry_on_kg}kg (01 kiện kích thước chuẩn) và 01 túi xách nhỏ.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start p-4 rounded-[16px] border border-slate-100 bg-slate-50/50">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Hành lý ký gửi</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedFare.baggage_kg > 0
                        ? `Miễn phí ${selectedFare.baggage_kg}kg`
                        : 'Mua thêm khi đặt chỗ'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start p-4 rounded-[16px] border border-slate-100 bg-slate-50/50">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Đổi/Hoàn vé</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedFare.is_refundable ? 'Được hoàn vé' : 'Không hoàn vé'}
                      {' • '}
                      {selectedFare.change_fee === 0
                        ? 'Miễn phí đổi chuyến'
                        : `Phí đổi chuyến: ${formatCurrency(selectedFare.change_fee)}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start p-4 rounded-[16px] border border-slate-100 bg-slate-50/50">
                  <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Thủ tục bay</p>
                    <p className="text-xs text-slate-500 mt-1">Quầy thủ tục đóng trước 40 phút so với giờ khởi hành.</p>
                  </div>
                </div>
              </div>
              ) : (
                <p className="text-sm text-slate-500">Chưa có thông tin hạng vé.</p>
              )}
            </section>

            {/* 3. Chọn Hạng Vé */}
            <section className="rounded-[24px] border border-slate-200/90 bg-white/95 p-6 md:p-8 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur-sm">
              <h3 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" /> Chọn hạng vé
              </h3>
              <div className="grid gap-4">
                {fares.map((fare: any, idx: number) => {
                  const isSelected = selectedFareIndex === idx;
                  const effectivePrice = fare.promo_price ?? fare.base_price;
                  const cabinLabel: Record<string, string> = {
                    ECONOMY: 'Phổ thông',
                    PREMIUM_ECONOMY: 'Phổ thông đặc biệt',
                    BUSINESS: 'Thương gia',
                    FIRST_CLASS: 'Hạng nhất',
                  };
                  return (
                    <label
                      key={fare._id || idx}
                      className={`relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-[20px] border-2 cursor-pointer transition-all ${
                        isSelected
                        ? 'border-sky-500 bg-sky-50/40 shadow-sm'
                        : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="seatClass"
                        className="hidden"
                        checked={isSelected}
                        onChange={() => setSelectedFareIndex(idx)}
                      />

                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${isSelected ? 'border-sky-500' : 'border-slate-300'}`}>
                          {isSelected && <div className="w-3 h-3 bg-sky-500 rounded-full"></div>}
                        </div>
                        <div>
                          <p className={`text-[1.1rem] font-black ${isSelected ? 'text-sky-700' : 'text-slate-800'}`}>
                            {fare.fare_name}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 mt-1">
                            {cabinLabel[fare.cabin_class] || fare.cabin_class}
                            {' • '}
                            {fare.baggage_kg > 0 ? `Ký gửi ${fare.baggage_kg}kg` : 'Không kèm ký gửi'}
                            {' • '}
                            {fare.is_refundable ? 'Hoàn vé' : 'Không hoàn'}
                          </p>
                        </div>
                      </div>
                      <div className="sm:text-right ml-10 sm:ml-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Giá từ / khách</p>
                        {/* 🔥 ĐÃ FIX CONFLICT: Giá dựa theo thẻ được chọn */}
                        <p className={`text-xl font-black ${isSelected ? 'text-sky-700' : 'text-slate-900'}`}>
                          {formatCurrency(effectivePrice)}
                        </p>
                        {fare.promo_price != null && (
                          <p className="text-xs text-slate-400 line-through">{formatCurrency(fare.base_price)}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
          </div>

          {/* --- CỘT PHẢI: SUMMARY SIDEBAR --- */}
          <aside className="lg:sticky lg:top-24">
            <section className="rounded-[24px] border border-slate-200/90 bg-white/95 p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] backdrop-blur-sm flex flex-col h-full">
              <h2 className="text-xl font-black text-slate-950 mb-6 border-b border-slate-100 pb-4">Tóm tắt đặt chỗ</h2>
              
              <div className="space-y-5 flex-1">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold text-slate-500">Chuyến bay</p>
                  <p className="text-sm font-black text-slate-800">{flight.flight_number}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold text-slate-500">Hạng vé</p>
                  <p className="text-sm font-black text-sky-600">{selectedFare?.fare_name || '—'}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold text-slate-500">Trạng thái</p>
                  <p className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">Còn chỗ</p>
                </div>

                <div className="border-t border-slate-200/80 pt-5 mt-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Tổng cộng (1 khách)</p>
                  <p className="text-[1.8rem] font-black tracking-tight text-slate-950">{formatCurrency(currentPrice)}</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1 italic">* Giá đã bao gồm thuế & phí</p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {/* 🔥 ĐÃ FIX CONFLICT: Route theo selectedFare */}
                <button
                  onClick={() => router.push(`/user/bookings/seat-map?tripId=${flight._id}&class=${selectedFare?.cabin_class?.toLowerCase() || 'economy'}&type=flight`)}
                  className="flex w-full min-h-[3rem] items-center justify-center rounded-full bg-[linear-gradient(135deg,#88dbff_0%,#32afff_100%)] px-4 text-[0.95rem] font-black text-slate-950 shadow-[0_12px_24px_rgba(50,175,255,0.20)] transition hover:-translate-y-0.5 active:translate-y-0"
                >
                  Chọn ghế ngồi
                </button>

                <button
                  onClick={() => router.back()}
                  className="flex w-full min-h-[3rem] items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-[0.95rem] font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Đổi chuyến khác
                </button>
              </div>
            </section>
          </aside>

        </div>
      </div>
    </div>
  );
}
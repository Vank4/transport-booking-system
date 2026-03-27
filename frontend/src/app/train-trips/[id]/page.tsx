'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import config from '@/config';
import { 
    Train, ChevronLeft, Info, Users, Briefcase, 
    ShieldCheck, CheckCircle2, Loader2, ArrowRight 
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

export default function TrainTripDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    
    const [trip, setTrip] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState('economy');

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const response = await axios.get(`${config.apiBaseUrl}/train-trips/${id}`);
                if (response.data.success) {
                    setTrip(response.data.data);
                    if (response.data.data.prices) {
                        const availableClasses = Object.keys(response.data.data.prices);
                        if (availableClasses.length > 0) setSelectedClass(availableClasses[0]);
                    }
                }
            } catch (err) {
                console.error("Lỗi lấy chi tiết tàu:", err);
            } finally { setLoading(false); }
        };
        fetchDetail();
    }, [id]);

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#fffbfa]">
            <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
        </div>
    );

    if (!trip) return (
        <div className="flex h-screen flex-col items-center justify-center bg-[#fffbfa]">
            <div className="rounded-[24px] border border-slate-200 bg-white px-10 py-12 text-center shadow-sm">
                <Train className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <p className="text-xl font-black text-slate-900">Không tìm thấy thông tin chuyến tàu này</p>
                <button onClick={() => router.back()} className="mt-6 text-orange-600 font-bold hover:underline">Quay lại trang tìm kiếm</button>
            </div>
        </div>
    );

    const currentPrice = trip.prices?.[selectedClass] || 0;

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fffbf7_0%,#fff0e6_38%,#ffe4d6_100%)] pt-4 pb-12 text-slate-900">
            <div className="max-w-[1140px] mx-auto px-4 md:px-5">

                {/* --- BREADCRUMB --- */}
                <div className="flex items-center gap-2 text-[0.85rem] font-semibold text-slate-500 mb-6">
                    <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-orange-600 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Quay lại kết quả
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-800">Chi tiết chuyến tàu</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">

                    {/* --- CỘT TRÁI: CHI TIẾT --- */}
                    <div className="space-y-6">

                        {/* 1. Header & Tuyến đường */}
                        <section className="rounded-[24px] border border-slate-200/90 bg-white/95 p-6 md:p-8 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur-sm">
                            <div className="mb-8">
                                <h1 className="text-[1.8rem] font-black tracking-tight text-slate-950">Chi tiết hành trình</h1>
                                <p className="mt-1.5 text-[0.95rem] text-slate-600">
                                    Mã tàu: <span className="font-bold text-slate-800">{trip.train_id?.train_number}</span> • {formatDate(trip.departure_time)}
                                </p>
                            </div>

                            {/* Timeline chuyến tàu */}
                            <div className="relative rounded-[20px] border border-slate-100 bg-slate-50/50 p-6">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                    
                                    {/* Hãng tàu */}
                                    <div className="flex items-center gap-4 min-w-[200px]">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white border border-slate-200 text-orange-600 shadow-sm">
                                            <Train className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-[1.1rem] font-black text-slate-950">{trip.train_id?.name || 'Đường Sắt VN'}</p>
                                            <div className="flex gap-2 mt-1">
                                                <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Tàu khách SE</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Giờ khởi hành */}
                                    <div className="flex flex-1 items-center gap-4 w-full">
                                        <div className="text-center w-24">
                                            <p className="text-2xl font-black text-slate-950">{formatTime(trip.departure_time)}</p>
                                            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 line-clamp-1" title={trip.departure_station_id?.name}>{trip.departure_station_id?.name}</p>
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col items-center">
                                            <span className="text-[11px] font-bold text-slate-400 mb-2">{getDurationLabel(trip.departure_time, trip.arrival_time)}</span>
                                            <div className="w-full flex items-center">
                                                <div className="h-2 w-2 rounded-full border-2 border-orange-400 bg-white"></div>
                                                <div className="h-[2px] flex-1 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200 border-dashed"></div>
                                                <div className="h-[2px] flex-1 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200"></div>
                                                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">Trực tiếp</span>
                                        </div>

                                        <div className="text-center w-24">
                                            <p className="text-2xl font-black text-slate-950">{formatTime(trip.arrival_time)}</p>
                                            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 line-clamp-1" title={trip.arrival_station_id?.name}>{trip.arrival_station_id?.name}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Tiện ích & Quy định */}
                        <section className="rounded-[24px] border border-slate-200/90 bg-white/95 p-6 md:p-8 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur-sm">
                            <h3 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-orange-600" /> Quy định hành lý & Di chuyển
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex gap-3 items-start p-4 rounded-[16px] border border-slate-100 bg-slate-50/50">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">Hành lý mang theo</p>
                                        <p className="text-xs text-slate-500 mt-1">Tối đa 20kg/người, gọn gàng dễ di chuyển.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start p-4 rounded-[16px] border border-slate-100 bg-slate-50/50">
                                    <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">Thời gian ra ga</p>
                                        <p className="text-xs text-slate-500 mt-1">Có mặt tại ga ít nhất 30 phút trước giờ tàu chạy.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start p-4 rounded-[16px] border border-slate-100 bg-slate-50/50">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">Giấy tờ tùy thân</p>
                                        <p className="text-xs text-slate-500 mt-1">Xuất trình CCCD hoặc Passport khớp với vé khi lên tàu.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start p-4 rounded-[16px] border border-slate-100 bg-slate-50/50">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">Đổi/Hoàn vé</p>
                                        <p className="text-xs text-slate-500 mt-1">Áp dụng theo quy định hiện hành của ngành đường sắt.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. Chọn Hạng Ghế */}
                        <section className="rounded-[24px] border border-slate-200/90 bg-white/95 p-6 md:p-8 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur-sm">
                            <h3 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                                <Users className="w-5 h-5 text-orange-600" /> Chọn loại chỗ
                            </h3>
                            <div className="grid gap-4">
                                {[
                                    { id: 'economy', name: 'Ghế ngồi (Cứng/Mềm)', desc: 'Điều hòa • Giá tiết kiệm nhất' },
                                    { id: 'premium', name: 'Giường nằm Khoang 6', desc: 'Thoải mái • Có gối mền • Phù hợp đi nhóm' },
                                    { id: 'business', name: 'Giường nằm Khoang 4', desc: 'Cao cấp • Không gian riêng tư • Yên tĩnh' }
                                ]
                                    .filter(cls => trip.prices && trip.prices[cls.id])
                                    .map((cls) => (
                                        <label 
                                            key={cls.id} 
                                            className={`relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-[20px] border-2 cursor-pointer transition-all ${
                                                selectedClass === cls.id 
                                                ? 'border-orange-500 bg-orange-50/40 shadow-sm' 
                                                : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50/50'
                                            }`}
                                        >
                                            {/* 🔥 FIX: Thêm thẻ input bị ẩn để nhận sự kiện */}
                                            <input 
                                                type="radio" 
                                                name="trainClass" 
                                                className="hidden" 
                                                checked={selectedClass === cls.id} 
                                                onChange={() => setSelectedClass(cls.id)} 
                                            />

                                            <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                                <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${selectedClass === cls.id ? 'border-orange-500' : 'border-slate-300'}`}>
                                                    {selectedClass === cls.id && <div className="w-3 h-3 bg-orange-500 rounded-full"></div>}
                                                </div>
                                                <div>
                                                    <p className={`text-[1.1rem] font-black ${selectedClass === cls.id ? 'text-orange-700' : 'text-slate-800'}`}>{cls.name}</p>
                                                    <p className="text-xs font-semibold text-slate-500 mt-1">{cls.desc}</p>
                                                </div>
                                            </div>
                                            <div className="sm:text-right ml-10 sm:ml-0">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Giá từ / khách</p>
                                                <p className={`text-xl font-black ${selectedClass === cls.id ? 'text-orange-700' : 'text-slate-900'}`}>
                                                    {formatCurrency(trip.prices?.[cls.id])}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                            </div>
                        </section>
                    </div>

                    {/* --- CỘT PHẢI: SUMMARY SIDEBAR --- */}
                    <aside className="lg:sticky lg:top-24">
                        <section className="rounded-[24px] border border-slate-200/90 bg-white/95 p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] backdrop-blur-sm flex flex-col h-full">
                            <h2 className="text-xl font-black text-slate-950 mb-6 border-b border-slate-100 pb-4">Tóm tắt vé tàu</h2>
                            
                            <div className="space-y-5 flex-1">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-semibold text-slate-500">Mã chuyến</p>
                                    <p className="text-sm font-black text-slate-800">{trip.train_id?.train_number}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-semibold text-slate-500">Loại chỗ</p>
                                    <p className="text-sm font-black text-orange-600 capitalize">
                                        {selectedClass === 'economy' ? 'Ghế ngồi' : selectedClass === 'premium' ? 'Giường khoang 6' : 'Giường khoang 4'}
                                    </p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-semibold text-slate-500">Trạng thái</p>
                                    <p className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">Còn vé</p>
                                </div>

                                <div className="border-t border-slate-200/80 pt-5 mt-5">
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Tổng cộng (1 khách)</p>
                                    <p className="text-[1.8rem] font-black tracking-tight text-orange-600">{formatCurrency(currentPrice)}</p>
                                    <p className="text-[10px] font-semibold text-slate-400 mt-1 italic">* Giá có thể thay đổi theo vị trí ghế</p>
                                </div>
                            </div>

                            <div className="mt-8 space-y-3">
                                <button
                                    onClick={() => router.push(`/user/bookings/seat-map?tripId=${trip._id}&class=${selectedClass}&type=train`)}
                                    className="flex w-full min-h-[3rem] items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffb75e_0%,#ea580c_100%)] px-4 text-[0.95rem] font-black text-white shadow-[0_12px_24px_rgba(234,88,12,0.25)] transition hover:-translate-y-0.5 active:translate-y-0 gap-2"
                                >
                                    Chọn toa & chỗ <ArrowRight size={18} />
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

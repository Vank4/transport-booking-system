"use client";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/components/admin/ToastProvider";

export default function AdminEditFlightPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const isNew = unwrappedParams.id === "new";
  const flightId = isNew ? null : unwrappedParams.id;

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [airlines, setAirlines] = useState([]);
  const [airports, setAirports] = useState([]);

  const [formData, setFormData] = useState({
    airline_id: "",
    flight_number: "",
    departure_airport_id: "",
    arrival_airport_id: "",
    departure_time: "",
    arrival_time: "",
    status: "SCHEDULED",
    prices: {
      economy: 1500000,
      business: 3000000
    }
  });

  const formatLocalDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [airlinesRes, airportsRes] = await Promise.all([
          api.get('/airlines?limit=100'),
          api.get('/airports?limit=100')
        ]);
        setAirlines(airlinesRes.data.data.airlines);
        setAirports(airportsRes.data.data.airports);
      } catch (err: any) {
        console.error("Failed to load dependencies", err);
      }
    };
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (isNew) return;
    const fetchFlight = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/flights/${flightId}`);
        const data = res.data.data;
        setFormData({
          airline_id: data.airline_id?._id || data.airline_id || "",
          flight_number: data.flight_number || "",
          departure_airport_id: data.departure_airport_id?._id || data.departure_airport_id || "",
          arrival_airport_id: data.arrival_airport_id?._id || data.arrival_airport_id || "",
          departure_time: formatLocalDate(data.departure_time),
          arrival_time: formatLocalDate(data.arrival_time),
          status: data.status || "SCHEDULED",
          prices: {
            economy: data.prices?.economy ?? 1500000,
            business: data.prices?.business ?? 3000000
          }
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Lỗi tải thông tin chuyến bay");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFlight();
  }, [flightId, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    if (id.startsWith("prices.")) {
      const priceKey = id.split(".")[1];
      setFormData({
        ...formData,
        prices: { ...formData.prices, [priceKey]: Number(value) }
      });
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // -- VALIDATION --
    if (formData.departure_airport_id === formData.arrival_airport_id) {
      toast.error("Lỗi lộ trình", "Sân bay đến không thể trùng với sân bay đi");
      return;
    }

    const depDate = new Date(formData.departure_time);
    const arrDate = new Date(formData.arrival_time);
    if (arrDate <= depDate) {
      toast.error("Lỗi thời gian", "Thời gian hạ cánh phải sau thời gian cất cánh");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        departure_time: depDate.toISOString(),
        arrival_time: arrDate.toISOString(),
      };

      if (isNew) {
        await api.post(`/flights`, payload);
        toast.success("Thành công", "Đã thêm chuyến bay mới vào hệ thống");
      } else {
        await api.put(`/flights/${flightId}`, payload);
        toast.success("Thành công", "Thông tin chuyến bay đã được cập nhật");
      }
      router.push("/admin/flights");
    } catch (err: any) {
      toast.error("Lỗi", err?.response?.data?.message || "Không thể lưu dữ liệu. Vui lòng kiểm tra lại.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-5xl text-orange-500">progress_activity</span>
          <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border-0 py-3 px-4 text-slate-900 bg-slate-50 ring-1 ring-inset ring-slate-200 dark:bg-slate-800/50 dark:text-white dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm transition-all shadow-sm";
  const labelCls = "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 px-1";

  return (
    <div className="flex flex-col max-w-[1000px] mx-auto flex-1 gap-6 pb-20">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col gap-2">
        <Link href="/admin/flights" className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-orange-500 transition-colors w-fit">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Danh sách chuyến bay
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-3xl">flight</span>
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">
              {isNew ? "Tạo Chuyến bay" : "Chỉnh sửa Chuyến bay"}
            </h1>
            <p className="text-slate-500 text-sm">{isNew ? "Nhập thông tin để thiết lập lịch trình bay mới" : `Mã chuyến: ${formData.flight_number}`}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: General Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-orange-500">info</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thông tin hành trình</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="flight_number" className={labelCls}>Số hiệu chuyến bay <span className="text-red-500">*</span></label>
                <input type="text" id="flight_number" value={formData.flight_number} onChange={handleChange} required className={`${inputCls} font-mono uppercase text-lg font-bold`} placeholder="VD: VN123" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="airline_id" className={labelCls}>Hãng hàng không <span className="text-red-500">*</span></label>
                <select id="airline_id" value={formData.airline_id} onChange={handleChange} required className={inputCls}>
                  <option value="" disabled>-- Chọn Hãng bay --</option>
                  {airlines.map((a: any) => (
                    <option key={a._id} value={a._id}>{a.name} ({a.iata_code})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 pt-2">
                <label htmlFor="departure_airport_id" className={labelCls}>Sân bay Khởi hành</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">flight_takeoff</span>
                  <select id="departure_airport_id" value={formData.departure_airport_id} onChange={handleChange} required className={`${inputCls} pl-11`}>
                    <option value="" disabled>-- Chọn Sân bay --</option>
                    {airports.map((a: any) => (
                      <option key={a._id} value={a._id}>{a.city} ({a.iata_code}) — {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2">
                <label htmlFor="arrival_airport_id" className={labelCls}>Sân bay Hạ cánh</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">flight_land</span>
                  <select id="arrival_airport_id" value={formData.arrival_airport_id} onChange={handleChange} required className={`${inputCls} pl-11`}>
                    <option value="" disabled>-- Chọn Sân bay --</option>
                    {airports.map((a: any) => (
                      <option key={a._id} value={a._id}>{a.city} ({a.iata_code}) — {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="departure_time" className={labelCls}>Thời gian khởi hành</label>
                <input type="datetime-local" id="departure_time" value={formData.departure_time} onChange={handleChange} required className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="arrival_time" className={labelCls}>Thời gian dự kiến hạ cánh</label>
                <input type="datetime-local" id="arrival_time" value={formData.arrival_time} onChange={handleChange} required className={inputCls} />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-orange-500">payments</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Định giá cơ bản (VNĐ)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <label htmlFor="prices.economy" className={labelCls}>Hạng Phổ thông (Economy)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="number" id="prices.economy" value={formData.prices.economy} onChange={handleChange} required min={0} className={inputCls} />
                  <span className="font-bold text-slate-400">₫</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <label htmlFor="prices.business" className={labelCls}>Hạng Thương gia (Business)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="number" id="prices.business" value={formData.prices.business} onChange={handleChange} required min={0} className={inputCls} />
                  <span className="font-bold text-slate-400">₫</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Technical & Status */}
        <div className="flex flex-col gap-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-orange-500">settings</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Kỹ thuật & Trạng thái</h2>
            </div>

            <div className="flex flex-col gap-5">
              <div className="relative">
                <label htmlFor="status" className={labelCls}>Trạng thái vận hành</label>
                <select id="status" value={formData.status} onChange={handleChange} className={`${inputCls} font-bold ${formData.status === 'SCHEDULED' ? 'text-blue-600' : formData.status === 'CANCELLED' ? 'text-red-600' : 'text-orange-600'}`}>
                  <option value="SCHEDULED">SCHEDULED (Đã lên lịch)</option>
                  <option value="DELAYED">DELAYED (Bị hoãn)</option>
                  <option value="CANCELLED">CANCELLED (Đã hủy)</option>
                  <option value="COMPLETED">COMPLETED (Hoàn thành)</option>
                </select>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 mt-auto">
            <button type="submit" disabled={isSaving} className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {isSaving ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">save</span>}
              {isNew ? "TẠO CHUYẾN BAY" : "LƯU CẬP NHẬT"}
            </button>
            <Link href="/admin/flights" className="w-full py-4 text-center text-slate-500 font-bold hover:text-slate-700 transition-colors">
              Hủy bỏ thay đổi
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}


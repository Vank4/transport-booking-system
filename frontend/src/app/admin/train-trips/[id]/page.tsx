"use client";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/components/admin/ToastProvider";

export default function AdminEditTrainTripPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const isNew = unwrappedParams.id === "new";
  const tripId = isNew ? null : unwrappedParams.id;

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trains, setTrains] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    train_id: "",
    departure_station_id: "",
    arrival_station_id: "",
    departure_time: "",
    arrival_time: "",
    status: "SCHEDULED"
  });

  const formatLocalDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  // Fetch dependencies (Trains, Stations)
  useEffect(() => {
    const fetchDeps = async () => {
      try {
        const [trainsRes, stationsRes] = await Promise.all([
          api.get('/trains', { params: { limit: 100 } }),
          api.get('/train-stations', { params: { limit: 100 } })
        ]);
        const trainsData = trainsRes.data.data.trains || trainsRes.data.data || [];
        const stationsData = stationsRes.data.data.stations || stationsRes.data.data.trainStations || stationsRes.data.data || [];
        setTrains(Array.isArray(trainsData) ? trainsData : []);
        setStations(Array.isArray(stationsData) ? stationsData : []);
      } catch (err) {
        console.error("Failed to fetch deps", err);
      }
    };
    fetchDeps();
  }, []);

  useEffect(() => {
    if (isNew) return;
    const fetchTrip = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/train-trips/${tripId}`);
        const data = res.data.data;
        setFormData({
          train_id: data.train_id?._id || data.train_id || "",
          departure_station_id: data.departure_station_id?._id || data.departure_station_id || "",
          arrival_station_id: data.arrival_station_id?._id || data.arrival_station_id || "",
          departure_time: formatLocalDate(data.departure_time),
          arrival_time: formatLocalDate(data.arrival_time),
          status: data.status || "SCHEDULED"
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Lỗi tải thông tin lịch trình");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrip();
  }, [tripId, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // -- VALIDATION --
    if (formData.departure_station_id === formData.arrival_station_id) {
      toast.error("Lỗi lộ trình", "Ga đến không thể trùng với ga khởi hành");
      return;
    }

    const depDate = new Date(formData.departure_time);
    const arrDate = new Date(formData.arrival_time);
    if (arrDate <= depDate) {
      toast.error("Lỗi thời gian", "Giờ đến nơi phải sau giờ khởi hành");
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
        await api.post(`/train-trips`, payload);
        toast.success("Thành công", "Đã thêm lịch trình tàu mới");
      } else {
        await api.put(`/train-trips/${tripId}`, payload);
        toast.success("Thành công", "Cập nhật lịch trình tàu thành công");
      }
      router.push("/admin/train-trips");
    } catch (err: any) {
      toast.error("Lỗi", err?.response?.data?.message || "Lỗi khi lưu thông tin.");
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
        <Link href="/admin/train-trips" className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-orange-500 transition-colors w-fit">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Danh sách lịch trình tàu
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-3xl">train</span>
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">
              {isNew ? "Tạo Lịch trình tàu" : "Chỉnh sửa Lịch trình"}
            </h1>
            <p className="text-slate-500 text-sm">{isNew ? "Thiết lập tuyến đường và thời gian chạy tàu mới" : `ID lịch trình: ${tripId}`}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: General Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-orange-500">route</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thông tin lộ trình</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label htmlFor="train_id" className={labelCls}>Đoàn tàu hỏa <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">train</span>
                  <select id="train_id" value={formData.train_id} onChange={handleChange} required className={`${inputCls} pl-11 font-bold`}>
                    <option value="">-- Chọn tàu --</option>
                    {trains.map((t: any) => (
                      <option key={t._id} value={t._id}>{t.train_number} — {t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2">
                <label htmlFor="departure_station_id" className={labelCls}>Ga Khởi hành</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">location_on</span>
                  <select id="departure_station_id" value={formData.departure_station_id} onChange={handleChange} required className={`${inputCls} pl-11`}>
                    <option value="">-- Chọn ga đi --</option>
                    {stations.map((s: any) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2">
                <label htmlFor="arrival_station_id" className={labelCls}>Ga Điểm đến</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">fmd_good</span>
                  <select id="arrival_station_id" value={formData.arrival_station_id} onChange={handleChange} required className={`${inputCls} pl-11`}>
                    <option value="">-- Chọn ga đến --</option>
                    {stations.map((s: any) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="departure_time" className={labelCls}>Giờ khởi hành</label>
                <input type="datetime-local" id="departure_time" value={formData.departure_time} onChange={handleChange} required className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="arrival_time" className={labelCls}>Giờ đến nơi dự kiến</label>
                <input type="datetime-local" id="arrival_time" value={formData.arrival_time} onChange={handleChange} required className={inputCls} />
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: Status & Save */}
        <div className="flex flex-col gap-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-orange-500">settings</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Điều khiển</h2>
            </div>
            <div className="flex flex-col gap-5">
              <div className="relative">
                <label htmlFor="status" className={labelCls}>Trạng thái</label>
                <select id="status" value={formData.status} onChange={handleChange} className={`${inputCls} font-bold ${formData.status === 'SCHEDULED' ? 'text-blue-600' : formData.status === 'CANCELLED' ? 'text-red-600' : 'text-orange-600'}`}>
                  <option value="SCHEDULED">SCHEDULED (Đã lên lịch)</option>
                  <option value="DELAYED">DELAYED (Trễ giờ)</option>
                  <option value="CANCELLED">CANCELLED (Đã hủy)</option>
                  <option value="COMPLETED">COMPLETED (Hoàn thành)</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/20">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium leading-relaxed">
                  Lưu ý: Mọi thay đổi về giờ khởi hành sẽ ảnh hưởng đến thông báo của hành khách đã đặt chỗ.
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 mt-auto">
            <button type="submit" disabled={isSaving} className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {isSaving ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">save</span>}
              {isNew ? "TẠO LỊCH TRÌNH" : "LƯU CẬP NHẬT"}
            </button>
            <Link href="/admin/train-trips" className="w-full py-4 text-center text-slate-500 font-bold hover:text-slate-700 transition-colors">
              Hủy bỏ
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

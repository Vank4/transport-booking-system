"use client";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/components/admin/ToastProvider";

export default function AdminEditAirportPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const isNew = unwrappedParams.id === "new";
  const airportId = isNew ? null : unwrappedParams.id;

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    iata_code: "",
    city: "",
    country: "Việt Nam"
  });

  const [departures, setDepartures] = useState<any[]>([]);
  const [arrivals, setArrivals] = useState<any[]>([]);

  useEffect(() => {
    if (isNew) return;
    const fetchAirportAndFlights = async () => {
      try {
        setIsLoading(true);
        const [airportRes, depRes, arrRes] = await Promise.all([
          api.get(`/airports/${airportId}`),
          api.get('/flights', { params: { departure_airport_id: airportId, limit: 5 } }),
          api.get('/flights', { params: { arrival_airport_id: airportId, limit: 5 } })
        ]);

        const data = airportRes.data.data;
        setFormData({
          name: data.name || "",
          iata_code: data.iata_code || "",
          city: data.city || "",
          country: data.country || "Việt Nam"
        });
        setDepartures(depRes.data.data.flights || []);
        setArrivals(arrRes.data.data.flights || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Lỗi tải thông tin sân bay");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAirportAndFlights();
  }, [airportId, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (isNew) {
        await api.post(`/airports`, formData);
        toast.success("Thành công", "Đã khởi tạo sân bay mới");
      } else {
        await api.put(`/airports/${airportId}`, formData);
        toast.success("Thành công", "Đã cập nhật cấu hình sân bay");
      }
      router.push("/admin/airports");
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

  const inputCls = "w-full rounded-xl border-0 py-2.5 px-4 text-slate-900 bg-slate-50 ring-1 ring-inset ring-slate-200 dark:bg-slate-800/50 dark:text-white dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm transition-all shadow-sm";
  const labelCls = "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 px-1";

  const FlightList = ({ flights, title, emptyMsg, icon }: any) => (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-orange-500">{icon}</span>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      {flights.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">{emptyMsg}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {flights.map((f: any) => (
            <div key={f._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:border-orange-200">
               <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-xs text-orange-600 border border-slate-200 dark:border-slate-700">
                  {f.flight_number}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
                    {f.airline_id?.name || "N/A"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    {title.includes("Đi") ? `Đến: ${f.arrival_airport_id?.iata_code}` : `Từ: ${f.departure_airport_id?.iata_code}`}
                  </span>
                </div>
              </div>
              <Link href={`/admin/flights/${f._id}`} className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg text-slate-400 hover:text-orange-500 transition-all">
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="flex flex-col max-w-[1200px] mx-auto flex-1 gap-6 pb-20">
      <div className="flex flex-col gap-2">
        <Link href="/admin/airports" className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-orange-500 transition-colors w-fit">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại danh sách
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm">
            <span className="material-symbols-outlined text-3xl">hub</span>
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">
              {isNew ? "Thêm Sân Bay" : "Cấu hình Sân Bay"}
            </h1>
            <p className="text-slate-500 text-sm">{isNew ? "Khai báo điểm đến mới trong mạng lưới" : `Mã thực thể: ${airportId}`}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="material-symbols-outlined text-orange-500">map</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thông tin định danh</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label htmlFor="name" className={labelCls}>Tên sân bay đầy đủ <span className="text-red-500">*</span></label>
                <input type="text" id="name" value={formData.name} onChange={handleChange} required placeholder="VD: Cảng hàng không quốc tế Nội Bài" className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="iata_code" className={labelCls}>Mã IATA <span className="text-red-500">*</span></label>
                <input type="text" id="iata_code" value={formData.iata_code} onChange={handleChange} required placeholder="VD: HAN" maxLength={3} className={`${inputCls} font-black uppercase tracking-widest`} />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="material-symbols-outlined text-orange-500">location_on</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Vị trí địa lý</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="flex flex-col gap-1.5">
                <label htmlFor="city" className={labelCls}>Thành phố <span className="text-red-500">*</span></label>
                <input type="text" id="city" value={formData.city} onChange={handleChange} required placeholder="VD: Hà Nội" className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="country" className={labelCls}>Quốc gia <span className="text-red-500">*</span></label>
                <input type="text" id="country" value={formData.country} onChange={handleChange} required className={inputCls} />
              </div>
            </div>
          </section>

          {!isNew && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FlightList 
                flights={departures} 
                title="Chuyến Bay Đi" 
                emptyMsg="Không có chuyến bay đi" 
                icon="flight_takeoff"
              />
              <FlightList 
                flights={arrivals} 
                title="Chuyến Bay Đến" 
                emptyMsg="Không có chuyến bay đến" 
                icon="flight_land"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Link href="/admin/airports" className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
              Hủy bỏ
            </Link>
            <button type="submit" disabled={isSaving} className="h-11 px-8 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {isSaving ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">save</span>}
              {isNew ? "TẠO MỚI" : "LƯU CẤP NHẬT"}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-6 sticky top-6">
          <div className="bg-orange-50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/20 rounded-3xl p-6">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold mb-3">
              <span className="material-symbols-outlined text-[20px]">lightbulb</span>
              Lưu ý
            </div>
            <p className="text-sm text-orange-600 dark:text-orange-500 font-medium leading-relaxed">
              Mã IATA là định danh quan trọng. Việc thay đổi mã IATA có thể ảnh hưởng đến đồng bộ hóa vé và lịch trình bay toàn cầu.
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
            <h3 className={labelCls}>Mã Token Hệ Thống</h3>
            <div className="mt-2 font-mono text-[10px] text-slate-400 break-all bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              {airportId || "--- NEW-ENTITY ---"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

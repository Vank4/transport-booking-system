"use client";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/components/admin/ToastProvider";

export default function AdminEditFlightFarePage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const isNew = unwrappedParams.id === "new";
  const fareId = isNew ? null : unwrappedParams.id;

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [flights, setFlights] = useState([]);

  const [formData, setFormData] = useState({
    flight_id: "",
    cabin_class: "ECONOMY",
    fare_name: "",
    base_price: 0,
    promo_price: "",
    baggage_kg: 0,
    carry_on_kg: 7,
    is_refundable: false,
    change_fee: 0,
    available_seats: 0,
    is_active: true
  });

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const res = await api.get('/flights?limit=100');
        setFlights(res.data.data.flights);
      } catch (err: any) {
        toast.error("Lỗi dữ liệu", "Không thể tải danh sách chuyến bay");
      }
    };
    fetchFlights();
  }, [toast]);

  useEffect(() => {
    if (isNew) return;
    const fetchFare = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/flight-fares/${fareId}`);
        const data = res.data.data;
        setFormData({
          flight_id: data.flight_id?._id || data.flight_id || "",
          cabin_class: data.cabin_class || "ECONOMY",
          fare_name: data.fare_name || "",
          base_price: data.base_price || 0,
          promo_price: data.promo_price ?? "",
          baggage_kg: data.baggage_kg || 0,
          carry_on_kg: data.carry_on_kg !== undefined ? data.carry_on_kg : 7,
          is_refundable: !!data.is_refundable,
          change_fee: data.change_fee || 0,
          available_seats: data.available_seats || 0,
          is_active: data.is_active !== undefined ? !!data.is_active : true
        });
      } catch (err: any) {
        toast.error("Lỗi", err?.response?.data?.message || "Lỗi tải thông tin giá vé");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFare();
  }, [fareId, isNew, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { id, value, type } = target;
    if (type === "checkbox") {
      setFormData({ ...formData, [id]: target.checked });
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        promo_price: formData.promo_price === "" ? null : Number(formData.promo_price)
      };

      if (isNew) {
        await api.post(`/flight-fares`, payload);
        toast.success("Thành công", "Đã thêm cấu hình giá vé mới");
      } else {
        await api.put(`/flight-fares/${fareId}`, payload);
        toast.success("Thành công", "Đã cập nhật cấu hình giá vé");
      }
      router.push("/admin/flight-fares");
    } catch (err: any) {
      toast.error("Lỗi lưu", err?.response?.data?.message || "Lỗi khi lưu thông tin.");
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

  return (
    <div className="flex flex-col max-w-[1200px] mx-auto flex-1 gap-6 pb-20">
      <div className="flex flex-col gap-2">
        <Link href="/admin/flight-fares" className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-orange-500 transition-colors w-fit">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại danh sách
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-3xl">payments</span>
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">
              {isNew ? "Tạo Hạng Vé Mới" : "Cấu Hình Giá Vé"}
            </h1>
            <p className="text-slate-500 text-sm">{isNew ? "Thiết lập sản phẩm vé cho chuyến bay" : `ID: ${fareId}`}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-orange-500">confirmation_number</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Định danh Gói vé</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label htmlFor="flight_id" className={labelCls}>Chuyến bay áp dụng <span className="text-red-500">*</span></label>
                <select id="flight_id" value={formData.flight_id} onChange={handleChange} required className={`${inputCls} font-mono uppercase font-bold`}>
                  <option value="" disabled>-- Chọn Chuyến bay --</option>
                  {flights.map((f: any) => (
                    <option key={f._id} value={f._id}>
                      {f.flight_number} | {f.departure_airport_id?.city} ({f.departure_airport_id?.iata_code}) → {f.arrival_airport_id?.city} ({f.arrival_airport_id?.iata_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="cabin_class" className={labelCls}>Hạng khoang <span className="text-red-500">*</span></label>
                <select id="cabin_class" value={formData.cabin_class} onChange={handleChange} required className={inputCls}>
                  <option value="ECONOMY">Phổ thông (Economy)</option>
                  <option value="PREMIUM_ECONOMY">Phổ thông Đặc biệt (Premium Economy)</option>
                  <option value="BUSINESS">Thương gia (Business)</option>
                  <option value="FIRST_CLASS">Hạng Nhất (First Class)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="fare_name" className={labelCls}>Tên gói vé <span className="text-red-500">*</span></label>
                <input type="text" id="fare_name" value={formData.fare_name} onChange={handleChange} required placeholder="VD: Phổ thông linh hoạt" className={inputCls} />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-orange-500">savings</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Giá niêm yết & Sức chứa</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="base_price" className={labelCls}>Giá gốc (VNĐ) <span className="text-red-500">*</span></label>
                <input type="number" id="base_price" value={formData.base_price} onChange={handleChange} required min={0} className={`${inputCls} font-bold text-primary`} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="promo_price" className={`${labelCls} text-orange-600`}>Giá khuyến mãi (VNĐ)</label>
                <input type="number" id="promo_price" value={formData.promo_price} onChange={handleChange} min={0} placeholder="Trống nếu không có" className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="available_seats" className={labelCls}>Số ghế mở bán <span className="text-red-500">*</span></label>
                <input type="number" id="available_seats" value={formData.available_seats} onChange={handleChange} required min={0} className={`${inputCls} font-bold`} />
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-orange-500">description</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chính sách & Dịch vụ</h2>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="carry_on_kg" className={labelCls}>Xách tay (KG)</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">work</span>
                  <input type="number" id="carry_on_kg" value={formData.carry_on_kg} onChange={handleChange} min={0} className={`${inputCls} pl-10`} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="baggage_kg" className={labelCls}>Ký gửi (KG)</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">luggage</span>
                  <input type="number" id="baggage_kg" value={formData.baggage_kg} onChange={handleChange} min={0} className={`${inputCls} pl-10`} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2">
                <label className={labelCls}>Chính sách hoàn vé</label>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Hoàn tiền được phép</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="is_refundable" checked={formData.is_refundable} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="change_fee" className={labelCls}>Phí đổi vé (VNĐ)</label>
                <input type="number" id="change_fee" value={formData.change_fee} onChange={handleChange} min={0} placeholder="Trống = Miễn phí" className={inputCls} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-3xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 mt-2">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-orange-900 dark:text-orange-400 uppercase tracking-tighter">Trạng thái mở bán</span>
                  <span className="text-[10px] text-orange-700 dark:text-orange-500/70 font-bold uppercase">Cho phép hiển thị để đặt vé</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="is_active" checked={formData.is_active} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 mt-4">
            <button type="submit" disabled={isSaving} className="h-12 w-full bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black text-sm shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-slate-700">
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  ĐANG XỬ LÝ...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  XÁC NHẬN LƯU
                </>
              )}
            </button>
            <Link href="/admin/flight-fares" className="h-12 w-full flex items-center justify-center text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors uppercase tracking-widest text-xs">
              Hủy bỏ & Quay lại
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

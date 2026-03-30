"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/components/admin/ToastProvider";

export default function AdminEditTrainCarriagePage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const isNew = unwrappedParams.id === "new";
  const carriageId = isNew ? null : unwrappedParams.id;

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trainTrips, setTrainTrips] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    train_trip_id: "",
    carriage_number: "",
    type: "ECONOMY",
    base_price: ""
  });

  // Fetch danh sách chuyến tàu để populate dropdown
  useEffect(() => {
    const fetchDeps = async () => {
      try {
        const tripsRes = await api.get('/train-trips', { params: { limit: 100 } });
        const tripsData = tripsRes.data.data.trainTrips || tripsRes.data.data.trips || tripsRes.data.data || [];
        setTrainTrips(Array.isArray(tripsData) ? tripsData : []);
      } catch (err) {
        console.error("Failed to fetch train trips", err);
      }
    };
    fetchDeps();
  }, []);

  useEffect(() => {
    if (isNew) return;
    const fetchCarriage = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/train-carriages/${carriageId}`);
        const data = res.data.data;
        setFormData({
          train_trip_id: typeof data.train_trip_id === 'object' ? data.train_trip_id._id : (data.train_trip_id || ""),
          carriage_number: data.carriage_number || "",
          type: data.type || "ECONOMY",
          base_price: data.base_price?.toString() || ""
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Lỗi tải thông tin toa xe");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCarriage();
  }, [carriageId, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = { ...formData, base_price: parseInt(formData.base_price) || 0 };
      if (isNew) {
        await api.post(`/train-carriages`, payload);
        toast.success("Thành công", "Đã thêm toa xe mới vào hệ thống.");
      } else {
        await api.put(`/train-carriages/${carriageId}`, payload);
        toast.success("Thành công", "Thông tin toa xe đã được cập nhật.");
      }
      router.push("/admin/train-carriages");
    } catch (err: any) {
      toast.error("Lỗi", err?.response?.data?.message || "Không thể lưu dữ liệu.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (<div className="flex flex-col max-w-[800px] mx-auto flex-1 gap-6 justify-center items-center min-h-[400px]"><span className="material-symbols-outlined animate-spin text-4xl text-slate-400">hourglass_empty</span></div>);
  if (error) return (<div className="flex flex-col max-w-[800px] mx-auto flex-1 gap-6 justify-center items-center min-h-[400px]"><span className="material-symbols-outlined text-4xl text-red-500">error</span><p className="text-red-500 font-medium">{error}</p><Link href="/admin/train-carriages" className="text-orange-500 hover:underline">Quay lại</Link></div>);

  return (
    <div className="flex flex-col max-w-[800px] mx-auto flex-1 gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin/train-carriages" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-orange-500 w-fit transition-colors"><span className="material-symbols-outlined text-[18px]">arrow_back</span>Quay lại danh sách</Link>
        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">{isNew ? "Thêm Toa xe mới" : "Cập nhật Toa xe"}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{isNew ? "Gắn toa xe vào một lịch trình tàu." : `Đang chỉnh sửa: ${carriageId}`}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 sm:p-8">
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label htmlFor="train_trip_id" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Chuyến tàu (Lịch trình) <span className="text-red-500">*</span></label>
              <select id="train_trip_id" value={formData.train_trip_id} onChange={handleChange} required className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm">
                <option value="">-- Chọn chuyến tàu --</option>
                {trainTrips.map((trip: any) => (
                  <option key={trip._id} value={trip._id}>
                    {trip.train_id?.name || trip.train_id} — {new Date(trip.departure_time).toLocaleDateString('vi-VN')}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="carriage_number" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Số toa <span className="text-red-500">*</span></label>
              <input type="text" id="carriage_number" value={formData.carriage_number} onChange={handleChange} required className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm" placeholder="VD: TOA-01" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="type" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Hạng toa <span className="text-red-500">*</span></label>
              <select id="type" value={formData.type} onChange={handleChange} required className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm">
                <option value="ECONOMY">Phổ Thông (ECONOMY)</option>
                <option value="BUSINESS">Thương Gia (BUSINESS)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="base_price" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Giá cơ sở (VNĐ) <span className="text-red-500">*</span></label>
              <input type="number" id="base_price" min="0" value={formData.base_price} onChange={handleChange} required className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm" placeholder="VD: 500000" />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Link href="/admin/train-carriages" className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Hủy</Link>
            <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed">{isSaving ? "Đang lưu..." : "Lưu thông tin"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

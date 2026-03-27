"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/components/admin/ToastProvider";

export default function AdminEditTrainStationPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const isNew = unwrappedParams.id === "new";
  const stationId = isNew ? null : unwrappedParams.id;

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: "", city: "" });

  useEffect(() => {
    if (isNew) return;
    const fetchStation = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/train-stations/${stationId}`);
        const data = res.data.data;
        setFormData({ name: data.name || "", city: data.city || "" });
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Lỗi tải thông tin ga tàu");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStation();
  }, [stationId, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (isNew) {
        await api.post(`/train-stations`, formData);
        toast.success("Thành công", "Đã thêm ga tàu mới vào hệ thống.");
      } else {
        await api.put(`/train-stations/${stationId}`, formData);
        toast.success("Thành công", "Thông tin ga tàu đã được cập nhật.");
      }
      router.push("/admin/train-stations");
    } catch (err: any) {
      toast.error("Lỗi", err?.response?.data?.message || "Không thể lưu dữ liệu.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (<div className="flex flex-col max-w-[800px] mx-auto flex-1 gap-6 justify-center items-center min-h-[400px]"><span className="material-symbols-outlined animate-spin text-4xl text-slate-400">hourglass_empty</span></div>);
  if (error) return (<div className="flex flex-col max-w-[800px] mx-auto flex-1 gap-6 justify-center items-center min-h-[400px]"><span className="material-symbols-outlined text-4xl text-red-500">error</span><p className="text-red-500 font-medium">{error}</p><Link href="/admin/train-stations" className="text-orange-500 hover:underline">Quay lại</Link></div>);

  return (
    <div className="flex flex-col max-w-[800px] mx-auto flex-1 gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin/train-stations" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-orange-500 w-fit transition-colors"><span className="material-symbols-outlined text-[18px]">arrow_back</span>Quay lại danh sách</Link>
        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">{isNew ? "Thêm Ga tàu mới" : "Cập nhật Ga tàu"}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{isNew ? "Nhập thông tin ga tàu mới." : `Đang chỉnh sửa: ${stationId}`}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 sm:p-8">
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tên ga <span className="text-red-500">*</span></label>
              <input type="text" id="name" value={formData.name} onChange={handleChange} required className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm" placeholder="VD: Ga Sài Gòn" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="city" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Thành phố <span className="text-red-500">*</span></label>
              <input type="text" id="city" value={formData.city} onChange={handleChange} required className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm" placeholder="VD: TP. Hồ Chí Minh" />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Link href="/admin/train-stations" className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Hủy</Link>
            <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed">{isSaving ? "Đang lưu..." : "Lưu thông tin"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/components/admin/ToastProvider";

export default function AdminEditVoucherPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { toast } = useToast();
  const router = useRouter();
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const isNew = unwrappedParams.id === "new";
  const voucherId = isNew ? null : unwrappedParams.id;

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    discount_type: "PERCENTAGE",
    discount_value: "",
    min_order_value: "",
    max_discount: "",
    usage_limit: "",
    expiry_date: "",
    is_active: true
  });

  useEffect(() => {
    if (isNew) return;
    const fetchVoucher = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/vouchers/${voucherId}`);
        const data = res.data.data;

        let expiryStr = "";
        if (data.expiry_date) {
          expiryStr = new Date(data.expiry_date).toISOString().split('T')[0];
        }

        setFormData({
          code: data.code || "",
          discount_type: data.discount_type || "PERCENTAGE",
          discount_value: data.discount_value?.toString() || "",
          min_order_value: data.min_order_value?.toString() || "0",
          max_discount: data.max_discount?.toString() || "",
          usage_limit: data.usage_limit?.toString() || "",
          expiry_date: expiryStr,
          is_active: data.is_active !== undefined ? data.is_active : true
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Lỗi tải thông tin mã giảm giá");
      } finally {
        setIsLoading(false);
      }
    };
    fetchVoucher();
  }, [voucherId, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [id]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value) || 0,
        min_order_value: parseFloat(formData.min_order_value) || 0,
        max_discount: parseFloat(formData.max_discount) || 0,
        usage_limit: parseInt(formData.usage_limit) || 100,
        expiry_date: formData.expiry_date || null,
        is_active: formData.is_active
      };

      if (isNew) {
        await api.post(`/vouchers`, payload);
        toast.success("Thành công", "Tạo mã giảm giá thành công!");
      } else {
        await api.put(`/vouchers/${voucherId}`, payload);
        toast.success("Thành công", "Cập nhật mã giảm giá thành công!");
      }
      router.push("/admin/vouchers");
    } catch (err: any) {
      toast.error("Lỗi", err?.response?.data?.message || "Lỗi khi lưu.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (<div className="flex flex-col max-w-[800px] mx-auto flex-1 gap-6 justify-center items-center min-h-[400px]"><span className="material-symbols-outlined animate-spin text-4xl text-slate-400">hourglass_empty</span></div>);
  if (error) return (<div className="flex flex-col max-w-[800px] mx-auto flex-1 gap-6 justify-center items-center min-h-[400px]"><span className="material-symbols-outlined text-4xl text-red-500">error</span><p className="text-red-500 font-medium">{error}</p><Link href="/admin/vouchers" className="text-orange-500 hover:underline">Quay lại</Link></div>);

  return (
    <div className="flex flex-col max-w-[800px] mx-auto flex-1 gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin/vouchers" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-orange-500 w-fit transition-colors"><span className="material-symbols-outlined text-[18px]">arrow_back</span>Quay lại danh sách</Link>
        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">{isNew ? "Tạo Mã giảm giá mới" : "Cập nhật Mã giảm giá"}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{isNew ? "Cài đặt thông tin cho mã giảm giá mới." : `Đang chỉnh sửa: ${voucherId}`}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 sm:p-8">
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label htmlFor="code" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mã Voucher <span className="text-red-500">*</span></label>
              <input type="text" id="code" value={formData.code} onChange={handleChange} required className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm uppercase font-bold tracking-wider" placeholder="VD: SUMMER2024" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="discount_type" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Loại giảm giá <span className="text-red-500">*</span></label>
              <select id="discount_type" value={formData.discount_type} onChange={handleChange} required className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm">
                <option value="PERCENTAGE">Phần trăm (%)</option>
                <option value="FIXED">Cố định (VNĐ)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="discount_value" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Giá trị giảm {formData.discount_type === "PERCENTAGE" ? "(%)" : "(VNĐ)"} <span className="text-red-500">*</span>
              </label>
              <input type="number" id="discount_value" min="0" step={formData.discount_type === "PERCENTAGE" ? "1" : "1000"} value={formData.discount_value} onChange={handleChange} required className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm" placeholder={formData.discount_type === "PERCENTAGE" ? "VD: 10" : "VD: 50000"} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="min_order_value" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Đơn tối thiểu (VNĐ)</label>
              <input type="number" id="min_order_value" min="0" step="1000" value={formData.min_order_value} onChange={handleChange} className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm" placeholder="VD: 500000" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="max_discount" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Giảm tối đa (VNĐ)</label>
              <input type="number" id="max_discount" min="0" step="1000" value={formData.max_discount} onChange={handleChange} className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm" placeholder="VD: 100000" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="usage_limit" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Giới hạn lượt dùng <span className="text-red-500">*</span></label>
              <input type="number" id="usage_limit" min="1" value={formData.usage_limit} onChange={handleChange} required className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm" placeholder="VD: 100" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="expiry_date" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ngày hết hạn</label>
              <input type="date" id="expiry_date" value={formData.expiry_date} onChange={handleChange} className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm" />
            </div>

            <div className="flex items-center gap-3 sm:col-span-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
              <label htmlFor="is_active" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kích hoạt mã giảm giá</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Link href="/admin/vouchers" className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Hủy</Link>
            <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed">{isSaving ? "Đang lưu..." : "Lưu thông tin"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

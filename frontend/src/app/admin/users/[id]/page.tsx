"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/components/admin/ToastProvider";

export default function AdminUserFormPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();

  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const userId = unwrappedParams.id;
  const isNew = userId === "new";

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    date_of_birth: "",
    gender: "",
    nationality: { code: "", name: "" },
    id_card: "",
    passport: "",
    address: {
      country_name: "",
      city: "",
      district: "",
      address_detail: "",
      full_address: "",
    },
    role: "USER",
    status: "ACTIVE",
  });

  useEffect(() => {
    if (isNew) return;
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/users/${userId}`);
        const d = res.data.data;
        let dobStr = "";
        if (d.date_of_birth) {
          const date = new Date(d.date_of_birth);
          if (!isNaN(date.getTime())) dobStr = date.toISOString().split("T")[0];
        }
        setFormData({
          full_name: d.full_name || "",
          email: d.email || "",
          phone: d.phone || "",
          password: "",
          date_of_birth: dobStr,
          gender: d.gender || "",
          nationality: { code: d.nationality?.code || "", name: d.nationality?.name || "" },
          id_card: d.id_card || "",
          passport: d.passport || "",
          address: {
            country_name: d.address?.country_name || "",
            city: d.address?.city || "",
            district: d.address?.district || "",
            address_detail: d.address?.address_detail || "",
            full_address: d.address?.full_address || "",
          },
          role: d.role || "USER",
          status: d.status || "ACTIVE",
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Lỗi tải thông tin người dùng");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [userId, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNestedChange = (e: React.ChangeEvent<HTMLInputElement>, group: "nationality" | "address") => {
    setFormData((prev) => ({
      ...prev,
      [group]: { ...(prev[group] as any), [e.target.name]: e.target.value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (isNew) {
        if (!formData.password) {
          toast.error("Thiếu mật khẩu", "Vui lòng nhập mật khẩu cho tài khoản mới.");
          setIsSaving(false);
          return;
        }
        await api.post("/users", formData);
        toast.success("Tạo thành công", "Tài khoản người dùng mới đã được tạo.");
      } else {
        // Don't send password if empty (not changing password)
        const { password, ...updatePayload } = formData;
        await api.put(`/users/${userId}`, updatePayload);
        toast.success("Cập nhật thành công", "Thông tin người dùng đã được lưu.");
      }
      router.push("/admin/users");
    } catch (err: any) {
      toast.error("Lỗi", err?.response?.data?.message || "Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6";
  const labelClass = "text-sm font-semibold text-slate-700 dark:text-slate-200";

  if (isLoading) {
    return (
      <div className="flex flex-col max-w-[800px] mx-auto flex-1 gap-6 justify-center items-center min-h-[400px]">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-700" />
          <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" />
        </div>
        <p className="text-slate-500 text-sm animate-pulse">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col max-w-[800px] mx-auto flex-1 gap-6 justify-center items-center min-h-[400px]">
        <span className="material-symbols-outlined text-4xl text-red-500">error</span>
        <p className="text-red-500 font-medium">{error}</p>
        <Link href="/admin/users" className="text-orange-500 hover:underline">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-[800px] mx-auto flex-1 gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin/users" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-orange-500 w-fit transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại danh sách
        </Link>
        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
          {isNew ? "Thêm người dùng mới" : "Chỉnh sửa tài khoản"}
        </h1>
        {!isNew && (
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            ID: <span className="font-mono text-slate-700 dark:text-slate-300">{userId}</span>
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 sm:p-8">
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>

          {/* ─── THÔNG TIN CƠ BẢN ──────────────────────────── */}
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin cơ bản</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Họ và tên <span className="text-red-500">*</span></label>
              <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required placeholder="Nguyễn Văn A" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="email@example.com" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Số điện thoại</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="0901234567" className={inputClass} />
            </div>
            {isNew && (
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Mật khẩu <span className="text-red-500">*</span></label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Nhập mật khẩu" className={inputClass} />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Ngày sinh</label>
              <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Giới tính</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                <option value="">Chọn giới tính...</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div className="h-px w-full bg-slate-200 dark:bg-slate-800" />

          {/* ─── GIẤY TỜ ───────────────────────────────────── */}
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Giấy tờ tùy thân</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>CCCD/CMND</label>
              <input type="text" name="id_card" value={formData.id_card} onChange={handleChange} placeholder="012345678901" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Hộ chiếu</label>
              <input type="text" name="passport" value={formData.passport} onChange={handleChange} placeholder="B1234567" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Quốc tịch</label>
              <input type="text" name="name" value={formData.nationality.name} onChange={(e) => handleNestedChange(e, "nationality")} placeholder="Việt Nam" className={inputClass} />
            </div>
          </div>

          <div className="h-px w-full bg-slate-200 dark:bg-slate-800" />

          {/* ─── ĐỊA CHỈ ──────────────────────────────────── */}
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Địa chỉ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Quốc gia</label>
              <input type="text" name="country_name" value={formData.address.country_name} onChange={(e) => handleNestedChange(e, "address")} placeholder="Việt Nam" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Thành phố</label>
              <input type="text" name="city" value={formData.address.city} onChange={(e) => handleNestedChange(e, "address")} placeholder="TP. Hồ Chí Minh" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Quận/Huyện</label>
              <input type="text" name="district" value={formData.address.district} onChange={(e) => handleNestedChange(e, "address")} placeholder="Quận 1" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Địa chỉ chi tiết</label>
              <input type="text" name="address_detail" value={formData.address.address_detail} onChange={(e) => handleNestedChange(e, "address")} placeholder="123 Nguyễn Huệ" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className={labelClass}>Địa chỉ đầy đủ</label>
              <input type="text" name="full_address" value={formData.address.full_address} onChange={(e) => handleNestedChange(e, "address")} placeholder="123 Nguyễn Huệ, Q1, TP.HCM" className={inputClass} />
            </div>
          </div>

          <div className="h-px w-full bg-slate-200 dark:bg-slate-800" />

          {/* ─── QUYỀN & TRẠNG THÁI ───────────────────────── */}
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quyền & Trạng thái</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Vai trò</label>
              <select name="role" value={formData.role} onChange={handleChange} className={inputClass}>
                <option value="USER">Khách hàng (USER)</option>
                <option value="ADMIN">Quản trị viên (ADMIN)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Trạng thái</label>
              <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="BLOCKED">Đã khóa (BLOCKED)</option>
              </select>
            </div>
          </div>

          {/* ─── ACTIONS ──────────────────────────────────── */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              href="/admin/users"
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed gap-2"
            >
              {isSaving && (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isSaving ? "Đang lưu..." : isNew ? "Tạo tài khoản" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

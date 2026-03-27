"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/components/admin/ToastProvider";

export default function AdminEditTicketPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { toast } = useToast();
  const router = useRouter();
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const ticketId = unwrappedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ticketData, setTicketData] = useState<any>(null);

  const [formData, setFormData] = useState({
    passenger_name: "",
    passenger_id_card: "",
    date_of_birth: "",
    gender: "MALE",
    passenger_type: "ADULT",
    contact_phone: "",
    contact_email: ""
  });

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/tickets/${ticketId}`);
        const data = res.data.data;
        setTicketData(data);

        let dobStr = "";
        if (data.date_of_birth) {
          dobStr = new Date(data.date_of_birth).toISOString().split('T')[0];
        }

        setFormData({
          passenger_name: data.passenger_name || "",
          passenger_id_card: data.passenger_id_card || "",
          date_of_birth: dobStr,
          gender: data.gender || "MALE",
          passenger_type: data.passenger_type || "ADULT",
          contact_phone: data.contact_info?.phone || "",
          contact_email: data.contact_info?.email || ""
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Lỗi tải thông tin vé");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        passenger_name: formData.passenger_name,
        passenger_id_card: formData.passenger_id_card,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender,
        passenger_type: formData.passenger_type,
        contact_info: {
          phone: formData.contact_phone,
          email: formData.contact_email
        }
      };

      await api.put(`/tickets/${ticketId}`, payload);
      toast.success("Thành công", "Cập nhật thông tin hành khách thành công!");
      router.push("/admin/tickets");
    } catch (err: any) {
      toast.error("Lỗi", err?.response?.data?.message || "Lỗi khi lưu. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">hourglass_empty</span>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <span className="material-symbols-outlined text-4xl text-red-500">error</span>
        <p className="text-red-500">{error || "Dữ liệu vé không tồn tại."}</p>
        <Link href="/admin/tickets" className="text-orange-500 hover:underline">Quay lại danh sách</Link>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="flex flex-col max-w-[900px] mx-auto flex-1 gap-6 pb-12">
      <div className="flex flex-col gap-2">
        <Link href="/admin/tickets" className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-orange-500 w-fit transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại danh sách
        </Link>
        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
          Phát hành Thông tin Vé (ID: <span className="text-slate-500">{ticketId.slice(-6)}</span>)
        </h1>
        <p className="text-sm text-slate-500">Người quản trị chỉ có thể cập nhật thông tin nhân thân của chủ vé.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Cột hiển thị thông tin READ-ONLY (Seat, Booking, Giá) */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 flex flex-col gap-5">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã Đặt Chỗ (Booking)</span>
              {ticketData.booking_id ? (
                <div className="flex flex-col mt-1">
                  <span className="text-lg font-black text-orange-600">{ticketData.booking_id.booking_code}</span>
                  {ticketData.booking_id.user_id && (
                    <span className="text-xs text-slate-500 font-medium">Người đặt: {ticketData.booking_id.user_id.full_name}</span>
                  )}
                </div>
              ) : (
                <p className="text-sm italic text-slate-500 mt-1">N/A</p>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã Ghế / Hạng</span>
              {ticketData.seat_id ? (
                <div className="flex items-center gap-3 mt-2">
                  <div className="min-w-[40px] px-2 h-10 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded flex items-center justify-center font-black text-lg text-slate-800 dark:text-slate-200">
                    {ticketData.seat_id.seat_number}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold uppercase">{ticketData.seat_id.class}</span>
                    <span className="text-xs text-slate-500">Giá trị: {formatCurrency(ticketData.final_price)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm italic text-slate-500 mt-1">N/A</p>
              )}
            </div>
          </div>
        </div>

        {/* Cột Form Editable */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 sm:p-8">
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>

              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">Thông tin Hành khách</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="passenger_name" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="passenger_name"
                    value={formData.passenger_name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 bg-slate-50 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm uppercase"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="passenger_id_card" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Sổ Hộ Chiếu / CCCD <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="passenger_id_card"
                    value={formData.passenger_id_card}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 bg-slate-50 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="date_of_birth" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Ngày sinh (Nếu có)
                  </label>
                  <input
                    type="date"
                    id="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 bg-slate-50 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="gender" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Giới tính & Độ tuổi
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 bg-slate-50 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm"
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>

                    <select
                      id="passenger_type"
                      value={formData.passenger_type}
                      onChange={handleChange}
                      className="w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 bg-slate-50 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm"
                    >
                      <option value="ADULT">Người lớn (ADULT)</option>
                      <option value="CHILD">Trẻ em (CHILD)</option>
                      <option value="INFANT">Em bé (INFANT)</option>
                    </select>
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2 mt-2">Thông tin Liên lạc Phụ</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="contact_phone" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Số Điện Thoại</label>
                  <input
                    type="text"
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 bg-slate-50 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="contact_email" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Email</label>
                  <input
                    type="email"
                    id="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    className="w-full rounded-lg border-0 py-2.5 px-4 text-slate-900 bg-slate-50 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isSaving ? "Đang xử lý..." : "Lưu Thông Tin Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

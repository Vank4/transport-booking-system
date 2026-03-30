"use client";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/components/admin/ToastProvider";
import config from "@/config";
import { getLogoUrl } from '@/lib/utils';

export default function AdminEditAirlinePage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const isNew = unwrappedParams.id === "new";
  const airlineId = isNew ? null : unwrappedParams.id;

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    iata_code: "",
    logo_url: ""
  });

  const [relatedFlights, setRelatedFlights] = useState<any[]>([]);

  useEffect(() => {
    if (isNew) return;
    const fetchAirlineAndFlights = async () => {
      try {
        setIsLoading(true);
        const [airlineRes, flightsRes] = await Promise.all([
          api.get(`/airlines/${airlineId}`),
          api.get('/flights', { params: { airline_id: airlineId, limit: 10 } })
        ]);

        const data = airlineRes.data.data;
        setFormData({
          name: data.name || "",
          iata_code: data.iata_code || "",
          logo_url: data.logo_url || ""
        });
        setRelatedFlights(flightsRes.data.data.flights || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Lỗi tải thông tin hãng bay");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAirlineAndFlights();
  }, [airlineId, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("logo", file);

    try {
      setIsUploading(true);
      const res = await api.post("/airlines/upload", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setFormData(prev => ({ ...prev, logo_url: res.data.url }));
      toast.success("Thành công", "Đã tải ảnh lên thành công");
    } catch (err: any) {
      toast.error("Lỗi upload", err?.response?.data?.message || "Không thể tải ảnh lên");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (isNew) {
        await api.post(`/airlines`, formData);
        toast.success("Thành công", "Đã thêm hãng hàng không mới");
      } else {
        await api.put(`/airlines/${airlineId}`, formData);
        toast.success("Thành công", "Đã cập nhật thông tin hãng bay");
      }
      router.push("/admin/airlines");
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

  const inputCls = "w-full rounded-xl border-0 py-2.5 px-4 text-slate-900 bg-slate-50 ring-1 ring-inset ring-slate-200 dark:bg-slate-800/50 dark:text-white dark:ring-slate-700 focus:ring-2 focus:ring-orange-500 sm:text-sm transition-all";
  const labelCls = "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 px-1";

  return (
    <div className="flex flex-col max-w-[1200px] mx-auto flex-1 gap-6 pb-20">
      <div className="flex flex-col gap-2">
        <Link href="/admin/airlines" className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-orange-500 transition-colors w-fit">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại danh sách
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-3xl">corporate_fare</span>
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">
              {isNew ? "Thêm Hãng Bay" : "Hồ Sơ Hãng Bay"}
            </h1>
            <p className="text-slate-500 text-sm">{isNew ? "Thiết lập đối tác vận chuyển mới" : `ID: ${airlineId}`}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-orange-500">info</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thông tin cơ bản</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label htmlFor="name" className={labelCls}>Tên hãng hàng không <span className="text-red-500">*</span></label>
                <input type="text" id="name" value={formData.name} onChange={handleChange} required placeholder="VD: Vietnam Airlines" className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="iata_code" className={labelCls}>Mã IATA</label>
                <input type="text" id="iata_code" value={formData.iata_code} onChange={handleChange} placeholder="VD: VN" maxLength={3} className={`${inputCls} font-black uppercase`} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Logo hãng bay</label>
                <div className="flex flex-col gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-900 overflow-hidden shrink-0">
                      {formData.logo_url ? (
                        <div className="relative group w-full h-full">
                          <img src={getLogoUrl(formData.logo_url)} alt="Preview" className="w-full h-full object-contain p-2" />
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, logo_url: "" }))}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="material-symbols-outlined text-white">delete</span>
                          </button>
                        </div>
                      ) : (
                        <span className="material-symbols-outlined text-slate-300 text-4xl">image</span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-3 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <label className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-black transition-all shadow-md shadow-orange-500/10 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                          {isUploading ? "ĐANG TẢI..." : "TẢI ẢNH LÊN"}
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                        <button 
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${showUrlInput ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
                        >
                          <span className="material-symbols-outlined text-[20px]">link</span>
                          LINK ẢNH
                        </button>
                      </div>
                      
                      {showUrlInput && (
                        <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
                          <input 
                            type="url" 
                            id="logo_url" 
                            value={formData.logo_url} 
                            onChange={handleChange} 
                            placeholder="Dán link ảnh tại đây (https://...)" 
                            className="w-full rounded-xl border-0 py-2 px-4 text-slate-900 bg-white ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-orange-500 sm:text-xs shadow-inner"
                          />
                        </div>
                      )}
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                        Hỗ trợ định dạng PNG, JPG hoặc SVG. Dung lượng tối đa 5MB. <br/>
                        <span className="italic text-orange-400">Khuyên dùng: Ảnh có nền trong suốt (transparent)</span>
                      </p>
                    </div>
                  </div>
                  
                  {formData.logo_url && (
                    <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-sm">link</span>
                      <span className="text-[10px] text-slate-400 font-mono truncate flex-1">{formData.logo_url}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Link href="/admin/airlines" className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                Hủy bỏ
              </Link>
              <button type="submit" disabled={isSaving} className="h-11 px-8 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isSaving ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">save</span>}
                {isNew ? "TẠO HÃNG BAY" : "LƯU THAY ĐỔI"}
              </button>
            </div>
          </section>

          {!isNew && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-orange-500">flight</span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chuyến bay đang khai thác</h2>
                </div>
                <Link href={`/admin/flights/new?airline_id=${airlineId}`} className="text-xs font-bold text-orange-500 hover:underline">Thêm chuyến bay mới</Link>
              </div>

              {relatedFlights.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                  <p className="text-slate-400 text-sm font-medium">Chưa có chuyến bay nào của hãng này.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {relatedFlights.map(flight => (
                    <div key={flight._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-xs text-orange-600 border border-slate-200 dark:border-slate-700 uppercase">
                          {flight.flight_number}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
                            {flight.departure_airport_id?.iata_code} → {flight.arrival_airport_id?.iata_code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{flight.status}</span>
                        </div>
                      </div>
                      <Link href={`/admin/flights/${flight._id}`} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-orange-500 transition-all">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </Link>
                    </div>
                  ))}
                  {relatedFlights.length === 10 && (
                    <p className="text-center text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Hiển thị 10 chuyến bay gần nhất</p>
                  )}
                </div>
              )}
            </section>
          )}
        </form>

        <div className="flex flex-col gap-6 sticky top-6">
          <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-3xl p-5">
            <h3 className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-2">Mẹo nhỏ</h3>
            <p className="text-xs text-orange-600 dark:text-orange-300 leading-relaxed font-medium">
              Bạn có thể dán link ảnh từ internet hoặc tải file trực tiếp từ máy tính. Hệ thống sẽ tự động tối ưu hóa hiển thị.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

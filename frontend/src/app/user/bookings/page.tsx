"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Copy,
  Filter,
  MapPin,
  Plane,
  QrCode,
  Search,
  Ticket,
  Train,
} from "lucide-react";
import AppSidebar from "@/components/layout/AppSidebar";
import { buildLoginRedirect, isAuthenticated } from "@/lib/auth";
import api from "@/lib/api";

type BookingStatus = "paid" | "pending" | "expired";
type StatusFilter = "all" | BookingStatus;
type TransportType = "flight" | "train";
type Booking = {
  id: string;
  code: string;
  route: string;
  origin: string;
  destination: string;
  bookingDate: string;
  departureDate: string;
  arrivalDate: string;
  status: BookingStatus;
  transportType: TransportType;
  carrier: string;
  price: number;
};

type BackendProfile = {
  full_name?: string;
  email?: string;
  avatar_url?: string;
};

type HeaderProfile = {
  fullName: string;
  email: string;
  avatarUrl: string;
};

const ITEMS_PER_PAGE = 4;
const DEFAULT_HEADER_PROFILE: HeaderProfile = {
  fullName: "Tài khoản của bạn",
  email: "Chưa cập nhật email",
  avatarUrl: "/images/icons/account.png",
};
const PROMOS = [
  "/images/voucher/ChatGPT Image 12_45_57 25 thg 2, 2026.png",
  "/images/voucher/ChatGPT Image 12_55_53 25 thg 2, 2026.png",
  "/images/voucher/ChatGPT Image 13_07_43 25 thg 2, 2026.png",
];
const DEFAULT_FILTERS = {
  status: "all" as StatusFilter,
  bookingDate: "",
  departureDate: "",
  arrivalDate: "",
  origin: "",
  destination: "",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN").format(parsed);
}

function toDateFilterValue(value: string) {
  const isoLikeDate = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (isoLikeDate) return isoLikeDate;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")} VND`;
}

function mapBackendProfileToHeader(profile?: BackendProfile): HeaderProfile {
  return {
    fullName: profile?.full_name?.trim() || DEFAULT_HEADER_PROFILE.fullName,
    email: profile?.email?.trim() || DEFAULT_HEADER_PROFILE.email,
    avatarUrl: profile?.avatar_url?.trim() || DEFAULT_HEADER_PROFILE.avatarUrl,
  };
}

export default function MyBookingsPage() {
  const router = useRouter();
  const canViewPage = isAuthenticated();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [headerProfile, setHeaderProfile] = useState<HeaderProfile>(
    DEFAULT_HEADER_PROFILE,
  );

  useEffect(() => {
    if (!canViewPage) {
      router.replace(buildLoginRedirect("/user/bookings"));
    }
  }, [canViewPage, router]);

  useEffect(() => {
    if (!canViewPage) return;

    let cancelled = false;

    const loadBookings = async () => {
      setIsLoadingBookings(true);
      setBookingError(null);

      try {
        const { data } = await api.get<{ data?: Booking[] }>("/bookings/list");
        if (cancelled) return;
        setBookings(data?.data ?? []);
      } catch (error: unknown) {
        if (cancelled) return;
        setBookingError(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách booking.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingBookings(false);
        }
      }
    };

    loadBookings();

    return () => {
      cancelled = true;
    };
  }, [canViewPage]);

  useEffect(() => {
    if (!canViewPage) return;

    let cancelled = false;

    const loadHeaderProfile = async () => {
      try {
        const { data } = await api.get<{ data?: BackendProfile }>(
          "/auth/profile",
        );
        if (cancelled) return;
        setHeaderProfile(mapBackendProfileToHeader(data?.data));
      } catch {
        if (cancelled) return;
        setHeaderProfile(DEFAULT_HEADER_PROFILE);
      }
    };

    loadHeaderProfile();

    return () => {
      cancelled = true;
    };
  }, [canViewPage]);

  if (!canViewPage) {
    return null;
  }

  const origins = useMemo(
    () => Array.from(new Set(bookings.map((item) => item.origin))),
    [bookings],
  );
  const destinations = useMemo(
    () => Array.from(new Set(bookings.map((item) => item.destination))),
    [bookings],
  );

  const searched = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((item) => item.code.toLowerCase().includes(q));
  }, [bookings, searchQuery]);

  const counts = useMemo(
    () => ({
      all: searched.length,
      paid: searched.filter((item) => item.status === "paid").length,
      pending: searched.filter((item) => item.status === "pending").length,
      expired: searched.filter((item) => item.status === "expired").length,
    }),
    [searched],
  );

  const filtered = useMemo(
    () =>
      searched.filter((item) => {
        const tabOk = activeTab === "all" || item.status === activeTab;
        const statusOk = filters.status === "all" || item.status === filters.status;
        const bookingDateOk =
          !filters.bookingDate || toDateFilterValue(item.bookingDate) === filters.bookingDate;
        const departureDateOk =
          !filters.departureDate ||
          toDateFilterValue(item.departureDate) === filters.departureDate;
        const arrivalDateOk =
          !filters.arrivalDate || toDateFilterValue(item.arrivalDate) === filters.arrivalDate;
        const originOk = !filters.origin || item.origin === filters.origin;
        const destinationOk = !filters.destination || item.destination === filters.destination;
        return tabOk && statusOk && bookingDateOk && departureDateOk && arrivalDateOk && originOk && destinationOk;
      }),
    [activeTab, filters, searched],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filtered]);

  useEffect(() => setCurrentPage(1), [activeTab, filters, searchQuery]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  useEffect(() => {
    if (!copiedCode) return;
    const timer = window.setTimeout(() => setCopiedCode(null), 1500);
    return () => window.clearTimeout(timer);
  }, [copiedCode]);

  const statusMeta = {
    paid: {
      label: "Đã thanh toán",
      icon: CheckCircle2,
      className:
        "bg-[linear-gradient(90deg,#3FC96B_0%,#45FF52_50%,#46B864_100%)] text-white shadow-[0_10px_22px_rgba(63,201,107,0.32)]",
    },
    pending: {
      label: "Chờ thanh toán",
      icon: Clock3,
      className:
        "bg-[linear-gradient(90deg,#FEAA30_0%,#FD9A1E_50%,#FEB14C_100%)] text-white shadow-[0_10px_22px_rgba(253,154,30,0.32)]",
    },
    expired: {
      label: "Hết hạn",
      icon: CircleAlert,
      className:
        "bg-[linear-gradient(90deg,#FB4939_0%,#ED423A_50%,#FA6A64_100%)] text-white shadow-[0_10px_22px_rgba(237,66,58,0.30)]",
    },
  } satisfies Record<BookingStatus, { label: string; icon: typeof CheckCircle2; className: string }>;

  const tabs = [
    {
      key: "all" as const,
      label: "Booking",
      icon: Ticket,
      count: counts.all,
      className:
        "bg-[linear-gradient(90deg,#38ADFE_0%,#2882FD_50%,#63A6FD_100%)] shadow-[0_12px_26px_rgba(40,130,253,0.28)]",
      hoverClass: "hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 hover:shadow-[0_18px_42px_rgba(56,189,248,0.18)]",
      hoverIconClass: "group-hover:bg-sky-100 group-hover:text-sky-700",
      hoverCountClass: "group-hover:text-sky-600",
    },
    {
      key: "paid" as const,
      label: "Đã thanh toán",
      icon: CheckCircle2,
      count: counts.paid,
      className:
        "bg-[linear-gradient(90deg,#3FC96B_0%,#45FF52_50%,#46B864_100%)] shadow-[0_12px_26px_rgba(63,201,107,0.28)]",
      hoverClass: "hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-[0_18px_42px_rgba(63,201,107,0.18)]",
      hoverIconClass: "group-hover:bg-emerald-100 group-hover:text-emerald-700",
      hoverCountClass: "group-hover:text-emerald-600",
    },
    {
      key: "pending" as const,
      label: "Chờ thanh toán",
      icon: Clock3,
      count: counts.pending,
      className:
        "bg-[linear-gradient(90deg,#FEAA30_0%,#FD9A1E_50%,#FEB14C_100%)] shadow-[0_12px_26px_rgba(253,154,30,0.28)]",
      hoverClass: "hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 hover:shadow-[0_18px_42px_rgba(253,154,30,0.18)]",
      hoverIconClass: "group-hover:bg-amber-100 group-hover:text-amber-700",
      hoverCountClass: "group-hover:text-amber-600",
    },
    {
      key: "expired" as const,
      label: "Hết hạn",
      icon: CircleAlert,
      count: counts.expired,
      className:
        "bg-[linear-gradient(90deg,#FB4939_0%,#ED423A_50%,#FA6A64_100%)] shadow-[0_12px_26px_rgba(237,66,58,0.28)]",
      hoverClass: "hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 hover:shadow-[0_18px_42px_rgba(237,66,58,0.18)]",
      hoverIconClass: "group-hover:bg-rose-100 group-hover:text-rose-700",
      hoverCountClass: "group-hover:text-rose-600",
    },
  ];

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setActiveTab("all");
    setSearchInput("");
    setSearchQuery("");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef3f8]">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header className="border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-3 md:px-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="interactive-chip flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <Image src="/images/icons/icons8-features-list-64.png" alt="menu" width={22} height={22} className="h-5 w-5 object-contain" />
            </button>
            <Link href="/" className="flex items-center gap-3">
              <span className="hidden text-[1.5rem] font-bold tracking-tight text-slate-900 sm:inline">Transport Booking</span>
              <Image src="/images/image/LogoTransportBooking.png" alt="Transport Booking" width={180} height={44} className="h-9 w-auto object-contain" priority />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" className="interactive-chip flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm">
              <Bell className="h-5 w-5" />
            </button>
            <div className="interactive-chip flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-sm">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold text-slate-900">
                  {headerProfile.fullName}
                </p>
                <p className="text-xs text-slate-500">{headerProfile.email}</p>
              </div>
              <Image
                src={headerProfile.avatarUrl}
                alt="avatar"
                width={34}
                height={34}
                className="h-8 w-8 rounded-full border border-slate-300 bg-white object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] space-y-5 px-4 py-5 md:px-5">
        <section className="panel-float rounded-[26px] border border-slate-200 bg-gradient-to-r from-white via-sky-50 to-sky-100 px-4 py-4 shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-[1.72rem] font-bold tracking-tight text-slate-900 md:text-[2.35rem]">Booking của tôi</h1>
              <p className="mt-1.5 text-[0.84rem] text-slate-600 md:text-[0.94rem]">Quản lý các đơn đặt vé máy bay & tàu hỏa</p>
            </div>
            <div className="flex w-full max-w-[460px] flex-col gap-3 sm:flex-row">
              <label className="interactive-chip flex flex-1 items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setSearchQuery(searchInput)}
                  placeholder="Tìm kiếm mã Booking"
                  className="w-full bg-transparent text-[0.84rem] text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
              <button type="button" onClick={() => setSearchQuery(searchInput)} className="button-sheen rounded-[18px] bg-[linear-gradient(135deg,#86d8ff_0%,#44b5ff_100%)] px-5 py-2.5 text-[0.86rem] font-bold text-slate-950 shadow-[0_16px_32px_rgba(56,189,248,0.28)]">
                Tìm
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "interactive-tab group rounded-[22px] border px-4 py-3.5 text-left shadow-[0_16px_38px_rgba(15,23,42,0.08)] transition",
                  active ? `border-transparent ${tab.className} text-white` : `border-slate-200 bg-white text-slate-800 ${tab.hoverClass}`,
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-[18px] transition-colors duration-200", active ? "bg-white/15" : `bg-slate-100 ${tab.hoverIconClass}`)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[0.92rem] font-bold">{tab.label}</span>
                    <span className={cn("text-[0.75rem] transition-colors duration-200", active ? "text-white/85" : `text-slate-500 ${tab.hoverCountClass}`)}>{tab.count} booking</span>
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        <section className="panel-float rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_22px_56px_rgba(15,23,42,0.08)] md:p-4.5">
          <div className="rounded-[20px] bg-slate-50 px-4 py-3.5 transition-all duration-300 hover:bg-slate-100/90">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => setShowFilters((prev) => !prev)} className="interactive-link flex items-center gap-3 text-[0.92rem] font-bold text-sky-700 md:text-[0.98rem]">
                <Filter className="h-6 w-6" />
                Bộ lọc nâng cao
                <ChevronDown className={cn("h-5 w-5 transition", showFilters && "rotate-180")} />
              </button>
              <button type="button" onClick={resetFilters} className="interactive-link text-[0.82rem] font-bold text-sky-700">Tất cả</button>
            </div>

            {showFilters && (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as StatusFilter }))} className="interactive-chip rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-[0.8rem] font-medium text-slate-700 outline-none shadow-sm">
                  <option value="all">Trạng thái: Tất cả</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="pending">Chờ thanh toán</option>
                  <option value="expired">Hết hạn</option>
                </select>
                <input type="date" value={filters.bookingDate} onChange={(e) => setFilters((prev) => ({ ...prev, bookingDate: e.target.value }))} className="interactive-chip rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-[0.8rem] font-medium text-slate-700 outline-none shadow-sm" />
                <input type="date" value={filters.departureDate} onChange={(e) => setFilters((prev) => ({ ...prev, departureDate: e.target.value }))} className="interactive-chip rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-[0.8rem] font-medium text-slate-700 outline-none shadow-sm" />
                <input type="date" value={filters.arrivalDate} onChange={(e) => setFilters((prev) => ({ ...prev, arrivalDate: e.target.value }))} className="interactive-chip rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-[0.8rem] font-medium text-slate-700 outline-none shadow-sm" />
                <select value={filters.origin} onChange={(e) => setFilters((prev) => ({ ...prev, origin: e.target.value }))} className="interactive-chip rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-[0.8rem] font-medium text-slate-700 outline-none shadow-sm">
                  <option value="">Điểm khởi hành: Tất cả</option>
                  {origins.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <select value={filters.destination} onChange={(e) => setFilters((prev) => ({ ...prev, destination: e.target.value }))} className="interactive-chip rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-[0.8rem] font-medium text-slate-700 outline-none shadow-sm">
                  <option value="">Điểm đến: Tất cả</option>
                  {destinations.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-4">
            {isLoadingBookings && (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                <p className="text-[1.05rem] font-bold text-slate-900">Đang tải booking...</p>
                <p className="mt-2 text-[0.84rem] text-slate-500">Dữ liệu đang được lấy từ hệ thống.</p>
              </div>
            )}

            {!isLoadingBookings && bookingError && (
              <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-14 text-center">
                <p className="text-[1.05rem] font-bold text-red-700">Không thể tải booking</p>
                <p className="mt-2 text-[0.84rem] text-red-600">{bookingError}</p>
              </div>
            )}

            {!isLoadingBookings && !bookingError && paginated.length === 0 && (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                <p className="text-[1.05rem] font-bold text-slate-900">Không tìm thấy booking phù hợp</p>
                <p className="mt-2 text-[0.84rem] text-slate-500">Thử đổi mã booking hoặc bộ lọc nâng cao.</p>
              </div>
            )}

            {!isLoadingBookings && !bookingError && paginated.map((booking) => {
              const meta = statusMeta[booking.status];
              const StatusIcon = meta.icon;
              const TransportIcon = booking.transportType === "flight" ? Plane : Train;
              return (
                <article key={booking.id} className="booking-card rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-sky-50 text-sky-600"><QrCode className="h-4.5 w-4.5" /></span>
                        <h3 className="text-[1.38rem] font-black tracking-tight text-slate-900">{booking.code}</h3>
                        <button type="button" onClick={() => navigator.clipboard.writeText(booking.code).then(() => setCopiedCode(booking.code)).catch(() => setCopiedCode(booking.code))} className="interactive-chip rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.76rem] font-semibold text-slate-600">
                          <span className="flex items-center gap-2"><Copy className="h-3.5 w-3.5" />{copiedCode === booking.code ? "Đã copy" : "Copy mã"}</span>
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-slate-900">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700"><TransportIcon className="h-4.5 w-4.5" /></span>
                        <span className="text-[1.22rem] font-bold tracking-tight">{booking.route}</span>
                      </div>

                      <div className="mt-4 grid gap-3 xl:grid-cols-[200px_repeat(2,minmax(0,170px))]">
                        <div className="info-tile rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-400">Hãng / Đơn vị</p>
                          <div className="mt-3 flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-white text-sky-600 shadow-sm ring-1 ring-slate-200"><TransportIcon className="h-5 w-5" /></span>
                            <p className="text-[0.84rem] font-bold text-slate-900">{booking.carrier}</p>
                          </div>
                        </div>
                        <div className="info-tile rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-400">Ngày khởi hành</p>
                              <p className="mt-2 text-[0.9rem] font-bold text-slate-900">{formatDate(booking.departureDate)}</p>
                            </div>
                            <CalendarDays className="h-5 w-5 text-slate-400" />
                          </div>
                        </div>
                        <div className="info-tile rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-400">Ngày đến</p>
                              <p className="mt-2 text-[0.9rem] font-bold text-slate-900">{formatDate(booking.arrivalDate)}</p>
                            </div>
                            <MapPin className="h-5 w-5 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full flex-col items-start gap-3 xl:w-[230px] xl:items-end">
                      <div className={cn("status-pill rounded-[16px] px-4 py-2.5 shadow-lg", meta.className)}>
                        <span className="flex items-center gap-2 text-[0.9rem] font-bold"><StatusIcon className="h-5 w-5" />{meta.label}</span>
                      </div>
                      <div className="text-left xl:text-right">
                        <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-slate-400">Tổng tiền</p>
                        <p className="mt-1 text-[1.6rem] font-black tracking-tight text-slate-950">{formatCurrency(booking.price)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        {booking.status === "pending" && (
                          <button type="button" onClick={() => router.push(`/user/booking/payment?bookingId=${booking.id}`)} className="button-sheen rounded-full bg-[linear-gradient(135deg,#ffe7b5_0%,#ffbe55_100%)] px-4 py-2 text-[0.76rem] font-bold text-slate-950 shadow-[0_14px_28px_rgba(251,191,36,0.22)]">
                            Thanh toán ngay
                          </button>
                        )}
                        <button type="button" onClick={() => router.push(`/user/bookings/${booking.id}`)} className="button-sheen rounded-full bg-[linear-gradient(135deg,#c8efff_0%,#56bfff_100%)] px-4 py-2 text-[0.76rem] font-bold text-slate-950 shadow-[0_14px_28px_rgba(56,189,248,0.22)]">
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {!isLoadingBookings && !bookingError && (
              <div className="flex flex-col gap-4 rounded-[22px] bg-slate-50 px-4 py-3.5 transition-all duration-300 hover:bg-slate-100/90 md:flex-row md:items-center md:justify-between">
              <p className="text-[0.95rem] font-bold text-slate-900">Trang {currentPage}/{totalPages}</p>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} className="interactive-chip flex h-10 w-10 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-slate-700 shadow-sm disabled:opacity-50">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button key={page} type="button" onClick={() => setCurrentPage(page)} className={cn("interactive-chip flex h-10 min-w-[2.6rem] items-center justify-center rounded-[18px] border text-[0.84rem] font-bold shadow-sm", currentPage === page ? "border-sky-300 bg-[linear-gradient(135deg,#d8f3ff_0%,#5dc5ff_100%)] text-slate-950" : "border-slate-200 bg-white text-slate-700")}>
                    {page}
                  </button>
                ))}
                <button type="button" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="interactive-chip flex h-10 w-10 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-slate-700 shadow-sm disabled:opacity-50">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              </div>
            )}
          </div>
        </section>

        <section className="panel-float rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_22px_56px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[1.26rem] font-bold tracking-tight text-slate-900 md:text-[1.72rem]">Ưu đãi & Voucher nổi bật</h2>
              <p className="mt-1.5 text-[0.82rem] text-slate-500 md:text-[0.9rem]">Nhận ngay khuyến mãi hấp dẫn cho chuyến đi của bạn</p>
            </div>
            <button type="button" onClick={() => router.push("/voucher")} className="button-sheen rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-[0.76rem] font-bold text-sky-700">
              Xem tất cả voucher
            </button>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {PROMOS.map((promo) => (
              <div key={promo} className="promo-card overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50 shadow-sm">
                <Image src={promo} alt="Khuyến mãi nổi bật" width={420} height={240} className="promo-image h-auto w-full object-cover transition-transform duration-700 ease-out" />
              </div>
            ))}
          </div>
        </section>

        <section className="footer-panel relative overflow-hidden rounded-[26px] border border-white/10">
          <Image src="/images/background/footer.png" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-slate-950/55" />
          <div className="relative grid gap-5 px-4 py-5 text-white md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <Image src="/images/image/LogoTransportBooking.png" alt="Transport Booking" width={54} height={54} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <h3 className="text-[0.9rem] font-bold">Transport Booking System</h3>
                  <p className="text-[0.76rem] text-white/85">Đặt vé máy bay & tàu hỏa nhanh chóng, an toàn và tiện lợi.</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-[0.86rem] font-bold">Sản phẩm</h4>
              <p className="mt-3 text-[0.76rem] text-white/85">Vé máy bay</p>
              <p className="mt-2 text-[0.76rem] text-white/85">Vé tàu hỏa</p>
              <p className="mt-2 text-[0.76rem] text-white/85">Ưu đãi & Voucher</p>
            </div>
            <div>
              <h4 className="text-[0.86rem] font-bold">Hỗ trợ</h4>
              <p className="mt-3 text-[0.76rem] text-white/85">Trung tâm hỗ trợ</p>
              <p className="mt-2 text-[0.76rem] text-white/85">Chính sách hoàn/đổi</p>
              <p className="mt-2 text-[0.76rem] text-white/85">Câu hỏi thường gặp</p>
            </div>
            <div>
              <h4 className="text-[0.86rem] font-bold">Liên hệ</h4>
              <p className="mt-3 text-[0.76rem] text-white/85">TP. Hồ Chí Minh, Việt Nam</p>
              <p className="mt-2 text-[0.76rem] text-white/85">support@transportbooking</p>
              <p className="mt-2 text-[0.76rem] text-white/85">19001234</p>
            </div>
          </div>
        </section>
        <style jsx>{`
          .panel-float {
            transition: transform 280ms ease, box-shadow 280ms ease, border-color 280ms ease;
          }

          .panel-float:hover {
            transform: translateY(-4px);
            box-shadow: 0 30px 72px rgba(15, 23, 42, 0.12);
            border-color: rgba(125, 211, 252, 0.45);
          }

          .interactive-chip {
            position: relative;
            overflow: hidden;
            transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, background-color 220ms ease;
          }

          .interactive-chip:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 16px 34px rgba(15, 23, 42, 0.12);
            border-color: rgba(125, 211, 252, 0.55);
          }

          .interactive-chip::after,
          .button-sheen::after {
            content: "";
            position: absolute;
            inset: -30% auto -30% -120%;
            width: 46%;
            transform: skewX(-24deg);
            background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.14) 20%, rgba(255, 255, 255, 0.58) 50%, rgba(255, 255, 255, 0.14) 80%, transparent 100%);
            transition: transform 560ms ease;
            pointer-events: none;
          }

          .interactive-chip:hover::after,
          .button-sheen:hover::after {
            transform: translateX(520%) skewX(-24deg);
          }

          .button-sheen {
            position: relative;
            overflow: hidden;
            transition: transform 220ms ease, box-shadow 220ms ease, filter 220ms ease;
          }

          .button-sheen:hover {
            transform: translateY(-2px);
            filter: saturate(1.06);
          }

          .interactive-tab {
            position: relative;
            overflow: hidden;
            transition: transform 240ms ease, box-shadow 240ms ease, border-color 240ms ease;
          }

          .interactive-tab:hover {
            transform: translateY(-4px) scale(1.01);
            box-shadow: 0 26px 54px rgba(15, 23, 42, 0.12);
          }

          .interactive-link {
            transition: color 220ms ease, transform 220ms ease;
          }

          .interactive-link:hover {
            transform: translateX(3px);
          }

          .booking-card {
            position: relative;
            overflow: hidden;
            transition: transform 300ms ease, box-shadow 300ms ease, border-color 300ms ease;
          }

          .booking-card::before {
            content: "";
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 34%);
            opacity: 0;
            transition: opacity 300ms ease;
            pointer-events: none;
          }

          .booking-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 28px 60px rgba(15, 23, 42, 0.13);
            border-color: rgba(125, 211, 252, 0.42);
          }

          .booking-card:hover::before {
            opacity: 1;
          }

          .info-tile {
            transition: transform 240ms ease, box-shadow 240ms ease, background-color 240ms ease;
          }

          .booking-card:hover .info-tile {
            transform: translateY(-2px);
            background-color: rgba(248, 250, 252, 0.92);
            box-shadow: 0 18px 30px rgba(148, 163, 184, 0.14);
          }

          .status-pill {
            animation: statusGlow 3.8s ease-in-out infinite;
          }

          .promo-card {
            position: relative;
            transition: transform 300ms ease, box-shadow 300ms ease, border-color 300ms ease;
          }

          .promo-card::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(120deg, transparent 12%, rgba(255, 255, 255, 0.24) 28%, transparent 44%);
            transform: translateX(-120%);
            transition: transform 700ms ease;
            pointer-events: none;
          }

          .promo-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 30px 60px rgba(15, 23, 42, 0.16);
            border-color: rgba(125, 211, 252, 0.35);
          }

          .promo-card:hover::after {
            transform: translateX(150%);
          }

          .promo-card:hover :global(.promo-image) {
            transform: scale(1.06);
          }

          .footer-panel::before {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.08) 18%, transparent 34%);
            animation: footerGlow 8s linear infinite;
            pointer-events: none;
          }

          @keyframes statusGlow {
            0%, 100% {
              transform: translateY(0);
              filter: brightness(1);
            }
            50% {
              transform: translateY(-1px);
              filter: brightness(1.06);
            }
          }

          @keyframes footerGlow {
            0% {
              transform: translateX(-120%);
            }
            100% {
              transform: translateX(180%);
            }
          }
        `}</style>
      </div>
    </main>
  );
}


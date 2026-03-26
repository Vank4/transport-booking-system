"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plane,
  Search,
  SlidersHorizontal,
  Train,
} from "lucide-react";
import config from "@/config";

type SearchType = "flight" | "train";

type LocationOption = {
  id: string;
  code: string;
  label: string;
  subtitle: string;
};

type FilterCounts = {
  airlines?: Record<string, number>;
  departure_time?: Record<string, number>;
};

type SearchTrip = {
  _id: string;
  flight_number?: string;
  airline_id?: {
    name?: string;
    iata_code?: string;
  };
  train_id?: {
    name?: string;
    train_number?: string;
  };
  departure_airport_id?: {
    iata_code?: string;
  };
  arrival_airport_id?: {
    iata_code?: string;
  };
  departure_station_id?: {
    name?: string;
    city?: string;
  };
  arrival_station_id?: {
    name?: string;
    city?: string;
  };
  departure_time: string;
  arrival_time: string;
  current_price?: number;
  starting_price?: number;
  prices?: Record<string, number>;
  available_seats_count?: number;
};

const DEFAULT_LIMIT = 10;
const DEFAULT_EMPTY_MESSAGE = "Không tìm thấy chuyến đi phù hợp.";
const SEARCH_HERO_BY_TYPE = {
  flight: {
    heroBg: "/images/background/flight.png",
    accentText: "text-sky-700",
    accentBorder: "border-sky-200",
    accentSurface: "bg-sky-50",
    accentButton:
      "bg-[linear-gradient(135deg,#eff9ff_0%,#2eb1f7_100%)] shadow-[0_10px_20px_rgba(47,174,255,0.16)]",
    accentOverlay:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.82)_0%,rgba(240,249,255,0.72)_42%,rgba(191,229,255,0.68)_100%)]",
  },
  train: {
    heroBg: "/images/background/train.png",
    accentText: "text-orange-700",
    accentBorder: "border-orange-200",
    accentSurface: "bg-orange-50",
    accentButton:
      "bg-[linear-gradient(135deg,#fff4e8_0%,#fb923c_100%)] shadow-[0_10px_20px_rgba(249,115,22,0.18)]",
    accentOverlay:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.82)_0%,rgba(255,247,237,0.74)_42%,rgba(255,221,181,0.68)_100%)]",
  },
} as const;

const timeRanges = [
  { id: "morning", label: "00:00 - 06:00", from: "00:00", to: "05:59" },
  { id: "noon", label: "06:00 - 12:00", from: "06:00", to: "11:59" },
  { id: "afternoon", label: "12:00 - 18:00", from: "12:00", to: "17:59" },
  { id: "evening", label: "18:00 - 24:00", from: "18:00", to: "23:59" },
] as const;

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")} VND`;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN").format(parsed);
}

function formatTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--:--";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getDurationLabel(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "--";
  }

  const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());
  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} phút`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}p`;
}

function getTripPrice(trip: SearchTrip, seatClass: string) {
  const normalizedSeatClass = seatClass.toLowerCase();
  return (
    trip.current_price ??
    trip.prices?.[normalizedSeatClass] ??
    trip.prices?.economy ??
    trip.starting_price ??
    0
  );
}

function getCarrierLabel(type: SearchType, trip: SearchTrip) {
  if (type === "flight") {
    return trip.airline_id?.name || trip.flight_number || "Chuyến bay";
  }

  return trip.train_id?.train_number || trip.train_id?.name || "Chuyến tàu";
}

function getCarrierCode(type: SearchType, trip: SearchTrip) {
  if (type === "flight") {
    return trip.airline_id?.iata_code || "FL";
  }

  return trip.train_id?.train_number?.slice(0, 3) || "TR";
}

function getOriginLabel(type: SearchType, trip: SearchTrip, fallback: string) {
  if (type === "flight") {
    return trip.departure_airport_id?.iata_code || fallback;
  }

  return trip.departure_station_id?.city || trip.departure_station_id?.name || fallback;
}

function getDestinationLabel(type: SearchType, trip: SearchTrip, fallback: string) {
  if (type === "flight") {
    return trip.arrival_airport_id?.iata_code || fallback;
  }

  return trip.arrival_station_id?.city || trip.arrival_station_id?.name || fallback;
}

function SearchPillField({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <div className="flex min-h-[3.7rem] items-center gap-2.5 overflow-hidden rounded-[20px] border border-slate-200/90 bg-white/96 px-3.5 py-2 shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition hover:border-sky-300 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
        <Image
          src={icon}
          alt=""
          width={24}
          height={24}
          className="h-5 w-5 shrink-0 object-contain"
        />
        <span className="text-lg leading-none text-slate-300">|</span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.72rem] font-semibold text-slate-500">{label}</p>
          {children}
        </div>
      </div>
    </label>
  );
}

function SearchCompactField({
  icon,
  children,
}: {
  icon: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[2.55rem] items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 shadow-[0_6px_12px_rgba(15,23,42,0.05)]">
      <Image
        src={icon}
        alt=""
        width={20}
        height={20}
        className="h-4 w-4 shrink-0 object-contain"
      />
      <div className="h-4 w-px bg-slate-300" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const type = (searchParams.get("type") as SearchType) || "flight";
  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const departureDate = searchParams.get("departure_date") || "";
  const passengers = searchParams.get("passengers") || "1";
  const seatClass = searchParams.get("seat_class") || "economy";
  const sort = searchParams.get("sort") || "price:asc";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));

  const [searchType, setSearchType] = useState<SearchType>(type);
  const [searchOrigin, setSearchOrigin] = useState(origin);
  const [searchDest, setSearchDest] = useState(destination);
  const [searchDate, setSearchDate] = useState(departureDate);
  const [returnDate, setReturnDate] = useState("");
  const [searchPassengers, setSearchPassengers] = useState(passengers);
  const [searchSeatClass, setSearchSeatClass] = useState(seatClass);
  const [tripKind, setTripKind] = useState<"one_way" | "round_trip">("one_way");
  const searchHeroTheme = SEARCH_HERO_BY_TYPE[searchType];

  const [results, setResults] = useState<SearchTrip[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [filterCounts, setFilterCounts] = useState<FilterCounts>({});

  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>(
    searchParams.get("airlines")?.split(",").filter(Boolean) || [],
  );
  const [selectedTimeRange, setSelectedTimeRange] = useState(
    timeRanges.find(
      (item) =>
        item.from === searchParams.get("time_from") &&
        item.to === searchParams.get("time_to"),
    )?.id || "",
  );

  const endpointBase =
    searchType === "flight" ? "/flights/search" : "/train-trips/search";
  const locationEndpoint =
    searchType === "flight" ? "/flights/locations" : "/train-trips/locations";

  const carrierOptions = useMemo(() => {
    return Object.entries(filterCounts.airlines || {}).map(([code, count]) => ({
      code,
      label: code,
      count,
    }));
  }, [filterCounts.airlines]);

  const locationList = useMemo(() => {
    const items = [...locationOptions];

    if (searchOrigin && !items.some((item) => item.code === searchOrigin)) {
      items.unshift({
        id: `origin-${searchOrigin}`,
        code: searchOrigin,
        label: searchOrigin,
        subtitle: searchOrigin,
      });
    }

    if (searchDest && !items.some((item) => item.code === searchDest)) {
      items.unshift({
        id: `destination-${searchDest}`,
        code: searchDest,
        label: searchDest,
        subtitle: searchDest,
      });
    }

    return items.filter((item, index, array) => {
      return array.findIndex((candidate) => candidate.code === item.code) === index;
    });
  }, [locationOptions, searchDest, searchOrigin]);

  const originDisplayLabel =
    locationList.find((item) => item.code === origin)?.label || origin || "--";
  const destinationDisplayLabel =
    locationList.find((item) => item.code === destination)?.label || destination || "--";

  const updateURL = (next: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(next).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
        return;
      }

      params.set(key, String(value));
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = () => {
    updateURL({
      type: searchType,
      origin: searchOrigin,
      destination: searchDest,
      departure_date: searchDate,
      passengers: searchPassengers,
      seat_class: searchSeatClass,
      min_price: "",
      max_price: "",
      airlines: "",
      time_from: "",
      time_to: "",
      page: 1,
      limit: DEFAULT_LIMIT,
    });
  };

  const handleTypeChange = (nextType: SearchType) => {
    setSearchType(nextType);
    setSearchOrigin("");
    setSearchDest("");
    setSearchDate("");
    setReturnDate("");
    setTripKind("one_way");
    setMinPrice("");
    setMaxPrice("");
    setSelectedAirlines([]);
    setSelectedTimeRange("");

    updateURL({
      type: nextType,
      origin: "",
      destination: "",
      departure_date: "",
      return_date: "",
      min_price: "",
      max_price: "",
      airlines: "",
      time_from: "",
      time_to: "",
      page: 1,
      limit: DEFAULT_LIMIT,
    });
  };

  const handleApplyFilter = () => {
    const activeTimeRange = timeRanges.find((item) => item.id === selectedTimeRange);
    updateURL({
      min_price: minPrice,
      max_price: maxPrice,
      airlines: selectedAirlines.join(","),
      time_from: activeTimeRange?.from || "",
      time_to: activeTimeRange?.to || "",
      page: 1,
    });
  };

  const resetFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelectedAirlines([]);
    setSelectedTimeRange("");
    updateURL({
      min_price: "",
      max_price: "",
      airlines: "",
      time_from: "",
      time_to: "",
      page: 1,
    });
  };

  useEffect(() => {
    setSearchType(type);
    setSearchOrigin(origin);
    setSearchDest(destination);
    setSearchDate(departureDate);
    setSearchPassengers(passengers);
    setSearchSeatClass(seatClass);
    setMinPrice(searchParams.get("min_price") || "");
    setMaxPrice(searchParams.get("max_price") || "");
    setSelectedAirlines(searchParams.get("airlines")?.split(",").filter(Boolean) || []);
    setSelectedTimeRange(
      timeRanges.find(
        (item) =>
          item.from === searchParams.get("time_from") &&
          item.to === searchParams.get("time_to"),
      )?.id || "",
    );
  }, [departureDate, destination, origin, passengers, searchParams, seatClass, type]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "30" });

    setLocationLoading(true);

    fetch(`${config.apiBaseUrl}${locationEndpoint}?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => res.json().then((payload) => ({ ok: res.ok, payload })))
      .then(({ ok, payload }) => {
        if (!ok) {
          throw new Error(payload?.message || "Không thể tải danh sách địa điểm.");
        }

        setLocationOptions(Array.isArray(payload?.data?.items) ? payload.data.items : []);
      })
      .catch(() => {
        setLocationOptions([]);
      })
      .finally(() => {
        setLocationLoading(false);
      });

    return () => controller.abort();
  }, [locationEndpoint]);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    fetch(`${config.apiBaseUrl}${endpointBase}?${searchParams.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => res.json().then((payload) => ({ ok: res.ok, payload })))
      .then(({ ok, payload }) => {
        if (!ok) {
          if (payload?.errors?.code === "NO_TRIPS_FOUND") {
            setResults([]);
            setTotalItems(0);
            setTotalPages(1);
            setFilterCounts({});
            setError("");
            return;
          }

          throw new Error(payload?.message || DEFAULT_EMPTY_MESSAGE);
        }

        const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
        const pagination = payload?.data?.pagination || {};

        setResults(items);
        setTotalItems(pagination.totalItems || 0);
        setTotalPages(pagination.totalPages || 1);
        setFilterCounts(payload?.data?.filter_counts || {});
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setResults([]);
        setTotalItems(0);
        setTotalPages(1);
        setFilterCounts({});
        setError(err instanceof Error ? err.message : "Không thể tải kết quả tìm kiếm.");
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [departureDate, destination, endpointBase, origin, searchParams]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#edf4fb_38%,#e8eef6_100%)] pb-10 pt-0 text-slate-900">
      <div className="mx-auto max-w-[1140px] px-4 md:px-5">
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200 shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
          <Image
            src={searchHeroTheme.heroBg}
            alt=""
            fill
            priority
            className="object-cover object-center"
          />
          <div className={`absolute inset-0 ${searchHeroTheme.accentOverlay}`} />
          <div className="relative flex flex-col gap-6 p-5 md:p-6">
            <div className="flex flex-col gap-2.5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className={`text-[0.82rem] font-semibold uppercase tracking-[0.16em] ${searchHeroTheme.accentText}`}>
                  {"T\u00ecm ki\u1ebfm"}
                </p>
                <h1 className="mt-1 text-[1.7rem] font-black tracking-tight text-slate-950 md:text-[2.1rem]">
                  {"T\u00ecm chuy\u1ebfn \u0111i ph\u00f9 h\u1ee3p"}
                </h1>
                <p className="mt-1.5 text-[0.94rem] text-slate-600 md:text-[1rem]">
                  {"So s\u00e1nh nhanh c\u00e1c l\u1ef1a ch\u1ecdn v\u00e0 tinh ch\u1ec9nh b\u1ed9 l\u1ecdc ngay tr\u00ean m\u1ed9t m\u00e0n h\u00ecnh."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border bg-white/92 px-3.5 py-1.5 text-[0.95rem] font-semibold ${searchHeroTheme.accentBorder} ${searchHeroTheme.accentText}`}>
                  {searchType === "flight" ? "\u004d\u00e1y bay" : "\u0054\u00e0u h\u1ecfa"}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[0.95rem] font-semibold text-slate-700">
                  {searchPassengers} {"h\u00e0nh kh\u00e1ch"}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[0.95rem] font-semibold text-slate-700">
                  {"H\u1ea1ng: "} {searchSeatClass === "business" ? "Th\u01b0\u01a1ng gia" : "Ph\u1ed5 th\u00f4ng"}
                </span>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/50 bg-white/40 p-3 backdrop-blur-md">
              <div className="grid gap-2 xl:grid-cols-[170px_30px_192px_84px_184px_166px_138px] xl:items-center">
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange("flight")}
                    className={`flex min-h-[2.35rem] items-center gap-1.5 rounded-full border px-3 text-left text-[0.8rem] font-semibold transition ${
                      searchType === "flight"
                        ? `${searchHeroTheme.accentBorder} ${searchHeroTheme.accentSurface} ${searchHeroTheme.accentText}`
                        : searchType === "train"
                          ? "border-slate-200 bg-white text-slate-800 hover:border-orange-200"
                          : "border-slate-200 bg-white text-slate-800 hover:border-sky-200"
                    }`}
                  >
                    <Image
                      src="/images/icons/icons8-plane-96.png"
                      alt=""
                      width={18}
                      height={18}
                      className="h-[14px] w-[14px] shrink-0 object-contain"
                    />
                    {"Vé máy bay"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange("train")}
                    className={`flex min-h-[2.35rem] items-center gap-1.5 rounded-full border px-3 text-left text-[0.8rem] font-semibold transition ${
                      searchType === "train"
                        ? `${searchHeroTheme.accentBorder} ${searchHeroTheme.accentSurface} ${searchHeroTheme.accentText}`
                        : searchType === "train"
                          ? "border-slate-200 bg-white text-slate-800 hover:border-orange-200"
                          : "border-slate-200 bg-white text-slate-800 hover:border-sky-200"
                    }`}
                  >
                    <Image
                      src="/images/icons/icons8-train-100.png"
                      alt=""
                      width={18}
                      height={18}
                      className="h-[14px] w-[14px] shrink-0 object-contain"
                    />
                    {"Vé tàu"}
                  </button>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOrigin(searchDest);
                      setSearchDest(searchOrigin);
                    }}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border bg-white shadow-sm transition hover:-translate-y-0.5 ${searchHeroTheme.accentBorder} ${searchHeroTheme.accentText}`}
                  >
                    <Image
                      src="/images/icons/icons8-data-transfer-64.png"
                      alt=""
                      width={18}
                      height={18}
                      className="h-[14px] w-[14px] object-contain"
                    />
                  </button>
                </div>

                <div className="grid gap-2">
                  <SearchCompactField icon="/images/icons/icons8-location-64.png">
                    <select
                      value={searchOrigin}
                      onChange={(e) => setSearchOrigin(e.target.value)}
                      className="w-full bg-transparent text-[0.78rem] font-semibold text-slate-900 outline-none"
                    >
                      <option value="">{locationLoading ? "Đang tải..." : "Điểm đi"}</option>
                      {locationList.map((item) => (
                        <option key={`origin-${item.code}`} value={item.code}>
                          {item.label} - {item.subtitle}
                        </option>
                      ))}
                    </select>
                  </SearchCompactField>
                  <SearchCompactField icon="/images/icons/icons8-location-64.png">
                    <select
                      value={searchDest}
                      onChange={(e) => setSearchDest(e.target.value)}
                      className="w-full bg-transparent text-[0.78rem] font-semibold text-slate-900 outline-none"
                    >
                      <option value="">{locationLoading ? "Đang tải..." : "Điểm đến"}</option>
                      {locationList.map((item) => (
                        <option key={`destination-${item.code}`} value={item.code}>
                          {item.label} - {item.subtitle}
                        </option>
                      ))}
                    </select>
                  </SearchCompactField>
                </div>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTripKind("one_way");
                      setReturnDate("");
                    }}
                    className={`min-h-[2.35rem] rounded-full border px-2.5 text-[0.76rem] font-semibold transition ${
                      tripKind === "one_way"
                        ? `${searchHeroTheme.accentBorder} ${searchHeroTheme.accentSurface} ${searchHeroTheme.accentText}`
                        : searchType === "train"
                          ? "border-slate-200 bg-white text-slate-800 hover:border-orange-200"
                          : "border-slate-200 bg-white text-slate-800 hover:border-sky-200"
                    }`}
                  >
                    {"Một chiều"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripKind("round_trip")}
                    className={`min-h-[2.35rem] rounded-full border px-2.5 text-[0.76rem] font-semibold transition ${
                      tripKind === "round_trip"
                        ? `${searchHeroTheme.accentBorder} ${searchHeroTheme.accentSurface} ${searchHeroTheme.accentText}`
                        : searchType === "train"
                          ? "border-slate-200 bg-white text-slate-800 hover:border-orange-200"
                          : "border-slate-200 bg-white text-slate-800 hover:border-sky-200"
                    }`}
                  >
                    {"Khứ hồi"}
                  </button>
                </div>

                <div className="grid gap-2">
                  <SearchCompactField icon="/images/icons/icons8-calendar-50.png">
                    <input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="w-full bg-transparent text-[0.78rem] font-semibold text-slate-900 outline-none"
                    />
                  </SearchCompactField>
                  <SearchCompactField icon="/images/icons/icons8-calendar-50.png">
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      placeholder="Ngày về"
                      disabled={tripKind === "one_way"}
                      className="w-full bg-transparent text-[0.78rem] font-semibold text-slate-900 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                    />
                  </SearchCompactField>
                </div>

                <div className="grid gap-2">
                  <SearchCompactField icon="/images/icons/icons8-standing-man-64.png">
                    <input
                      type="number"
                      min={1}
                      value={searchPassengers}
                      onChange={(e) => setSearchPassengers(e.target.value)}
                      className="w-full bg-transparent text-[0.78rem] font-semibold text-slate-900 outline-none [appearance:textfield]"
                    />
                  </SearchCompactField>
                  <SearchCompactField icon="/images/icons/icons8-living-room-48.png">
                    <select
                      value={searchSeatClass}
                      onChange={(e) => setSearchSeatClass(e.target.value)}
                      className="w-full bg-transparent text-[0.78rem] font-semibold text-slate-900 outline-none"
                    >
                      <option value="economy">Phổ thông</option>
                      <option value="business">Thương gia</option>
                    </select>
                  </SearchCompactField>
                </div>

                <div className="flex items-stretch">
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className={`flex min-h-[2.55rem] w-full items-center justify-center rounded-full px-3.5 text-[0.8rem] font-black text-slate-950 transition hover:-translate-y-0.5 ${searchHeroTheme.accentButton}`}
                  >
                    {"Tìm Chuyến"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-7 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
            <section className="rounded-[24px] border border-slate-200/90 bg-white/95 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${searchHeroTheme.accentSurface} ${searchHeroTheme.accentText}`}>
                  <SlidersHorizontal className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h2 className="text-[1.28rem] font-black text-slate-900">{"B\u1ed9 l\u1ecdc"}</h2>
                  <p className="text-sm leading-6 text-slate-500">{"Tinh chỉnh kết quả theo nhu cầu."}</p>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div className="rounded-[20px] border border-slate-200 bg-slate-50/75 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-800">{"Khoảng giá"}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold ${searchHeroTheme.accentSurface} ${searchHeroTheme.accentText}`}>
                      {"VND"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3">
                    <label className="grid gap-1.5">
                      <span className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-slate-400">
                        {"Từ"}
                      </span>
                      <input
                        type="number"
                        placeholder={"Giá thấp nhất"}
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="rounded-[16px] border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-slate-300"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-slate-400">
                        {"Đến"}
                      </span>
                      <input
                        type="number"
                        placeholder={"Giá cao nhất"}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="rounded-[16px] border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-slate-300"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-800">
                        {type === "flight" ? "Hãng bay" : "Mã tàu"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{"Chọn một hoặc nhiều tuỳ chọn."}</p>
                    </div>
                    {carrierOptions.length > 0 && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.7rem] font-bold text-slate-500">
                        {carrierOptions.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-3">
                    {carrierOptions.length === 0 && (
                      <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-400">
                        {"Chưa có dữ liệu bộ lọc."}
                      </div>
                    )}
                    {carrierOptions.map((item) => (
                      <label
                        key={item.code}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white"
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedAirlines.includes(item.code)}
                            onChange={() =>
                              setSelectedAirlines((prev) =>
                                prev.includes(item.code)
                                  ? prev.filter((value) => value !== item.code)
                                  : [...prev, item.code],
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-0"
                          />
                          <span className="font-semibold text-slate-700">{item.label}</span>
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[0.7rem] font-bold text-slate-500 shadow-sm">
                          {item.count}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-800">{"Khung giờ khởi hành"}</p>
                      <p className="mt-1 text-xs text-slate-400">{"Thu hẹp kết quả theo khung giờ bạn muốn."}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold ${searchHeroTheme.accentSurface} ${searchHeroTheme.accentText}`}>
                      {"4 mốc"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {timeRanges.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white"
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedTimeRange === item.id}
                            onChange={() => setSelectedTimeRange((prev) => (prev === item.id ? "" : item.id))}
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-0"
                          />
                          <span className="font-semibold text-slate-700">{item.label}</span>
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[0.7rem] font-bold text-slate-500 shadow-sm">
                          {filterCounts.departure_time?.[item.id] || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Đặt lại
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilter}
                    className={`flex-1 rounded-full px-4 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 ${searchHeroTheme.accentButton}`}
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </section>
          </aside>

          <main className="space-y-5">
            <section className="rounded-[24px] border border-slate-200/90 bg-white/95 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-[1.65rem] font-black tracking-tight text-slate-950">
                    {type === "flight"
                      ? "K\u1ebft qu\u1ea3 chuy\u1ebfn bay"
                      : "K\u1ebft qu\u1ea3 chuy\u1ebfn t\u00e0u"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {"Tuyến "}
                    {originDisplayLabel} {"→"} {destinationDisplayLabel} {" • Ngày đi "}
                    {departureDate ? formatDate(departureDate) : "--"} {" • "}
                    {totalItems} {" kết quả"}
                  </p>
                </div>

                <label className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                  <span className="font-semibold text-slate-500">{"S\u1eafp x\u1ebfp"}</span>
                  <select
                    value={sort}
                    onChange={(e) => updateURL({ sort: e.target.value, page: 1 })}
                    className="bg-transparent font-bold outline-none"
                  >
                    <option value="price:asc">{"Gi\u00e1 th\u1ea5p nh\u1ea5t"}</option>
                    <option value="price:desc">{"Gi\u00e1 cao nh\u1ea5t"}</option>
                    <option value="departure_time:asc">{"Kh\u1edfi h\u00e0nh s\u1edbm nh\u1ea5t"}</option>
                  </select>
                </label>
              </div>
            </section>
            {loading ? (
              <div className="rounded-[24px] border border-slate-200/90 bg-white/95 px-6 py-[4.4rem] text-center shadow-[0_16px_36px_rgba(15,23,42,0.07)]">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-sky-600" />
                <p className="mt-4 text-base font-bold text-slate-900">{"\u0110ang t\u00ecm chuy\u1ebfn \u0111i ph\u00f9 h\u1ee3p..."}</p>
              </div>
            ) : error ? (
              <div className="rounded-[24px] border border-red-200 bg-white/95 px-6 py-[4.4rem] text-center shadow-[0_16px_36px_rgba(15,23,42,0.07)]">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <p className="mt-4 text-lg font-black text-slate-950">{error}</p>
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/95 px-6 py-[4.4rem] text-center shadow-[0_16px_36px_rgba(15,23,42,0.07)]">
                <Search className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-lg font-black text-slate-950">{DEFAULT_EMPTY_MESSAGE}</p>
                <p className="mt-2 text-sm text-slate-500">{"H\u00e3y th\u1eed \u0111\u1ed5i \u0111i\u1ec3m \u0111i, \u0111i\u1ec3m \u0111\u1ebfn, ng\u00e0y \u0111i ho\u1eb7c b\u1ed9 l\u1ecdc."}</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {results.map((trip) => {
                    const price = getTripPrice(trip, seatClass);
                    const carrierLabel = getCarrierLabel(type, trip);
                    const carrierCode = getCarrierCode(type, trip);
                    const tripOrigin = getOriginLabel(type, trip, origin);
                    const tripDestination = getDestinationLabel(type, trip, destination);

                    return (
                      <article
                        key={trip._id}
                        className="rounded-[24px] border border-slate-200/90 bg-white/95 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:border-sky-300"
                      >
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                          <div className="flex min-w-0 flex-1 items-start gap-3.5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                              {type === "flight" ? <Plane className="h-5 w-5" /> : <Train className="h-5 w-5" />}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                                  {carrierCode}
                                </span>
                                <p className="text-[1.02rem] font-black text-slate-950">{carrierLabel}</p>
                              </div>

                              <div className="mt-3.5 grid gap-3 md:grid-cols-[96px_1fr_96px] md:items-center">
                                <div className="text-left">
                                  <p className="text-[1.15rem] font-black text-slate-950">{formatTime(trip.departure_time)}</p>
                                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{tripOrigin}</p>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="h-px flex-1 bg-slate-200" />
                                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                                    {getDurationLabel(trip.departure_time, trip.arrival_time)}
                                  </span>
                                  <div className="h-px flex-1 bg-slate-200" />
                                </div>

                                <div className="text-left md:text-right">
                                  <p className="text-[1.15rem] font-black text-slate-950">{formatTime(trip.arrival_time)}</p>
                                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{tripDestination}</p>
                                </div>
                              </div>

                              <div className="mt-3.5 flex flex-wrap gap-2">
                                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                                  {"Ng\u00e0y \u0111i: "} {formatDate(trip.departure_time)}
                                </span>
                                {type === "flight" && trip.available_seats_count != null && (
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    {"C\u00f2n "} {trip.available_seats_count} {" gh\u1ebf"}
                                  </span>
                                )}
                                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                                  {searchPassengers} {" h\u00e0nh kh\u00e1ch"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex w-full flex-col items-start gap-2.5 xl:w-[200px] xl:items-end">
                            <div className="text-left xl:text-right">
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{"Gi\u00e1 t\u1eeb"}</p>
                              <p className="mt-1 text-[1.35rem] font-black tracking-tight text-slate-950">{formatCurrency(price)}</p>
                            </div>

                            <Link
                              href={type === "flight" ? `/flights/${trip._id}` : `/train-trips/${trip._id}`}
                              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#88dbff_0%,#32afff_100%)] px-5 py-2 text-[0.92rem] font-black text-slate-950 shadow-[0_12px_24px_rgba(50,175,255,0.20)] transition hover:-translate-y-0.5"
                            >
                              {"Ch\u1ecdn chuy\u1ebfn"}
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="flex flex-col items-center justify-between gap-4 rounded-[24px] border border-slate-200/90 bg-white/95 px-5 py-4 shadow-[0_16px_36px_rgba(15,23,42,0.07)] md:flex-row">
                  <p className="text-sm font-bold text-slate-700">
                    {"Trang "}
                    {page}/{totalPages} {" • "} {totalItems} {" kết quả"}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => updateURL({ page: page - 1 })}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition disabled:opacity-40"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => updateURL({ page: page + 1 })}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition disabled:opacity-40"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#eef4fb]">
          <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}



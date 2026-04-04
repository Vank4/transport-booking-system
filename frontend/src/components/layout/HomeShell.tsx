"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { buildLoginRedirect, isAuthenticated } from "@/lib/auth";
import api from "@/lib/api";
import AppSidebar from "./AppSidebar";
import config from "@/config";

type TravelMode = "flight" | "train";
type TripKind = "one_way" | "round_trip";
type ModalType =
  | null
  | "origin"
  | "destination"
  | "departureDate"
  | "returnDate"
  | "passengers"
  | "seatClass";

type HomeShellProps = {
  initialMode?: TravelMode;
};

type LocationOption = {
  id: string;
  code: string;
  label: string;
  subtitle: string;
};

type SeatClassOption = {
  value: string;
  label: string;
  queryValue: string;
};

type SearchFormState = {
  origin: LocationOption | null;
  destination: LocationOption | null;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  seatClass: string;
};

type SearchResultsState = {
  loading: boolean;
  error: string | null;
  items: Array<Record<string, any>>;
};

type LocationState = {
  loading: boolean;
  error: string | null;
  items: LocationOption[];
};

type PopularItem = {
  id: string;
  route: string;
  price: string;
  image: string;
  originCode: string;
  destinationCode: string;
};

type PopularTripApiItem = {
  _id: string;
  current_price?: number;
  starting_price?: number;
  prices?: {
    economy?: number;
    business?: number;
  };
  departure_airport_id?: {
    city?: string;
    iata_code?: string;
  };
  arrival_airport_id?: {
    city?: string;
    iata_code?: string;
  };
  departure_station_id?: {
    city?: string;
    name?: string;
  };
  arrival_station_id?: {
    city?: string;
    name?: string;
  };
};

type PromotionItem = {
  id: string;
  discount: string;
  title: string;
  headline: string;
  savings: string;
  destination: string;
  destinationQuery: string;
  couponCode: string;
  image: string;
};

type NewUserVoucherItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
  code: string;
  destination?: string;
};

type DomesticDealItem = {
  id: string;
  from: string;
  to: string;
  date: string;
  oldPrice: string;
  newPrice: string;
  image: string;
  destinationCode: string;
};

type HomeFlightDealItem = {
  id: string;
  flight_id: string;
  flight_number: string;
  departure_code: string;
  departure_city: string;
  arrival_code: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
  destinationCode: string;
  destinationLabel: string;
  current_price: number;
  old_price: number;
};

type HomeFlightDealsPayload = {
  tabs: Array<{ code: string; label: string }>;
  items: HomeFlightDealItem[];
};

type BookingStep = {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: string;
  iconClassName: string;
};

type WhyChooseUsItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

type BackendProfile = {
  avatar_url?: string;
};

const dataByMode = {
  flight: {
    heroBg: "/images/background/flight.png",
    transportIcon: "/images/icons/icons8-airplane-take-off-50.png",
    switchBg: "/images/background/backgroundTrain.jpg",
    switchIcon: "/images/icons/iconTrain.png",
    switchText: "Đặt vé tàu ở đây",
    button: "from-cyan-200 via-sky-300 to-sky-500",
  },
  train: {
    heroBg: "/images/background/train.png",
    transportIcon: "/images/icons/icons8-train-100.png",
    switchBg: "/images/background/backgroundFlight.jpg",
    switchIcon: "/images/icons/iconFlight.png",
    switchText: "Đặt vé máy bay ở đây",
    button: "from-orange-200 via-amber-300 to-orange-500",
  },
} as const;

const seatClassesByMode: Record<TravelMode, SeatClassOption[]> = {
  flight: [
    { value: "ECONOMY", label: "Phổ thông", queryValue: "economy" },
    { value: "BUSINESS", label: "Thương gia", queryValue: "business" },
  ],
  train: [
    { value: "ECONOMY", label: "Chỗ ngồi phổ thông", queryValue: "economy" },
    { value: "BUSINESS", label: "Khoang ưu tiên", queryValue: "business" },
  ],
};

const popularByMode: Record<
  TravelMode,
  {
    title: string;
    subtitle: string;
    cta: string;
    button: string;
    items: PopularItem[];
  }
> = {
  flight: {
    title: "Tuyến bay phổ biến",
    subtitle: "Khám phá những hành trình được đặt nhiều nhất tuần này",
    cta: "Xem tất cả",
    button: "from-cyan-200 to-sky-500",
    items: [
      {
        id: "flight-1",
        route: "Hà Nội → Đà Nẵng",
        price: "1.660.000 VND",
        image: "/images/background/backgroundFlight.jpg",
        originCode: "HAN",
        destinationCode: "DAD",
      },
      {
        id: "flight-2",
        route: "TP.HCM → Hà Nội",
        price: "2.760.000 VND",
        image: "/images/background/flight.png",
        originCode: "SGN",
        destinationCode: "HAN",
      },
      {
        id: "flight-3",
        route: "Hà Nội → Vũng Tàu",
        price: "3.660.000 VND",
        image: "/images/background/backgroundTrain.jpg",
        originCode: "HAN",
        destinationCode: "PQC",
      },
    ],
  },
  train: {
    title: "Tuyến tàu phổ biến",
    subtitle: "Khám phá những hành trình được đặt nhiều nhất tuần này",
    cta: "Xem tất cả",
    button: "from-orange-200 to-orange-500",
    items: [
      {
        id: "train-1",
        route: "Hà Nội → Đà Nẵng",
        price: "1.660.000 VND",
        image: "/images/background/backgroundTrain.jpg",
        originCode: "Ga Ha Noi",
        destinationCode: "Ga Da Nang",
      },
      {
        id: "train-2",
        route: "TP.HCM → Hà Nội",
        price: "2.760.000 VND",
        image: "/images/background/train.png",
        originCode: "Ga Sai Gon",
        destinationCode: "Ga Ha Noi",
      },
      {
        id: "train-3",
        route: "Hà Nội → Vũng Tàu",
        price: "3.660.000 VND",
        image: "/images/background/backgroundFlight.jpg",
        originCode: "Ga Hue",
        destinationCode: "Ga Ha Noi",
      },
    ],
  },
};

const promotionsByMode: Record<
  TravelMode,
  {
    title: string;
    subtitle: string;
    items: PromotionItem[];
  }
> = {
  flight: {
    title: "Ưu đãi & Voucher nổi bật",
    subtitle: "Nhận ngay khuyến mãi hấp dẫn cho chuyến đi của bạn",
    items: [
      {
        id: "promo-flight-1",
        discount: "-20%",
        title: "Ưu đãi đường bay biển",
        headline: "Bay tới Đà Nẵng",
        savings: "Save up to 20%",
        destination: "Đà Nẵng",
        destinationQuery: "DAD",
        couponCode: "FLYDAD20",
        image: "/images/voucher/ChatGPT Image 12_45_57 25 thg 2, 2026.png",
      },
      {
        id: "promo-flight-2",
        discount: "-30%",
        title: "Săn vé hot cuối tuần",
        headline: "Khám phá Phú Quốc",
        savings: "Save up to 30%",
        destination: "Phú Quốc",
        destinationQuery: "PQC",
        couponCode: "PQC30",
        image: "/images/voucher/ChatGPT Image 12_55_53 25 thg 2, 2026.png",
      },
      {
        id: "promo-flight-3",
        discount: "-15%",
        title: "City Break",
        headline: "Bay tới Hà Nội",
        savings: "Save up to 15%",
        destination: "Hà Nội",
        destinationQuery: "HAN",
        couponCode: "HAN15",
        image: "/images/voucher/ChatGPT Image 13_07_43 25 thg 2, 2026.png",
      },
    ],
  },
  train: {
    title: "Ưu đãi & Voucher nổi bật",
    subtitle: "Nhận ngay khuyến mãi hấp dẫn cho chuyến đi của bạn",
    items: [
      {
        id: "promo-train-1",
        discount: "-20%",
        title: "Weekend Train Deals",
        headline: "Go to Da Nang",
        savings: "Save up to 20%",
        destination: "Đà Nẵng",
        destinationQuery: "Ga Da Nang",
        couponCode: "TRAIN20",
        image: "/images/voucher/ChatGPT Image 12_45_57 25 thg 2, 2026.png",
      },
      {
        id: "promo-train-2",
        discount: "-25%",
        title: "Northern Journey",
        headline: "Ride to Hanoi",
        savings: "Save up to 25%",
        destination: "Hà Nội",
        destinationQuery: "Ga Ha Noi",
        couponCode: "HN25",
        image: "/images/voucher/ChatGPT Image 12_55_53 25 thg 2, 2026.png",
      },
      {
        id: "promo-train-3",
        discount: "-15%",
        title: "City Escape",
        headline: "Trip to Hue",
        savings: "Save up to 15%",
        destination: "Huế",
        destinationQuery: "Ga Hue",
        couponCode: "RAIL15",
        image: "/images/voucher/ChatGPT Image 13_07_43 25 thg 2, 2026.png",
      },
    ],
  },
};

const heroTypedMessagesByMode: Record<TravelMode, string[]> = {
  flight: [
    "Đặt vé máy bay chỉ trong vài chạm.",
    "Săn ưu đãi bay quốc tế theo từng mùa.",
    "So sánh hành trình nhanh, chọn chuyến dễ dàng.",
  ],
  train: [
    "Đặt vé tàu thuận tiện cho mọi hành trình dài.",
    "Theo dõi ưu đãi tuyến hot theo từng ngày.",
    "Chọn chỗ, chọn chuyến và áp mã nhanh hơn.",
  ],
};

const newUserVouchersByMode: Record<
  TravelMode,
  {
    title: string;
    items: NewUserVoucherItem[];
  }
> = {
  flight: {
    title: "Phiếu giảm giá 10% cho người dùng mới",
    items: [
      {
        id: "flight-voucher-1",
        icon: "/images/icons/icons8-plane-94.png",
        title: "Giảm đến 75,000 VND cho lần đặt vé máy bay đầu tiên.",
        description:
          "Áp dụng cho lần đặt đầu tiên trên web Transport Booking System",
        code: "TYVLBANVE",
      },
      {
        id: "flight-voucher-2",
        icon: "/images/icons/icons8-plane-94.png",
        title: "Giảm đến 100,000 VND cho lần đặt vé máy bay đầu tiên khi đi từ Hà Nội → TP.HCM.",
        description:
          "Áp dụng cho lần đặt đầu tiên trên web Transport Booking System",
        code: "FLYHN100",
        destination: "SGN",
      },
      {
        id: "flight-voucher-3",
        icon: "/images/icons/icons8-plane-94.png",
        title: "Giảm đến 65,000 VND cho lần đặt vé máy bay đầu tiên khi đi từ Đà Nẵng → Hà Nội.",
        description:
          "Áp dụng cho lần đặt đầu tiên trên web Transport Booking System",
        code: "DADHAN65",
        destination: "HAN",
      },
    ],
  },
  train: {
    title: "Phiếu giảm giá 10% cho người dùng mới",
    items: [
      {
        id: "train-voucher-1",
        icon: "/images/icons/icons8-train-100.png",
        title: "Giảm đến 75,000 VND cho lần đặt vé tàu đầu tiên.",
        description:
          "Áp dụng cho lần đặt đầu tiên trên web Transport Booking System",
        code: "TYVLBANVE",
      },
      {
        id: "train-voucher-2",
        icon: "/images/icons/icons8-train-100.png",
        title: "Giảm đến 100,000 VND cho lần đặt vé tàu đầu tiên khi đi từ Hà Nội → TP.HCM.",
        description:
          "Áp dụng cho lần đặt đầu tiên trên web Transport Booking System",
        code: "TRAINHN100",
        destination: "Ga Sai Gon",
      },
      {
        id: "train-voucher-3",
        icon: "/images/icons/icons8-train-100.png",
        title: "Giảm đến 65,000 VND cho lần đặt vé tàu đầu tiên khi đi từ Đà Nẵng → Hà Nội.",
        description:
          "Áp dụng cho lần đặt đầu tiên trên web Transport Booking System",
        code: "RAILDNHN65",
        destination: "Ga Ha Noi",
      },
    ],
  },
};

const domesticDealsByMode: Record<
  TravelMode,
  {
    title: string;
    icon: string;
    moreLabel: string;
    tabs: Array<{ code: string; label: string }>;
    items: DomesticDealItem[];
  }
> = {
  flight: {
    title: "Vé máy bay nội địa giá tốt!",
    icon: "/images/icons/icons8-plane-94.png",
    moreLabel: "Xem thêm ưu đãi hay >",
    tabs: [
      { code: "HAN", label: "Hà Nội" },
      { code: "SGN", label: "TP. Hồ Chí Minh" },
      { code: "DAD", label: "Đà Nẵng" },
      { code: "HUI", label: "Huế" },
      { code: "DLI", label: "Đà Lạt" },
      { code: "HPH", label: "Hải Phòng" },
      { code: "QNI", label: "Quảng Ninh" },
    ],
    items: [
      { id: "f-han-1", from: "TP. HCM", to: "Hà Nội", date: "3 thg 3 2026", oldPrice: "768.036 VND", newPrice: "768.017 VND", image: "/images/background/backgroundTrain.jpg", destinationCode: "HAN" },
      { id: "f-han-2", from: "Đà Nẵng", to: "Hà Nội", date: "5 thg 3 2026", oldPrice: "1.268.036 VND", newPrice: "1.098.017 VND", image: "/images/background/flight.png", destinationCode: "HAN" },
      { id: "f-han-3", from: "Nha Trang", to: "Hà Nội", date: "8 thg 3 2026", oldPrice: "1.468.036 VND", newPrice: "1.188.017 VND", image: "/images/background/backgroundFlight.jpg", destinationCode: "HAN" },
      { id: "f-sgn-1", from: "Hà Nội", to: "TP. HCM", date: "3 thg 3 2026", oldPrice: "768.036 VND", newPrice: "768.017 VND", image: "/images/background/flight.png", destinationCode: "SGN" },
      { id: "f-sgn-2", from: "Huế", to: "TP. HCM", date: "6 thg 3 2026", oldPrice: "968.036 VND", newPrice: "818.017 VND", image: "/images/background/backgroundFlight.jpg", destinationCode: "SGN" },
      { id: "f-sgn-3", from: "Đà Lạt", to: "TP. HCM", date: "10 thg 3 2026", oldPrice: "868.036 VND", newPrice: "728.017 VND", image: "/images/background/backgroundTrain.jpg", destinationCode: "SGN" },
      { id: "f-dad-1", from: "Hà Nội", to: "Đà Nẵng", date: "4 thg 3 2026", oldPrice: "668.036 VND", newPrice: "598.017 VND", image: "/images/background/backgroundFlight.jpg", destinationCode: "DAD" },
      { id: "f-dad-2", from: "TP. HCM", to: "Đà Nẵng", date: "7 thg 3 2026", oldPrice: "888.036 VND", newPrice: "758.017 VND", image: "/images/background/flight.png", destinationCode: "DAD" },
      { id: "f-dad-3", from: "Hải Phòng", to: "Đà Nẵng", date: "9 thg 3 2026", oldPrice: "1.068.036 VND", newPrice: "908.017 VND", image: "/images/background/backgroundTrain.jpg", destinationCode: "DAD" },
      { id: "f-hui-1", from: "Hà Nội", to: "Huế", date: "11 thg 3 2026", oldPrice: "728.036 VND", newPrice: "648.017 VND", image: "/images/background/backgroundFlight.jpg", destinationCode: "HUI" },
      { id: "f-dli-1", from: "TP. HCM", to: "Đà Lạt", date: "12 thg 3 2026", oldPrice: "628.036 VND", newPrice: "568.017 VND", image: "/images/background/backgroundTrain.jpg", destinationCode: "DLI" },
      { id: "f-hph-1", from: "Đà Nẵng", to: "Hải Phòng", date: "13 thg 3 2026", oldPrice: "1.128.036 VND", newPrice: "968.017 VND", image: "/images/background/flight.png", destinationCode: "HPH" },
      { id: "f-qni-1", from: "TP. HCM", to: "Quảng Ninh", date: "14 thg 3 2026", oldPrice: "1.328.036 VND", newPrice: "1.148.017 VND", image: "/images/background/backgroundFlight.jpg", destinationCode: "QNI" },
    ],
  },
  train: {
    title: "Vé tàu nội địa giá tốt!",
    icon: "/images/icons/icons8-train-100.png",
    moreLabel: "Xem thêm ưu đãi hay >",
    tabs: [
      { code: "HAN", label: "Hà Nội" },
      { code: "SGN", label: "TP. Hồ Chí Minh" },
      { code: "DAD", label: "Đà Nẵng" },
      { code: "HUI", label: "Huế" },
      { code: "DLI", label: "Đà Lạt" },
      { code: "DNA", label: "Đồng Nai" },
      { code: "THA", label: "Thanh Hóa" },
    ],
    items: [
      { id: "t-han-1", from: "TP. HCM", to: "Hà Nội", date: "3 thg 3 2026", oldPrice: "768.036 VND", newPrice: "768.017 VND", image: "/images/background/backgroundTrain.jpg", destinationCode: "HAN" },
      { id: "t-han-2", from: "Đà Nẵng", to: "Hà Nội", date: "5 thg 3 2026", oldPrice: "668.036 VND", newPrice: "598.017 VND", image: "/images/background/train.png", destinationCode: "HAN" },
      { id: "t-han-3", from: "Huế", to: "Hà Nội", date: "8 thg 3 2026", oldPrice: "568.036 VND", newPrice: "498.017 VND", image: "/images/background/backgroundFlight.jpg", destinationCode: "HAN" },
      { id: "t-sgn-1", from: "Hà Nội", to: "TP. HCM", date: "3 thg 3 2026", oldPrice: "868.036 VND", newPrice: "768.017 VND", image: "/images/background/train.png", destinationCode: "SGN" },
      { id: "t-sgn-2", from: "Đà Nẵng", to: "TP. HCM", date: "6 thg 3 2026", oldPrice: "668.036 VND", newPrice: "588.017 VND", image: "/images/background/backgroundTrain.jpg", destinationCode: "SGN" },
      { id: "t-dad-1", from: "Hà Nội", to: "Đà Nẵng", date: "4 thg 3 2026", oldPrice: "628.036 VND", newPrice: "548.017 VND", image: "/images/background/backgroundFlight.jpg", destinationCode: "DAD" },
      { id: "t-dad-2", from: "TP. HCM", to: "Đà Nẵng", date: "7 thg 3 2026", oldPrice: "728.036 VND", newPrice: "658.017 VND", image: "/images/background/train.png", destinationCode: "DAD" },
      { id: "t-hui-1", from: "Hà Nội", to: "Huế", date: "11 thg 3 2026", oldPrice: "428.036 VND", newPrice: "378.017 VND", image: "/images/background/backgroundTrain.jpg", destinationCode: "HUI" },
      { id: "t-dli-1", from: "TP. HCM", to: "Đà Lạt", date: "12 thg 3 2026", oldPrice: "528.036 VND", newPrice: "468.017 VND", image: "/images/background/backgroundFlight.jpg", destinationCode: "DLI" },
      { id: "t-dna-1", from: "Huế", to: "Đồng Nai", date: "13 thg 3 2026", oldPrice: "688.036 VND", newPrice: "618.017 VND", image: "/images/background/train.png", destinationCode: "DNA" },
      { id: "t-tha-1", from: "Đà Nẵng", to: "Thanh Hóa", date: "14 thg 3 2026", oldPrice: "588.036 VND", newPrice: "518.017 VND", image: "/images/background/backgroundTrain.jpg", destinationCode: "THA" },
    ],
  },
};

const internationalFlightDeals = {
  title: "Vé máy bay quốc tế giá tốt nhất!",
  icon: "/images/icons/icons8-plane-94.png",
  moreLabel: "Xem thêm ưu đãi hay >",
  tabs: [
    { code: "TYO", label: "Tokyo" },
    { code: "SIN", label: "Singapore" },
    { code: "BKK", label: "Bangkok" },
    { code: "ICN", label: "Seoul" },
    { code: "SYD", label: "Sydney" },
    { code: "PAR", label: "Paris" },
  ],
  items: [
    { id: "i-tyo-1", from: "TP. HCM", to: "Tokyo", date: "18 thg 3 2026", oldPrice: "8.768.036 VND", newPrice: "7.968.017 VND", image: "/images/voucher/ChatGPT Image 12_55_53 25 thg 2, 2026.png", destinationCode: "TYO" },
    { id: "i-tyo-2", from: "Hà Nội", to: "Tokyo", date: "22 thg 3 2026", oldPrice: "9.168.036 VND", newPrice: "8.318.017 VND", image: "/images/voucher/ChatGPT Image 12_45_57 25 thg 2, 2026.png", destinationCode: "TYO" },
    { id: "i-sin-1", from: "TP. HCM", to: "Singapore", date: "16 thg 3 2026", oldPrice: "4.768.036 VND", newPrice: "4.118.017 VND", image: "/images/voucher/ChatGPT Image 13_07_43 25 thg 2, 2026.png", destinationCode: "SIN" },
    { id: "i-sin-2", from: "Đà Nẵng", to: "Singapore", date: "20 thg 3 2026", oldPrice: "5.068.036 VND", newPrice: "4.468.017 VND", image: "/images/voucher/ChatGPT Image 12_45_57 25 thg 2, 2026.png", destinationCode: "SIN" },
    { id: "i-bkk-1", from: "Hà Nội", to: "Bangkok", date: "19 thg 3 2026", oldPrice: "5.268.036 VND", newPrice: "4.728.017 VND", image: "/images/voucher/ChatGPT Image 13_07_43 25 thg 2, 2026.png", destinationCode: "BKK" },
    { id: "i-icn-1", from: "TP. HCM", to: "Seoul", date: "25 thg 3 2026", oldPrice: "7.868.036 VND", newPrice: "7.018.017 VND", image: "/images/voucher/ChatGPT Image 12_55_53 25 thg 2, 2026.png", destinationCode: "ICN" },
    { id: "i-syd-1", from: "TP. HCM", to: "Sydney", date: "28 thg 3 2026", oldPrice: "12.768.036 VND", newPrice: "11.318.017 VND", image: "/images/voucher/ChatGPT Image 12_45_57 25 thg 2, 2026.png", destinationCode: "SYD" },
    { id: "i-par-1", from: "Hà Nội", to: "Paris", date: "2 thg 4 2026", oldPrice: "14.268.036 VND", newPrice: "12.918.017 VND", image: "/images/voucher/ChatGPT Image 12_55_53 25 thg 2, 2026.png", destinationCode: "PAR" },
  ],
};

const bookingSteps: BookingStep[] = [
  {
    id: "step-1",
    number: "1",
    title: "Tìm chuyến",
    description: "Chọn điểm đi, điểm đến và ngày khởi hành",
    icon: "/images/icons/iconSearchBookingSteps.png",
    iconClassName: "h-[118px] w-[118px] md:h-[136px] md:w-[136px]",
  },
  {
    id: "step-2",
    number: "2",
    title: "Chọn vé & nhập thông tin",
    description: "Điền thông tin hành khách, chọn hạng ghế",
    icon: "/images/icons/iconPassportBookingSteps.png",
    iconClassName: "h-[122px] w-[122px] md:h-[146px] md:w-[146px]",
  },
  {
    id: "step-3",
    number: "3",
    title: "Thanh toán & nhận vé",
    description: "Thanh toán an toàn và nhận vé điện tử ngay",
    icon: "/images/icons/iconPaymentBookingSteps.png",
    iconClassName: "h-[116px] w-[116px] md:h-[136px] md:w-[136px]",
  },
];

const whyChooseUsItems: WhyChooseUsItem[] = [
  {
    id: "why-flight",
    icon: "/images/icons/iconFlightWhyChooseUs.png",
    title: "500 + Tuyến bay",
    description: "Kết nối hơn 500 điểm bay trên khắp thế giới",
  },
  {
    id: "why-train",
    icon: "/images/icons/iconTrainWhyChooseUs.png",
    title: "200 + Tuyến tàu",
    description: "Mạng lưới đường sắt rộng khắp cả nước",
  },
  {
    id: "why-payment",
    icon: "/images/icons/iconPaymentWhyChooseUs.png",
    title: "Thanh toán an toàn",
    description: "Bảo mật thông tin & nhiều lựa chọn thanh toán",
  },
  {
    id: "why-help",
    icon: "/images/icons/iconHelpWhyChooseUs.png",
    title: "Hỗ trợ 24/7",
    description: "Luôn sẵn sàng giúp đỡ bạn mọi lúc, mọi nơi",
  },
];

const newsletterByMode: Record<
  TravelMode,
  {
    background: string;
  }
> = {
  flight: {
    background: "/images/background/NewsletterFlight.png",
  },
  train: {
    background: "/images/background/NewsletterTrain.png",
  },
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")} VND`;
}

const HOME_SEARCH_LOCATION_MAP: Record<TravelMode, Record<string, string>> = {
  flight: {
    "TP. HCM": "SGN",
    "TP.HCM": "SGN",
    "Hà Nội": "HAN",
    "Đà Nẵng": "DAD",
    "Huế": "HUI",
    "Đà Lạt": "DLI",
    "Hải Phòng": "HPH",
    "Quảng Ninh": "QNI",
    "Nha Trang": "CXR",
    "Tokyo": "TYO",
    "Singapore": "SIN",
    "Bangkok": "BKK",
    "Seoul": "ICN",
    "Sydney": "SYD",
    "Paris": "PAR",
  },
  train: {
    "TP. HCM": "Ga Sai Gon",
    "TP.HCM": "Ga Sai Gon",
    "Hà Nội": "Ga Ha Noi",
    "Đà Nẵng": "Ga Da Nang",
    "Huế": "Ga Hue",
    "Đà Lạt": "Ga Da Lat",
    "Đồng Nai": "Ga Bien Hoa",
    "Thanh Hóa": "Ga Thanh Hoa",
    "Nha Trang": "Ga Nha Trang",
  },
};

const NEWSLETTER_STORAGE_KEY = "home-newsletter-signups";
const FLIGHT_DEAL_IMAGE_BY_CODE: Record<string, string> = {
  HAN: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Hoan_Kiem_Lake,_Hanoi,_Vietnam.jpg",
  SGN: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ho_Chi_Minh_City_Skyline_(night).jpg",
  DAD: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Dragon_Bridge,_Da_Nang_(49040841826).jpg",
  CXR: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Nha_Trang_Beach_5.jpg",
  HPH: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Haiphong_Opera_House.jpg",
  PQC: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Phu_quoc_3.jpg",
  NRT: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Tokyo_Montage_2015.jpg",
  SIN: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Singapore_Panorama_v2.jpg",
  BKK: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Grand_Palace,_Bangkok._Thailand_(15658779983).jpg",
  ICN: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Seoul_Skyline_(6907571755).jpg",
  SYD: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Sydney_Skyline_(2049714613).jpg",
  CDG: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Paris_Skyline_-_roofs.jpg",
};

function normalizeHomeSearchLocation(mode: TravelMode, value: string) {
  return HOME_SEARCH_LOCATION_MAP[mode][value] ?? value;
}

function parseDealDateToIso(value: string) {
  const matched = value.match(/(\d{1,2})\s+thg\s+(\d{1,2})\s+(\d{4})/i);
  if (!matched) return "";

  const [, day, month, year] = matched;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function getFlightDealImageUrl(destinationCode: string, destinationLabel: string) {
  return (
    FLIGHT_DEAL_IMAGE_BY_CODE[destinationCode] ??
    `https://source.unsplash.com/featured/1200x800/?${encodeURIComponent(
      `${destinationLabel} skyline airplane`,
    )}`
  );
}

function toSearchDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function getStoredNewsletterSignups() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(NEWSLETTER_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistNewsletterSignup(email: string, mode: TravelMode) {
  if (typeof window === "undefined") return;

  const nextItems = getStoredNewsletterSignups().filter(
    (item): item is { email: string; mode: TravelMode; subscribed_at: string } =>
      Boolean(item?.email),
  );

  const normalizedEmail = email.trim().toLowerCase();
  const exists = nextItems.some((item) => item.email === normalizedEmail);
  if (!exists) {
    nextItems.push({
      email: normalizedEmail,
      mode,
      subscribed_at: new Date().toISOString(),
    });
  }

  window.localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify(nextItems));
}

function getPassengerSummary(adults: number, children: number) {
  return children > 0
    ? `${adults} người lớn, ${children} trẻ em`
    : `${adults} người lớn`;
}

function getDefaultForm(mode: TravelMode): SearchFormState {
  return {
    origin: null,
    destination: null,
    departureDate: "",
    returnDate: "",
    adults: 1,
    children: 0,
    seatClass: seatClassesByMode[mode][0].value,
  };
}

function SearchField({
  icon,
  label,
  value,
  placeholder,
  onClick,
  error,
  disabled = false,
}: {
  icon: string;
  label: string;
  value: string;
  placeholder: string;
  onClick: () => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex h-[2.2rem] w-full items-center justify-between gap-2 overflow-hidden rounded-full bg-white/90 px-3 text-slate-900 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)] disabled:cursor-not-allowed disabled:opacity-70 md:h-[2.3rem]",
          error && "ring-2 ring-red-300",
        )}
      >
        <span className="flex items-center gap-2.5">
          <Image
            src={icon}
            alt=""
            width={24}
            height={24}
            className="h-5 w-5 object-contain"
          />
          <span className="text-xl leading-none text-slate-400">|</span>
          <span className="text-[10px] font-medium leading-3 text-slate-500 md:text-[11px]">
            {label}
          </span>
        </span>
        <span
          className={cn(
            "max-w-[42%] truncate whitespace-nowrap text-right text-[0.8rem] font-medium leading-4 md:max-w-[46%] md:text-[0.9rem]",
            !value && "text-slate-400",
          )}
        >
          {value || placeholder}
        </span>
      </button>
      {error && (
        <p className="mt-2 px-2 text-sm font-medium text-red-700">{error}</p>
      )}
    </div>
  );
}

function PopularSection({ mode }: { mode: TravelMode }) {
  const router = useRouter();
  const section = popularByMode[mode];
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState<string | null>(null);
  const imagePool = useMemo(
    () =>
      mode === "flight"
        ? [
            "/images/background/backgroundFlight.jpg",
            "/images/background/flight.png",
            "/images/background/backgroundTrain.jpg",
          ]
        : [
            "/images/background/backgroundTrain.jpg",
            "/images/background/train.png",
            "/images/background/backgroundFlight.jpg",
          ],
    [mode],
  );

  useEffect(() => {
    let cancelled = false;

    const loadPopularTrips = async () => {
      setPopularLoading(true);
      setPopularError(null);

      try {
        const endpoint =
          mode === "flight" ? "/flights/search" : "/train-trips/search";
        const { data } = await api.get<{
          data?: { items?: PopularTripApiItem[] };
        }>(endpoint, {
          params: {
            limit: 3,
            page: 1,
            seat_class: "economy",
          },
        });

        if (cancelled) return;

        const items = (data?.data?.items ?? [])
          .slice(0, 3)
          .map((item, index) => {
            if (mode === "flight") {
              const origin = item.departure_airport_id?.city?.trim() || "Điểm đi";
              const destination =
                item.arrival_airport_id?.city?.trim() || "Điểm đến";
              const originCode = item.departure_airport_id?.iata_code?.trim() || "";
              const destinationCode =
                item.arrival_airport_id?.iata_code?.trim() || "";
              const price =
                item.current_price ??
                item.prices?.economy ??
                item.prices?.business ??
                0;

              return {
                id: item._id,
                route: `${origin} → ${destination}`,
                price: formatCurrency(price),
                image: imagePool[index % imagePool.length],
                originCode,
                destinationCode,
              };
            }

            const origin = item.departure_station_id?.city?.trim() || "Điểm đi";
            const destination =
              item.arrival_station_id?.city?.trim() || "Điểm đến";
            const originCode = item.departure_station_id?.name?.trim() || "";
            const destinationCode =
              item.arrival_station_id?.name?.trim() || "";
            const price =
              item.starting_price ??
              item.current_price ??
              item.prices?.economy ??
              0;

            return {
              id: item._id,
              route: `${origin} → ${destination}`,
              price: formatCurrency(price),
              image: imagePool[index % imagePool.length],
              originCode,
              destinationCode,
            };
          })
          .filter((item) => item.originCode && item.destinationCode);

        setPopularItems(items);
      } catch {
        if (cancelled) return;
        setPopularError("Chưa tải được tuyến phổ biến từ hệ thống.");
        setPopularItems([]);
      } finally {
        if (!cancelled) {
          setPopularLoading(false);
        }
      }
    };

    void loadPopularTrips();

    return () => {
      cancelled = true;
    };
  }, [imagePool, mode]);

  const buildPopularHref = (item: PopularItem) => {
    const params = new URLSearchParams({
      type: mode,
      origin: item.originCode,
      destination: item.destinationCode,
      seat_class: "economy",
      page: "1",
    });

    return `/search?${params.toString()}`;
  };
  const openPopularItem = (item: PopularItem) => {
    router.push(buildPopularHref(item));
  };
  const openPopularListing = () => {
    const params = new URLSearchParams({
      type: mode,
      seat_class: "economy",
      page: "1",
    });

    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="w-full border-y border-slate-200/80 bg-white px-4 py-7 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:px-8 md:py-8 lg:px-10">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[1.28rem] font-bold tracking-tight text-slate-950 md:text-[1.55rem]">
              {section.title}
            </h2>
            <p className="mt-1.5 text-[0.92rem] text-slate-700 md:text-[0.95rem]">
              {section.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={openPopularListing}
            className={cn(
              "hidden text-[0.92rem] font-medium transition md:inline-flex",
              mode === "flight"
                ? "text-sky-500 hover:text-sky-600"
                : "text-orange-500 hover:text-orange-600",
            )}
          >
            {section.cta} →
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {popularLoading && (
            <div className="rounded-[14px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-sm font-medium text-slate-500 md:col-span-2 xl:col-span-3">
              Đang tải tuyến phổ biến...
            </div>
          )}
          {!popularLoading && popularError && (
            <div className="rounded-[14px] border border-red-200 bg-red-50 px-5 py-10 text-sm font-medium text-red-600 md:col-span-2 xl:col-span-3">
              {popularError}
            </div>
          )}
          {!popularLoading && !popularError && popularItems.length === 0 && (
            <div className="rounded-[14px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-sm font-medium text-slate-500 md:col-span-2 xl:col-span-3">
              Hiện chưa có tuyến phổ biến phù hợp.
            </div>
          )}
          {!popularLoading && !popularError && popularItems.map((item) => (
            <article
              key={item.id}
              role="link"
              tabIndex={0}
              onClick={() => openPopularItem(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openPopularItem(item);
                }
              }}
              className="group relative overflow-hidden rounded-[14px] shadow-[0_12px_28px_rgba(15,23,42,0.13)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_34px_rgba(15,23,42,0.18)]"
            >
              <div className="relative h-[248px] md:h-[262px]">
                <Image
                  src={item.image}
                  alt={item.route}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3.5">
                  <h3 className="text-[0.92rem] font-bold tracking-tight text-white md:text-[1.02rem]">
                    {item.route}
                  </h3>
                  <p className="mt-1 text-[0.88rem] font-bold text-yellow-300 md:text-[0.96rem]">
                    {item.price}
                  </p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openPopularItem(item);
                    }}
                    className={cn(
                      "hover-sheen mt-2.5 inline-flex h-8 min-w-[146px] items-center justify-center rounded-full bg-gradient-to-r px-4 text-[0.92rem] font-medium text-slate-950 shadow-lg transition hover:brightness-105",
                      section.button,
                    )}
                  >
                    Xem chuyến
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 md:hidden">
          <button
            type="button"
            onClick={openPopularListing}
            className={cn(
              "inline-flex text-[0.92rem] font-medium transition",
              mode === "flight"
                ? "text-sky-500 hover:text-sky-600"
                : "text-orange-500 hover:text-orange-600",
            )}
          >
            {section.cta} →
          </button>
        </div>
      </div>
    </section>
  );
}

function PromotionsBanner({ mode }: { mode: TravelMode }) {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const section = promotionsByMode[mode];

  const scrollPromotions = (direction: "prev" | "next") => {
    const node = trackRef.current;
    if (!node) return;
    const amount = Math.max(node.clientWidth * 0.78, 280);
    node.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  const goToPromotion = (item: PromotionItem) => {
    const params = new URLSearchParams({
      type: mode,
      promo: item.couponCode,
      destination: item.destinationQuery,
      seat_class: "economy",
      page: "1",
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="w-full border-y border-slate-200/80 bg-white px-4 py-7 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:px-8 md:py-8 lg:px-10">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-5">
          <h2 className="text-[1.28rem] font-bold tracking-tight text-slate-950 md:text-[1.55rem]">
            {section.title}
          </h2>
          <p className="mt-1.5 text-[0.92rem] text-slate-700 md:text-[0.95rem]">
            {section.subtitle}
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollPromotions("prev")}
            className="carousel-nav absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-orange-400 bg-white text-xl text-slate-900 shadow-lg md:flex"
            aria-label="Previous promotion"
          >
            ←
          </button>

          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {section.items.map((item) => (
              <article
                key={item.id}
                onClick={() => goToPromotion(item)}
                className="group relative min-w-[280px] flex-[0_0_88%] cursor-pointer overflow-hidden rounded-[22px] shadow-[0_16px_35px_rgba(15,23,42,0.14)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_42px_rgba(15,23,42,0.2)] sm:flex-[0_0_75%] lg:flex-[0_0_46%]"
              >
                <div className="relative h-[240px] w-full">
                  <Image
                    src={item.image}
                    alt={item.headline}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(7,21,62,0.82)_0%,rgba(17,75,196,0.22)_50%,rgba(15,23,42,0.1)_100%)]" />

                  <div className="absolute inset-0 flex flex-col justify-between p-5">
                    <div>
                      <div className="inline-flex rounded-[22px] bg-[linear-gradient(135deg,#ff5a1f_0%,#ff8f1f_55%,#ffd23f_100%)] px-4 py-2 text-[2rem] font-black italic leading-none text-white shadow-[0_14px_28px_rgba(255,115,0,0.35)]">
                        {item.discount}
                      </div>
                      <p className="mt-3 text-[1.05rem] font-bold text-white md:text-[1.2rem]">
                        {item.title}
                      </p>
                      <h3 className="mt-1 text-[1.9rem] font-black leading-none text-white md:text-[2.3rem]">
                        {item.headline}
                      </h3>
                      <p className="mt-2 text-[1.35rem] font-bold text-yellow-300 md:text-[1.7rem]">
                        {item.savings}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        goToPromotion(item);
                      }}
                      className={cn(
                        "hover-sheen inline-flex h-11 w-fit min-w-[170px] items-center justify-center rounded-full bg-gradient-to-r px-6 text-base font-semibold text-white shadow-[0_12px_26px_rgba(15,23,42,0.2)]",
                        mode === "flight"
                          ? "from-cyan-400 to-sky-600"
                          : "from-amber-300 to-orange-500",
                      )}
                    >
                      Book Now →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollPromotions("next")}
            className="carousel-nav absolute right-0 top-1/2 z-10 hidden h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-orange-400 bg-white text-xl text-slate-900 shadow-lg md:flex"
            aria-label="Next promotion"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}

function NewUserVoucherSection({ mode }: { mode: TravelMode }) {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const section = newUserVouchersByMode[mode];

  const scrollVouchers = (direction: "prev" | "next") => {
    const node = trackRef.current;
    if (!node) return;
    const amount = Math.max(node.clientWidth * 0.72, 260);
    node.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  const goToVoucher = (item: NewUserVoucherItem) => {
    const params = new URLSearchParams({
      type: mode,
      promo: item.code,
      seat_class: "economy",
      page: "1",
    });
    if (item.destination) params.set("destination", item.destination);
    router.push(`/search?${params.toString()}`);
  };

  const copyCode = async (item: NewUserVoucherItem) => {
    try {
      await navigator.clipboard.writeText(item.code);
      setCopiedId(item.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === item.id ? null : current));
      }, 1800);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <section className="w-full border-y border-slate-200/80 bg-white px-4 py-7 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:px-8 md:py-8 lg:px-10">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-5 flex items-center gap-3">
          <span className="text-[1.9rem] leading-none">🎁</span>
          <h2
            className={cn(
              "text-[1.28rem] font-bold tracking-tight md:text-[1.55rem]",
              mode === "flight" ? "text-rose-400" : "text-rose-400",
            )}
          >
            {section.title}
          </h2>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollVouchers("prev")}
            className={cn(
              "carousel-nav absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-white text-xl text-slate-900 shadow-lg md:flex",
              mode === "flight" ? "border-sky-400" : "border-orange-400",
            )}
            aria-label="Previous voucher"
          >
            ←
          </button>

          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {section.items.map((item) => (
              <article
                key={item.id}
                onClick={() => goToVoucher(item)}
                className="min-w-[280px] flex-[0_0_88%] cursor-pointer rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_22px_rgba(15,23,42,0.12)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_32px_rgba(15,23,42,0.16)] sm:flex-[0_0_70%] lg:flex-[0_0_38%]"
              >
                <div className="flex items-start gap-2.5">
                  <Image
                    src={item.icon}
                    alt=""
                    width={28}
                    height={28}
                    className="mt-0.5 h-7 w-7 object-contain"
                  />
                  <div>
                    <h3 className="text-[1rem] font-semibold leading-6 text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[0.92rem] leading-5 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center overflow-hidden rounded-[12px] bg-slate-100">
                  <div className="flex flex-1 items-center gap-3 px-4 py-3">
                    <Image
                      src="/images/icons/icons8-copy-64.png"
                      alt=""
                      width={18}
                      height={18}
                      className="h-[1.05rem] w-[1.05rem] object-contain opacity-70"
                    />
                    <span className="text-[1rem] tracking-[0.08em] text-slate-900">
                      {item.code}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void copyCode(item);
                    }}
                    className={cn(
                      "hover-sheen h-full min-w-[96px] px-4 py-3 text-[0.98rem] font-medium shadow-inner transition",
                      mode === "flight"
                        ? "bg-[linear-gradient(90deg,#f8fbff_0%,#c9ebff_35%,#4db5ff_100%)] text-slate-900"
                        : "bg-[linear-gradient(90deg,#fff8ef_0%,#ffe3bf_35%,#ff9a33_100%)] text-slate-900",
                    )}
                  >
                    {copiedId === item.id ? "Đã copy mã" : "Copy"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollVouchers("next")}
            className={cn(
              "carousel-nav absolute right-0 top-1/2 z-10 hidden h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-white text-xl text-slate-900 shadow-lg md:flex",
              mode === "flight" ? "border-sky-400" : "border-orange-400",
            )}
            aria-label="Next voucher"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}

function DealsSection({
  mode,
  section,
}: {
  mode: TravelMode;
  section: {
    title: string;
    icon: string;
    moreLabel: string;
    tabs: Array<{ code: string; label: string }>;
    items: DomesticDealItem[];
  };
}) {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState(section.tabs[0]?.code ?? "");

  useEffect(() => {
    setActiveTab(section.tabs[0]?.code ?? "");
  }, [section.tabs]);

  const visibleItems = section.items.filter(
    (item) => item.destinationCode === activeTab,
  );

  const scrollDeals = (direction: "prev" | "next") => {
    const node = trackRef.current;
    if (!node) return;
    const amount = Math.max(node.clientWidth * 0.7, 260);
    node.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  const openDeal = (item: DomesticDealItem) => {
    const params = new URLSearchParams({
      type: mode,
      origin: normalizeHomeSearchLocation(mode, item.from),
      destination: normalizeHomeSearchLocation(mode, item.to),
      page: "1",
    });

    const isoDate = parseDealDateToIso(item.date);
    if (isoDate) {
      params.set("departure_date", isoDate);
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="w-full border-y border-slate-200/80 bg-white px-4 py-7 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:px-8 md:py-8 lg:px-10">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex items-center gap-2.5">
          <Image
            src={section.icon}
            alt=""
            width={36}
            height={36}
            className="h-8 w-8 object-contain"
          />
          <h2
            className={cn(
              "text-[1.28rem] font-bold tracking-tight md:text-[1.55rem]",
              mode === "flight" ? "text-sky-500" : "text-orange-500",
            )}
          >
            {section.title}
          </h2>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {section.tabs.map((tab) => (
            <button
              key={tab.code}
              type="button"
              onClick={() => setActiveTab(tab.code)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-[0.92rem] font-medium transition",
                activeTab === tab.code
                  ? mode === "flight"
                    ? "border-sky-300 bg-sky-100 text-sky-700"
                    : "border-orange-300 bg-orange-100 text-orange-700"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative mt-5">
          <button
            type="button"
            onClick={() => scrollDeals("prev")}
            className={cn(
              "carousel-nav absolute left-0 top-[5.25rem] z-10 hidden h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-white text-xl text-slate-900 shadow-lg md:flex",
              mode === "flight" ? "border-sky-400" : "border-orange-400",
            )}
            aria-label="Previous domestic deals"
          >
            ←
          </button>

          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {visibleItems.map((item) => (
              <article
                key={item.id}
                onClick={() => openDeal(item)}
                className="group min-w-[235px] flex-[0_0_82%] cursor-pointer overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_30px_rgba(15,23,42,0.18)] sm:flex-[0_0_48%] lg:flex-[0_0_22%]"
              >
                <div className="relative h-[165px]">
                  <Image
                    src={item.image}
                    alt={item.to}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-[0.95rem] font-semibold text-slate-900">
                    {item.from} → {item.to}
                  </h3>
                  <p className="mt-1 text-[0.88rem] text-slate-700">
                    {item.date}
                  </p>
                  <p className="mt-1 text-[0.9rem] text-slate-500 line-through">
                    {item.oldPrice}
                  </p>
                  <p
                    className={cn(
                      "text-[1rem] font-bold",
                      mode === "flight" ? "text-amber-500" : "text-amber-500",
                    )}
                  >
                    {item.newPrice}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollDeals("next")}
            className={cn(
              "carousel-nav absolute right-0 top-[5.25rem] z-10 hidden h-11 w-11 translate-x-1/2 items-center justify-center rounded-full border-2 bg-white text-xl text-slate-900 shadow-lg md:flex",
              mode === "flight" ? "border-sky-400" : "border-orange-400",
            )}
            aria-label="Next domestic deals"
          >
            →
          </button>
        </div>

        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams({
                type: mode,
                page: "1",
              });

              if (activeTab) {
                params.set(
                  "destination",
                  normalizeHomeSearchLocation(mode, section.tabs.find((tab) => tab.code === activeTab)?.label ?? activeTab),
                );
              }

              router.push(`/search?${params.toString()}`);
            }}
            className={cn(
              "hover-sheen inline-flex h-10 min-w-[260px] items-center justify-center rounded-[10px] px-6 text-[0.98rem] font-semibold text-slate-900 shadow-sm",
              mode === "flight"
                ? "bg-[linear-gradient(90deg,#eef8ff_0%,#bfe6ff_45%,#55b8ff_100%)]"
                : "bg-[linear-gradient(90deg,#fff6ea_0%,#ffd7ad_45%,#ff9d47_100%)]",
            )}
          >
            {section.moreLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

function FlightDealsSection({
  scope,
  title,
}: {
  scope: "domestic" | "international";
  title: string;
}) {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [deals, setDeals] = useState<HomeFlightDealsPayload>({
    tabs: [],
    items: [],
  });
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDeals = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${config.apiBaseUrl}/home/flight-deals?scope=${scope}&limit=12&per_destination_limit=12`,
        );
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || !payload?.success) {
          throw new Error(
            payload?.message ?? "Khong the tai danh sach uu dai chuyen bay",
          );
        }

        const nextDeals = {
          tabs: Array.isArray(payload?.data?.tabs) ? payload.data.tabs : [],
          items: Array.isArray(payload?.data?.items) ? payload.data.items : [],
        };

        if (cancelled) return;
        setDeals(nextDeals);
        setActiveTab((current) => current || nextDeals.tabs[0]?.code || "");
      } catch (fetchError) {
        if (cancelled) return;
        setDeals({ tabs: [], items: [] });
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Khong the tai danh sach uu dai chuyen bay",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDeals();

    return () => {
      cancelled = true;
    };
  }, [scope]);

  useEffect(() => {
    if (!deals.tabs.some((tab) => tab.code === activeTab)) {
      setActiveTab(deals.tabs[0]?.code || "");
    }
  }, [activeTab, deals.tabs]);

  const visibleItems = deals.items.filter(
    (item) => item.destinationCode === activeTab,
  );

  const scrollDeals = (direction: "prev" | "next") => {
    const node = trackRef.current;
    if (!node) return;
    const amount = Math.max(node.clientWidth * 0.7, 260);
    node.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  const openDeal = (item: HomeFlightDealItem) => {
    const params = new URLSearchParams({
      type: "flight",
      origin: item.departure_code,
      destination: item.arrival_code,
      page: "1",
    });

    const searchDate = toSearchDate(item.departure_time);
    if (searchDate) {
      params.set("departure_date", searchDate);
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="w-full border-y border-slate-200/80 bg-white px-4 py-7 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:px-8 md:py-8 lg:px-10">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex items-center gap-2.5">
          <Image
            src="/images/icons/icons8-plane-94.png"
            alt=""
            width={36}
            height={36}
            className="h-8 w-8 object-contain"
          />
          <h2 className="text-[1.28rem] font-bold tracking-tight text-sky-500 md:text-[1.55rem]">
            {title}
          </h2>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {deals.tabs.map((tab) => (
            <button
              key={tab.code}
              type="button"
              onClick={() => setActiveTab(tab.code)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-[0.92rem] font-medium transition",
                activeTab === tab.code
                  ? "border-sky-300 bg-sky-100 text-sky-700"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-5 rounded-[14px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-sm font-medium text-slate-500">
            Dang tai uu dai chuyen bay...
          </div>
        )}

        {!loading && error && (
          <div className="mt-5 rounded-[14px] border border-red-200 bg-red-50 px-5 py-10 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && visibleItems.length === 0 && (
          <div className="mt-5 rounded-[14px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-sm font-medium text-slate-500">
            Chua co du lieu chuyen bay phu hop trong he thong.
          </div>
        )}

        {!loading && !error && visibleItems.length > 0 && (
          <>
            <div className="relative mt-5">
              <button
                type="button"
                onClick={() => scrollDeals("prev")}
                className="carousel-nav absolute left-0 top-[5.25rem] z-10 hidden h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border-2 border-sky-400 bg-white text-xl text-slate-900 shadow-lg md:flex"
                aria-label={`Previous ${scope} flight deals`}
              >
                {"<-"}
              </button>

              <div
                ref={trackRef}
                className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {visibleItems.map((item) => (
                  <article
                    key={item.id}
                    onClick={() => openDeal(item)}
                    className="group min-w-[235px] flex-[0_0_82%] cursor-pointer overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_30px_rgba(15,23,42,0.18)] sm:flex-[0_0_48%] lg:flex-[0_0_22%]"
                  >
                    <div className="relative h-[165px]">
                      <img
                        src={getFlightDealImageUrl(
                          item.arrival_code,
                          item.destinationLabel,
                        )}
                        alt={`${item.departure_city} den ${item.arrival_city}`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-[0.95rem] font-semibold text-slate-900">
                        {item.departure_city} {"->"} {item.arrival_city}
                      </h3>
                      <p className="mt-1 text-[0.88rem] text-slate-700">
                        {formatDateLabel(item.departure_time)}
                      </p>
                      <p className="mt-1 text-[0.9rem] text-slate-500 line-through">
                        {formatCurrency(item.old_price)}
                      </p>
                      <p className="text-[1rem] font-bold text-amber-500">
                        {formatCurrency(item.current_price)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              <button
                type="button"
                onClick={() => scrollDeals("next")}
                className="carousel-nav absolute right-0 top-[5.25rem] z-10 hidden h-11 w-11 translate-x-1/2 items-center justify-center rounded-full border-2 border-sky-400 bg-white text-xl text-slate-900 shadow-lg md:flex"
                aria-label={`Next ${scope} flight deals`}
              >
                {"->"}
              </button>
            </div>

            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams({
                    type: "flight",
                    page: "1",
                  });

                  if (activeTab) {
                    params.set("destination", activeTab);
                  }

                  router.push(`/search?${params.toString()}`);
                }}
                className="hover-sheen inline-flex h-10 min-w-[260px] items-center justify-center rounded-[10px] bg-[linear-gradient(90deg,#eef8ff_0%,#bfe6ff_45%,#55b8ff_100%)] px-6 text-[0.98rem] font-semibold text-slate-900 shadow-sm"
              >
                Xem them uu dai hay {">"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function DomesticDealsSection({ mode }: { mode: TravelMode }) {
  if (mode === "flight") {
    return (
      <FlightDealsSection
        scope="domestic"
        title="Ve may bay noi dia gia tot!"
      />
    );
  }

  return <DealsSection mode={mode} section={domesticDealsByMode[mode]} />;
}

function InternationalFlightDealsSection() {
  return (
    <FlightDealsSection
      scope="international"
      title="Ve may bay quoc te gia tot nhat!"
    />
  );
}

function BookingStepsSection() {
  return (
    <section className="relative w-full overflow-hidden border-y border-slate-200/80 bg-white">
      <div className="absolute inset-0">
        <Image
          src="/images/background/backgroundBookingSteps.png"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-white/20 backdrop-[blur(1px)]" />
      </div>

      <div className="relative mx-auto max-w-[1220px] px-4 py-10 md:px-8 md:py-12 lg:px-10">
        <div className="text-center">
          <h2 className="text-[1.75rem] font-bold tracking-tight text-slate-950 md:text-[2.2rem]">
            Cách thức đặt vé dễ dàng chỉ với{" "}
            <span className="text-sky-500">3</span> bước
          </h2>
          <p className="mt-2 text-[1rem] font-medium text-slate-900 md:text-[1.15rem]">
            Đặt vé máy bay và tàu hỏa chỉ trong vài bước đơn giản sau:
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {bookingSteps.map((step) => (
            <article
              key={step.id}
              className="rounded-[24px] border border-white/45 bg-white/40 px-5 pb-6 pt-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-md transition duration-300 hover:-translate-y-1.5 hover:bg-white/55 hover:shadow-[0_24px_46px_rgba(15,23,42,0.14)]"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400 text-sm font-bold text-slate-950">
                  {step.number}
                </span>
                <h3 className="text-[1rem] font-bold text-slate-950 md:text-[1.05rem]">
                  {step.title}
                </h3>
              </div>
              <p className="mt-3 text-[0.96rem] leading-6 text-slate-900">
                {step.description}
              </p>

              <div className="mt-7 flex justify-center">
                <Image
                  src={step.icon}
                  alt={step.title}
                  width={146}
                  height={146}
                  className={cn("object-contain drop-shadow-[0_12px_24px_rgba(15,23,42,0.12)]", step.iconClassName)}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUsSection() {
  return (
    <section className="w-full border-y border-slate-200/80 bg-white px-4 py-10 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:px-8 md:py-12 lg:px-10">
      <div className="mx-auto max-w-[1220px]">
        <div className="text-center">
          <h2 className="font-sans text-[1.85rem] font-bold tracking-tight text-slate-950 md:text-[2.4rem]">
            Tại sao chọn Transport Booking System?
          </h2>
          <p className="mt-2 text-[1rem] font-medium text-slate-500 md:text-[1.2rem]">
            Đặt vé dễ dàng với chúng tôi - Dịch vụ tin cậy hàng đầu
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {whyChooseUsItems.map((item) => (
            <article
              key={item.id}
              className="rounded-[18px] border border-slate-200 bg-white px-6 py-6 text-center shadow-[0_10px_24px_rgba(15,23,42,0.10)] transition duration-300 hover:-translate-y-1.5 hover:border-sky-200 hover:shadow-[0_18px_34px_rgba(15,23,42,0.14)]"
            >
              <div className="flex justify-center">
                <Image
                  src={item.icon}
                  alt={item.title}
                  width={128}
                  height={128}
                  className="h-28 w-28 object-contain"
                />
              </div>
              <h3 className="mt-4 text-[1.05rem] font-bold text-slate-950 md:text-[1.15rem]">
                {item.title}
              </h3>
              <p className="mt-2 text-[0.92rem] leading-7 text-slate-500">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsletterSection({ mode }: { mode: TravelMode }) {
  const [email, setEmail] = useState("");
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterToast, setNewsletterToast] = useState<string | null>(null);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const background = newsletterByMode[mode].background;

  useEffect(() => {
    if (!email.trim()) {
      setNewsletterSubscribed(false);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const alreadySubscribed = getStoredNewsletterSignups().some(
      (item) => item.email === normalizedEmail,
    );

    setNewsletterSubscribed(alreadySubscribed);
  }, [email]);

  const validateNewsletterEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "Vui lòng nhập email";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return "Email không hợp lệ";
    return null;
  };

  const submitNewsletter = async () => {
    if (newsletterSubscribed || newsletterLoading) return;

    const validationError = validateNewsletterEmail(email);
    setNewsletterError(validationError);
    setNewsletterToast(null);
    if (validationError) return;

    setNewsletterLoading(true);
    try {
      const res = await fetch(`${config.apiBaseUrl}/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          mode,
          subscribed_at: new Date().toISOString(),
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 404 || res.status === 405) {
          persistNewsletterSignup(email, mode);
          setNewsletterSubscribed(true);
          setNewsletterError(null);
          setNewsletterToast("Da ghi nhan email cua ban");
          return;
        }
        const message =
          payload?.message ??
          (res.status === 409
            ? "Bạn đã đăng ký rồi"
            : "Không thể đăng ký lúc này");
        setNewsletterError(message);
        return;
      }

      persistNewsletterSignup(email, mode);
      setNewsletterSubscribed(true);
      setNewsletterError(null);
      setNewsletterToast("Đăng ký thành công");
    } catch {
      setNewsletterError("Không thể đăng ký lúc này");
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <section className="w-full border-y border-slate-200/80 bg-white px-4 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:px-8 md:py-10 lg:px-10">
      <div className="mx-auto max-w-[1220px]">
        <div className="relative overflow-hidden rounded-[26px]">
          <Image
            src={background}
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.06)_100%)]" />

          <div className="relative px-6 py-6 md:px-9 md:py-7">
            <div className="inline-block rounded-[20px] bg-white/55 px-6 py-3 backdrop-blur-sm">
              <h2 className="font-sans text-[2rem] font-black leading-none tracking-tight text-black md:text-[2.45rem]">
                Nhận ưu đãi mới mỗi tuần
              </h2>
              <p className="mt-2 text-[1.05rem] font-semibold text-slate-700 md:text-[1.25rem]">
                Đăng ký email để không bỏ lỡ Voucher & deal hot
              </p>
            </div>

            <div className="mt-8 flex flex-col overflow-hidden rounded-full border border-slate-300/70 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)] md:flex-row">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="Nhập email của bạn"
                disabled={newsletterSubscribed || newsletterLoading}
                className="h-14 flex-1 bg-transparent px-6 text-[1rem] font-medium text-slate-700 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-70 md:text-[1.1rem]"
              />
              <button
                type="button"
                onClick={submitNewsletter}
                disabled={newsletterSubscribed || newsletterLoading}
                className={cn(
                  "hover-sheen h-14 min-w-[200px] rounded-full text-[1rem] font-bold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 md:text-[1.15rem]",
                  mode === "flight"
                    ? "bg-[linear-gradient(90deg,#d8f3ff_0%,#56bfff_100%)]"
                    : "bg-[linear-gradient(90deg,#ffe3bf_0%,#4db5ff_100%)]",
                )}
              >
                {newsletterSubscribed
                  ? "Bạn đã đăng ký rồi"
                  : newsletterLoading
                    ? "Đang đăng ký..."
                    : "Đăng ký"}
              </button>
            </div>

            <div className="mt-3 min-h-[2rem]">
              {newsletterError && (
                <div className="inline-flex rounded-full bg-rose-50 px-4 py-2 text-[0.92rem] font-medium text-rose-600 shadow-sm">
                  {newsletterError}
                </div>
              )}
              {!newsletterError && newsletterToast && (
                <div className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-[0.92rem] font-medium text-emerald-700 shadow-sm">
                  {newsletterToast}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeFooter() {
  const footerGroups = [
    {
      title: "Sản phẩm",
      items: [
        "Vé máy bay",
        "Vé tàu hỏa",
        "Ưu đãi & Voucher",
        "Hướng dẫn đặt vé",
      ],
    },
    {
      title: "Hỗ trợ",
      items: [
        "Trung tâm hỗ trợ",
        "Chính sách hoàn/đổi",
        "Câu hỏi thường gặp",
      ],
    },
    {
      title: "Liên hệ",
      items: [
        "TP. Hồ Chí Minh, Việt Nam",
        "support@transportbooking",
        "19001234",
        "Hỗ trợ 24/7",
      ],
    },
  ];

  return (
    <footer className="relative mt-3 overflow-hidden border-t border-white/15">
      <Image
        src="/images/background/footer.png"
        alt=""
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.12)_0%,rgba(12,19,46,0.58)_40%,rgba(8,12,31,0.82)_100%)]" />

      <div className="relative mx-auto max-w-[1140px] px-4 py-6 text-white md:px-6 md:py-7 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-3">
            <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/35 bg-white/10 shadow-[0_8px_22px_rgba(8,12,31,0.24)] backdrop-blur-sm">
              <Image
                src="/images/image/LogoTransportBooking.png"
                alt="Transport Booking System"
                width={58}
                height={58}
                className="h-full w-full object-cover"
              />
            </div>

            <div>
              <h2 className="font-sans text-[1.7rem] font-bold tracking-tight text-white md:text-[2.05rem]">
                Transport Booking System
              </h2>
              <p className="mt-1.5 max-w-3xl text-[0.88rem] font-semibold leading-5 text-white/95 md:text-[1.25rem] md:leading-[1.2]">
                Đặt vé máy bay & tàu hỏa nhanh chóng, an toàn và tiện lợi.
              </p>
            </div>
          </div>

          <div className="grid gap-6 border-t border-white/35 pt-5 lg:grid-cols-[1.08fr_2.2fr] lg:gap-5">
            <div className="space-y-4">
              <div>
                <h3 className="text-[1.02rem] font-bold text-white md:text-[1.12rem]">
                  Đối tác thanh toán
                </h3>
                <div className="mt-2.5 overflow-hidden rounded-[16px] border border-white/25 bg-white/92 shadow-[0_10px_24px_rgba(10,14,33,0.16)]">
                  <Image
                    src="/images/image/Bank.png"
                    alt="Danh sách ngân hàng và đối tác thanh toán"
                    width={500}
                    height={220}
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-[1.02rem] font-bold text-white md:text-[1.12rem]">
                  Đối tác hàng không
                </h3>
                <div className="mt-2.5 overflow-hidden rounded-[16px] border border-white/25 bg-white/92 shadow-[0_10px_24px_rgba(10,14,33,0.16)]">
                  <Image
                    src="/images/image/airline_list.png"
                    alt="Danh sách hãng hàng không"
                    width={500}
                    height={280}
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {footerGroups.map((group) => (
                <section
                  key={group.title}
                  className="border-l border-white/25 pl-0 md:pl-5"
                >
                  <h3 className="text-center text-[1.15rem] font-bold text-white md:text-left md:text-[1.28rem]">
                    {group.title}
                  </h3>
                  <ul className="mt-3 space-y-2.5 text-[0.82rem] leading-6 text-white/95 md:text-[0.9rem]">
                    {group.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="pt-1 text-white/85">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-white/25 pt-4 text-[0.74rem] font-semibold text-white/95 md:flex-row md:items-center md:justify-between md:text-[0.82rem]">
            <p>2026 Transport Booking System. All rights reserved</p>
            <p>Term - Privacy - Cookies</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomeShell({ initialMode = "flight" }: HomeShellProps) {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [mode, setMode] = useState<TravelMode>(initialMode);
  const [modeTransitioning, setModeTransitioning] = useState(false);
  const [tripKind, setTripKind] = useState<TripKind>("one_way");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [userAvatar, setUserAvatar] = useState(
    "/images/icons/icons8-user-male-64.png",
  );
  const [locationSearch, setLocationSearch] = useState("");
  const [typedLine, setTypedLine] = useState("");
  const [typedIndex, setTypedIndex] = useState(0);
  const [typedDeleting, setTypedDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<SearchResultsState>({
    loading: false,
    error: null,
    items: [],
  });
  const [locationState, setLocationState] = useState<LocationState>({
    loading: false,
    error: null,
    items: [],
  });
  const [form, setForm] = useState<SearchFormState>(() =>
    getDefaultForm(initialMode),
  );
  const modeSwitchTimerRef = useRef<number | null>(null);
  const modeSwitchEndTimerRef = useRef<number | null>(null);

  const view = dataByMode[mode];

  const navigateToProtectedPage = (targetPath: string) => {
    if (!isAuthenticated()) {
      router.push(buildLoginRedirect(targetPath));
      return;
    }

    router.push(targetPath);
  };
  const seatOptions = seatClassesByMode[mode];
  const heroTypedMessages = heroTypedMessagesByMode[mode];
  const selectedSeatLabel =
    seatOptions.find((item) => item.value === form.seatClass)?.label ?? "";
  const selectedSeatQueryValue =
    seatOptions.find((item) => item.value === form.seatClass)?.queryValue ??
    seatOptions[0]?.queryValue ??
    "economy";
  const sidebarSearchHref = useMemo(() => {
    const params = new URLSearchParams({ type: mode });
    if (form.origin?.code) params.set("origin", form.origin.code);
    if (form.destination?.code) params.set("destination", form.destination.code);
    if (form.departureDate) params.set("departure_date", form.departureDate);
    if (tripKind === "round_trip" && form.returnDate) {
      params.set("return_date", form.returnDate);
    }
    const passengers = form.adults + form.children;
    if (passengers > 0) params.set("passengers", String(passengers));
    params.set("seat_class", selectedSeatQueryValue);
    params.set("page", "1");
    return `/search?${params.toString()}`;
  }, [
    form.adults,
    form.children,
    form.departureDate,
    form.destination?.code,
    form.origin?.code,
    form.returnDate,
    mode,
    selectedSeatQueryValue,
    tripKind,
  ]);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      setUserAvatar("/images/icons/icons8-user-male-64.png");
      return;
    }

    let cancelled = false;

    const loadProfileAvatar = async () => {
      try {
        const { data } = await api.get<{ data?: BackendProfile }>(
          "/auth/profile",
        );
        if (cancelled) return;
        setUserAvatar(
          data?.data?.avatar_url?.trim() ||
            "/images/icons/icons8-user-male-64.png",
        );
      } catch {
        if (cancelled) return;
        setUserAvatar("/images/icons/icons8-user-male-64.png");
      }
    };

    loadProfileAvatar();

    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  useEffect(() => {
    return () => {
      if (modeSwitchTimerRef.current) window.clearTimeout(modeSwitchTimerRef.current);
      if (modeSwitchEndTimerRef.current) window.clearTimeout(modeSwitchEndTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setForm(getDefaultForm(mode));
    setTripKind("one_way");
    setErrors({});
    setResults({ loading: false, error: null, items: [] });
    setLocationState({ loading: false, error: null, items: [] });
    setActiveModal(null);
    setLocationSearch("");
    setTypedLine("");
    setTypedIndex(0);
    setTypedDeleting(false);
  }, [mode]);

  useEffect(() => {
    const currentMessage = heroTypedMessages[typedIndex % heroTypedMessages.length];
    const typingSpeed = typedDeleting ? 32 : 58;
    const pause = typedDeleting ? 0 : typedLine === currentMessage ? 1200 : 0;

    const timer = window.setTimeout(() => {
      if (!typedDeleting) {
        if (typedLine.length < currentMessage.length) {
          setTypedLine(currentMessage.slice(0, typedLine.length + 1));
          return;
        }
        setTypedDeleting(true);
        return;
      }

      if (typedLine.length > 0) {
        setTypedLine(currentMessage.slice(0, typedLine.length - 1));
        return;
      }

      setTypedDeleting(false);
      setTypedIndex((prev) => (prev + 1) % heroTypedMessages.length);
    }, pause || typingSpeed);

    return () => window.clearTimeout(timer);
  }, [heroTypedMessages, typedDeleting, typedIndex, typedLine]);

  useEffect(() => {
    const shouldLoad = activeModal === "origin" || activeModal === "destination";
    if (!shouldLoad) return;

    const controller = new AbortController();
    const endpoint = mode === "flight" ? "/flights/locations" : "/train-trips/locations";
    const params = new URLSearchParams({ limit: "20" });
    if (locationSearch.trim()) params.set("q", locationSearch.trim());

    setLocationState((prev) => ({ ...prev, loading: true, error: null }));

    fetch(`${config.apiBaseUrl}${endpoint}?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => res.json().then((payload) => ({ res, payload })))
      .then(({ res, payload }) => {
        if (!res.ok) {
          throw new Error(payload?.message ?? "Không thể tải danh sách địa điểm.");
        }

        const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
        setLocationState({ loading: false, error: null, items });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        const message = error instanceof Error ? error.message : "Không thể tải danh sách địa điểm.";
        setLocationState({ loading: false, error: message, items: [] });
      });

    return () => controller.abort();
  }, [activeModal, locationSearch, mode]);

  const filteredLocations = useMemo(() => {
    const q = locationSearch.trim().toLowerCase();
    const blocked =
      activeModal === "origin"
        ? form.destination?.code
        : activeModal === "destination"
          ? form.origin?.code
          : null;
    return locationState.items.filter((item) => {
      if (blocked && item.code === blocked) return false;
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q)
      );
    });
  }, [
    activeModal,
    form.destination?.code,
    form.origin?.code,
    locationSearch,
    locationState.items,
  ]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.origin) next.origin = "Vui lòng chọn điểm đi.";
    if (!form.destination) next.destination = "Vui lòng chọn điểm đến.";
    if (
      form.origin &&
      form.destination &&
      form.origin.code === form.destination.code
    )
      next.destination = "Điểm đến không được trùng với điểm đi.";
    if (!form.departureDate) next.departureDate = "Vui lòng chọn ngày đi.";
    if (form.departureDate && form.departureDate < getToday())
      next.departureDate = "Ngày đi không được nằm trong quá khứ.";
    if (tripKind === "round_trip") {
      if (!form.returnDate) next.returnDate = "Vui lòng chọn ngày về.";
      if (
        form.returnDate &&
        form.departureDate &&
        form.returnDate < form.departureDate
      )
        next.returnDate = "Ngày về phải lớn hơn hoặc bằng ngày đi.";
    }
    if (form.adults + form.children < 1)
      next.passengers = "Cần ít nhất 1 hành khách.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const searchTrips = () => {
    if (!validate() || !form.origin || !form.destination) return;
    const seat =
      seatOptions.find((item) => item.value === form.seatClass) ??
      seatOptions[0];
    const params = new URLSearchParams({
      type: mode,
      origin: form.origin.code,
      destination: form.destination.code,
      departure_date: form.departureDate,
      passengers: String(form.adults + form.children),
      seat_class: seat.queryValue,
      page: "1",
    });
    if (tripKind === "round_trip" && form.returnDate) {
      params.set("return_date", form.returnDate);
    }
    setResults({ loading: true, error: null, items: [] });
    setErrors({});
    router.push(`/search?${params.toString()}`);
  };
  const handleModeSwitch = () => {
    if (modeTransitioning) return;
    setModeTransitioning(true);
    modeSwitchTimerRef.current = window.setTimeout(() => {
      setMode((current) => (current === "flight" ? "train" : "flight"));
    }, 140);
    modeSwitchEndTimerRef.current = window.setTimeout(() => {
      setModeTransitioning(false);
    }, 520);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <style jsx>{`
        @keyframes heroRainbow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 220% 50%;
          }
        }
        @keyframes shellFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -6px, 0);
          }
        }
        @keyframes modePulse {
          0% {
            opacity: 0;
            transform: scale(0.985);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: scale(1.02);
          }
        }
        :global(.hover-sheen) {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }
        :global(.hover-sheen::after) {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 20%,
            rgba(255, 255, 255, 0.34) 48%,
            rgba(255, 255, 255, 0.08) 72%,
            transparent 100%
          );
          transform: translateX(-135%);
          transition: transform 520ms ease;
          pointer-events: none;
          z-index: 1;
        }
        :global(.hover-sheen:hover::after) {
          transform: translateX(135%);
        }
        :global(.carousel-nav) {
          overflow: hidden;
          isolation: isolate;
          transition:
            box-shadow 220ms ease,
            border-color 220ms ease,
            background-color 220ms ease,
            filter 220ms ease;
        }
        :global(.carousel-nav::before) {
          content: "";
          position: absolute;
          inset: -18%;
          border-radius: 9999px;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.65) 0%,
            rgba(125, 211, 252, 0.22) 36%,
            transparent 68%
          );
          opacity: 0;
          transform: scale(0.72);
          transition: opacity 220ms ease, transform 220ms ease;
          pointer-events: none;
        }
        :global(.carousel-nav::after) {
          content: "";
          position: absolute;
          top: -30%;
          left: -45%;
          width: 55%;
          height: 170%;
          background: linear-gradient(
            115deg,
            transparent 0%,
            rgba(255, 255, 255, 0.15) 22%,
            rgba(255, 255, 255, 0.88) 48%,
            rgba(125, 211, 252, 0.55) 62%,
            rgba(251, 191, 36, 0.38) 78%,
            transparent 100%
          );
          transform: translateX(-180%) rotate(18deg);
          transition: transform 560ms ease;
          pointer-events: none;
          z-index: 0;
          mix-blend-mode: screen;
        }
        :global(.carousel-nav:hover) {
          filter: brightness(1.03);
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.2);
        }
        :global(.carousel-nav:hover::before) {
          opacity: 1;
          transform: scale(1);
        }
        :global(.carousel-nav:hover::after) {
          transform: translateX(340%) rotate(18deg);
        }
        :global(.carousel-nav-icon) {
          position: relative;
          z-index: 1;
          transition: none;
        }
      `}</style>
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        searchHref={sidebarSearchHref}
      />
      <section className="relative isolate min-h-screen overflow-hidden">
        <Image
          src={view.heroBg}
          alt=""
          fill
          priority
          className={cn(
            "object-cover object-center transition duration-700",
            modeTransitioning && "scale-[1.02] blur-[1.5px]",
          )}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0.18)_18%,rgba(15,23,42,0.18)_100%)]" />
        {modeTransitioning && (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(125,211,252,0.2)_38%,rgba(251,191,36,0.16)_100%)] [animation:modePulse_520ms_ease-out_forwards]" />
        )}
        <div className="relative z-10 min-h-screen px-4 pb-8 pt-3 md:px-6 lg:px-10">
          <div className="mx-auto max-w-[1120px] rounded-[22px] border border-white/35 bg-white/32 px-4 py-1.5 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-md transition duration-300 md:px-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3 md:gap-5">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/75 shadow-sm md:h-9 md:w-9"
                >
                  <Image
                    src="/images/icons/icons8-features-list-64.png"
                    alt="Menu icon"
                    width={20}
                    height={20}
                    className="h-[1.125rem] w-[1.125rem] object-contain md:h-5 md:w-5"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => navigateToProtectedPage("/user/profile")}
                  className={cn(
                    "flex min-w-0 items-center",
                    loggedIn ? "gap-3 md:gap-4" : "gap-0",
                  )}
                  aria-label="Mở trang hồ sơ"
                >
                  <Image
                    src={userAvatar}
                    alt="User avatar"
                    width={24}
                    height={24}
                    className={cn(
                      "shrink-0 rounded-full border border-white/50 bg-white/85 object-cover",
                      loggedIn ? "h-5 w-5 md:h-6 md:w-6" : "hidden",
                    )}
                  />
                  <span className="truncate font-serif text-base text-slate-950 md:text-[1.65rem]">
                    Transport Booking
                  </span>
                  <Image
                    src={view.transportIcon}
                    alt={mode}
                    width={28}
                    height={28}
                    className="hidden h-6 w-6 shrink-0 object-contain md:block"
                  />
                </button>
              </div>
              <button
                type="button"
                onClick={handleModeSwitch}
                className={cn(
                  "group relative h-[56px] w-[114px] shrink-0 overflow-hidden rounded-bl-[22px] rounded-tr-[22px] shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.28)] md:h-[64px] md:w-[124px]",
                  modeTransitioning && "scale-[0.98]",
                )}
              >
                <Image
                  src={view.switchBg}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-black/10 via-transparent to-black/30" />
                <span className="absolute left-3 top-2 max-w-[60px] text-left text-[9px] font-medium leading-3 text-black md:left-3 md:top-2.5 md:max-w-[68px] md:text-[10px] md:leading-3.5">
                  {view.switchText}
                </span>
                <Image
                  src={view.switchIcon}
                  alt=""
                  width={72}
                  height={72}
                  className="absolute bottom-0 right-0 h-[46px] w-[62px] object-contain transition duration-500 group-hover:translate-x-1 group-hover:scale-[1.05] md:h-[54px] md:w-[72px]"
                />
              </button>
            </div>
          </div>

          <div className="mx-auto flex max-w-[700px] flex-col items-center gap-2 pb-7 pt-4 md:pt-5">
            <div className="mx-auto max-w-[470px] self-start text-left [animation:shellFloat_9s_ease-in-out_infinite]">
              <h1 className="font-sans text-[1.75rem] font-black leading-[0.92] tracking-[-0.04em] md:text-[2.38rem]">
                <span className="text-white [text-shadow:-2px_0_0_rgba(15,23,42,0.85),2px_0_0_rgba(15,23,42,0.85),0_-2px_0_rgba(15,23,42,0.85),0_2px_0_rgba(15,23,42,0.85)]">
                  Welcome to{" "}
                </span>
                <span
                  className="bg-[linear-gradient(90deg,#ffffff_0%,#7dd3fc_18%,#38bdf8_34%,#818cf8_52%,#f472b6_68%,#f59e0b_84%,#ffffff_100%)] bg-[length:260%_100%] bg-clip-text text-transparent [filter:drop-shadow(0_2px_10px_rgba(255,255,255,0.28))] motion-safe:animate-[heroRainbow_14s_linear_infinite]"
                >
                  Transport Booking
                </span>
              </h1>
              <p className="mt-2 max-w-[400px] text-[0.86rem] font-medium leading-[1.26rem] text-slate-900 md:text-[0.94rem]">
                Nền tảng đặt vé máy bay và tàu hỏa nhanh chóng, tiện lợi và an
                toàn.
              </p>
              <div className="mt-3 inline-flex min-h-[2.35rem] items-center rounded-full border border-white/60 bg-white/55 px-4 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white/68">
                <span
                  className={cn(
                    "text-[0.82rem] font-semibold md:text-[0.92rem]",
                    mode === "flight" ? "text-sky-800" : "text-orange-800",
                  )}
                >
                  {typedLine}
                </span>
                <span
                  className={cn(
                    "ml-1 inline-block h-4 w-[2px] animate-pulse rounded-full md:h-5",
                    mode === "flight" ? "bg-sky-700" : "bg-orange-700",
                  )}
                />
              </div>
            </div>

            <div className="mx-auto w-full max-w-[500px] rounded-[18px] border border-white/30 bg-[#c8c2bc]/55 p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-md transition duration-300 hover:shadow-[0_28px_78px_rgba(15,23,42,0.24)] md:p-2.5">
              <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr]">
                <SearchField
                  icon="/images/icons/icons8-location-64.png"
                  label="Điểm đi"
                  value={form.origin?.label ?? ""}
                  placeholder="Điểm đi"
                  onClick={() => setActiveModal("origin")}
                  error={errors.origin}
                />
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        origin: prev.destination,
                        destination: prev.origin,
                      }))
                    }
                    className="hover-sheen flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition duration-300 hover:rotate-180 hover:bg-white hover:shadow-[0_10px_20px_rgba(15,23,42,0.12)]"
                  >
                    <Image
                      src="/images/icons/icons8-data-transfer-64.png"
                      alt="Swap"
                      width={18}
                      height={18}
                      className="h-[1.125rem] w-[1.125rem] object-contain"
                    />
                  </button>
                </div>
                <SearchField
                  icon="/images/icons/icons8-location-64.png"
                  label="Điểm đến"
                  value={form.destination?.label ?? ""}
                  placeholder="Điểm đến"
                  onClick={() => setActiveModal("destination")}
                  error={errors.destination}
                />
              </div>

              <div className="mt-2.5 flex flex-wrap gap-2">
                {[
                  { key: "one_way" as const, label: "Một chiều" },
                  { key: "round_trip" as const, label: "Khứ hồi" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setTripKind(item.key);
                      if (item.key === "one_way")
                        setForm((prev) => ({ ...prev, returnDate: "" }));
                    }}
                    className={cn(
                      "hover-sheen rounded-full px-3 py-1 text-[0.88rem] font-medium shadow-sm transition duration-300 hover:-translate-y-0.5",
                      tripKind === item.key
                        ? "bg-white text-slate-950 ring-2 ring-slate-300"
                        : "bg-white/85 text-slate-800",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-2.5 grid gap-2 md:grid-cols-2">
                <SearchField
                  icon="/images/icons/icons8-calendar-50.png"
                  label="Ngày đi"
                  value={formatDateLabel(form.departureDate)}
                  placeholder="Ngày đi"
                  onClick={() => setActiveModal("departureDate")}
                  error={errors.departureDate}
                />
                <SearchField
                  icon="/images/icons/icons8-calendar-50.png"
                  label="Ngày về"
                  value={formatDateLabel(form.returnDate)}
                  placeholder={
                    tripKind === "one_way" ? "Không áp dụng" : "Ngày về"
                  }
                  onClick={() =>
                    tripKind === "round_trip" && setActiveModal("returnDate")
                  }
                  error={errors.returnDate}
                  disabled={tripKind === "one_way"}
                />
                <SearchField
                  icon="/images/icons/icons8-standing-man-64.png"
                  label="Hành khách"
                  value={getPassengerSummary(form.adults, form.children)}
                  placeholder="Hành khách"
                  onClick={() => setActiveModal("passengers")}
                  error={errors.passengers}
                />
                <SearchField
                  icon="/images/icons/icons8-living-room-48.png"
                  label={mode === "flight" ? "Hạng ghế" : "Chỗ ngồi"}
                  value={selectedSeatLabel}
                  placeholder={mode === "flight" ? "Hạng ghế" : "Chỗ ngồi"}
                  onClick={() => setActiveModal("seatClass")}
                  error={errors.seatClass}
                />
              </div>

              {errors.form && (
                <p className="mt-4 px-2 text-sm font-semibold text-red-700">
                  {errors.form}
                </p>
              )}

              <button
                type="button"
                onClick={searchTrips}
                disabled={results.loading}
                className={cn(
                  "hover-sheen mt-3 flex h-[2.1rem] w-full items-center justify-center rounded-full bg-gradient-to-r text-[0.88rem] font-medium text-slate-900 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,23,42,0.18)] md:h-[2.25rem]",
                  view.button,
                )}
              >
                {results.loading ? "Đang tìm..." : "Tìm chuyến"}
              </button>

              {(results.error || results.items.length > 0) && (
                <div className="mt-5 rounded-[28px] border border-white/40 bg-white/60 p-4 backdrop-blur">
                  <p className="text-sm font-semibold text-slate-800">
                    {results.error ??
                      `Tìm thấy ${results.items.length} kết quả.`}
                  </p>
                  {!results.error && (
                    <div className="mt-4 grid gap-3">
                      {results.items.slice(0, 3).map((item, index) => (
                        <div
                          key={item._id ?? index}
                          className="rounded-[24px] border border-white/60 bg-white/75 px-4 py-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                                {mode === "flight" ? "Flight" : "Train"}
                              </p>
                              <h3 className="text-xl font-semibold text-slate-950">
                                {String(
                                  item.flight_number ??
                                    item.train_id?.train_number ??
                                    item._id ??
                                    "Chuyến",
                                )}
                              </h3>
                            </div>
                            <p className="text-lg font-semibold text-slate-950">
                              {Number(
                                item.current_price ?? item.starting_price ?? 0,
                              ).toLocaleString("vi-VN")}{" "}
                              VND
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="pt-3 md:pt-4">
        <PopularSection mode={mode} />
      </div>

      <div className="pt-3 md:pt-4">
        <PromotionsBanner mode={mode} />
      </div>

      <div className="pt-3 md:pt-4">
        <NewUserVoucherSection mode={mode} />
      </div>

      <div className="pt-3 md:pt-4">
        <DomesticDealsSection mode={mode} />
      </div>

      {mode === "train" && (
        <div className="pt-3 md:pt-4">
          <BookingStepsSection />
        </div>
      )}

      {mode === "flight" && (
        <div className="pt-3 md:pt-4">
          <InternationalFlightDealsSection />
        </div>
      )}

      {mode === "flight" && (
        <div className="pt-3 md:pt-4">
          <BookingStepsSection />
        </div>
      )}

      <div className="pt-3 md:pt-4">
        <WhyChooseUsSection />
      </div>

      <div className="pt-3 md:pt-4">
        <NewsletterSection mode={mode} />
      </div>

      <HomeFooter />

      {activeModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[30px] border border-white/50 bg-white/95 p-5 shadow-2xl">
            {(activeModal === "origin" || activeModal === "destination") && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-slate-950">
                    {activeModal === "origin"
                      ? "Chọn điểm đi"
                      : "Chọn điểm đến"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null);
                      setLocationSearch("");
                    }}
                    className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    Đóng
                  </button>
                </div>
                <input
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Tìm nhanh theo tên địa điểm..."
                  className="mt-4 h-12 w-full rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-slate-400"
                />
                <div className="mt-4 max-h-[340px] space-y-3 overflow-y-auto pr-1">
                  {locationState.loading && (
                    <div className="rounded-[24px] border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500">
                      Đang tải danh sách địa điểm...
                    </div>
                  )}
                  {!locationState.loading && locationState.error && (
                    <div className="rounded-[24px] border border-dashed border-red-300 px-4 py-8 text-center text-red-700">
                      {locationState.error}
                    </div>
                  )}
                  {!locationState.loading && !locationState.error && filteredLocations.length === 0 && (
                    <div className="rounded-[24px] border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500">
                      Không tìm thấy địa điểm phù hợp.
                    </div>
                  )}
                  {!locationState.loading && !locationState.error && filteredLocations.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, [activeModal]: item }));
                        setErrors((prev) => ({ ...prev, [activeModal]: "" }));
                        setActiveModal(null);
                        setLocationSearch("");
                      }}
                      className="flex w-full items-start justify-between rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span>
                        <span className="block text-lg font-semibold text-slate-950">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-sm text-slate-500">
                          {item.subtitle}
                        </span>
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                        {item.code}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {(activeModal === "departureDate" ||
              activeModal === "returnDate") && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-slate-950">
                    {activeModal === "departureDate"
                      ? "Chọn ngày đi"
                      : "Chọn ngày về"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    Đóng
                  </button>
                </div>
                <input
                  type="date"
                  min={
                    activeModal === "departureDate"
                      ? getToday()
                      : form.departureDate || getToday()
                  }
                  value={
                    activeModal === "departureDate"
                      ? form.departureDate
                      : form.returnDate
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [activeModal === "departureDate"
                        ? "departureDate"
                        : "returnDate"]: e.target.value,
                    }))
                  }
                  className="mt-5 h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg outline-none focus:border-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className={cn(
                    "mt-5 h-12 w-full rounded-full text-base font-semibold text-white",
                    mode === "flight" ? "bg-sky-500" : "bg-orange-500",
                  )}
                >
                  Xác nhận ngày
                </button>
              </>
            )}

            {activeModal === "passengers" && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-slate-950">
                    Chọn hành khách
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    Đóng
                  </button>
                </div>
                {[
                  { key: "adults" as const, label: "Người lớn", min: 1 },
                  { key: "children" as const, label: "Trẻ em", min: 0 },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="mt-4 flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <p className="text-lg font-semibold text-slate-950">
                      {item.label}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            [item.key]: Math.max(item.min, prev[item.key] - 1),
                          }))
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-semibold text-slate-900 shadow-sm"
                      >
                        -
                      </button>
                      <span className="min-w-8 text-center text-lg font-semibold text-slate-950">
                        {form[item.key]}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            [item.key]: prev[item.key] + 1,
                          }))
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-semibold text-slate-900 shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className={cn(
                    "mt-5 h-12 w-full rounded-full text-base font-semibold text-white",
                    mode === "flight" ? "bg-sky-500" : "bg-orange-500",
                  )}
                >
                  Xác nhận hành khách
                </button>
              </>
            )}

            {activeModal === "seatClass" && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-slate-950">
                    {mode === "flight" ? "Chọn hạng ghế" : "Chọn chỗ ngồi"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    Đóng
                  </button>
                </div>
                <div className="mt-5 space-y-3">
                  {seatOptions.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, seatClass: item.value }));
                        setActiveModal(null);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-[24px] border px-4 py-4 text-left transition",
                        form.seatClass === item.value
                          ? "border-slate-300 bg-slate-100"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white",
                      )}
                    >
                      <span className="text-lg font-semibold text-slate-950">
                        {item.label}
                      </span>
                      {form.seatClass === item.value && (
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-sm font-semibold text-white",
                            mode === "flight" ? "bg-sky-500" : "bg-orange-500",
                          )}
                        >
                          Đã chọn
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}







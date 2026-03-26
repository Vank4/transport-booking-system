"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import api from "@/lib/api";
import {
  buildLoginRedirect,
  clearAuthSession,
  isAuthenticated,
} from "@/lib/auth";

const menuItems = [
  {
    id: "account",
    label: "Thông tin tài khoản",
    icon: "/images/icons/account.png",
  },
  {
    id: "security",
    label: "Bảo mật",
    icon: "/images/icons/shield-user.png",
  },
  {
    id: "payment",
    label: "Phương thức thanh toán",
    icon: "/images/icons/credit-card.png",
  },
  {
    id: "notifications",
    label: "Thông báo & email",
    icon: "/images/icons/bell.png",
  },
  { id: "terms", label: "Điều khoản", icon: "/images/icons/checklist.png" },
  { id: "settings", label: "Cài đặt", icon: "/images/icons/settings.png" },
] as const;

type Gender = "Nam" | "Nữ" | "Khác";
type MenuSection = (typeof menuItems)[number]["id"];

type CountryOption = {
  code: string;
  name: string;
  flag: string;
  cities: Array<{ name: string; districts: string[] }>;
};

const countries: CountryOption[] = [
  {
    code: "VN",
    name: "Việt Nam",
    flag: "🇻🇳",
    cities: [
      {
        name: "TP. Hồ Chí Minh",
        districts: ["Thủ Đức", "Quận 1", "Quận 7"],
      },
      {
        name: "Hà Nội",
        districts: ["Ba Đình", "Cầu Giấy", "Đống Đa"],
      },
      {
        name: "Đà Nẵng",
        districts: ["Hải Châu", "Sơn Trà", "Ngũ Hành Sơn"],
      },
    ],
  },
  {
    code: "US",
    name: "Hoa Kỳ",
    flag: "🇺🇸",
    cities: [
      {
        name: "California",
        districts: ["Los Angeles", "San Diego", "San Jose"],
      },
      { name: "New York", districts: ["Manhattan", "Brooklyn", "Queens"] },
    ],
  },
  {
    code: "JP",
    name: "Nhật Bản",
    flag: "đŸ‡¯đŸ‡µ",
    cities: [
      { name: "Tokyo", districts: ["Shibuya", "Shinjuku", "Minato"] },
      { name: "Osaka", districts: ["Kita", "Naniwa", "Tennoji"] },
    ],
  },
  {
    code: "KR",
    name: "Hàn Quốc",
    flag: "đŸ‡°đŸ‡·",
    cities: [
      { name: "Seoul", districts: ["Gangnam", "Mapo", "Jongno"] },
      { name: "Busan", districts: ["Haeundae", "Suyeong", "Dongnae"] },
    ],
  },
];

type ProfileFormState = {
  fullName: string;
  avatarPreview: string;
  avatarFile: File | null;
  dateOfBirth: string;
  gender: Gender;
  nationality: CountryOption;
  idCard: string;
  passport: string;
  email: string;
  phone: string;
  country: CountryOption;
  city: string;
  district: string;
  addressDetail: string;
};

type BackendProfile = {
  _id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  nationality?: {
    code?: string;
    name?: string;
  };
  id_card?: string;
  passport?: string;
  avatar_url?: string;
  address?: {
    country_code?: string;
    country_name?: string;
    city?: string;
    district?: string;
    address_detail?: string;
  };
  role?: "USER" | "ADMIN";
  status?: "ACTIVE" | "BLOCKED";
};

type FieldErrors = Partial<
  Record<keyof ProfileFormState | "avatarFile", string>
>;

type SecurityState = {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  backupEmail: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type TrustedDevice = {
  id: string;
  name: string;
  location: string;
  lastActive: string;
};

type PaymentMethod = {
  id: string;
  type: string;
  label: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
};

type BackendPaymentMethod = {
  id: string;
  type: string;
  bank_name: string;
  card_holder: string;
  last4: string;
  expiry: string;
  is_default: boolean;
};

type NotificationSettings = {
  bookingEmail: boolean;
  bookingSms: boolean;
  pushUpdates: boolean;
  promoEmail: boolean;
  promoSms: boolean;
  weeklySummary: boolean;
  reminderTime: string;
  contactEmail: string;
  contactPhone: string;
};

type TermsState = {
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeData: boolean;
  feedback: string;
};

type AppSettings = {
  language: string;
  theme: string;
  currency: string;
  timezone: string;
  seatPreference: string;
  autoApplyVoucher: boolean;
  compactView: boolean;
};

const defaultCountry = countries[0];

const sectionDescriptions: Record<MenuSection, string> = {
  account:
    "Cập nhật thông tin cá nhân, liên hệ và giấy tờ của bạn.",
  security:
    "Quản lý mật khẩu, xác thực hai lớp và thiết bị đăng nhập.",
  payment:
    "Lưu thẻ thanh toán và chọn phương thức mặc định cho lần đặt vé tiếp theo.",
  notifications:
    "Tùy chỉnh email, SMS và thông báo khuyến mãi theo nhu cầu.",
  terms:
    "Xem lại các quyền riêng tư, điều khoản sử dụng và lựa chọn chia sẻ dữ liệu.",
  settings:
    "Cá nhân hóa ngôn ngữ, giao diện và trải nghiệm hiển thị của bạn.",
};

function formatDateDdMmYyyy(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function maskIdCard(value: string) {
  if (!value) return "";
  if (value.length <= 5) return value;
  return `${"x".repeat(Math.max(0, value.length - 5))}${value.slice(-5)}`;
}

function mapBackendPaymentMethod(method: BackendPaymentMethod): PaymentMethod {
  return {
    id: method.id,
    type: method.type,
    label: `${method.bank_name} • ${method.card_holder}`,
    last4: method.last4,
    expiry: method.expiry,
    isDefault: method.is_default,
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Khong the doc file anh."));
    };
    reader.onerror = () => {
      reject(new Error("Khong the doc file anh."));
    };
    reader.readAsDataURL(file);
  });
}

function getInitialFormState(): ProfileFormState {
  return {
    fullName: "",
    avatarPreview: "/images/icons/account.png",
    avatarFile: null,
    dateOfBirth: "",
    gender: "Nữ",
    nationality: defaultCountry,
    idCard: "",
    passport: "",
    email: "",
    phone: "",
    country: defaultCountry,
    city: defaultCountry.cities[0]?.name ?? "",
    district: defaultCountry.cities[0]?.districts[0] ?? "",
    addressDetail: "",
  };
}

function findCountryOption(code?: string, name?: string) {
  const normalizedCode = code?.trim().toLowerCase();
  const normalizedName = name?.trim().toLowerCase();
  return (
    countries.find((item) => item.code.toLowerCase() === normalizedCode) ??
    countries.find((item) => item.name.toLowerCase() === normalizedName) ??
    defaultCountry
  );
}

function mapBackendProfileToForm(
  profile?: BackendProfile,
  fallback?: ProfileFormState,
): ProfileFormState {
  const base = fallback ?? getInitialFormState();
  const nationalityOption = findCountryOption(
    profile?.nationality?.code,
    profile?.nationality?.name,
  );
  const addressCountryOption = findCountryOption(
    profile?.address?.country_code,
    profile?.address?.country_name,
  );
  const cities = addressCountryOption.cities;
  const profileCity = profile?.address?.city?.trim() ?? "";
  const city =
    cities.find((item) => item.name === profileCity)?.name ??
    cities[0]?.name ??
    "";
  const districts = cities.find((item) => item.name === city)?.districts ?? [];
  const profileDistrict = profile?.address?.district?.trim() ?? "";
  const district =
    districts.find((item) => item === profileDistrict) ?? districts[0] ?? "";
  const dateOfBirth = profile?.date_of_birth
    ? new Date(profile.date_of_birth).toISOString().slice(0, 10)
    : "";

  return {
    ...base,
    fullName: profile?.full_name ?? base.fullName,
    avatarPreview: profile?.avatar_url || base.avatarPreview,
    dateOfBirth,
    gender: profile?.gender ?? base.gender,
    nationality: nationalityOption,
    idCard: profile?.id_card ?? "",
    passport: profile?.passport ?? "",
    email: profile?.email ?? base.email,
    phone: profile?.phone ?? base.phone,
    country: addressCountryOption,
    city,
    district,
    addressDetail: profile?.address?.address_detail ?? "",
  };
}

function StatusBanner({
  message,
  tone = "success",
}: {
  message: string;
  tone?: "success" | "error" | "info";
}) {
  const classes =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "info"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div
      className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-medium ${classes}`}
    >
      {message}
    </div>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-2.5 border-b border-slate-100 pb-2.5">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-slate-900 md:text-[1.28rem]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="pt-3.5">{children}</div>
    </section>
  );
}

function FieldShell({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block rounded-[18px] border border-slate-200 bg-slate-50/80 p-2.5">
      <span className="text-xs font-semibold text-slate-800">{label}</span>
      {hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
      <div className="mt-2">{children}</div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-[22px] w-9 items-center rounded-full transition",
        checked ? "bg-sky-500" : "bg-slate-300",
        disabled ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition",
          checked ? "translate-x-[18px]" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const canViewPage = isAuthenticated();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form, setForm] = useState<ProfileFormState>(getInitialFormState);
  const [savedProfileForm, setSavedProfileForm] =
    useState<ProfileFormState>(getInitialFormState);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof ProfileFormState, boolean>>
  >({});
  const [isNationalityOpen, setIsNationalityOpen] = useState(false);
  const [nationalitySearch, setNationalitySearch] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<MenuSection>("account");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [security, setSecurity] = useState<SecurityState>({
    twoFactorEnabled: true,
    loginAlerts: true,
    backupEmail: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([
    {
      id: "device-1",
      name: "Chrome • Windows 11",
      location: "TP. Hồ Chí Minh",
      lastActive: "Hôm nay, 09:12",
    },
    {
      id: "device-2",
      name: "Safari • iPhone 15",
      location: "Hà Nội",
      lastActive: "Hôm qua, 22:45",
    },
    {
      id: "device-3",
      name: "Edge • Surface Pro",
      location: "Đà Nẵng",
      lastActive: "12/03/2026, 19:05",
    },
  ]);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);
  const [isSavingPaymentMethod, setIsSavingPaymentMethod] = useState(false);
  const [newPayment, setNewPayment] = useState({
    type: "Visa",
    holderName: "",
    cardNumber: "",
    expiry: "",
    bank: "",
  });
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      bookingEmail: true,
      bookingSms: true,
      pushUpdates: true,
      promoEmail: false,
      promoSms: false,
      weeklySummary: true,
      reminderTime: "08:00",
      contactEmail: "",
      contactPhone: "",
    });
  const [notificationMessage, setNotificationMessage] = useState<string | null>(
    null,
  );
  const [terms, setTerms] = useState<TermsState>({
    agreeTerms: true,
    agreePrivacy: true,
    agreeData: false,
    feedback: "",
  });
  const [termsMessage, setTermsMessage] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    language: "vi",
    theme: "light",
    currency: "VND",
    timezone: "GMT+7",
    seatPreference: "window",
    autoApplyVoucher: true,
    compactView: false,
  });
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const nationalityBoxRef = useRef<HTMLDivElement | null>(null);
  const avatarObjectUrlRef = useRef<string | null>(null);

  const filteredCountries = useMemo(() => {
    const q = nationalitySearch.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((item) => item.name.toLowerCase().includes(q));
  }, [nationalitySearch]);

  const selectedCityObject = useMemo(
    () => form.country.cities.find((item) => item.name === form.city),
    [form.country, form.city],
  );

  const availableCities = form.country.cities;
  const availableDistricts = selectedCityObject?.districts ?? [];
  const activeMenu = useMemo(
    () => menuItems.find((item) => item.id === activeSection),
    [activeSection],
  );
  const isProfileReadOnly = !isEditingProfile || isLoadingProfile || isSaving;
  const isServerEditableField = (field: keyof ProfileFormState) =>
    field !== "email" && field !== "avatarFile";
  const activeSectionTitle = activeMenu?.label ?? "Thông tin tài khoản";
  const activeSectionDescription = sectionDescriptions[activeSection];
  const profileActionLabel = isSaving
    ? "Đang lưu..."
    : isEditingProfile
      ? "Lưu"
      : "Cập nhật hồ sơ";
  const isPaymentBusy = isLoadingPaymentMethods || isSavingPaymentMethod;

  const resetNewPaymentForm = () => {
    setNewPayment({
      type: "Visa",
      holderName: "",
      cardNumber: "",
      expiry: "",
      bank: "",
    });
  };

  const loadPaymentMethods = async (options?: { silent?: boolean }) => {
    const shouldShowLoading = !options?.silent;
    if (shouldShowLoading) {
      setIsLoadingPaymentMethods(true);
    }

    try {
      const { data } = await api.get<{ data?: BackendPaymentMethod[] }>(
        "/payment-methods",
      );
      const nextPaymentMethods = (data?.data ?? []).map(mapBackendPaymentMethod);
      setPaymentMethods(nextPaymentMethods);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải phương thức thanh toán.";
      setPaymentMessage(message);
    } finally {
      if (shouldShowLoading) {
        setIsLoadingPaymentMethods(false);
      }
    }
  };

  const setAppSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    setAppSettings((prev) => ({ ...prev, [key]: value }));
  };

  const setField = <K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const clearAvatarObjectUrl = () => {
    if (!avatarObjectUrlRef.current) return;
    URL.revokeObjectURL(avatarObjectUrlRef.current);
    avatarObjectUrlRef.current = null;
  };

  const validateField = (
    key: keyof ProfileFormState,
    value: ProfileFormState[keyof ProfileFormState],
  ) => {
    switch (key) {
      case "fullName": {
        const name = String(value).trim();
        if (!name) return "Họ và tên không được để trống.";
        if (name.length > 100) return "Họ và tên tối đa 100 ký tự.";
        return "";
      }
      case "dateOfBirth": {
        const dateValue = String(value);
        if (!dateValue) return "Vui lòng chọn ngày sinh.";
        const selected = new Date(dateValue);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selected > today)
          return "Ngày sinh không được ở tương lai.";
        return "";
      }
      case "idCard": {
        const digits = String(value);
        if (!digits) return "Vui lòng nhập số CCCD.";
        if (!(digits.length === 9 || digits.length === 12))
          return "CCCD phải có 9 hoặc 12 số.";
        return "";
      }
      case "passport": {
        const passport = String(value).trim();
        if (!passport) return "Vui lòng nhập số hộ chiếu.";
        if (!/^[a-zA-Z0-9]+$/.test(passport)) {
          return "Hộ chiếu chỉ gồm chữ và số, không chứa ký tự đặc biệt.";
        }
        return "";
      }
      case "email": {
        const email = String(value).trim();
        if (!email) return "Vui lòng nhập email.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          return "Email không đúng định dạng.";
        return "";
      }
      case "phone": {
        const phone = String(value).trim();
        if (!phone) return "Vui lòng nhập số điện thoại.";
        if (!/^0\d{9,10}$/.test(phone)) {
          return "Số điện thoại Việt Nam phải từ 10-11 số và bắt đầu bằng 0.";
        }
        return "";
      }
      case "city":
        return String(value).trim() ? "" : "Vui lòng chọn tỉnh/thành.";
      case "district":
        return String(value).trim() ? "" : "Vui lòng chọn quận/huyện.";
      case "addressDetail":
        return String(value).trim()
          ? ""
          : "Vui lòng nhập địa chỉ chi tiết.";
      default:
        return "";
    }
  };

  const validateAndSetError = (
    key: keyof ProfileFormState,
    value: ProfileFormState[keyof ProfileFormState],
  ) => {
    const message = validateField(key, value);
    setErrors((prev) => ({ ...prev, [key]: message }));
    return !message;
  };

  const validateForm = () => {
    const keys: Array<keyof ProfileFormState> = ["fullName", "phone"];
    const nextErrors: FieldErrors = {};
    keys.forEach((key) => {
      const message = validateField(key, form[key]);
      if (message) nextErrors[key] = message;
    });
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    setTouched((prev) => {
      const nextTouched = { ...prev };
      keys.forEach((key) => {
        nextTouched[key] = true;
      });
      return nextTouched;
    });
    return Object.values(nextErrors).every((item) => !item);
  };

  useEffect(() => {
    if (!canViewPage) {
      router.replace(buildLoginRedirect("/user/profile"));
      return;
    }

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setSubmitError(null);
      setSubmitMessage(null);
      try {
        const { data } = await api.get<{ data?: BackendProfile }>(
          "/auth/profile",
        );
        const nextForm = mapBackendProfileToForm(data?.data);
        clearAvatarObjectUrl();
        setForm(nextForm);
        setSavedProfileForm(nextForm);
        setErrors({});
        setTouched({});
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải hồ sơ từ máy chủ.";
        setSubmitError(message);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [canViewPage, router]);

  if (!canViewPage) {
    return null;
  }

  useEffect(() => {
    setNotificationSettings((prev) => ({
      ...prev,
      contactEmail: prev.contactEmail || form.email,
      contactPhone: prev.contactPhone || form.phone,
    }));
    setSecurity((prev) => ({
      ...prev,
      backupEmail: prev.backupEmail || form.email,
    }));
  }, [form.email, form.phone]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        nationalityBoxRef.current &&
        !nationalityBoxRef.current.contains(event.target as Node)
      ) {
        setIsNationalityOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      clearAvatarObjectUrl();
    };
  }, []);

  useEffect(() => {
    if (!submitMessage) return;
    const timer = window.setTimeout(() => {
      setSubmitMessage(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [submitMessage]);

  const handleBlur = (key: keyof ProfileFormState) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    validateAndSetError(key, form[key]);
  };

  const handleAvatarPick = (event: ChangeEvent<HTMLInputElement>) => {
    if (isProfileReadOnly) return;
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        avatarFile: "Ảnh đại diện chỉ chấp nhận JPG hoặc PNG.",
      }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        avatarFile: "Anh dai dien toi da 2MB.",
      }));
      return;
    }

    clearAvatarObjectUrl();
    const preview = URL.createObjectURL(file);
    avatarObjectUrlRef.current = preview;
    setField("avatarFile", file);
    setField("avatarPreview", preview);
    setErrors((prev) => ({ ...prev, avatarFile: "" }));
  };

  const handleProfileAction = async () => {
    if (!isEditingProfile) {
      setErrors({});
      setTouched({});
      setIsEditingProfile(true);
      setSubmitMessage(null);
      setSubmitError(null);
      return;
    }

    setSubmitMessage(null);
    setSubmitError(null);

    if (!validateForm()) {
      setSubmitError(
        "Vui lòng kiểm tra lại các trường thông tin trước khi cập nhật.",
      );
      return;
    }

    setIsSaving(true);
    try {
      const avatarBase64 = form.avatarFile
        ? await fileToDataUrl(form.avatarFile)
        : undefined;

      const payload = {
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
        date_of_birth: form.dateOfBirth || null,
        gender: form.gender,
        nationality: {
          code: form.nationality.code,
          name: form.nationality.name,
        },
        id_card: form.idCard.trim(),
        passport: form.passport.trim(),
        avatar_url: form.avatarFile ? undefined : form.avatarPreview.trim(),
        avatar_base64: avatarBase64,
        address: {
          country_code: form.country.code,
          country_name: form.country.name,
          city: form.city.trim(),
          district: form.district.trim(),
          address_detail: form.addressDetail.trim(),
        },
      };

      const { data } = await api.put<{ data?: BackendProfile }>(
        "/auth/update-profile",
        payload,
      );
      const nextSavedForm = mapBackendProfileToForm(
        data?.data,
        savedProfileForm,
      );
      clearAvatarObjectUrl();

      setForm(nextSavedForm);
      setSavedProfileForm(nextSavedForm);
      setErrors({});
      setTouched({});
      setSubmitMessage("Cập nhật hồ sơ thành công.");
      setIsEditingProfile(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Cập nhật hồ sơ thất bại.";
      setSubmitError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelProfileEditing = () => {
    clearAvatarObjectUrl();
    setForm(savedProfileForm);
    setIsEditingProfile(false);
    setErrors({});
    setTouched({});
    setSubmitError(null);
    setSubmitMessage(null);
  };

  const handleSecuritySave = () => {
    if (!security.backupEmail.trim()) {
      setSecurityMessage("Vui lòng nhập email dự phòng.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(security.backupEmail.trim())) {
      setSecurityMessage("Email dự phòng không hợp lệ.");
      return;
    }
    if (
      security.newPassword &&
      security.newPassword !== security.confirmPassword
    ) {
      setSecurityMessage("Mật khẩu xác nhận không khớp.");
      return;
    }
    setSecurityMessage("Đã lưu cài đặt bảo mật.");
    setSecurity((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  };

  const handleRemoveDevice = (id: string) => {
    setTrustedDevices((prev) => prev.filter((item) => item.id !== id));
    setSecurityMessage("Đã đăng xuất khỏi thiết bị.");
  };

  const handleAddPayment = () => {
    const cardNumber = newPayment.cardNumber.replace(/\s/g, "");
    if (
      !newPayment.holderName.trim() ||
      !cardNumber ||
      !newPayment.expiry ||
      !newPayment.bank.trim()
    ) {
      setPaymentMessage("Vui lòng nhập đầy đủ thông tin thẻ.");
      return;
    }

    const sanitized = cardNumber.replace(/\D/g, "");
    if (sanitized.length < 12) {
      setPaymentMessage(
        "Số thẻ chưa hợp lệ, vui lòng kiểm tra lại.",
      );
      return;
    }

    const hasDefault = paymentMethods.some((item) => item.isDefault);
    const newMethod: PaymentMethod = {
      id: `card-${Date.now()}`,
      type: newPayment.type,
      label: `${newPayment.bank.trim()} • ${newPayment.holderName.trim()}`,
      last4: sanitized.slice(-4),
      expiry: newPayment.expiry,
      isDefault: !hasDefault,
    };

    setPaymentMethods((prev) => [...prev, newMethod]);
    setNewPayment({
      type: "Visa",
      holderName: "",
      cardNumber: "",
      expiry: "",
      bank: "",
    });
    setPaymentMessage("Đã thêm phương thức thanh toán mới.");
  };

  const handleSetDefaultPayment = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((item) => ({ ...item, isDefault: item.id === id })),
    );
    setPaymentMessage("Đã cập nhật thẻ mặc định.");
  };

  const handleRemovePayment = (id: string) => {
    const next = paymentMethods.filter((item) => item.id !== id);
    if (next.length > 0 && !next.some((item) => item.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    setPaymentMethods(next);
    setPaymentMessage("Đã xóa phương thức thanh toán.");
  };

  const handleNotificationSave = () => {
    if (!notificationSettings.contactEmail.trim()) {
      setNotificationMessage("Vui lòng nhập email nhận thông báo.");
      return;
    }
    setNotificationMessage("Đã lưu tùy chọn thông báo.");
  };

  const handleTermsSave = () => {
    if (!terms.agreeTerms || !terms.agreePrivacy) {
      setTermsMessage(
        "Bạn cần đồng ý Điều khoản và Chính sách bảo mật.",
      );
      return;
    }
    setTermsMessage(
      "Đã cập nhật điều khoản và phản hồi của bạn.",
    );
  };

  const handleSettingsSave = () => {
    setSettingsMessage("Đã lưu cài đặt cá nhân hóa.");
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("profile_form_draft");
    }
    clearAuthSession();
    router.push("/auth/login");
  };

  const renderAccountSection = () => (
    <div className="space-y-4">
      {submitError ? <StatusBanner message={submitError} tone="error" /> : null}
      {submitMessage ? <StatusBanner message={submitMessage} /> : null}

      <SectionCard
        title="Thông tin cá nhân"
        description="Giữ thông tin hồ sơ luôn chính xác để việc đặt vé và xác minh diễn ra nhanh hơn."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isEditingProfile ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                Đang chỉnh sửa
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                Chế độ xem
              </span>
            )}
            <button
              type="button"
              onClick={handleCancelProfileEditing}
              disabled={!isEditingProfile || isSaving}
              className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy thay đổi
            </button>
            <button
              type="button"
              onClick={handleProfileAction}
              disabled={isSaving || isLoadingProfile}
              className="rounded-full bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {profileActionLabel}
            </button>
          </div>
        }
      >
        {isLoadingProfile ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-slate-500">
            Đang tải hồ sơ...
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="grid gap-3.5 xl:grid-cols-[1.5fr_0.82fr]">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-3.5">
                <div className="grid gap-3.5">
                  <FieldShell
                    label="Nhập họ và tên"
                    error={touched.fullName ? errors.fullName : ""}
                  >
                    <input
                      value={form.fullName}
                      onChange={(e) => {
                        const next = e.target.value.slice(0, 100);
                        setField("fullName", next);
                        if (touched.fullName)
                          validateAndSetError("fullName", next);
                      }}
                      onBlur={() => handleBlur("fullName")}
                      disabled={
                        isProfileReadOnly || !isServerEditableField("fullName")
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none transition focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="Nhập họ và tên"
                    />
                  </FieldShell>

                  <FieldShell
                    label="Ngày sinh"
                    error={touched.dateOfBirth ? errors.dateOfBirth : ""}
                  >
                    <div className="relative">
                      <input
                        type="date"
                        max={new Date().toISOString().slice(0, 10)}
                        value={form.dateOfBirth}
                        onChange={(e) => {
                          setField("dateOfBirth", e.target.value);
                          if (touched.dateOfBirth)
                            validateAndSetError("dateOfBirth", e.target.value);
                        }}
                        onBlur={() => handleBlur("dateOfBirth")}
                        disabled={
                          isProfileReadOnly ||
                          !isServerEditableField("dateOfBirth")
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-[13px] text-slate-700 outline-none transition focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                      <Image
                        src="/images/icons/icons8-calendar-50.png"
                        alt="calendar"
                        width={18}
                        height={18}
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 object-contain"
                      />
                    </div>
                  </FieldShell>
                </div>
              </div>

              <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50/80">
                <div className="flex min-h-[148px] items-center justify-center border-b border-slate-200 px-3 py-4">
                  <Image
                    src={form.avatarPreview}
                    alt="avatar"
                    width={96}
                    height={96}
                    className="h-20 w-20 rounded-full border border-slate-300 bg-white object-cover"
                  />
                </div>
                <div className="flex flex-col items-center px-3 py-3">
                  <p className="text-sm font-semibold text-slate-800">
                    Ảnh đại diện
                  </p>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={
                      isProfileReadOnly || !isServerEditableField("dateOfBirth")
                    }
                    className="mt-2.5 rounded-xl border border-slate-300 bg-white p-2 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Tải ảnh đại diện"
                  >
                    <Image
                      src="/images/icons/image-.png"
                      alt="upload avatar"
                      width={28}
                      height={28}
                      className="h-6 w-6 object-contain"
                    />
                  </button>
                  {errors.avatarFile ? (
                    <p className="mt-2 text-xs text-red-600">
                      {errors.avatarFile}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3.5 lg:grid-cols-[1.2fr_1fr]">
              <FieldShell label="Giới tính">
                <div className="flex flex-wrap gap-3">
                  {(["Nam", "Nữ", "Khác"] as Gender[]).map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-700"
                    >
                      <input
                        type="radio"
                        name="gender"
                        checked={form.gender === item}
                        onChange={() => setField("gender", item)}
                        disabled={
                          isProfileReadOnly ||
                          !isServerEditableField("dateOfBirth")
                        }
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </FieldShell>

              <div ref={nationalityBoxRef}>
                <FieldShell label="Quốc tịch">
                  <button
                    type="button"
                    onClick={() => setIsNationalityOpen((prev) => !prev)}
                    disabled={
                      isProfileReadOnly || !isServerEditableField("dateOfBirth")
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <span className="flex items-center gap-2">
                      <span>{form.nationality.flag}</span>
                      <span>{form.nationality.name}</span>
                    </span>
                    <Image
                      src="/images/icons/down-arrow.png"
                      alt="down"
                      width={18}
                      height={18}
                      className="h-4 w-4"
                    />
                  </button>

                  {isNationalityOpen && !isProfileReadOnly ? (
                    <div className="relative z-20 mt-2.5 rounded-[22px] border border-slate-200 bg-white p-2.5 shadow-xl">
                      <input
                        value={nationalitySearch}
                        onChange={(e) => setNationalitySearch(e.target.value)}
                        placeholder="Tìm quốc gia..."
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-sky-400"
                      />
                      <div className="mt-3 max-h-48 space-y-1 overflow-auto">
                        {filteredCountries.map((item) => (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => {
                              setField("nationality", item);
                              setIsNationalityOpen(false);
                              setNationalitySearch("");
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] text-slate-700 transition hover:bg-sky-50"
                          >
                            <span>{item.flag}</span>
                            <span>{item.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </FieldShell>
              </div>
            </div>

            <div className="grid gap-3.5 lg:grid-cols-2">
              <FieldShell
                label="Số căn cước"
                hint={
                  form.idCard ? `Mask: ${maskIdCard(form.idCard)}` : undefined
                }
                error={touched.idCard ? errors.idCard : ""}
              >
                <input
                  value={form.idCard}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setField("idCard", digits);
                    if (touched.idCard) validateAndSetError("idCard", digits);
                  }}
                  onBlur={() => handleBlur("idCard")}
                  disabled={
                    isProfileReadOnly || !isServerEditableField("dateOfBirth")
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none transition focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                  placeholder="Nhập CCCD"
                />
              </FieldShell>

              <FieldShell
                label="Số hộ chiếu"
                error={touched.passport ? errors.passport : ""}
              >
                <input
                  value={form.passport}
                  onChange={(e) => {
                    const next = e.target.value.toUpperCase();
                    setField("passport", next);
                    if (touched.passport) validateAndSetError("passport", next);
                  }}
                  onBlur={() => handleBlur("passport")}
                  disabled={
                    isProfileReadOnly || !isServerEditableField("dateOfBirth")
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none transition focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                  placeholder="Nhập hộ chiếu"
                />
              </FieldShell>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Thông tin liên hệ"
        description="Thông tin này sẽ được dùng để gửi vé điện tử, nhắc chuyến và hỗ trợ khẩn cấp."
      >
        <div className="space-y-3.5">
          <div className="grid gap-3.5 lg:grid-cols-2">
            <FieldShell label="Email" error={touched.email ? errors.email : ""}>
              <input
                value={form.email}
                onChange={(e) => {
                  setField("email", e.target.value);
                  if (touched.email)
                    validateAndSetError("email", e.target.value);
                }}
                onBlur={() => handleBlur("email")}
                disabled={isProfileReadOnly || !isServerEditableField("phone")}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none transition focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                placeholder="Nhập email"
              />
            </FieldShell>

            <FieldShell
              label="Số điện thoại"
              error={touched.phone ? errors.phone : ""}
            >
              <input
                value={form.phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  setField("phone", digits);
                  if (touched.phone) validateAndSetError("phone", digits);
                }}
                onBlur={() => handleBlur("phone")}
                disabled={
                  isProfileReadOnly || !isServerEditableField("dateOfBirth")
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none transition focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                placeholder="Nhập số điện thoại"
              />
            </FieldShell>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-3.5">
            <p className="text-[13px] font-semibold text-slate-800">
              Địa chỉ cư trú
            </p>
            <div className="mt-3 grid gap-3 xl:grid-cols-4">
              <select
                value={form.country.code}
                onChange={(e) => {
                  const nextCountry =
                    countries.find((item) => item.code === e.target.value) ??
                    defaultCountry;
                  const firstCity = nextCountry.cities[0]?.name ?? "";
                  const firstDistrict =
                    nextCountry.cities[0]?.districts[0] ?? "";
                  setForm((prev) => ({
                    ...prev,
                    country: nextCountry,
                    city: firstCity,
                    district: firstDistrict,
                  }));
                }}
                disabled={
                  isProfileReadOnly || !isServerEditableField("dateOfBirth")
                }
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none disabled:bg-slate-100 disabled:text-slate-400"
              >
                {countries.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.flag} {item.name}
                  </option>
                ))}
              </select>

              <select
                value={form.city}
                onChange={(e) => {
                  const nextCity = e.target.value;
                  const firstDistrict =
                    form.country.cities.find((item) => item.name === nextCity)
                      ?.districts[0] ?? "";
                  setForm((prev) => ({
                    ...prev,
                    city: nextCity,
                    district: firstDistrict,
                  }));
                  if (touched.city) validateAndSetError("city", nextCity);
                }}
                onBlur={() => handleBlur("city")}
                disabled={
                  isProfileReadOnly || !isServerEditableField("dateOfBirth")
                }
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none disabled:bg-slate-100 disabled:text-slate-400"
              >
                {availableCities.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>

              <select
                value={form.district}
                onChange={(e) => {
                  setField("district", e.target.value);
                  if (touched.district)
                    validateAndSetError("district", e.target.value);
                }}
                onBlur={() => handleBlur("district")}
                disabled={
                  isProfileReadOnly || !isServerEditableField("dateOfBirth")
                }
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none disabled:bg-slate-100 disabled:text-slate-400"
              >
                {availableDistricts.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <input
                value={form.addressDetail}
                onChange={(e) => {
                  setField("addressDetail", e.target.value);
                  if (touched.addressDetail)
                    validateAndSetError("addressDetail", e.target.value);
                }}
                onBlur={() => handleBlur("addressDetail")}
                disabled={
                  isProfileReadOnly || !isServerEditableField("dateOfBirth")
                }
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none transition focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                placeholder="Số nhà, tên đường..."
              />
            </div>
            <div className="mt-2 space-y-1">
              {errors.city && touched.city ? (
                <p className="text-xs text-red-600">{errors.city}</p>
              ) : null}
              {errors.district && touched.district ? (
                <p className="text-xs text-red-600">{errors.district}</p>
              ) : null}
              {errors.addressDetail && touched.addressDetail ? (
                <p className="text-xs text-red-600">{errors.addressDetail}</p>
              ) : null}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-4">
      {securityMessage ? (
        <StatusBanner message={securityMessage} tone="info" />
      ) : null}

      <SectionCard
        title="Bảo mật tài khoản"
        description="Bật lớp bảo vệ bổ sung để tránh đăng nhập trái phép."
      >
        <div className="grid gap-3.5 xl:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] font-semibold text-slate-900">
                    Xác thực hai lớp
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-slate-500">
                    Nhận mã OTP khi đăng nhập trên thiết bị mới.
                  </p>
                </div>
                <Toggle
                  checked={security.twoFactorEnabled}
                  onChange={(checked) =>
                    setSecurity((prev) => ({
                      ...prev,
                      twoFactorEnabled: checked,
                    }))
                  }
                />
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] font-semibold text-slate-900">
                    Cảnh báo đăng nhập
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-slate-500">
                    Gửi email khi tài khoản có đăng nhập bất thường.
                  </p>
                </div>
                <Toggle
                  checked={security.loginAlerts}
                  onChange={(checked) =>
                    setSecurity((prev) => ({ ...prev, loginAlerts: checked }))
                  }
                />
              </div>
            </div>

            <FieldShell label="Email dự phòng">
              <input
                value={security.backupEmail}
                onChange={(e) =>
                  setSecurity((prev) => ({
                    ...prev,
                    backupEmail: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none focus:border-sky-500"
                placeholder="backup@example.com"
              />
            </FieldShell>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-3.5">
            <p className="text-[15px] font-semibold text-slate-900">
              Đổi mật khẩu
            </p>
            <div className="mt-4 space-y-3">
              {[
                { key: "currentPassword", label: "Mật khẩu hiện tại" },
                { key: "newPassword", label: "Mật khẩu mới" },
                { key: "confirmPassword", label: "Xác nhận mật khẩu" },
              ].map((item) => (
                <input
                  key={item.key}
                  type="password"
                  value={security[item.key as keyof SecurityState] as string}
                  onChange={(e) =>
                    setSecurity((prev) => ({
                      ...prev,
                      [item.key]: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none focus:border-sky-500"
                  placeholder={item.label}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSecuritySave}
            className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Lưu bảo mật
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Thiết bị đã đăng nhập"
        description="Kiểm tra và thu hồi các thiết bị không còn sử dụng."
      >
        <div className="space-y-3">
          {trustedDevices.map((device) => (
            <div
              key={device.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-3.5 py-3.5"
            >
              <div>
                <p className="text-[15px] font-semibold text-slate-900">{device.name}</p>
                <p className="mt-1 text-[13px] text-slate-500">
                  {device.location} • {device.lastActive}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveDevice(device.id)}
                className="rounded-full border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
              >
                Đăng xuất thiết bị
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const renderPaymentSection = () => (
    <div className="space-y-4">
      {paymentMessage ? (
        <StatusBanner message={paymentMessage} tone="info" />
      ) : null}

      <SectionCard
        title="Thẻ đã lưu"
        description="Chọn thẻ mặc định để thanh toán nhanh hơn cho những lần đặt vé sau."
      >
        <div className="grid gap-3.5 xl:grid-cols-2">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-slate-900">
                    {method.type}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-600">{method.label}</p>
                </div>
                {method.isDefault ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Mặc định
                  </span>
                ) : null}
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-[13px] text-slate-500">Số cuối</p>
                  <p className="text-base font-semibold text-slate-900">
                    •••• {method.last4}
                  </p>
                </div>
                <p className="text-[13px] text-slate-500">
                  Hết hạn {method.expiry}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSetDefaultPayment(method.id)}
                  disabled={method.isDefault}
                  className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Đặt mặc định
                </button>
                <button
                  type="button"
                  onClick={() => handleRemovePayment(method.id)}
                  className="rounded-full border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-600"
                >
                  Xóa thẻ
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Thêm phương thức mới"
        description="Nhập thông tin thẻ để lưu cho lần thanh toán kế tiếp."
      >
        <div className="grid gap-3 xl:grid-cols-5">
          <select
            value={newPayment.type}
            onChange={(e) =>
              setNewPayment((prev) => ({ ...prev, type: e.target.value }))
            }
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none focus:border-sky-500"
          >
            <option value="Visa">Visa</option>
            <option value="Mastercard">Mastercard</option>
            <option value="JCB">JCB</option>
          </select>
          <input
            value={newPayment.bank}
            onChange={(e) =>
              setNewPayment((prev) => ({ ...prev, bank: e.target.value }))
            }
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none focus:border-sky-500"
            placeholder="Ngân hàng"
          />
          <input
            value={newPayment.holderName}
            onChange={(e) =>
              setNewPayment((prev) => ({ ...prev, holderName: e.target.value }))
            }
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none focus:border-sky-500"
            placeholder="Tên chủ thẻ"
          />
          <input
            value={newPayment.cardNumber}
            onChange={(e) =>
              setNewPayment((prev) => ({ ...prev, cardNumber: e.target.value }))
            }
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none focus:border-sky-500"
            placeholder="Số thẻ"
          />
          <input
            value={newPayment.expiry}
            onChange={(e) =>
              setNewPayment((prev) => ({ ...prev, expiry: e.target.value }))
            }
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none focus:border-sky-500"
            placeholder="MM/YY"
          />
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleAddPayment}
            className="rounded-full bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"
          >
            Thêm phương thức
          </button>
        </div>
      </SectionCard>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-5">
      {notificationMessage ? (
        <StatusBanner message={notificationMessage} tone="info" />
      ) : null}

      <SectionCard
        title="Thông báo đặt vé"
        description="Chọn kênh nhận thông báo phù hợp cho lịch trình của bạn."
      >
        <div className="space-y-3">
          {[
            [
              "bookingEmail",
              "Email xác nhận đặt vé",
              "Gửi xác nhận và vé điện tử qua email.",
            ],
            [
              "bookingSms",
              "SMS nhắc giờ khởi hành",
              "Nhắc trước giờ đi cho chuyến bay hoặc tàu của bạn.",
            ],
            [
              "pushUpdates",
              "Thông báo đẩy",
              "Hiển thị cập nhật cổng, sân ga hoặc thay đổi giờ.",
            ],
            [
              "promoEmail",
              "Email khuyến mãi",
              "Nhận deal theo tuyến, theo mùa và voucher mới.",
            ],
            [
              "promoSms",
              "SMS khuyến mãi",
              "Nhận mã giảm giá ngắn hạn qua điện thoại.",
            ],
            [
              "weeklySummary",
              "Bản tin hàng tuần",
              "Tóm tắt ưu đãi nổi bật phù hợp với bạn.",
            ],
          ].map(([key, title, desc]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <div>
                <p className="font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{desc}</p>
              </div>
              <Toggle
                checked={
                  notificationSettings[
                    key as keyof NotificationSettings
                  ] as boolean
                }
                onChange={(checked) =>
                  setNotificationSettings((prev) => ({
                    ...prev,
                    [key]: checked,
                  }))
                }
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Địa chỉ nhận thông báo"
        description="Chọn email và số điện thoại dùng cho mọi cập nhật chuyến đi."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <input
            value={notificationSettings.contactEmail}
            onChange={(e) =>
              setNotificationSettings((prev) => ({
                ...prev,
                contactEmail: e.target.value,
              }))
            }
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500"
            placeholder="Email nhận thông báo"
          />
          <input
            value={notificationSettings.contactPhone}
            onChange={(e) =>
              setNotificationSettings((prev) => ({
                ...prev,
                contactPhone: e.target.value,
              }))
            }
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500"
            placeholder="Số điện thoại nhận thông báo"
          />
          <input
            type="time"
            value={notificationSettings.reminderTime}
            onChange={(e) =>
              setNotificationSettings((prev) => ({
                ...prev,
                reminderTime: e.target.value,
              }))
            }
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500"
          />
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleNotificationSave}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Lưu thông báo
          </button>
        </div>
      </SectionCard>
    </div>
  );

  const renderTermsSection = () => (
    <div className="space-y-5">
      {termsMessage ? (
        <StatusBanner message={termsMessage} tone="info" />
      ) : null}

      <SectionCard
        title="Điều khoản & quyền riêng tư"
        description="Xác nhận những nội dung quan trọng trước khi tiếp tục sử dụng dịch vụ."
      >
        <div className="space-y-3">
          {[
            [
              "agreeTerms",
              "Tôi đồng ý với Điều khoản sử dụng của Transport Booking System.",
            ],
            [
              "agreePrivacy",
              "Tôi đã đọc và đồng ý với Chính sách bảo mật dữ liệu cá nhân.",
            ],
            [
              "agreeData",
              "Tôi đồng ý nhận đề xuất cá nhân hóa dựa trên hành vi đặt vé.",
            ],
          ].map(([key, label]) => (
            <label
              key={key}
              className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={terms[key as keyof TermsState] as boolean}
                onChange={(e) =>
                  setTerms((prev) => ({
                    ...prev,
                    [key]: e.target.checked,
                  }))
                }
                className="mt-1"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-800">
            Góp ý thêm cho chúng tôi
          </p>
          <textarea
            value={terms.feedback}
            onChange={(e) =>
              setTerms((prev) => ({ ...prev, feedback: e.target.value }))
            }
            rows={5}
            className="mt-3 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500"
            placeholder="Bạn có góp ý nào về điều khoản, chính sách hoặc trải nghiệm đặt vé không?"
          />
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleTermsSave}
            className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white"
          >
            Lưu điều khoản
          </button>
        </div>
      </SectionCard>
    </div>
  );

  const renderSettingsSection = () => (
    <div className="space-y-5">
      {settingsMessage ? (
        <StatusBanner message={settingsMessage} tone="info" />
      ) : null}

      <SectionCard
        title="Cài đặt cá nhân"
        description="Tùy chỉnh cách hệ thống hiển thị và gợi ý chuyến đi cho bạn."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <FieldShell label="Ngôn ngữ">
            <select
              value={appSettings.language}
              onChange={(e) => setAppSetting("language", e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </FieldShell>

          <FieldShell label="Giao diện">
            <select
              value={appSettings.theme}
              onChange={(e) => setAppSetting("theme", e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500"
            >
              <option value="light">Sáng</option>
              <option value="system">Theo hệ thống</option>
              <option value="dark">Tối</option>
            </select>
          </FieldShell>

          <FieldShell label="Tiền tệ">
            <select
              value={appSettings.currency}
              onChange={(e) => setAppSetting("currency", e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500"
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
              <option value="JPY">JPY</option>
            </select>
          </FieldShell>

          <FieldShell label="Múi giờ">
            <select
              value={appSettings.timezone}
              onChange={(e) => setAppSetting("timezone", e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500"
            >
              <option value="GMT+7">GMT+7 (Việt Nam)</option>
              <option value="GMT+9">GMT+9 (Nhật Bản)</option>
              <option value="GMT-5">GMT-5 (New York)</option>
            </select>
          </FieldShell>

          <FieldShell label="Ghế ưa thích">
            <select
              value={appSettings.seatPreference}
              onChange={(e) => setAppSetting("seatPreference", e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500"
            >
              <option value="window">Cửa sổ</option>
              <option value="aisle">Lối đi</option>
              <option value="middle">Giữa</option>
            </select>
          </FieldShell>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  Tự động áp dụng voucher
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Ưu tiên dùng mã giảm giá tốt nhất khi thanh toán.
                </p>
              </div>
              <Toggle
                checked={appSettings.autoApplyVoucher}
                onChange={(checked) =>
                  setAppSetting("autoApplyVoucher", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  Chế độ hiển thị gọn
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Rút gọn thông tin để xem được nhiều nội dung hơn.
                </p>
              </div>
              <Toggle
                checked={appSettings.compactView}
                onChange={(checked) => setAppSetting("compactView", checked)}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSettingsSave}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Lưu cài đặt
          </button>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#eef3f8] p-2 md:p-3">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleAvatarPick}
      />

      <div className="mx-auto flex w-full max-w-[1040px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <header className="border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-sky-100 px-3 py-2.5 md:px-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm"
                aria-label="Mở menu"
              >
                <Image
                  src="/images/icons/icons8-features-list-64.png"
                  alt="menu"
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px] object-contain"
                />
              </button>

              <Link
                href="/"
                className="flex min-w-0 items-center gap-3"
                aria-label="Về trang chủ"
              >
                <span className="hidden text-[1.15rem] font-bold tracking-tight text-slate-900 sm:inline">
                  Transport Booking
                </span>
                <Image
                  src="/images/image/LogoTransportBooking.png"
                  alt="Transport Booking Logo"
                  width={140}
                  height={34}
                  className="h-7 w-auto object-contain"
                  priority
                />
              </Link>
            </div>

            <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-sm">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-900">
                  {form.fullName || "Tài khoản của bạn"}
                </p>
                <p className="text-xs text-slate-500">
                  {form.email || "Chưa cập nhật email"}
                </p>
              </div>
              <Image
                src={form.avatarPreview}
                alt="avatar"
                width={34}
                height={34}
                className="h-8 w-8 rounded-full border border-slate-300 bg-white object-cover"
              />
            </div>
          </div>
        </header>

        <section className="grid min-h-[calc(100vh-108px)] lg:grid-cols-[220px_1fr]">
          <aside className="border-r border-slate-200 bg-slate-50/80 p-2.5">
            <div className="rounded-[18px] border border-slate-200 bg-white p-2 shadow-sm">
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const isActive = item.id === activeSection;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={[
                        "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition",
                        isActive
                          ? "bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-100"
                          : "text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <Image
                        src={item.icon}
                        alt={item.label}
                        width={16}
                        height={16}
                        className="h-4 w-4 object-contain"
                      />
                      <span
                        className={isActive ? "font-semibold" : "font-medium"}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mt-3.5 rounded-[18px] border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-3 shadow-sm">
              <Image
                src="/images/icons/icons8-gift-box-100.png"
                alt="voucher"
                width={38}
                height={38}
                className="h-9 w-9 object-contain"
              />
              <p className="mt-2.5 text-[15px] font-bold text-slate-900">
                Ưu đãi riêng cho tài khoản của bạn
              </p>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                Theo dõi tab thông báo để không bỏ lỡ voucher dành cho tuyến yêu thích.
              </p>
              <button
                type="button"
                onClick={() => setActiveSection("notifications")}
                className="mt-2.5 rounded-full bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                Xem thông báo
              </button>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-[18px] border border-red-200 bg-red-50 px-3.5 py-2 text-[11px] font-semibold text-red-700 transition hover:bg-red-100"
            >
              <Image
                src="/images/icons/logout.png"
                alt="logout"
                width={16}
                height={16}
                className="h-4 w-4"
              />
              Đăng xuất
            </button>
          </aside>

          <div className="bg-[#f8fbff] p-2.5 md:p-4">
            <div className="rounded-[20px] border border-slate-200 bg-gradient-to-r from-white via-sky-50 to-sky-100 px-3.5 py-3.5 shadow-sm">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 md:text-[1.7rem]">
                {activeSectionTitle}
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-600">
                {activeSectionDescription}
              </p>
            </div>

            <div className="mt-4">
              {activeSection === "account" ? renderAccountSection() : null}
              {activeSection === "security" ? renderSecuritySection() : null}
              {activeSection === "payment" ? renderPaymentSection() : null}
              {activeSection === "notifications"
                ? renderNotificationsSection()
                : null}
              {activeSection === "terms" ? renderTermsSection() : null}
              {activeSection === "settings" ? renderSettingsSection() : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}



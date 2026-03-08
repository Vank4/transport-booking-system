"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const router = useRouter();
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [hasError, setHasError] = useState(false);

  const validateFormat = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
    return emailRegex.test(value) || phoneRegex.test(value);
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = contact.trim();

    if (!value) {
      setHasError(true);
      showNotification("Vui lòng nhập email hoặc số điện thoại", "error");
      return;
    }

    if (!validateFormat(value)) {
      setHasError(true);
      showNotification(
        "Dữ liệu không hợp lệ. Vui lòng nhập đúng định dạng email hoặc số điện thoại",
        "error"
      );
      return;
    }

    setLoading(true);
    setHasError(false);

    try {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const payload = isEmail ? { email: value } : { phone: value };

      // Make API request to backend
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        payload
      );

      if (response.status === 200) {
        showNotification(
          "Gửi yêu cầu thành công! Vui lòng kiểm tra email/tin nhắn của bạn.",
          "success"
        );
        setContact("");
        setTimeout(() => {
          router.push("/auth/reset-password");
        }, 1500);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setHasError(true);
      if (error.response?.status === 404) {
        showNotification("Tài khoản không tồn tại trong hệ thống", "error");
      } else {
        showNotification(
          error.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen overflow-hidden bg-white text-[#202124] font-sans">
      {/* Left Side: Form */}
      <div className="flex-1 flex justify-center items-center p-6 md:p-10 relative z-10 bg-white">
        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-8">
            {/* Modern logo placeholder */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="url(#paint0_linear)" />
              <path d="M14 20L20 12L26 20H14Z" fill="white" />
              <path d="M14 28L20 20L26 28H14Z" fill="white" fillOpacity="0.8" />
              <defs>
                <linearGradient id="paint0_linear" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1A73E8" />
                  <stop offset="1" stopColor="#1557B0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <h1 className="text-4xl font-bold mb-3 tracking-tight text-[#202124]">
            Quên mật khẩu
          </h1>
          <p className="text-[#5F6368] text-[1.05rem] mb-10 leading-relaxed">
            Nhập email hoặc số điện thoại để nhận hướng dẫn khôi phục mật khẩu.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2.5">
              <label htmlFor="contact" className="text-[0.9rem] font-semibold text-[#202124]">
                Email hoặc số điện thoại
              </label>
              <input
                type="text"
                id="contact"
                name="contact"
                placeholder="Nhập email hoặc số điện thoại..."
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  setHasError(false);
                  setNotification(null);
                }}
                disabled={loading}
                autoComplete="off"
                className={`
                  p-4 border-[1.5px] rounded-xl text-base transition-all duration-250 outline-none
                  ${hasError 
                    ? "border-[#C5221F] bg-[#FFF8F7] focus:ring-4 focus:ring-[#C5221F]/15" 
                    : "border-[#DADCE0] bg-[#FAFAFA] text-[#202124] hover:border-[#BDBDBD] focus:bg-white focus:border-[#1A73E8] focus:ring-4 focus:ring-[#1A73E8]/15"
                  }
                `}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                mt-4 flex justify-center items-center bg-gradient-to-br from-[#1A73E8] to-[#0d59bf] 
                text-white border-none p-4 rounded-full text-[1.05rem] font-semibold cursor-pointer 
                transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(26,115,232,0.3)]
                active:translate-y-0 active:shadow-[0_4px_10px_rgba(26,115,232,0.2)] disabled:opacity-70 
                disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none relative overflow-hidden
              "
            >
              {!loading ? (
                <span>Gửi yêu cầu</span>
              ) : (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              )}
            </button>

            {/* Notification Area */}
            <div className="flex flex-col gap-3 min-h-[48px] mt-2">
              {notification && (
                <div
                  className={`
                    p-4 rounded-xl text-[0.95rem] font-medium flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300
                    ${notification.type === "success" 
                      ? "bg-[#E6F4EA] text-[#137333] border border-[#9CE0A9]" 
                      : "bg-[#FCE8E6] text-[#C5221F] border border-[#F6A39E]"
                    }
                  `}
                >
                  <div className="shrink-0 mt-0.5">
                    {notification.type === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-[#137333]" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-[#C5221F]" />
                    )}
                  </div>
                  <span>{notification.message}</span>
                </div>
              )}
            </div>
          </form>

          <div className="flex justify-center mt-10">
            <Link
              href="/auth/login"
              className="
                inline-flex items-center gap-2 text-[#1A73E8] no-underline font-semibold text-[0.95rem] 
                transition-colors duration-200 py-2 px-4 rounded-lg hover:text-[#1557B0] hover:bg-[#1A73E8]/5 group
              "
            >
              <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
              Quay lại đăng nhập
            </Link>
          </div>
          
        </div>
      </div>

      {/* Right Side: Image Montage */}
      <div className="flex-[1.2] hidden lg:block bg-[#F8F9FA] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-[1]" />
        <Image
          src="/travel_illustration.png"
          alt="Travel and Monuments Illustration"
          fill
          className="object-cover animate-[scaleIn_20s_linear_infinite_alternate]"
          priority
        />
        <div className="absolute inset-x-12 bottom-12 z-[2] text-white animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
          <h2 className="text-4xl font-bold mb-3 leading-tight drop-shadow-md">
            Khám phá thế giới cùng chúng tôi
          </h2>
          <p className="text-lg opacity-90 drop-shadow-sm">
            Khôi phục quyền truy cập và tiếp tục hành trình của bạn.
          </p>
        </div>
      </div>
{/* 
        Add some custom animation for tailwind if needed, we'll use a local style block 
        just for the specific 'scaleIn' keyframe to perfectly match the CSS, 
        since we used inline class animate-[scaleIn_20s...]
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scaleIn {
          from { transform: scale(1); }
          to { transform: scale(1.08); }
        }
      `}} />
    </div>
  );
}

// src/app/auth/register/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import Image from 'next/image';

// 1. Danh sách ảnh và slogan cho Slideshow
const slides = [
  { id: 1, src: "/auth-illustration.png", title: "Cơ hội đi muôn nơi chỉ bằng một cú Click chuột" },
  { id: 2, src: "/auth-2.jpg", title: "Khám phá những vùng đất mới đầy thú vị" },
  { id: 3, src: "/auth-3.jpg", title: "Trải nghiệm dịch vụ đặt vé hàng đầu Việt Nam" },
];

export default function RegisterPage() {
  const router = useRouter();
  
  // 2. Logic Slideshow
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // Tự động chuyển sau 4 giây
    return () => clearInterval(timer);
  }, []);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savePassword, setSavePassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp!');
    }
    if (formData.password.length < 6) {
      return setError('Mật khẩu phải có ít nhất 6 ký tự!');
    }

    setLoading(true);
    try {
      await authService.register({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      
      setSuccess('Đăng ký thành công! Đang chuyển hướng đăng nhập...');
      setTimeout(() => router.push('/auth/login'), 2000);
      
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Container chính */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl flex overflow-hidden items-stretch min-h-[750px]">
        
        {/* =========================================
           CỘT TRÁI: SLIDESHOW ẢNH NỀN
           ========================================= */}
        <div className="w-1/2 hidden md:flex flex-col relative overflow-hidden">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Ảnh phủ kín */}
              <Image 
                src={slide.src} 
                alt={`Slide ${index}`}
                fill 
                className="object-cover" 
                priority={index === 0} 
              />
              
              {/* Lớp phủ mờ */}
              <div className="absolute inset-0 bg-black/20"></div>

              {/* Nội dung chữ thay đổi theo slide */}
              <div className="relative z-10 flex-1 flex flex-col p-16 text-white text-center justify-start mt-10">
                <h1 className="text-4xl font-extrabold leading-tight drop-shadow-2xl">
                  {slide.title}
                </h1>
              </div>
            </div>
          ))}
          
          {/* Các dấu chấm trang trí (Pagination Dots) */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-20">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-3 rounded-full transition-all duration-300 cursor-pointer ${
                  index === currentSlide ? 'w-8 bg-white' : 'w-3 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* =========================================
           CỘT PHẢI: FORM ĐĂNG KÝ
           ========================================= */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center bg-white">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Đăng ký tài khoản</h2>
            <p className="text-lg text-gray-600 mb-8">Khám phá dịch vụ đặt chỗ trực tuyến</p>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200 text-center mb-6">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg border border-green-200 text-center mb-6">
                {success}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input name="full_name" type="text" required onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Nguyễn Văn A" value={formData.full_name} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email" required onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="user@example.com" value={formData.email} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input name="phone" type="tel" required onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="0901234567" value={formData.phone} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password" required onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="••••••••" value={formData.password} />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 hover:text-gray-700 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="••••••••" value={formData.confirmPassword} />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 hover:text-gray-700 cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col space-y-3 pt-2">
                <div className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer" checked={savePassword} onChange={() => setSavePassword(!savePassword)} />
                  <label className="ml-2 block text-sm text-gray-900 cursor-pointer font-medium">Lưu mật khẩu</label>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Bằng việc đăng ký bạn chấp nhận <Link href="#" className="font-semibold text-blue-600 hover:text-blue-500">Điều khoản</Link> và <Link href="#" className="font-semibold text-blue-600 hover:text-blue-500">Chính sách</Link> của chúng tôi.
                </p>
              </div>

              <button type="submit" disabled={loading} className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 transition-all duration-200 shadow-lg shadow-blue-100 mt-2 cursor-pointer">
                {loading ? 'Đang xử lý...' : 'Đăng ký'}
              </button>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-4">Hoặc đăng ký bằng</p>
                <div className="flex justify-center space-x-5">
                  {/* Google */}
                  <button type="button" className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-100 transition-transform hover:scale-110 active:scale-95 cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.64 24.55c0-1.65-.15-3.23-.42-4.75H24v9h12.75c-.55 2.89-2.2 5.34-4.71 6.99l7.33 5.69C43.64 37.1 46.64 31.39 46.64 24.55z"/><path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.33-5.69c-2.2 1.47-5.01 2.35-8.56 2.35-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  </button>
                  {/* Facebook */}
                  <button type="button" className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-100 transition-transform hover:scale-110 active:scale-95 cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 20 20"><path fill="#1877F2" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"/><path fill="#fff" d="M13.26 12.89l.443-2.89H10.93V8.127c0-.791.387-1.562 1.63-1.562h1.26v-2.46s-1.144-.195-2.238-.195c-2.285 0-3.777 1.384-3.777 3.89V10H6.719v2.89h2.54v6.988C9.752 19.957 10 20 10 20c.248 0 .493-.043.719-.122v-6.99h2.33z"/></svg>
                  </button>
                  {/* Apple */}
                  <button type="button" className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-100 transition-transform hover:scale-110 active:scale-95 cursor-pointer">
                    <svg width="18" height="18" viewBox="0 0 384 512"><path fill="#000000" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                  </button>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600 mt-8">
                Bạn đã có tài khoản?{' '}
                <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-500">
                  Đăng nhập ngay
                </Link>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
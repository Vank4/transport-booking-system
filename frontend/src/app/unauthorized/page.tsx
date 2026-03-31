"use client";

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h2 className="mt-6 text-9xl font-extrabold text-[#112211]">
            403
          </h2>
          <h3 className="mt-4 text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
            Không có quyền truy cập
          </h3>
          <p className="mt-4 text-base text-gray-500">
            Xin lỗi, bạn cần có đặc quyền Quản trị viên (Admin) để xem trang này. Vui lòng liên hệ với ban quản trị nếu bạn cho rằng đây là một sự nhầm lẫn.
          </p>
        </div>
        
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-[#FF8682] hover:bg-[#ff726d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8682] transition-colors duration-200"
          >
            Về trang chủ
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E293B] transition-colors duration-200"
          >
            Quay lại
          </button>
        </div>
      </div>
      
      {/* Decorative blocks */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-[#FF8682] opacity-10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#112211] opacity-5 blur-3xl"></div>
    </div>
  );
}

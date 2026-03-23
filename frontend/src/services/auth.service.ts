// src/services/auth.service.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const authService = {
  // 1. Đã sửa identifier thành email ở tham số truyền vào
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // 2. Đã sửa ở đây: gửi đi đúng chữ "email" mà Backend cần
      body: JSON.stringify({ email, password }), 
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');
    return data;
  },

  register: async (userData: any) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Đăng ký thất bại');
    return data;
  }
};
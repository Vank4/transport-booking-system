'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, User, Mail, Phone, Calendar, Users, CreditCard, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import BookingSteps from '@/components/booking/BookingSteps';
import TripDetailsCard from '@/components/booking/TripDetailsCard';
import { getBookingDetails, getCurrentUserProfile, savePassengerInfo } from '@/lib/api';
import { useBookingStore } from '@/store/bookingStore';
import type { BookingDetails, UserProfile } from '@/types';

// Form data types
interface PassengerFormData {
  seat_id: string;
  passenger_name: string;
  passenger_id_card: string;
  date_of_birth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  passenger_type: 'ADULT' | 'CHILD' | 'INFANT';
}

interface ContactFormData {
  phone: string;
  email: string;
}

function toDateInputValue(value?: string | null): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
}

function mapProfileGender(value?: string | null): PassengerFormData['gender'] | undefined {
  if (!value) return undefined;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'nam' || normalized === 'male') return 'MALE';
  if (normalized === 'nữ' || normalized === 'nu' || normalized === 'female') return 'FEMALE';
  if (normalized === 'khác' || normalized === 'khac' || normalized === 'other') return 'OTHER';

  return undefined;
}

function PassengerInfoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const { setBookingId, setBookingData, bookingData } = useBookingStore();
  const [booking, setBooking] = useState<BookingDetails | null>(bookingData);
  const [loading, setLoading] = useState(!bookingData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Contact form state
  const [contactForm, setContactForm] = useState<ContactFormData>({
    phone: '',
    email: '',
  });

  // Passenger forms state (dynamic based on number of seats)
  const [passengerForms, setPassengerForms] = useState<PassengerFormData[]>([]);

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    void getCurrentUserProfile()
      .then((profile) => {
        if (!cancelled) {
          setUserProfile(profile);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUserProfile(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bookingId) {
      setError('Không tìm thấy mã booking trong URL');
      setLoading(false);
      return;
    }

    setBookingId(bookingId);

    if (bookingData) {
      setBooking(bookingData);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const data = await getBookingDetails(bookingId);
        setBooking(data);
        setBookingData(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải thông tin booking';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId, bookingData, setBookingId, setBookingData]);

  // Initialize passenger forms when booking data is loaded
  useEffect(() => {
    if (booking?.passengers && booking.passengers.length > 0) {
      const initialForms = booking.passengers.map(p => ({
        seat_id: p.seat_info?.id ?? '',
        passenger_name: p.passenger_name,
        passenger_id_card: p.id_card ?? '',
        date_of_birth: p.date_of_birth ? p.date_of_birth.slice(0, 10) : '',
        gender: p.gender,
        passenger_type: p.passenger_type ?? 'ADULT',
      }));
      setPassengerForms(initialForms);

      const firstContact = booking.passengers.find(
        (passenger) => passenger.contact_info?.phone || passenger.contact_info?.email,
      )?.contact_info ?? booking.booking_summary.booking_contact;

      if (firstContact) {
        setContactForm({
          phone: firstContact.phone ?? '',
          email: firstContact.email ?? '',
        });
      }
    }
  }, [booking]);

  useEffect(() => {
    if (!booking || !userProfile) return;

    setContactForm((prev) => ({
      phone:
        prev.phone ||
        booking.booking_summary.booking_contact?.phone ||
        userProfile.preferences?.notifications?.contact_phone ||
        userProfile.phone ||
        '',
      email:
        prev.email ||
        booking.booking_summary.booking_contact?.email ||
        userProfile.preferences?.notifications?.contact_email ||
        userProfile.email ||
        '',
    }));

    setPassengerForms((prev) =>
      prev.map((passenger, idx) => {
        if (idx !== 0) return passenger;

        return {
          ...passenger,
          passenger_name:
            passenger.passenger_name ||
            booking.booking_summary.booking_contact?.full_name ||
            userProfile.full_name ||
            '',
          passenger_id_card:
            passenger.passenger_id_card ||
            booking.booking_summary.booking_contact?.id_card ||
            userProfile.id_card ||
            userProfile.passport ||
            '',
          date_of_birth: passenger.date_of_birth || toDateInputValue(userProfile.date_of_birth),
          gender: passenger.gender || mapProfileGender(userProfile.gender),
        };
      }),
    );
  }, [booking, userProfile]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Contact validation
    if (!contactForm.phone) {
      errors['contact.phone'] = 'Số điện thoại là bắt buộc';
    } else if (!/^\d{10}$/.test(contactForm.phone.replace(/\s/g, ''))) {
      errors['contact.phone'] = 'Số điện thoại phải có 10 chữ số';
    }

    if (!contactForm.email) {
      errors['contact.email'] = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      errors['contact.email'] = 'Email không hợp lệ';
    }

    // Passenger validation
    passengerForms.forEach((p, idx) => {
      if (!p.passenger_name.trim()) {
        errors[`passenger.${idx}.name`] = 'Họ tên là bắt buộc';
      }
      if (!p.passenger_id_card) {
        errors[`passenger.${idx}.id_card`] = 'CCCD/CMND là bắt buộc';
      } else if (p.passenger_id_card.length < 9) {
        errors[`passenger.${idx}.id_card`] = 'CCCD/CMND phải có ít nhất 9 ký tự';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle contact form changes
  const handleContactChange = (field: keyof ContactFormData, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[`contact.${field}`]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`contact.${field}`];
        return newErrors;
      });
    }
  };

  // Handle passenger form changes
  const handlePassengerChange = (index: number, field: keyof PassengerFormData, value: string) => {
    const newForms = [...passengerForms];
    newForms[index] = { ...newForms[index], [field]: value };
    setPassengerForms(newForms);

    if (formErrors[`passenger.${index}.${field}`]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`passenger.${index}.${field}`];
        return newErrors;
      });
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm() || !bookingId) return;

    setSaving(true);
    try {
      // Prepare passenger data with contact info
      const passengersWithContact = passengerForms.map(p => ({
        ...p,
        contact_info: {
          phone: contactForm.phone,
          email: contactForm.email,
        },
      }));

      await savePassengerInfo(bookingId, {
        passengers: passengersWithContact,
      });

      // Refresh booking details so checkout reads the latest passenger info
      const updatedBooking = await getBookingDetails(bookingId);
      setBooking(updatedBooking);
      setBookingData(updatedBooking);

      setSuccessMessage('Thông tin hành khách đã được lưu thành công!');

      // Redirect to checkout confirmation page
      setTimeout(() => {
        router.push(`/user/booking/checkout?bookingId=${bookingId}`);
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu thông tin';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Đang tải thông tin đặt vé...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không thể tải thông tin</h2>
          <p className="text-gray-500 mb-6">{error ?? 'Booking không tồn tại'}</p>
          <button onClick={() => router.back()} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center transition-colors hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5 text-gray-800" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Thông tin hành khách</h1>
            </div>
          </div>

          <BookingSteps currentStep={1} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - Left side */}
          <div className="lg:col-span-2 space-y-6">

            {/* Trip Summary Card */}
            <TripDetailsCard booking={booking.booking_summary} />

            {/* Contact Details Section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Thông tin liên hệ</h3>
                  <p className="text-sm text-gray-500">
                    Chúng tôi sẽ gửi thông tin đặt vé đến thông tin này
                    {userProfile ? ' và đã tự điền từ tài khoản khi có thể.' : '.'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => handleContactChange('phone', e.target.value)}
                      placeholder="Nhập số điện thoại (10 chữ số)"
                      className={`input pl-10 ${formErrors['contact.phone'] ? 'border-red-500' : ''}`}
                      maxLength={11}
                    />
                  </div>
                  {formErrors['contact.phone'] && (
                    <p className="mt-1 text-sm text-red-500">{formErrors['contact.phone']}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      placeholder="Nhập địa chỉ email"
                      className={`input pl-10 ${formErrors['contact.email'] ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {formErrors['contact.email'] && (
                    <p className="mt-1 text-sm text-red-500">{formErrors['contact.email']}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Passenger Details Section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Thông tin hành khách</h3>
                    <p className="text-sm text-gray-500">{passengerForms.length} hành khách</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {passengerForms.map((passenger, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="p-5 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        Hành khách #{idx + 1}
                      </h4>
                      {booking.passengers[idx]?.seat_info?.number && (
                        <span className="text-sm font-medium text-brand-600">
                          Ghế {booking.passengers[idx].seat_info?.number}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <User className="w-5 h-5" />
                          </div>
                          <input
                            type="text"
                            value={passenger.passenger_name}
                            onChange={(e) => handlePassengerChange(idx, 'passenger_name', e.target.value)}
                            placeholder="Nhập họ tên đầy đủ"
                            className={`input pl-10 uppercase ${formErrors[`passenger.${idx}.name`] ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {formErrors[`passenger.${idx}.name`] && (
                          <p className="mt-1 text-sm text-red-500">{formErrors[`passenger.${idx}.name`]}</p>
                        )}
                      </div>

                      {/* ID Card / Passport */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số CCCD/CMND/Hộ chiếu <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <input
                            type="text"
                            value={passenger.passenger_id_card}
                            onChange={(e) => handlePassengerChange(idx, 'passenger_id_card', e.target.value)}
                            placeholder="Nhập số CCCD/CMND"
                            className={`input pl-10 ${formErrors[`passenger.${idx}.id_card`] ? 'border-red-500' : ''}`}
                            maxLength={12}
                          />
                        </div>
                        {formErrors[`passenger.${idx}.id_card`] && (
                          <p className="mt-1 text-sm text-red-500">{formErrors[`passenger.${idx}.id_card`]}</p>
                        )}
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ngày sinh
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <input
                            type="date"
                            value={passenger.date_of_birth ?? ''}
                            onChange={(e) => handlePassengerChange(idx, 'date_of_birth', e.target.value)}
                            className="input pl-10"
                          />
                        </div>
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Giới tính
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Users className="w-5 h-5" />
                          </div>
                          <select
                            value={passenger.gender ?? ''}
                            onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)}
                            className="input pl-10"
                          >
                            <option value="" disabled>Chọn giới tính</option>
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                            <option value="OTHER">Khác</option>
                          </select>
                        </div>
                      </div>

                      {/* Passenger Type */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Loại hành khách
                        </label>
                        <div className="flex gap-3">
                          {(['ADULT', 'CHILD', 'INFANT'] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => handlePassengerChange(idx, 'passenger_type', type)}
                              className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${passenger.passenger_type === type
                                  ? 'border-brand-500 bg-brand-50 text-brand-600'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                            >
                              {type === 'ADULT' && 'Người lớn'}
                              {type === 'CHILD' && 'Trẻ em'}
                              {type === 'INFANT' && 'Sơ sinh'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

            </motion.div>
          </div>

          {/* Sidebar - Right side */}
          <div className="space-y-6">
            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-32 space-y-3"
            >
              {/* Save and Continue */}
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Lưu và tiếp tục
                  </>
                )}
              </button>

              {/* Back */}
              <button
                onClick={() => router.back()}
                className="btn-secondary w-full"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </button>

              {/* Info note */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Lưu ý:</strong> Thông tin hành khách phải khớp với giấy tờ tùy thân.
                  Vui lòng kiểm tra kỹ trước khi tiếp tục.
                </p>
              </div>
            </motion.div>

            {/* Success message */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-100 rounded-xl"
              >
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="text-sm font-medium">{successMessage}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PassengerInfoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Đang tải trang...</p>
        </div>
      </div>
    }>
      <PassengerInfoContent />
    </Suspense>
  );
}


"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import "./seat-map.css";
import { getSocket, disconnectSocket } from "@/lib/socket";
import config from "@/config";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Seat {
  _id: string;
  seat_number: string;
  class: "ECONOMY" | "BUSINESS";
  status: "AVAILABLE" | "HELD" | "BOOKED";
  holdUntil: string | null;
  price_modifier: number;
}

interface SeatUpdatePayload {
  tripId: string;
  seatId: string;
  seat_number: string;
  status: "AVAILABLE" | "HELD" | "BOOKED";
  updatedAt: string;
}

interface TripInfo {
  flightNumber?: string;
  departureTime: string;
  arrivalTime: string;
  status: string;
}

interface SeatMapData {
  tripType: "flight" | "train";
  tripId: string;
  trip: TripInfo;
  seats?: Seat[];
  carriages?: {
    carriageId: string;
    carriageNumber: string;
    type: string;
    basePrice: number;
    seats: Seat[];
  }[];
}

type WsStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = config.apiBaseUrl;
const SEAT_PRICE = config.defaultSeatPrice;
const HOLD_DURATION_SECONDS = config.seatHoldDurationSeconds;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function getSeatPrice(seat: Seat): number {
  return SEAT_PRICE + (seat.price_modifier ?? 0);
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SeatMapPage() {
  const [tripId, setTripId] = useState<string | null>(null);
  const [seatMap, setSeatMap] = useState<SeatMapData | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<WsStatus>("connecting");

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState(HOLD_DURATION_SECONDS);
  const [isCounting, setIsCounting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stable ref to selectedIds for use in callbacks without stale closure issues
  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);

  // ── Read tripId from URL ──────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTripId(params.get("tripId"));
  }, []);

  // ── Fetch seat map ────────────────────────────────────────────────────────
  const fetchSeatMap = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/seats/map/${id}`);
      const json = await res.json();
      if (!res.ok) { setError(json.message ?? "Failed to load seat map."); return; }
      const data: SeatMapData = json.data;
      setSeatMap(data);
      const flatSeats: Seat[] =
        data.tripType === "flight"
          ? (data.seats ?? [])
          : (data.carriages ?? []).flatMap((c) => c.seats);
      setSeats(flatSeats);
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tripId) fetchSeatMap(tripId);
  }, [tripId, fetchSeatMap]);

  // ── Socket.io ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tripId) return;

    const socket = getSocket();

    // Apply a single seat update from the server to local state
    function applyUpdate(payload: SeatUpdatePayload) {
      setSeats((prev) =>
        prev.map((s) =>
          s._id === payload.seatId
            ? { ...s, status: payload.status, holdUntil: payload.updatedAt }
            : s
        )
      );
      // If the seat we had selected was claimed by someone else, deselect it
      if (payload.status !== "AVAILABLE" && selectedIdsRef.current.has(payload.seatId)) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(payload.seatId);
          if (next.size === 0) { setIsCounting(false); setTimeLeft(HOLD_DURATION_SECONDS); }
          return next;
        });
      }
    }

    socket.on("connect", () => setWsStatus("connected"));
    socket.on("disconnect", () => setWsStatus("disconnected"));
    socket.on("connect_error", () => setWsStatus("reconnecting"));
    socket.on("reconnect_attempt", () => setWsStatus("reconnecting"));
    // On successful reconnect: re-fetch to catch any missed events
    socket.on("reconnect", () => {
      setWsStatus("connected");
      fetchSeatMap(tripId);
    });

    socket.on("seat_held", applyUpdate);
    socket.on("seat_released", applyUpdate);
    socket.on("seat_booked", applyUpdate);
    socket.on("seat_update", applyUpdate);

    socket.connect();
    socket.emit("join_trip", tripId);

    return () => {
      socket.emit("leave_trip", tripId);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("reconnect_attempt");
      socket.off("reconnect");
      socket.off("seat_held", applyUpdate);
      socket.off("seat_released", applyUpdate);
      socket.off("seat_booked", applyUpdate);
      socket.off("seat_update", applyUpdate);
      disconnectSocket();
    };
  }, [tripId, fetchSeatMap]);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isCounting) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handleHoldExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCounting]);

  const handleHoldExpired = useCallback(() => {
    alert("Đã hết thời gian giữ ghế. Vui lòng chọn lại.");
    const ids = selectedIdsRef.current;
    setSeats((prev) => prev.map((s) => ids.has(s._id) ? { ...s, status: "AVAILABLE" } : s));
    // Release on backend — fire and forget
    const token = getAuthToken();
    if (token && tripId && ids.size > 0) {
      fetch(`${API_BASE}/seats/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ seatIds: [...ids], tripId }),
      }).catch(() => {});
    }
    setSelectedIds(new Set());
    setIsCounting(false);
    setTimeLeft(HOLD_DURATION_SECONDS);
  }, [tripId]);

  // ── Toggle seat selection ─────────────────────────────────────────────────
  const toggleSeat = useCallback((seat: Seat) => {
    if (seat.status === "BOOKED" || seat.status === "HELD") return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(seat._id)) {
        next.delete(seat._id);
      } else {
        next.add(seat._id);
      }
      if (next.size > 0 && !isCounting) {
        setIsCounting(true);
        setTimeLeft(HOLD_DURATION_SECONDS);
      } else if (next.size === 0) {
        setIsCounting(false);
        setTimeLeft(HOLD_DURATION_SECONDS);
      }
      return next;
    });
  }, [isCounting]);

  // ── Continue → POST /seats/select ─────────────────────────────────────────
  const handleContinue = async () => {
    if (selectedIds.size === 0 || !tripId) return;
    setIsProcessing(true);
    setApiError(null);
    const token = getAuthToken();
    if (!token) {
      setApiError("Bạn cần đăng nhập để đặt ghế.");
      setIsProcessing(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/seats/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tripId, seatIds: [...selectedIds] }),
      });
      const json = await res.json();
      if (!res.ok) {
        setApiError(json.message ?? "Đặt ghế thất bại. Vui lòng thử lại.");
        return;
      }
      const confirmed: Seat[] = json.data?.selectedSeats ?? [];
      setSeats((prev) =>
        prev.map((s) => {
          const u = confirmed.find((c) => c._id === s._id);
          return u ? { ...u } : s;
        })
      );
      alert(`Giữ ghế thành công!\nCác ghế: ${confirmed.map((s) => s.seat_number).join(", ")}\nChuyển sang trang nhập thông tin hành khách...`);
    } catch {
      setApiError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const selectedSeats = seats.filter((s) => selectedIds.has(s._id));
  const totalPrice = selectedSeats.reduce((sum, s) => sum + getSeatPrice(s), 0);

  const seatRows = new Map<string, Seat[]>();
  seats.forEach((s) => {
    const row = s.seat_number.replace(/[A-Z]/g, "");
    if (!seatRows.has(row)) seatRows.set(row, []);
    seatRows.get(row)!.push(s);
  });

  const getSeatClass = (seat: Seat) => {
    if (selectedIds.has(seat._id)) return "status-selected";
    return `status-${seat.status.toLowerCase()}`;
  };

  // WS status badge styling
  const wsBadgeStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "0.35rem",
    fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "999px",
    fontWeight: 500,
    background: wsStatus === "connected" ? "#dcfce7" : wsStatus === "connecting" ? "#fef9c3" : "#fee2e2",
    color: wsStatus === "connected" ? "#166534" : wsStatus === "connecting" ? "#854d0e" : "#991b1b",
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="app-container" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "#2563eb" }} />
        <p style={{ marginTop: "1rem", color: "#64748b" }}>Đang tải sơ đồ ghế...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: "2rem", color: "#ef4444" }} />
        <p style={{ marginTop: "1rem", color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <div className="app-container">
        {/* Header */}
        <header className="page-header">
          <button className="back-link" aria-label="Quay lại" onClick={() => history.back()}>
            <i className="fa-solid fa-arrow-left" />
          </button>
          <h1>Chọn ghế chuyến đi</h1>
          {/* Real-time connection badge */}
          <span style={wsBadgeStyle}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: wsStatus === "connected" ? "#16a34a" : wsStatus === "connecting" ? "#ca8a04" : "#dc2626",
              display: "inline-block",
            }} />
            {wsStatus === "connected" ? "Đồng bộ thời gian thực" : wsStatus === "connecting" ? "Đang kết nối..." : "Mất kết nối"}
          </span>
        </header>

        <div className="main-content">
          {/* ─ Left Panel ─ */}
          <div className="left-panel">
            {/* Trip Info */}
            {seatMap && (
              <section className="trip-info-card card">
                <div className="trip-header">
                  <span className="trip-code">
                    <i className="fa-solid fa-plane-departure" />{" "}
                    {seatMap.trip.flightNumber ?? seatMap.tripId}
                  </span>
                  <span className="trip-status">{seatMap.trip.status}</span>
                </div>
                <div className="trip-details">
                  <div className="time-info">
                    <div className="time-item">
                      <i className="fa-regular fa-calendar" />
                      <span>{new Date(seatMap.trip.departureTime).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <div className="time-item">
                      <i className="fa-regular fa-clock" />
                      <span>
                        {new Date(seatMap.trip.departureTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        {" → "}
                        {new Date(seatMap.trip.arrivalTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Legend */}
            <section className="legend-area card">
              <h3>Chú thích</h3>
              <div className="legend-items">
                <div className="legend-item"><div className="seat-badge empty" /> Ghế trống</div>
                <div className="legend-item"><div className="seat-badge selected" /> Đang chọn</div>
                <div className="legend-item"><div className="seat-badge held" /> Đang giữ</div>
                <div className="legend-item"><div className="seat-badge booked" /> Đã đặt / Ko bán</div>
              </div>
            </section>

            {/* Seat Map */}
            <section className="seat-map-wrapper card">
              <div className="map-header">
                <h3>Sơ đồ ghế ngồi</h3>
                <p>Vui lòng click vào ghế trống để chọn.</p>
              </div>
              <div className="seat-map-container">
                <div className="seat-map-grid" id="seat-map-grid">
                  {Array.from(seatRows.entries()).map(([rowLabel, rowSeats]) => {
                    const leftGroup = rowSeats.filter((s) => ["A", "B"].some((c) => s.seat_number.endsWith(c)));
                    const rightGroup = rowSeats.filter((s) => ["C", "D"].some((c) => s.seat_number.endsWith(c)));
                    return (
                      <div key={rowLabel} className="seat-row">
                        <div className="seat-group">
                          {leftGroup.map((seat) => (
                            <div
                              key={seat._id}
                              className={`seat ${getSeatClass(seat)}`}
                              title={`Ghế ${seat.seat_number} — ${formatCurrency(getSeatPrice(seat))}`}
                              onClick={() => toggleSeat(seat)}
                            >
                              {seat.status === "BOOKED" ? <i className="fa-solid fa-xmark" /> :
                               seat.status === "HELD" && !selectedIds.has(seat._id) ? <i className="fa-solid fa-lock" /> :
                               seat.seat_number}
                            </div>
                          ))}
                        </div>
                        <div className="row-label">{rowLabel}</div>
                        <div className="seat-group">
                          {rightGroup.map((seat) => (
                            <div
                              key={seat._id}
                              className={`seat ${getSeatClass(seat)}`}
                              title={`Ghế ${seat.seat_number} — ${formatCurrency(getSeatPrice(seat))}`}
                              onClick={() => toggleSeat(seat)}
                            >
                              {seat.status === "BOOKED" ? <i className="fa-solid fa-xmark" /> :
                               seat.status === "HELD" && !selectedIds.has(seat._id) ? <i className="fa-solid fa-lock" /> :
                               seat.seat_number}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* ─ Right Panel ─ */}
          <div className="right-panel">
            <div className="summary-card card sticky">
              <h2>Chi tiết đặt chỗ</h2>

              {isCounting && (
                <div className="countdown-wrapper" id="countdown-wrapper">
                  <div className="countdown-label">
                    <i className="fa-regular fa-clock" /> Thời gian giữ ghế
                  </div>
                  <div className="countdown-timer" id="timer-display">{formatTime(timeLeft)}</div>
                </div>
              )}

              {apiError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem", color: "#b91c1c", fontSize: "0.9rem" }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: "0.5rem" }} />
                  {apiError}
                </div>
              )}

              <div className="selected-seats-info">
                <h3>Ghế đã chọn (<span id="selected-count">{selectedSeats.length}</span>)</h3>
                <div className="selected-list" id="selected-seats-list">
                  {selectedSeats.length === 0 ? (
                    <div className="empty-state">Chưa có ghế nào được chọn</div>
                  ) : (
                    selectedSeats.map((seat) => (
                      <div key={seat._id} className="selected-seat-item">
                        <div>Ghế <strong>{seat.seat_number}</strong></div>
                        <div>
                          {formatCurrency(getSeatPrice(seat))}
                          <button className="btn-remove-seat" aria-label="Xóa ghế" onClick={() => toggleSeat(seat)}>
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="price-summary">
                <div className="price-row">
                  <span>Tạm tính</span>
                  <strong id="total-price">{formatCurrency(totalPrice)}</strong>
                </div>
              </div>

              <div className="action-buttons">
                <button className="btn btn-secondary" onClick={() => history.back()}>
                  <i className="fa-solid fa-arrow-left" /> Quay lại
                </button>
                <button
                  className="btn btn-primary"
                  id="btn-continue"
                  disabled={selectedSeats.length === 0 || isProcessing}
                  onClick={handleContinue}
                >
                  {isProcessing ? (
                    <><i className="fa-solid fa-spinner fa-spin" /> Đang xử lý...</>
                  ) : (
                    <>Tiếp tục <i className="fa-solid fa-arrow-right" /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

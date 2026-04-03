"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import "./seat-map.css";
import { getValidAccessToken } from "@/lib/auth";
import { getSocket, disconnectSocket } from "@/lib/socket";
import config from "@/config";

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
  selectedClass?: "ECONOMY" | "BUSINESS" | null;
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

const API_BASE = config.apiBaseUrl;
const SEAT_SELECTION_FEES = config.seatSelectionFees;
const HOLD_DURATION_SECONDS = config.seatHoldDurationSeconds;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getSeatPrice(seat: Seat): number {
  if (seat.class === "BUSINESS") {
    return SEAT_SELECTION_FEES.business;
  }
  return SEAT_SELECTION_FEES.economy;
}

function normalizeSeatClass(seatClass?: string | null): "ECONOMY" | "BUSINESS" {
  const normalized = String(seatClass || "").trim().toUpperCase();
  if (normalized === "BUSINESS" || normalized === "FIRST_CLASS") {
    return "BUSINESS";
  }
  return "ECONOMY";
}

function formatSeatClassLabel(seatClass: "ECONOMY" | "BUSINESS") {
  return seatClass === "BUSINESS" ? "Thương gia" : "Phổ thông";
}

function getSeatRowKey(seat: Seat, tripType?: "flight" | "train") {
  if (tripType === "train") {
    const [carriageNo] = seat.seat_number.split("-");
    return carriageNo || seat.seat_number;
  }

  const match = seat.seat_number.match(/\d+/);
  return match ? match[0] : seat.seat_number;
}

function sortSeatNumber(a: Seat, b: Seat) {
  return a.seat_number.localeCompare(b.seat_number, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function getSeatLabel(seat: Seat, tripType?: "flight" | "train") {
  if (tripType === "train") {
    return seat.seat_number;
  }
  return seat.seat_number;
}

export default function SeatMapPage() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId");
  const tripTypeParam = searchParams.get("type");
  const seatClass = searchParams.get("class") || "economy";
  const normalizedSeatClass = normalizeSeatClass(seatClass);
  const normalizedTripType =
    tripTypeParam?.toUpperCase() === "TRAIN" ? "TRAIN" : "FLIGHT";

  const [seatMap, setSeatMap] = useState<SeatMapData | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<WsStatus>("connecting");
  const [pendingSeatIds, setPendingSeatIds] = useState<Set<string>>(new Set());

  const [timeLeft, setTimeLeft] = useState(HOLD_DURATION_SECONDS);
  const [isCounting, setIsCounting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const selectedIdsRef = useRef(selectedIds);
  const pendingSeatIdsRef = useRef(pendingSeatIds);
  const holdExpiredHandledRef = useRef(false);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    pendingSeatIdsRef.current = pendingSeatIds;
  }, [pendingSeatIds]);

  const fetchSeatMap = useCallback(async (id: string, signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/seats/map/${id}?class=${normalizedSeatClass}`,
        { signal },
      );
      const json = await res.json();

      if (!res.ok) {
        setError(json.message ?? "Không thể tải sơ đồ ghế.");
        return;
      }

      const data: SeatMapData = json.data;
      const normalizedData: SeatMapData =
        data.tripType === "flight"
          ? {
              ...data,
              selectedClass: normalizedSeatClass,
              seats: (data.seats ?? []).filter((seat) => seat.class === normalizedSeatClass),
            }
          : {
              ...data,
              selectedClass: normalizedSeatClass,
              carriages: (data.carriages ?? [])
                .filter((carriage) => normalizeSeatClass(carriage.type) === normalizedSeatClass)
                .map((carriage) => ({
                  ...carriage,
                  seats: carriage.seats.filter((seat) => seat.class === normalizedSeatClass),
                })),
            };

      setSeatMap(normalizedData);

      const flatSeats: Seat[] =
        normalizedData.tripType === "flight"
          ? (normalizedData.seats ?? [])
          : (normalizedData.carriages ?? []).flatMap((c) => c.seats);

      setSeats(flatSeats);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, [normalizedSeatClass]);

  useEffect(() => {
    if (!tripId) {
      setError("Thiếu tripId trên URL.");
      setIsLoading(false);
      setWsStatus("disconnected");
      return;
    }

    const controller = new AbortController();
    fetchSeatMap(tripId, controller.signal);

    return () => {
      controller.abort();
    };
  }, [tripId, fetchSeatMap]);

  useEffect(() => {
    if (!tripId) return;

    const socket = getSocket();

    function applyUpdate(payload: SeatUpdatePayload) {
      setSeats((prev) =>
        prev.map((seat) =>
          seat._id === payload.seatId
            ? { ...seat, status: payload.status, holdUntil: payload.updatedAt }
            : seat
        )
      );

      if (payload.status !== "HELD" && selectedIdsRef.current.has(payload.seatId)) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(payload.seatId);
          if (next.size === 0) {
            setIsCounting(false);
            setTimeLeft(HOLD_DURATION_SECONDS);
          }
          return next;
        });
      }

      if (pendingSeatIdsRef.current.has(payload.seatId)) {
        setPendingSeatIds((prev) => {
          const next = new Set(prev);
          next.delete(payload.seatId);
          return next;
        });
      }
    }

    const handleConnect = () => setWsStatus("connected");
    const handleDisconnect = () => setWsStatus("disconnected");
    const handleReconnecting = () => setWsStatus("reconnecting");
    const handleReconnect = () => {
      setWsStatus("connected");
      void fetchSeatMap(tripId);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleReconnecting);
    socket.on("reconnect_attempt", handleReconnecting);
    socket.on("reconnect", handleReconnect);

    socket.on("seat_held", applyUpdate);
    socket.on("seat_released", applyUpdate);
    socket.on("seat_booked", applyUpdate);
    socket.on("seat_update", applyUpdate);

    socket.connect();
    socket.emit("join_trip", tripId);

    return () => {
      socket.emit("leave_trip", tripId);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleReconnecting);
      socket.off("reconnect_attempt", handleReconnecting);
      socket.off("reconnect", handleReconnect);
      socket.off("seat_held", applyUpdate);
      socket.off("seat_released", applyUpdate);
      socket.off("seat_booked", applyUpdate);
      socket.off("seat_update", applyUpdate);
      disconnectSocket();
    };
  }, [tripId, fetchSeatMap]);

  const handleHoldExpired = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (ids.size === 0) {
      setIsCounting(false);
      setTimeLeft(HOLD_DURATION_SECONDS);
      return;
    }

    alert("Đã hết thời gian giữ ghế. Vui lòng chọn lại.");

    setSeats((prev) =>
      prev.map((seat) =>
        ids.has(seat._id) ? { ...seat, status: "AVAILABLE", holdUntil: null } : seat
      )
    );

    void getValidAccessToken().then((token) => {
      if (token && tripId && ids.size > 0) {
        fetch(`${API_BASE}/seats/release`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ seatIds: [...ids], tripId }),
        }).catch(() => {});
      }
    });
    setSelectedIds(new Set());
    setIsCounting(false);
    setTimeLeft(HOLD_DURATION_SECONDS);
  }, [tripId]);

  useEffect(() => {
    if (!isCounting) {
      holdExpiredHandledRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isCounting]);

  useEffect(() => {
    if (!isCounting || timeLeft > 0 || holdExpiredHandledRef.current) return;
    holdExpiredHandledRef.current = true;
    handleHoldExpired();
  }, [isCounting, timeLeft, handleHoldExpired]);

  const toggleSeat = useCallback(async (seat: Seat) => {
    if (!tripId) return;
    if (seat.class !== normalizedSeatClass) return;
    if (pendingSeatIdsRef.current.has(seat._id)) return;

    const isSelected = selectedIdsRef.current.has(seat._id);
    if (!isSelected && seat.status === "BOOKED") {
      return;
    }

    const token = await getValidAccessToken();
    if (!token) {
      setApiError("Bạn cần đăng nhập để giữ ghế.");
      return;
    }

    setApiError(null);
    setPendingSeatIds((prev) => {
      const next = new Set(prev);
      next.add(seat._id);
      return next;
    });

    try {
      if (isSelected) {
        const releaseRes = await fetch(`${API_BASE}/seats/release`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ seatIds: [seat._id], tripId }),
        });

        const releaseJson = await releaseRes.json().catch(() => ({}));
        if (!releaseRes.ok) {
          setApiError(releaseJson.message ?? "Không thể bỏ giữ ghế. Vui lòng thử lại.");
          return;
        }

        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(seat._id);
          if (next.size === 0) {
            setIsCounting(false);
            setTimeLeft(HOLD_DURATION_SECONDS);
          }
          return next;
        });

        setSeats((prev) =>
          prev.map((item) =>
            item._id === seat._id ? { ...item, status: "AVAILABLE", holdUntil: null } : item,
          ),
        );
        return;
      }

      const holdRes = await fetch(`${API_BASE}/seats/hold`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          seatIds: [seat._id],
          tripType: normalizedTripType.toLowerCase(),
          tripId,
        }),
      });

      const holdJson = await holdRes.json().catch(() => ({}));
      if (!holdRes.ok) {
        setApiError(holdJson.message ?? "Ghế vừa được người khác giữ. Vui lòng chọn ghế khác.");
        return;
      }

      const held = holdJson.data?.heldSeats?.[0] as
        | { _id: string; status: "HELD"; holdUntil?: string | null }
        | undefined;

      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.add(seat._id);
        setIsCounting(true);
        if (prev.size === 0) {
          setTimeLeft(HOLD_DURATION_SECONDS);
        }
        return next;
      });

      setSeats((prev) =>
        prev.map((item) =>
          item._id === seat._id
            ? {
                ...item,
                status: "HELD",
                holdUntil: held?.holdUntil ?? item.holdUntil,
              }
            : item,
        ),
      );
    } catch {
      setApiError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setPendingSeatIds((prev) => {
        const next = new Set(prev);
        next.delete(seat._id);
        return next;
      });
    }
  }, [normalizedSeatClass, normalizedTripType, tripId]);

  const handleContinue = async () => {
    if (selectedIds.size === 0 || !tripId) return;

    setIsProcessing(true);
    setApiError(null);
    const token = await getValidAccessToken();
    if (!token) {
      setApiError("Bạn cần đăng nhập để đặt ghế.");
      setIsProcessing(false);
      return;
    }

    try {
      // Bước 1: Chọn ghế (hold seats)
      const selectRes = await fetch(`${API_BASE}/seats/select`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tripId, seatIds: [...selectedIds] }),
      });

      const selectJson = await selectRes.json();
      if (!selectRes.ok) {
        setApiError(selectJson.message ?? "Đặt ghế thất bại. Vui lòng thử lại.");
        setIsProcessing(false);
        return;
      }

      const confirmed: Seat[] = selectJson.data?.selectedSeats ?? [];
      setSeats((prev) =>
        prev.map((seat) => {
          const updated = confirmed.find((item) => item._id === seat._id);
          return updated ? { ...updated } : seat;
        })
      );

      // Bước 2: Tạo booking với các ghế đã chọn
      const bookingRes = await fetch(`${API_BASE}/bookings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trip_id: tripId,
          booking_type: normalizedTripType,
          seats: [...selectedIds],
          passengers: confirmed.map((seat) => ({
            seat_id: seat._id,
            passenger_name: "", // Sẽ được điền ở trang passenger info
            passenger_id_card: "",
          })),
        }),
      });

      const bookingJson = await bookingRes.json();
      if (!bookingRes.ok) {
        setApiError(bookingJson.message ?? "Tạo booking thất bại. Vui lòng thử lại.");
        setIsProcessing(false);
        return;
      }

      const bookingId =
        bookingJson.booking?._id ??
        bookingJson.data?.booking?._id ??
        bookingJson.data?._id ??
        bookingJson.booking_id ??
        bookingJson.data?.booking_id;

      if (!bookingId) {
        setApiError("Không lấy được mã booking để chuyển sang trang nhập thông tin hành khách.");
        setIsProcessing(false);
        return;
      }

      // Bước 3: Redirect sang trang nhập thông tin hành khách
      window.location.href = `/user/booking/passenger-info?bookingId=${bookingId}`;
    } catch {
      setApiError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
      setIsProcessing(false);
    }
  };

  const selectedSeats = seats.filter((seat) => selectedIds.has(seat._id));
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + getSeatPrice(seat), 0);
  const isTrainTrip = seatMap?.tripType === "train";
  const seatById = new Map(seats.map((seat) => [seat._id, seat]));

  const trainCarriages = (seatMap?.carriages ?? [])
    .map((carriage) => ({
      ...carriage,
      seats: carriage.seats
        .map((seat) => seatById.get(seat._id) ?? seat)
        .filter((seat) => seat.class === normalizedSeatClass)
        .sort(sortSeatNumber),
    }))
    .filter((carriage) => carriage.seats.length > 0);

  const seatRows = new Map<string, Seat[]>();
  seats.forEach((seat) => {
    const row = getSeatRowKey(seat, seatMap?.tripType);
    if (!seatRows.has(row)) seatRows.set(row, []);
    seatRows.get(row)!.push(seat);
  });

  const seatRowEntries = Array.from(seatRows.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: "base" }),
  );

  const renderSeat = (seat: Seat) => (
    <div
      key={seat._id}
      className={`seat ${getSeatClass(seat)}`}
      title={`Ghế ${seat.seat_number} - ${formatCurrency(getSeatPrice(seat))}`}
      onClick={() => void toggleSeat(seat)}
    >
      <span className="seat-code">{getSeatLabel(seat, seatMap?.tripType)}</span>
      {seat.status === "BOOKED" ? (
        <i className="fa-solid fa-xmark seat-state-icon" />
      ) : seat.status === "HELD" && !selectedIds.has(seat._id) ? (
        <i className="fa-solid fa-lock seat-state-icon" />
      ) : null}
    </div>
  );

  const getSeatClass = (seat: Seat) => {
    if (selectedIds.has(seat._id)) return "status-selected";
    return `status-${seat.status.toLowerCase()}`;
  };

  const wsBadgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.75rem",
    padding: "0.2rem 0.6rem",
    borderRadius: "999px",
    fontWeight: 500,
    background:
      wsStatus === "connected"
        ? "#dcfce7"
        : wsStatus === "connecting"
          ? "#fef9c3"
          : "#fee2e2",
    color:
      wsStatus === "connected"
        ? "#166534"
        : wsStatus === "connecting"
          ? "#854d0e"
          : "#991b1b",
  };

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
        <header className="page-header">
          <button className="back-link" aria-label="Quay lại" onClick={() => history.back()}>
            <i className="fa-solid fa-arrow-left" />
          </button>
          <h1>Chọn ghế chuyến đi</h1>
          <span style={wsBadgeStyle}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background:
                  wsStatus === "connected"
                    ? "#16a34a"
                    : wsStatus === "connecting"
                      ? "#ca8a04"
                      : "#dc2626",
                display: "inline-block",
              }}
            />
            {wsStatus === "connected"
              ? "Đồng bộ thời gian thực"
              : wsStatus === "connecting"
                ? "Đang kết nối..."
                : "Mất kết nối"}
          </span>
        </header>

        <div className="main-content">
          <div className="left-panel">
            {seatMap && (
              <section className="trip-info-card card">
                <div className="trip-header">
                  <span className="trip-code">
                    <i className="fa-solid fa-plane-departure" /> {seatMap.trip.flightNumber ?? seatMap.tripId}
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
                        {new Date(seatMap.trip.departureTime).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" -> "}
                        {new Date(seatMap.trip.arrivalTime).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="seat-class-pill">
                    <i className="fa-solid fa-couch" /> Đang chọn hạng ghế: {formatSeatClassLabel(normalizedSeatClass)}
                  </div>
                </div>
              </section>
            )}

            <section className="legend-area card">
              <h3>Chú thích</h3>
              <div className="legend-items">
                <div className="legend-item"><div className="seat-badge empty" /> Ghế trống</div>
                <div className="legend-item"><div className="seat-badge selected" /> Đang chọn</div>
                <div className="legend-item"><div className="seat-badge held" /> Đang giữ</div>
                <div className="legend-item"><div className="seat-badge booked" /> Đã đặt / Không bán</div>
              </div>
            </section>

            <section className="seat-map-wrapper card">
              <div className="map-header">
                <h3>Sơ đồ ghế {formatSeatClassLabel(normalizedSeatClass)}</h3>
                <p>
                  {isTrainTrip
                    ? "Chọn chỗ ngồi theo từng toa để có trải nghiệm trực quan hơn."
                    : `Vui lòng nhấn vào ghế trống thuộc hạng ${formatSeatClassLabel(normalizedSeatClass).toLowerCase()} để chọn.`}
                </p>
              </div>
              <div className="seat-map-container">
                {seats.length === 0 ? (
                  <div className="empty-state">Không có ghế {formatSeatClassLabel(normalizedSeatClass).toLowerCase()} cho chuyến đi này.</div>
                ) : (
                  isTrainTrip ? (
                    <div className="train-map-grid" id="seat-map-grid">
                      {trainCarriages.map((carriage, index) => {
                        const carriageLabel = carriage.carriageNumber || `${index + 1}`;

                        return (
                          <React.Fragment key={carriage.carriageId}>
                            <article className="train-carriage-card">
                              <div className="train-carriage-header">
                                <div>
                                  <p className="train-carriage-subtitle">Toa tàu</p>
                                  <h4 className="train-carriage-title">Toa {carriageLabel}</h4>
                                </div>
                                <span className="train-carriage-count">{carriage.seats.length} ghế</span>
                              </div>

                              <div className="train-carriage-body">
                                <div className="train-window-strip" aria-hidden="true" />
                                <div className="train-seat-grid">
                                  {carriage.seats.map((seat) => renderSeat(seat))}
                                </div>
                              </div>
                            </article>

                            {index < trainCarriages.length - 1 ? (
                              <div className="train-carriage-divider" aria-hidden="true">
                                <span>Toa tiếp theo</span>
                              </div>
                            ) : null}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="seat-map-grid" id="seat-map-grid">
                      {seatRowEntries.map(([rowLabel, rowSeats]) => {
                        const orderedRowSeats = [...rowSeats].sort(sortSeatNumber);
                        const hasClassicFlightLayout = orderedRowSeats.some((seat) =>
                          ["A", "B", "C", "D"].some((code) => seat.seat_number.endsWith(code)),
                        );

                        const leftGroup = hasClassicFlightLayout
                          ? orderedRowSeats.filter((seat) =>
                              ["A", "B"].some((code) => seat.seat_number.endsWith(code)),
                            )
                          : orderedRowSeats.slice(0, Math.ceil(orderedRowSeats.length / 2));

                        const rightGroup = hasClassicFlightLayout
                          ? orderedRowSeats.filter((seat) =>
                              ["C", "D"].some((code) => seat.seat_number.endsWith(code)),
                            )
                          : orderedRowSeats.slice(Math.ceil(orderedRowSeats.length / 2));

                        return (
                          <div key={rowLabel} className="seat-row">
                            <div className="seat-group">
                              {leftGroup.map((seat) => renderSeat(seat))}
                            </div>
                            <div className="row-label">{rowLabel}</div>
                            <div className="seat-group">
                              {rightGroup.map((seat) => renderSeat(seat))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </section>
          </div>

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
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    marginBottom: "1rem",
                    color: "#b91c1c",
                    fontSize: "0.9rem",
                  }}
                >
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
                          <button className="btn-remove-seat" aria-label="Xóa ghế" onClick={() => void toggleSeat(seat)}>
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

import React, { useState, useEffect, useMemo } from "react";
import { 
  ClipboardList, Search, Filter, RefreshCw, Eye, CheckCircle2, 
  Clock, Check, CreditCard, Wallet, Calendar, User, Phone, Mail, 
  Key, LogOut, AlertTriangle, ArrowRight, ShieldCheck, DollarSign
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { bookingApi, roomApi } from "../../services/api";

export default function StaffBookingsTab({ currentUser, initialFilter = "Tất cả", onToast }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialFilter || "Tất cả");
  
  // Modals state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [checkInModalBooking, setCheckInModalBooking] = useState(null);
  const [checkOutModalBooking, setCheckOutModalBooking] = useState(null);
  const [confirmModalBooking, setConfirmModalBooking] = useState(null);
  
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (initialFilter) {
      setStatusFilter(initialFilter);
    }
  }, [initialFilter]);

  const statuses = [
    "Tất cả", 
    "Chờ xác nhận", 
    "Đã xác nhận", 
    "Đã nhận phòng", 
    "Khách yêu cầu trả phòng", 
    "Đã trả phòng", 
    "Đã hủy"
  ];

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingApi.getAll();
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error("Error loading bookings:", err);
      if (onToast) onToast({ type: "error", message: "Không thể tải danh sách đặt phòng" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // 1. Confirm Booking (Chờ xác nhận -> Đã xác nhận)
  const handleConfirmBooking = async () => {
    if (!confirmModalBooking) return;
    const bookingId = confirmModalBooking.id || confirmModalBooking.bookingCode;
    try {
      setIsUpdating(true);
      const res = await bookingApi.confirmBooking(bookingId);
      if (res.success) {
        setBookings(prev => prev.map(b => (b.id === bookingId || b.bookingCode === bookingId) ? { ...b, status: "Đã xác nhận" } : b));
        setConfirmModalBooking(null);
        if (onToast) onToast({ type: "success", message: "Đã xác nhận đơn đặt phòng thành công." });
        fetchBookings();
      } else {
        if (onToast) onToast({ type: "error", message: res.message || "Lỗi khi xác nhận đơn" });
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: err.message || "Lỗi khi xác nhận đơn" });
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to determine if a booking belongs to a given status lifecycle tab
  const isBookingInStatus = (b, status) => {
    if (!b) return false;
    if (status === "Tất cả") return true;
    if (status === "Chờ xác nhận") {
      return b.status === "Chờ xác nhận";
    }
    if (status === "Đã xác nhận") {
      return (
        (b.status === "Đã xác nhận" || b.status === "Khách yêu cầu nhận phòng" || (b.status === "Đã thanh toán" && b.checkInStatus !== "Đã nhận phòng")) &&
        b.checkInStatus !== "Đã nhận phòng" &&
        b.status !== "Đã nhận phòng" &&
        b.status !== "Đã trả phòng" &&
        b.checkOutStatus !== "Đã trả phòng" &&
        b.status !== "Khách yêu cầu trả phòng" &&
        b.status !== "Đã hủy"
      );
    }
    if (status === "Đã nhận phòng") {
      return (
        (b.status === "Đã nhận phòng" || b.checkInStatus === "Đã nhận phòng") &&
        b.status !== "Đã trả phòng" &&
        b.checkOutStatus !== "Đã trả phòng" &&
        b.status !== "Khách yêu cầu trả phòng" &&
        b.status !== "Đã hủy"
      );
    }
    if (status === "Khách yêu cầu trả phòng") {
      return b.status === "Khách yêu cầu trả phòng";
    }
    if (status === "Đã trả phòng") {
      return b.status === "Đã trả phòng" || b.checkOutStatus === "Đã trả phòng";
    }
    if (status === "Đã hủy") {
      return b.status === "Đã hủy";
    }
    return b.status === status;
  };

  // 2. Check-in (Đã xác nhận -> Đã nhận phòng)
  const handleCheckInBooking = async () => {
    if (!checkInModalBooking) return;
    const bookingId = checkInModalBooking.id || checkInModalBooking.bookingCode;
    try {
      setIsUpdating(true);
      const res = await bookingApi.checkIn(bookingId, {
        staffName: currentUser?.name || "Lễ tân"
      });
      if (res.success) {
        setBookings(prev => prev.map(b => (b.id === bookingId || b.bookingCode === bookingId) ? { ...b, status: "Đã nhận phòng", checkInStatus: "Đã nhận phòng" } : b));
        setCheckInModalBooking(null);
        if (onToast) onToast({ type: "success", message: "Thực hiện thủ tục nhận phòng thành công!" });
        fetchBookings();
      } else {
        if (onToast) onToast({ type: "error", message: res.message || "Lỗi khi nhận phòng" });
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: err.message || "Lỗi khi làm thủ tục nhận phòng" });
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. Process Instant Payment by Receptionist
  const handleProcessPayment = async (bookingId) => {
    try {
      setIsUpdating(true);
      const res = await bookingApi.confirmPayment(bookingId, {
        staffName: currentUser?.name || "Lễ tân"
      });
      if (res.success) {
        setBookings(prev => prev.map(b => (b.id === bookingId || b.bookingCode === bookingId) ? { ...b, paymentStatus: "Đã thanh toán" } : b));
        if (checkOutModalBooking && (checkOutModalBooking.id === bookingId || checkOutModalBooking.bookingCode === bookingId)) {
          setCheckOutModalBooking(prev => ({ ...prev, paymentStatus: "Đã thanh toán" }));
        }
        if (checkInModalBooking && (checkInModalBooking.id === bookingId || checkInModalBooking.bookingCode === bookingId)) {
          setCheckInModalBooking(prev => ({ ...prev, paymentStatus: "Đã thanh toán" }));
        }
        if (selectedBooking && (selectedBooking.id === bookingId || selectedBooking.bookingCode === bookingId)) {
          setSelectedBooking(prev => ({ ...prev, paymentStatus: "Đã thanh toán" }));
        }
        if (onToast) onToast({ type: "success", message: "Đã thu tiền và cập nhật thanh toán thành công!" });
        fetchBookings();
      } else {
        if (onToast) onToast({ type: "error", message: res.message || "Lỗi cập nhật thanh toán" });
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: err.message || "Lỗi cập nhật thanh toán" });
    } finally {
      setIsUpdating(false);
    }
  };

  // 4. Check-out (Đã nhận phòng / Khách yêu cầu trả phòng -> Đã trả phòng)
  const handleCheckOutBooking = async (forcePayment = false) => {
    if (!checkOutModalBooking) return;
    const bookingId = checkOutModalBooking.id || checkOutModalBooking.bookingCode;
    
    try {
      setIsUpdating(true);
      const res = await bookingApi.checkOut(bookingId, {
        staffName: currentUser?.name || "Lễ tân",
        processPayment: forcePayment
      });
      if (res.success) {
        setBookings(prev => prev.map(b => (b.id === bookingId || b.bookingCode === bookingId) ? { ...b, status: "Đã trả phòng", checkOutStatus: "Đã trả phòng", paymentStatus: "Đã thanh toán" } : b));
        setCheckOutModalBooking(null);
        if (onToast) onToast({ type: "success", message: "Đã xác nhận trả phòng thành công. Phòng đã chuyển về trạng thái Cần dọn dẹp." });
        fetchBookings();
      } else {
        if (onToast) onToast({ type: "error", message: res.message || "Lỗi khi trả phòng" });
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi kết nối: " + err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter !== "Tất cả") {
        if (!isBookingInStatus(b, statusFilter)) return false;
      }
      
      if (searchTerm.trim() !== "") {
        const q = searchTerm.toLowerCase();
        const matchCode = b.bookingCode && b.bookingCode.toLowerCase().includes(q);
        const matchName = b.customerName && b.customerName.toLowerCase().includes(q);
        const matchPhone = b.phone && b.phone.includes(q);
        const matchEmail = b.email && b.email.toLowerCase().includes(q);
        const matchRoom = b.roomName && b.roomName.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPhone && !matchEmail && !matchRoom) return false;
      }
      return true;
    });
  }, [bookings, searchTerm, statusFilter]);

  // Statistics counts
  const stats = useMemo(() => {
    const total = bookings.length;
    const pendingConfirm = bookings.filter(b => isBookingInStatus(b, "Chờ xác nhận")).length;
    const confirmed = bookings.filter(b => isBookingInStatus(b, "Đã xác nhận")).length;
    const inUse = bookings.filter(b => isBookingInStatus(b, "Đã nhận phòng")).length;
    const reqCheckout = bookings.filter(b => isBookingInStatus(b, "Khách yêu cầu trả phòng")).length;
    const checkedOut = bookings.filter(b => isBookingInStatus(b, "Đã trả phòng")).length;
    return { total, pendingConfirm, confirmed, inUse, reqCheckout, checkedOut };
  }, [bookings]);

  const getStatusBadge = (b) => {
    const rawStatus = typeof b === "string" ? b : (b?.status || "");
    const status = rawStatus === "Khách yêu cầu nhận phòng" ? "Đã xác nhận" : rawStatus;
    let badgeClass = "badge-pending";
    if (status === "Đã xác nhận" || isBookingInStatus(b, "Đã xác nhận")) badgeClass = "badge-confirmed";
    else if (status === "Đã nhận phòng" || isBookingInStatus(b, "Đã nhận phòng")) badgeClass = "badge-checkin";
    else if (status === "Khách yêu cầu trả phòng") badgeClass = "badge-req-checkout";
    else if (status === "Đã trả phòng" || isBookingInStatus(b, "Đã trả phòng")) badgeClass = "badge-checkout";
    else if (status === "Đã hủy") badgeClass = "badge-cancelled";

    let displayStatus = status;
    if (isBookingInStatus(b, "Đã trả phòng")) displayStatus = "Đã trả phòng";
    else if (isBookingInStatus(b, "Đã nhận phòng")) displayStatus = "Đã nhận phòng";
    else if (isBookingInStatus(b, "Đã xác nhận")) displayStatus = "Đã xác nhận";
    if (displayStatus === "Khách yêu cầu nhận phòng") displayStatus = "Đã xác nhận";

    return (
      <span className={`booking-status-badge ${badgeClass}`}>
        {displayStatus === "Khách yêu cầu trả phòng" ? "🔔 Yêu cầu trả phòng" : displayStatus}
      </span>
    );
  };

  const getPaymentBadge = (b) => {
    const isPaid = b.paymentStatus === "Đã thanh toán";
    const isBank = b.paymentMethod === "bank_transfer";

    return (
      <div style={{ display: "inline-flex", flexDirection: "column", gap: "3px", alignItems: "flex-start" }}>
        <span style={{ fontSize: "11px", color: "var(--color-navy, #1e293b)", fontWeight: 600 }}>
          {isBank ? "💳 CK VietQR" : "🏨 Tại quầy"}
        </span>
        {isPaid ? (
          <span className="payment-status-badge payment-paid">✓ Đã thanh toán</span>
        ) : b.paymentStatus === "Chờ xác nhận chuyển khoản" ? (
          <span className="payment-status-badge payment-hotel">⏳ Chờ duyệt CK</span>
        ) : (
          <span className="payment-status-badge payment-unpaid">Chưa thanh toán</span>
        )}
      </div>
    );
  };

  return (
    <div className="staff-bookings-container">
      {/* 1. Page Header */}
      <div className="staff-page-header">
        <h1 className="staff-page-title font-serif">
          XỬ LÝ ĐƠN ĐẶT PHÒNG & THỦ TỤC CHECK-IN / OUT
        </h1>
        <p className="staff-page-subtitle">
          Lễ tân tiếp nhận yêu cầu đặt phòng, xác nhận đơn, thực hiện thủ tục nhận phòng và trả phòng.
        </p>
      </div>

      {/* 2. Search & Filter Bar Card */}
      <div className="staff-search-filter-card card-glass mb-4">
        <div className="search-box-row mb-3">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="🔍 Tìm theo mã đơn, họ tên khách, SĐT, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="staff-search-input"
            />
            {searchTerm && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>
          <button className="btn-staff-refresh" onClick={fetchBookings} title="Làm mới dữ liệu">
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            <span>Làm mới</span>
          </button>
        </div>

        <div className="filter-pill-row">
          <span className="filter-label-text">Trạng thái:</span>
          <div className="filter-pills-list">
            {statuses.map(st => (
              <button
                key={st}
                type="button"
                className={`staff-filter-pill ${statusFilter === st ? "active" : ""}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
                {st === "Tất cả" && ` (${stats.total})`}
                {st === "Chờ xác nhận" && ` (${stats.pendingConfirm})`}
                {st === "Đã xác nhận" && ` (${stats.confirmed})`}
                {st === "Đã nhận phòng" && ` (${stats.inUse})`}
                {st === "Khách yêu cầu trả phòng" && stats.reqCheckout > 0 && ` (${stats.reqCheckout})`}
                {st === "Đã trả phòng" && ` (${stats.checkedOut})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Table Card */}
      <div className="staff-table-card card-glass">
        <div className="table-responsive-wrapper">
          <table className="staff-luxury-table">
            <thead>
              <tr>
                <th style={{ width: "9%" }}>Mã đơn</th>
                <th style={{ width: "11%" }}>Khách hàng</th>
                <th style={{ width: "14%" }}>Email & SĐT</th>
                <th style={{ width: "15%" }}>Phòng đặt</th>
                <th style={{ width: "13%" }}>Lưu trú</th>
                <th style={{ width: "10%" }}>Tổng tiền</th>
                <th style={{ width: "11%" }}>Trạng thái</th>
                <th style={{ width: "9%" }}>Thanh toán</th>
                <th style={{ width: "8%", textAlign: "center" }}>Xử lý Lễ tân</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center p-5 text-muted">
                    <RefreshCw size={24} className="spin-icon text-gold mx-auto mb-2" />
                    <p>Đang tải danh sách đơn đặt phòng...</p>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center p-5 text-muted">
                    {statusFilter === "Đã xác nhận" ? (
                      <div className="empty-bookings-notice py-3">
                        <p className="font-size-md font-weight-600 mb-1 text-navy">Chưa có đơn đặt phòng nào ở trạng thái "Đã xác nhận"</p>
                        <p className="text-muted mb-3 font-size-sm">Vui lòng kiểm tra tab <strong>"Chờ xác nhận"</strong> để duyệt các đơn đặt phòng mới của khách hàng trước khi làm thủ tục nhận phòng.</p>
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setStatusFilter("Chờ xác nhận")}>
                          Chuyển sang tab "Chờ xác nhận" ({stats.pendingConfirm})
                        </button>
                      </div>
                    ) : statusFilter === "Đã nhận phòng" ? (
                      <div className="empty-bookings-notice py-3">
                        <p className="font-size-md font-weight-600 mb-1 text-navy">Hiện tại không có khách nào đang lưu trú ("Đã nhận phòng")</p>
                        <p className="text-muted mb-3 font-size-sm">Khi khách hàng đến khách sạn, hãy vào tab <strong>"Đã xác nhận"</strong> để bấm nút <strong>"Nhận phòng"</strong>.</p>
                        <button type="button" className="btn btn-outline-success btn-sm" onClick={() => setStatusFilter("Đã xác nhận")}>
                          Xem tab "Đã xác nhận" ({stats.confirmed})
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-size-md font-weight-600 mb-1">Không có đơn đặt phòng nào</p>
                        <small>
                          {statusFilter !== "Tất cả" ? `Không tìm thấy đơn nào có trạng thái "${statusFilter}".` : "Hệ thống chưa có dữ liệu đặt phòng."}
                        </small>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id || b.bookingCode}>
                    {/* 1. Mã đơn */}
                    <td>
                      <span className="booking-code-mono">
                        {b.bookingCode || b.id}
                      </span>
                    </td>

                    {/* 2. Khách hàng */}
                    <td>
                      <div className="customer-name-wrap font-weight-600 text-navy">
                        {b.customerName}
                      </div>
                    </td>

                    {/* 3. Email & SĐT */}
                    <td>
                      <div className="contact-col">
                        <div className="email-text text-muted">{b.email}</div>
                        <div className="phone-text text-navy">{b.phone}</div>
                      </div>
                    </td>

                    {/* 4. Phòng đặt */}
                    <td>
                      <div className="room-col">
                        <strong className="room-title-name text-navy">{b.roomName}</strong>
                        <small className="room-type-sub text-muted">{b.roomType} • {b.guests} khách</small>
                      </div>
                    </td>

                    {/* 5. Lưu trú */}
                    <td>
                      <div className="dates-col">
                        <span className="dates-range">{b.checkIn} → {b.checkOut}</span>
                        <small className="nights-sub text-muted">({b.nights} đêm)</small>
                      </div>
                    </td>

                    {/* 6. Tổng tiền */}
                    <td>
                      <strong className="total-price-val text-gold">
                        {formatCurrency(b.totalPrice)}
                      </strong>
                    </td>

                    {/* 7. Trạng thái */}
                    <td>
                      {getStatusBadge(b)}
                    </td>

                    {/* 8. Thanh toán */}
                    <td>
                      {getPaymentBadge(b)}
                    </td>

                    {/* 9. Xử lý Lễ tân */}
                    <td>
                      <div className="staff-actions-cell">
                        {/* Case 0: Chờ xác nhận -> Nút Xác nhận đơn */}
                        {isBookingInStatus(b, "Chờ xác nhận") && (
                          <button
                            type="button"
                            className="btn-staff-action btn-staff-confirm"
                            onClick={() => setConfirmModalBooking(b)}
                            title="Xác nhận duyệt đơn đặt phòng"
                          >
                            <Check size={14} />
                            <span>Xác nhận</span>
                          </button>
                        )}

                        {/* Case 1: Đã xác nhận (đã duyệt & chưa nhận phòng) -> Nút Nhận phòng màu xanh lá */}
                        {isBookingInStatus(b, "Đã xác nhận") && (
                          <button
                            type="button"
                            className="btn-staff-action btn-staff-checkin"
                            onClick={() => setCheckInModalBooking(b)}
                            title="Thực hiện thủ tục nhận phòng khi khách đến"
                          >
                            <Key size={14} />
                            <span>Nhận phòng</span>
                          </button>
                        )}

                        {/* Case 2: Đã nhận phòng (đang lưu trú) -> Nút Trả phòng màu vàng gold / navy */}
                        {isBookingInStatus(b, "Đã nhận phòng") && (
                          <button
                            type="button"
                            className="btn-staff-action btn-staff-checkout"
                            onClick={() => setCheckOutModalBooking(b)}
                            title="Thực hiện thủ tục trả phòng"
                          >
                            <LogOut size={14} />
                            <span>Trả phòng</span>
                          </button>
                        )}

                        {/* Case 3: Khách yêu cầu trả phòng -> Nút Trả phòng khẩn */}
                        {isBookingInStatus(b, "Khách yêu cầu trả phòng") && (
                          <button
                            type="button"
                            className="btn-staff-action btn-staff-req-checkout"
                            onClick={() => setCheckOutModalBooking(b)}
                            title="Khách gửi yêu cầu trả phòng. Click để xác nhận trả phòng."
                          >
                            <span className="pulse-dot"></span>
                            <span>Khách yêu cầu trả phòng</span>
                          </button>
                        )}

                        {/* Nút Thu tiền / Xác nhận thanh toán nếu chưa thanh toán */}
                        {b.paymentStatus !== "Đã thanh toán" && b.status !== "Đã hủy" && (
                          <button
                            type="button"
                            className="btn-staff-action"
                            style={{ background: "#fef3c7", color: "#b45309", borderColor: "#fde68a" }}
                            onClick={() => handleProcessPayment(b.id || b.bookingCode)}
                            title="Xác nhận đã nhận đủ tiền thanh toán"
                          >
                            <DollarSign size={13} />
                            <span>Thu tiền</span>
                          </button>
                        )}

                        {/* Case 4: Đã trả phòng -> Badge đã hoàn tất */}
                        {isBookingInStatus(b, "Đã trả phòng") && (
                          <span className="badge-checkout-done">
                            ✓ Đã hoàn tất
                          </span>
                        )}

                        {/* Always available: View Detail */}
                        <button
                          type="button"
                          className="btn-staff-view-icon"
                          onClick={() => setSelectedBooking(b)}
                          title="Xem chi tiết phiếu đặt phòng"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Xác nhận đơn đặt phòng (Chờ xác nhận -> Đã xác nhận) */}
      {confirmModalBooking && (
        <div className="modal-overlay" onClick={() => !isUpdating && setConfirmModalBooking(null)}>
          <div className="modal-content card-glass max-w-500 confirm-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex-align-center gap-2">
                <div className="confirm-bubble-icon">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="modal-title font-serif m-0">Xác Nhận Đơn Đặt Phòng</h3>
                  <small className="text-muted">Mã đơn: #{confirmModalBooking.bookingCode || confirmModalBooking.id}</small>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setConfirmModalBooking(null)}>✕</button>
            </div>

            <div className="modal-body pt-2 pb-2">
              <div className="confirm-details-box">
                <div className="c-info-row"><span className="c-label">Khách hàng:</span><strong className="c-value">{confirmModalBooking.customerName}</strong></div>
                <div className="c-info-row"><span className="c-label">Số điện thoại:</span><span className="c-value">{confirmModalBooking.phone}</span></div>
                <div className="c-info-row"><span className="c-label">Phòng:</span><strong className="c-value text-gold">{confirmModalBooking.roomName}</strong></div>
                <div className="c-info-row"><span className="c-label">Ngày nhận - trả:</span><span className="c-value">{confirmModalBooking.checkIn} → {confirmModalBooking.checkOut} ({confirmModalBooking.nights} đêm)</span></div>
                <div className="c-info-row border-top-dashed pt-2 mt-1"><span className="c-label font-weight-600">Tổng tiền:</span><strong className="c-value text-gold font-size-md">{formatCurrency(confirmModalBooking.totalPrice)}</strong></div>
              </div>
            </div>

            <div className="modal-footer pt-3 gap-2">
              <button type="button" className="btn btn-secondary flex-1" onClick={() => setConfirmModalBooking(null)} disabled={isUpdating}>Hủy</button>
              <button type="button" className="btn btn-success flex-1 btn-confirm-green" onClick={handleConfirmBooking} disabled={isUpdating}>
                {isUpdating ? "Đang xử lý..." : "Xác nhận đơn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Thủ tục Check-in (Đã xác nhận -> Đã nhận phòng) */}
      {checkInModalBooking && (
        <div className="modal-overlay" onClick={() => !isUpdating && setCheckInModalBooking(null)}>
          <div className="modal-content card-glass max-w-500 confirm-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex-align-center gap-2">
                <div className="confirm-bubble-icon bg-green-light text-green">
                  <Key size={22} />
                </div>
                <div>
                  <h3 className="modal-title font-serif m-0">Thủ Tục Nhận Phòng (Check-in)</h3>
                  <small className="text-muted">Bàn giao chìa khóa & kích hoạt phòng sử dụng</small>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setCheckInModalBooking(null)}>✕</button>
            </div>

            <div className="modal-body pt-2 pb-2">
              <div className="confirm-details-box">
                <div className="c-info-row"><span className="c-label">Mã đơn đặt:</span><strong className="c-value font-mono text-gold">{checkInModalBooking.bookingCode || checkInModalBooking.id}</strong></div>
                <div className="c-info-row"><span className="c-label">Khách nhận phòng:</span><strong className="c-value text-navy">{checkInModalBooking.customerName}</strong></div>
                <div className="c-info-row"><span className="c-label">Số điện thoại:</span><span className="c-value">{checkInModalBooking.phone}</span></div>
                <div className="c-info-row"><span className="c-label">Phòng bàn giao:</span><strong className="c-value text-gold">{checkInModalBooking.roomName}</strong></div>
                <div className="c-info-row"><span className="c-label">Thời gian lưu trú:</span><span className="c-value">{checkInModalBooking.checkIn} → {checkInModalBooking.checkOut} ({checkInModalBooking.nights} đêm)</span></div>
                <div className="c-info-row"><span className="c-label">Trạng thái thanh toán:</span><strong className={`c-value ${checkInModalBooking.paymentStatus === "Đã thanh toán" ? "text-green" : "text-orange"}`}>{checkInModalBooking.paymentStatus || "Chờ thanh toán"}</strong></div>
              </div>
            </div>

            <div className="modal-footer pt-3 gap-2">
              <button type="button" className="btn btn-secondary flex-1" onClick={() => setCheckInModalBooking(null)} disabled={isUpdating}>Hủy</button>
              <button type="button" className="btn btn-success flex-1 btn-confirm-green" onClick={handleCheckInBooking} disabled={isUpdating}>
                {isUpdating ? "Đang xử lý..." : "Xác nhận nhận phòng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: XÁC NHẬN TRẢ PHÒNG & KIỂM TRA THANH TOÁN */}
      {checkOutModalBooking && (
        <div className="modal-overlay" onClick={() => !isUpdating && setCheckOutModalBooking(null)}>
          <div className="modal-content card-glass max-w-550 confirm-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex-align-center gap-2">
                <div className="confirm-bubble-icon bg-orange-light text-orange">
                  <LogOut size={22} />
                </div>
                <div>
                  <h3 className="modal-title font-serif m-0">XÁC NHẬN TRẢ PHÒNG</h3>
                  <small className="text-muted">Kiểm tra thanh toán & hoàn tất thủ tục trả phòng</small>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setCheckOutModalBooking(null)}>✕</button>
            </div>

            <div className="modal-body pt-2 pb-2">
              {/* Payment Warning if unpaid */}
              {checkOutModalBooking.paymentStatus !== "Đã thanh toán" && (
                <div className="payment-alert-warning mb-3">
                  <AlertTriangle size={18} className="text-danger flex-shrink-0" />
                  <div className="alert-msg">
                    <strong>Đơn chưa hoàn tất thanh toán!</strong>
                    <p className="m-0 font-size-xs">Khách hàng cần thanh toán số tiền <strong>{formatCurrency(checkOutModalBooking.totalPrice)}</strong> trước khi trả phòng.</p>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-gold flex-shrink-0"
                    onClick={() => handleProcessPayment(checkOutModalBooking.id || checkOutModalBooking.bookingCode)}
                    disabled={isUpdating}
                  >
                    <DollarSign size={13} /> Thu tiền ngay
                  </button>
                </div>
              )}

              <div className="confirm-details-box">
                <div className="c-info-row">
                  <span className="c-label">Khách hàng:</span>
                  <strong className="c-value text-navy">{checkOutModalBooking.customerName}</strong>
                </div>
                <div className="c-info-row">
                  <span className="c-label">Phòng:</span>
                  <strong className="c-value text-gold">{checkOutModalBooking.roomName}</strong>
                </div>
                <div className="c-info-row">
                  <span className="c-label">Ngày nhận:</span>
                  <span className="c-value">{checkOutModalBooking.checkIn}</span>
                </div>
                <div className="c-info-row">
                  <span className="c-label">Ngày trả dự kiến:</span>
                  <span className="c-value">{checkOutModalBooking.checkOut}</span>
                </div>
                {checkOutModalBooking.checkoutRequestedDate && (
                  <div className="c-info-row">
                    <span className="c-label text-orange">Ngày khách yêu cầu trả:</span>
                    <strong className="c-value text-orange">{checkOutModalBooking.checkoutRequestedDate} (Trả phòng sớm)</strong>
                  </div>
                )}
                <div className="c-info-row border-top-dashed pt-2 mt-1">
                  <span className="c-label font-weight-600">Thanh toán:</span>
                  <strong className={`c-value ${checkOutModalBooking.paymentStatus === "Đã thanh toán" ? "text-green" : "text-danger"}`}>
                    {checkOutModalBooking.paymentStatus === "Đã thanh toán" ? "✓ Đã thanh toán" : "⚠️ Chưa thanh toán (" + formatCurrency(checkOutModalBooking.totalPrice) + ")"}
                  </strong>
                </div>
              </div>

              <p className="text-center text-muted font-size-sm mt-3 mb-1">
                {checkOutModalBooking.paymentStatus === "Đã thanh toán" 
                  ? "Bạn có chắc khách đã thanh toán đầy đủ và bàn giao phòng nguyên vẹn?" 
                  : "Vui lòng thu tiền hoặc chọn \"Thu tiền & Xác nhận trả phòng\" bên dưới."}
              </p>
            </div>

            <div className="modal-footer pt-3 gap-2">
              <button type="button" className="btn btn-secondary flex-1" onClick={() => setCheckOutModalBooking(null)} disabled={isUpdating}>
                Hủy
              </button>
              
              {checkOutModalBooking.paymentStatus === "Đã thanh toán" ? (
                <button 
                  type="button" 
                  className="btn btn-success flex-1 btn-confirm-green" 
                  onClick={() => handleCheckOutBooking(false)}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Đang xử lý..." : "Xác nhận trả phòng"}
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-gold flex-1 btn-glow" 
                  onClick={() => handleCheckOutBooking(true)}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Đang xử lý..." : "Thu tiền & Xác nhận trả phòng"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Chi tiết đơn đặt phòng */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content card-glass max-w-600" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi Tiết Đơn #{selectedBooking.bookingCode || selectedBooking.id}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedBooking(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="booking-modal-grid">
                <div className="modal-info-item"><span className="m-label">Khách hàng:</span><strong>{selectedBooking.customerName}</strong></div>
                <div className="modal-info-item"><span className="m-label">Số điện thoại:</span><strong>{selectedBooking.phone}</strong></div>
                <div className="modal-info-item"><span className="m-label">Email:</span><span>{selectedBooking.email}</span></div>
                <div className="modal-info-item"><span className="m-label">Phòng nghỉ:</span><strong className="text-gold">{selectedBooking.roomName}</strong></div>
                <div className="modal-info-item"><span className="m-label">Ngày nhận:</span><strong>{selectedBooking.checkIn}</strong></div>
                <div className="modal-info-item"><span className="m-label">Ngày trả:</span><strong>{selectedBooking.checkOut}</strong></div>
                <div className="modal-info-item"><span className="m-label">Số khách:</span><span>{selectedBooking.guests} người ({selectedBooking.nights} đêm)</span></div>
                <div className="modal-info-item"><span className="m-label">Tổng tiền:</span><strong className="text-gold font-size-md">{formatCurrency(selectedBooking.totalPrice)}</strong></div>
                <div className="modal-info-item"><span className="m-label">Trạng thái đơn:</span><span>{getStatusBadge(selectedBooking.status)}</span></div>
                <div className="modal-info-item"><span className="m-label">Thanh toán:</span><span>{getPaymentBadge(selectedBooking)}</span></div>
              </div>

              {selectedBooking.specialRequests && (
                <div className="modal-note-box mt-3">
                  <strong>Ghi chú / Yêu cầu từ khách:</strong>
                  <p>{selectedBooking.specialRequests}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedBooking(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

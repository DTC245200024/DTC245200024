import React, { useState, useEffect, useMemo } from "react";
import { 
  ClipboardList, Search, Filter, RefreshCw, Eye, CheckCircle2, 
  XCircle, Clock, Trash2, User, Phone, Mail, Calendar, DollarSign, Check,
  CreditCard, Wallet, ArrowRight, ShieldCheck, X, AlertCircle, Key, LogOut, AlertTriangle
} from "lucide-react";
import { formatCurrency, formatDate } from "../utils/formatters";
import { bookingApi } from "../services/api";

export default function AdminBookingsPage({ initialFilter = "Tất cả", onNavigateRevenue, onToast }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialFilter || "Tất cả");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingToConfirm, setBookingToConfirm] = useState(null);
  const [checkInModalBooking, setCheckInModalBooking] = useState(null);
  const [checkOutModalBooking, setCheckOutModalBooking] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Sync initialFilter prop if it updates
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
      console.error("Failed to load bookings:", err);
      if (onToast) onToast({ type: "error", message: "Không thể tải danh sách đặt phòng" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Lifecycle status matching function
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

  // Safe Lifecycle state transition from Admin modal
  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      setIsUpdating(true);
      let res;
      if (newStatus === "Đã xác nhận") {
        res = await bookingApi.confirmBooking(bookingId);
      } else if (newStatus === "Đã nhận phòng") {
        res = await bookingApi.checkIn(bookingId, { staffName: "Quản trị viên" });
      } else if (newStatus === "Đã trả phòng") {
        res = await bookingApi.checkOut(bookingId, { staffName: "Quản trị viên", processPayment: true });
      } else if (newStatus === "Đã hủy") {
        res = await bookingApi.cancelBooking(bookingId, { reason: "Admin cập nhật trạng thái hủy" });
      } else {
        res = await bookingApi.update(bookingId, { status: newStatus });
      }

      if (res && res.success) {
        if (selectedBooking && (selectedBooking.id === bookingId || selectedBooking.bookingCode === bookingId)) {
          setSelectedBooking(prev => ({ ...prev, status: newStatus }));
        }
        if (onToast) {
          onToast({ type: "success", message: `Đã cập nhật đơn ${bookingId} sang "${newStatus}"` });
        }
        fetchBookings();
      } else {
        if (onToast) onToast({ type: "error", message: res?.message || "Lỗi cập nhật trạng thái" });
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi cập nhật trạng thái: " + err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  // 1. Confirm Booking (Chờ xác nhận -> Đã xác nhận)
  const handleConfirmBooking = async () => {
    if (!bookingToConfirm) return;
    const bookingId = bookingToConfirm.id || bookingToConfirm.bookingCode;
    try {
      setIsConfirming(true);
      const res = await bookingApi.confirmBooking(bookingId);
      if (res.success) {
        setBookings(prev => prev.map(b => 
          (b.id === bookingId || b.bookingCode === bookingId) 
            ? { ...b, status: "Đã xác nhận", confirmedAt: new Date().toISOString() } 
            : b
        ));

        if (selectedBooking && (selectedBooking.id === bookingId || selectedBooking.bookingCode === bookingId)) {
          setSelectedBooking(prev => ({ ...prev, status: "Đã xác nhận" }));
        }

        setBookingToConfirm(null);

        if (onToast) {
          onToast({ type: "success", message: "Đã xác nhận đơn đặt phòng thành công." });
        }
        fetchBookings();
      } else {
        if (onToast) onToast({ type: "error", message: res.message || "Không thể xác nhận đơn đặt phòng" });
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi kết nối khi xác nhận: " + err.message });
    } finally {
      setIsConfirming(false);
    }
  };

  // 2. Check-in (Đã xác nhận -> Đã nhận phòng)
  const handleCheckInBooking = async () => {
    if (!checkInModalBooking) return;
    const bookingId = checkInModalBooking.id || checkInModalBooking.bookingCode;
    try {
      setIsUpdating(true);
      const res = await bookingApi.checkIn(bookingId, {
        staffName: "Quản trị viên"
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

  // 3. Check-out (Đã nhận phòng / Khách yêu cầu trả phòng -> Đã trả phòng)
  const handleCheckOutBooking = async (forcePayment = false) => {
    if (!checkOutModalBooking) return;
    const bookingId = checkOutModalBooking.id || checkOutModalBooking.bookingCode;
    
    try {
      setIsUpdating(true);
      const res = await bookingApi.checkOut(bookingId, {
        staffName: "Quản trị viên",
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

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đơn đặt phòng ${bookingId}?`)) {
      return;
    }

    try {
      const res = await bookingApi.delete(bookingId);
      if (res.success) {
        setBookings(prev => prev.filter(b => b.id !== bookingId && b.bookingCode !== bookingId));
        if (selectedBooking && (selectedBooking.id === bookingId || selectedBooking.bookingCode === bookingId)) {
          setSelectedBooking(null);
        }
        if (bookingToConfirm && (bookingToConfirm.id === bookingId || bookingToConfirm.bookingCode === bookingId)) {
          setBookingToConfirm(null);
        }
        if (onToast) onToast({ type: "success", message: "Đã xóa đơn đặt phòng thành công" });
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi khi xóa đơn: " + err.message });
    }
  };

  // Filter bookings using robust lifecycle matcher
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

  // Statistics
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter(b => isBookingInStatus(b, "Chờ xác nhận")).length;
    const confirmed = bookings.filter(b => isBookingInStatus(b, "Đã xác nhận")).length;
    const inUse = bookings.filter(b => isBookingInStatus(b, "Đã nhận phòng")).length;
    const reqCheckout = bookings.filter(b => isBookingInStatus(b, "Khách yêu cầu trả phòng")).length;
    const checkedOut = bookings.filter(b => isBookingInStatus(b, "Đã trả phòng")).length;
    const revenue = bookings
      .filter(b => b.status !== "Đã hủy")
      .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
    return { total, pending, confirmed, inUse, reqCheckout, checkedOut, revenue };
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

  const handleProcessPayment = async (bookingId) => {
    try {
      setIsUpdating(true);
      const res = await bookingApi.confirmPayment(bookingId, {
        staffName: "Quản trị viên"
      });
      if (res.success) {
        setBookings(prev => prev.map(b => (b.id === bookingId || b.bookingCode === bookingId) ? { ...b, paymentStatus: "Đã thanh toán" } : b));
        if (selectedBooking && (selectedBooking.id === bookingId || selectedBooking.bookingCode === bookingId)) {
          setSelectedBooking(prev => ({ ...prev, paymentStatus: "Đã thanh toán" }));
        }
        if (checkOutModalBooking && (checkOutModalBooking.id === bookingId || checkOutModalBooking.bookingCode === bookingId)) {
          setCheckOutModalBooking(prev => ({ ...prev, paymentStatus: "Đã thanh toán" }));
        }
        if (checkInModalBooking && (checkInModalBooking.id === bookingId || checkInModalBooking.bookingCode === bookingId)) {
          setCheckInModalBooking(prev => ({ ...prev, paymentStatus: "Đã thanh toán" }));
        }
        if (onToast) onToast({ type: "success", message: "Đã xác nhận thu tiền / thanh toán thành công!" });
        fetchBookings();
      } else {
        if (onToast) onToast({ type: "error", message: res.message || "Lỗi khi cập nhật thanh toán" });
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: err.message || "Lỗi khi cập nhật thanh toán" });
    } finally {
      setIsUpdating(false);
    }
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
    <div className="admin-bookings-layout">
      <div className="admin-bookings-container">
        
        {/* Page Header */}
        <div className="admin-bookings-header">
          <div className="header-subtitle">HỆ THỐNG QUẢN TRỊ</div>
          <h1 className="header-title">QUẢN LÝ ĐƠN ĐẶT PHÒNG</h1>
          <p className="header-desc">
            Theo dõi, duyệt đơn, làm thủ tục nhận phòng & trả phòng theo thời gian thực.
          </p>
        </div>

        {/* 4 Equal Interactive Metric Cards */}
        <div className="booking-stats-grid">
          {/* Card 1: Tổng Đơn Đặt */}
          <div 
            className={`booking-stat-card ${statusFilter === "Tất cả" ? "card-active" : ""}`}
            onClick={() => setStatusFilter("Tất cả")}
            title="Click để hiển thị tất cả đơn đặt phòng"
          >
            <div className="stat-card-icon icon-blue">
              <ClipboardList size={24} />
            </div>
            <div className="stat-card-body">
              <span className="stat-card-label">Tổng Đơn Đặt</span>
              <div className="stat-card-val text-navy">{stats.total}</div>
              <span className="stat-card-sub">Hiển thị tất cả</span>
            </div>
          </div>

          {/* Card 2: Chờ Xác Nhận */}
          <div 
            className={`booking-stat-card ${statusFilter === "Chờ xác nhận" ? "card-active" : ""}`}
            onClick={() => setStatusFilter("Chờ xác nhận")}
            title="Click để lọc đơn chờ xác nhận"
          >
            <div className="stat-card-icon icon-orange">
              <Clock size={24} />
            </div>
            <div className="stat-card-body">
              <span className="stat-card-label">Chờ Xác Nhận</span>
              <div className="stat-card-val text-orange">{stats.pending}</div>
              <span className="stat-card-sub">Cần duyệt sớm</span>
            </div>
          </div>

          {/* Card 3: Đã Xác Nhận */}
          <div 
            className={`booking-stat-card ${statusFilter === "Đã xác nhận" ? "card-active" : ""}`}
            onClick={() => setStatusFilter("Đã xác nhận")}
            title="Click để lọc đơn đã xác nhận"
          >
            <div className="stat-card-icon icon-green">
              <CheckCircle2 size={24} />
            </div>
            <div className="stat-card-body">
              <span className="stat-card-label">Đã Xác Nhận</span>
              <div className="stat-card-val text-green">{stats.confirmed}</div>
              <span className="stat-card-sub">Chờ nhận phòng</span>
            </div>
          </div>

          {/* Card 4: Doanh Thu Dự Kiến */}
          <div 
            className="booking-stat-card revenue-card-highlight"
            onClick={() => {
              if (onNavigateRevenue) {
                onNavigateRevenue();
              } else {
                setStatusFilter("Tất cả");
              }
            }}
            title="Click để xem báo cáo doanh thu chi tiết"
          >
            <div className="stat-card-icon icon-gold">
              <DollarSign size={24} />
            </div>
            <div className="stat-card-body">
              <span className="stat-card-label">Doanh Thu Dự Kiến</span>
              <div className="stat-card-val text-champagne">{formatCurrency(stats.revenue)}</div>
              <span className="stat-card-sub">Xem báo cáo →</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Control Panel */}
        <div className="booking-control-card">
          {/* Row 1: Search Box */}
          <div className="booking-search-wrapper">
            <Search size={18} className="search-input-icon" />
            <input
              type="text"
              placeholder="🔍 Tìm theo mã đơn, họ tên khách hàng, số điện thoại, email, tên phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="booking-search-field"
            />
            {searchTerm && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={() => setSearchTerm("")}
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Row 2: Status Filter Buttons & Refresh */}
          <div className="booking-filter-row">
            <div className="filter-group-left">
              <span className="filter-title-label">Trạng thái:</span>
              <div className="filter-buttons-wrap">
                {statuses.map(st => (
                  <button
                    key={st}
                    type="button"
                    className={`booking-pill-btn ${statusFilter === st ? "pill-active" : ""}`}
                    onClick={() => setStatusFilter(st)}
                  >
                    {st}
                    {st === "Tất cả" && ` (${stats.total})`}
                    {st === "Chờ xác nhận" && ` (${stats.pending})`}
                    {st === "Đã xác nhận" && ` (${stats.confirmed})`}
                    {st === "Đã nhận phòng" && ` (${stats.inUse})`}
                    {st === "Khách yêu cầu trả phòng" && stats.reqCheckout > 0 && ` (${stats.reqCheckout})`}
                    {st === "Đã trả phòng" && ` (${stats.checkedOut})`}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="button" 
              className="booking-refresh-btn" 
              onClick={fetchBookings} 
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Active Filter Notification Banner */}
        {statusFilter !== "Tất cả" && (
          <div className="booking-active-filter-alert">
            <div className="alert-content-left">
              <span className="alert-info-icon">ℹ</span>
              <span>Đang hiển thị các đơn có trạng thái: <strong>{statusFilter}</strong> ({filteredBookings.length} đơn)</span>
            </div>
            <button 
              type="button" 
              className="alert-clear-btn" 
              onClick={() => setStatusFilter("Tất cả")}
            >
              [ Xóa bộ lọc ]
            </button>
          </div>
        )}

        {/* Bookings Table Card */}
        <div className="booking-table-card">
          <div className="table-wrapper">
            <table className="grand-palace-table">
              <colgroup>
                <col style={{ width: "9%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "9%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Mã đặt phòng</th>
                  <th>Khách hàng</th>
                  <th>Email & SĐT</th>
                  <th>Phòng đặt</th>
                  <th>Ngày nhận - trả</th>
                  <th>Số khách</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                  <th className="text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="table-empty-row">
                      <RefreshCw size={26} className="spin-icon text-gold mx-auto mb-2" />
                      <p className="empty-text">Đang tải danh sách đặt phòng...</p>
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="table-empty-row">
                      <p className="empty-title">Không tìm thấy đơn đặt phòng nào</p>
                      <p className="empty-subtitle">
                        {statusFilter !== "Tất cả" 
                          ? `Không có đơn nào khớp với trạng thái "${statusFilter}".` 
                          : "Chưa có dữ liệu đơn đặt phòng trên hệ thống."}
                      </p>
                      {statusFilter !== "Tất cả" && (
                        <button 
                          type="button" 
                          className="btn-show-all-empty" 
                          onClick={() => setStatusFilter("Tất cả")}
                        >
                          Hiển thị tất cả đơn
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id || b.bookingCode}>
                      {/* 1. Mã đặt phòng */}
                      <td>
                        <div className="code-cell">
                          <span className="booking-code-badge font-mono">
                            {b.bookingCode || b.id}
                          </span>
                        </div>
                      </td>

                      {/* 2. Khách hàng */}
                      <td>
                        <div className="customer-cell">
                          <div className="customer-name font-weight-600 text-navy">
                            {b.customerName}
                          </div>
                        </div>
                      </td>

                      {/* 3. Email & SĐT */}
                      <td>
                        <div className="contact-cell">
                          <div className="email text-muted">{b.email}</div>
                          <div className="phone text-navy">{b.phone}</div>
                        </div>
                      </td>

                      {/* 4. Phòng đặt */}
                      <td>
                        <div className="room-cell">
                          <div className="room-name font-weight-600 text-navy">
                            {b.roomName}
                          </div>
                          <div className="room-type text-muted">
                            {b.roomType}
                          </div>
                        </div>
                      </td>

                      {/* 5. Ngày nhận - trả */}
                      <td>
                        <div className="date-cell">
                          <div className="date-range">{b.checkIn} → {b.checkOut}</div>
                          <small className="nights-count text-muted">{b.nights} đêm</small>
                        </div>
                      </td>

                      {/* 6. Số khách */}
                      <td>
                        <div className="guest-cell">
                          <span>{b.guests} khách</span>
                        </div>
                      </td>

                      {/* 7. Tổng tiền */}
                      <td>
                        <div className="price-cell">
                          <span className="price-val font-weight-600 text-gold">
                            {formatCurrency(b.totalPrice)}
                          </span>
                        </div>
                      </td>

                      {/* 8. Trạng thái */}
                      <td>
                        <div className="status-cell">
                          {getStatusBadge(b)}
                        </div>
                      </td>

                      {/* 9. Thanh toán */}
                      <td>
                        <div className="payment-cell">
                          {getPaymentBadge(b)}
                        </div>
                      </td>

                      {/* 10. Hành động */}
                      <td>
                        <div className="actions-cell" style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
                          {/* Case 1: Chờ xác nhận -> Nút Xác nhận đơn */}
                          {isBookingInStatus(b, "Chờ xác nhận") && (
                            <button
                              type="button"
                              className="btn-action-confirm"
                              title="Xác nhận đơn đặt phòng"
                              onClick={() => setBookingToConfirm(b)}
                            >
                              <Check size={13} className="confirm-icon-svg" />
                              <span>Xác nhận</span>
                            </button>
                          )}

                          {/* Case 2: Đã xác nhận -> Nút Nhận phòng */}
                          {isBookingInStatus(b, "Đã xác nhận") && (
                            <button
                              type="button"
                              className="btn-staff-action btn-staff-checkin"
                              onClick={() => setCheckInModalBooking(b)}
                              title="Thực hiện thủ tục nhận phòng (Check-in)"
                            >
                              <Key size={13} />
                              <span>Nhận phòng</span>
                            </button>
                          )}

                          {/* Case 3: Đã nhận phòng -> Nút Trả phòng */}
                          {isBookingInStatus(b, "Đã nhận phòng") && (
                            <button
                              type="button"
                              className="btn-staff-action btn-staff-checkout"
                              onClick={() => setCheckOutModalBooking(b)}
                              title="Thực hiện thủ tục trả phòng (Check-out)"
                            >
                              <LogOut size={13} />
                              <span>Trả phòng</span>
                            </button>
                          )}

                          {/* Case 4: Khách yêu cầu trả phòng -> Nút Duyệt trả phòng */}
                          {isBookingInStatus(b, "Khách yêu cầu trả phòng") && (
                            <button
                              type="button"
                              className="btn-staff-action btn-staff-req-checkout"
                              onClick={() => setCheckOutModalBooking(b)}
                              title="Khách gửi yêu cầu trả phòng. Click để xác nhận trả phòng."
                            >
                              <span className="pulse-dot"></span>
                              <span>Yêu cầu trả phòng</span>
                            </button>
                          )}

                          {/* Case 5: Đã trả phòng -> Badge đã xong */}
                          {isBookingInStatus(b, "Đã trả phòng") && (
                            <span className="badge-checkout-done" style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>
                              ✓ Hoàn tất
                            </span>
                          )}

                          {/* Thu tiền nếu chưa thanh toán */}
                          {b.paymentStatus !== "Đã thanh toán" && b.status !== "Đã hủy" && (
                            <button
                              type="button"
                              className="btn-staff-action"
                              style={{ background: "#fef3c7", color: "#b45309", borderColor: "#fde68a" }}
                              onClick={() => handleProcessPayment(b.id || b.bookingCode)}
                              title="Xác nhận thu tiền / thanh toán"
                            >
                              <DollarSign size={13} />
                              <span>Thu tiền</span>
                            </button>
                          )}

                          {/* Xem chi tiết */}
                          <button
                            type="button"
                            className="btn-action-view"
                            title="Xem chi tiết đơn"
                            onClick={() => setSelectedBooking(b)}
                          >
                            <Eye size={15} />
                          </button>

                          {/* Xóa đơn */}
                          <button
                            type="button"
                            className="btn-action-delete"
                            title="Xóa đơn"
                            onClick={() => handleDeleteBooking(b.id || b.bookingCode)}
                          >
                            <Trash2 size={15} />
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

        {/* Modal 1: Confirmation Dialog for "Chờ xác nhận" -> "Đã xác nhận" */}
        {bookingToConfirm && (
          <div className="modal-overlay" onClick={() => !isConfirming && setBookingToConfirm(null)}>
            <div className="modal-content card-glass max-w-500 confirm-dialog-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header border-bottom-0 pb-0">
                <div className="flex-align-center gap-2">
                  <div className="confirm-bubble-icon">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="modal-title font-serif m-0">Xác nhận đơn đặt phòng?</h3>
                    <small className="text-muted">Mã đơn: #{bookingToConfirm.bookingCode || bookingToConfirm.id}</small>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="modal-close-btn" 
                  onClick={() => !isConfirming && setBookingToConfirm(null)}
                  disabled={isConfirming}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body pt-3 pb-2">
                <p className="text-muted font-size-sm mb-3">
                  Vui lòng kiểm tra lại thông tin đơn đặt phòng trước khi xác nhận:
                </p>

                <div className="confirm-details-box">
                  <div className="c-info-row">
                    <span className="c-label">Mã đặt phòng:</span>
                    <strong className="c-value text-navy font-mono">
                      {bookingToConfirm.bookingCode || bookingToConfirm.id}
                    </strong>
                  </div>
                  <div className="c-info-row">
                    <span className="c-label">Tên khách hàng:</span>
                    <strong className="c-value text-navy">
                      {bookingToConfirm.customerName}
                    </strong>
                  </div>
                  <div className="c-info-row">
                    <span className="c-label">Phòng:</span>
                    <span className="c-value text-gold font-weight-600">
                      {bookingToConfirm.roomName}
                    </span>
                  </div>
                  <div className="c-info-row">
                    <span className="c-label">Ngày nhận - trả:</span>
                    <span className="c-value">
                      {bookingToConfirm.checkIn} → {bookingToConfirm.checkOut} ({bookingToConfirm.nights} đêm)
                    </span>
                  </div>
                  <div className="c-info-row pt-2 mt-1 border-top-dashed">
                    <span className="c-label font-weight-600 text-navy">Tổng tiền:</span>
                    <strong className="c-value text-gold font-size-md">
                      {formatCurrency(bookingToConfirm.totalPrice)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="modal-footer pt-3 gap-2">
                <button 
                  type="button" 
                  className="btn btn-secondary flex-1" 
                  onClick={() => setBookingToConfirm(null)}
                  disabled={isConfirming}
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  className="btn btn-success flex-1 btn-confirm-green" 
                  onClick={handleConfirmBooking}
                  disabled={isConfirming}
                >
                  {isConfirming ? (
                    <>
                      <RefreshCw size={15} className="spin-icon" />
                      <span>Đang xác nhận...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Xác nhận đặt phòng</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Check-in Modal (Đã xác nhận -> Đã nhận phòng) */}
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
                    <small className="text-muted">Bàn giao chìa khóa & chuyển phòng sang Đang sử dụng</small>
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

        {/* Modal 3: Check-out Modal (Đã nhận phòng / Khách yêu cầu trả phòng -> Đã trả phòng) */}
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
                      <strong className="c-value text-orange">{checkOutModalBooking.checkoutRequestedDate} (Trả phòng)</strong>
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

        {/* Modal 4: Full Booking Detail Modal */}
        {selectedBooking && (
          <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
            <div className="modal-content card-glass max-w-650" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title font-serif">Chi Tiết Đơn Đặt Phòng #{selectedBooking.bookingCode || selectedBooking.id}</h3>
                  <small className="text-muted">
                    Thời gian tạo: {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString("vi-VN") : "N/A"}
                  </small>
                </div>
                <button type="button" className="modal-close-btn" onClick={() => setSelectedBooking(null)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="booking-modal-grid">
                  <div className="modal-info-item">
                    <span className="m-label">Họ tên khách:</span>
                    <strong>{selectedBooking.customerName}</strong>
                  </div>
                  <div className="modal-info-item">
                    <span className="m-label">Số điện thoại:</span>
                    <strong>{selectedBooking.phone}</strong>
                  </div>
                  <div className="modal-info-item">
                    <span className="m-label">Email:</span>
                    <span>{selectedBooking.email}</span>
                  </div>
                  <div className="modal-info-item">
                    <span className="m-label">Phòng nghỉ:</span>
                    <strong className="text-gold">{selectedBooking.roomName}</strong>
                  </div>
                  <div className="modal-info-item">
                    <span className="m-label">Loại phòng:</span>
                    <span>{selectedBooking.roomType}</span>
                  </div>
                  <div className="modal-info-item">
                    <span className="m-label">Số lượng khách:</span>
                    <span>{selectedBooking.guests} người</span>
                  </div>
                  <div className="modal-info-item">
                    <span className="m-label">Ngày nhận (Check-in):</span>
                    <strong>{selectedBooking.checkIn}</strong>
                  </div>
                  <div className="modal-info-item">
                    <span className="m-label">Ngày trả (Check-out):</span>
                    <strong>{selectedBooking.checkOut}</strong>
                  </div>
                  <div className="modal-info-item">
                    <span className="m-label">Thời gian lưu trú:</span>
                    <span>{selectedBooking.nights} đêm</span>
                  </div>
                  <div className="modal-info-item">
                    <span className="m-label">Phương thức thanh toán:</span>
                    <span>
                      {selectedBooking.paymentMethod === "bank_transfer" ? "Chuyển khoản QR (VietQR)" : "Thanh toán tại quầy lễ tân (Tiền mặt)"}
                    </span>
                  </div>
                  <div className="modal-info-item">
                    <span className="m-label">Trạng thái thanh toán:</span>
                    <strong>{selectedBooking.paymentStatus || (selectedBooking.status === "Đã thanh toán" ? "Đã thanh toán" : "Chờ thanh toán")}</strong>
                  </div>
                  <div className="modal-info-item">
                    <span className="m-label">Tổng chi phí:</span>
                    <strong className="text-gold font-size-lg">{formatCurrency(selectedBooking.totalPrice)}</strong>
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div className="modal-note-box mt-3">
                    <strong>Ghi chú / Yêu cầu đặc biệt:</strong>
                    <p>{selectedBooking.specialRequests}</p>
                  </div>
                )}

                {/* Status Update Quick Action */}
                <div className="status-update-section mt-4">
                  <label className="m-label">Cập nhật nhanh trạng thái đơn:</label>
                  <div className="status-action-btns">
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedBooking.status === "Chờ xác nhận" ? "btn-warning active-btn" : "btn-outline-warning"}`}
                      onClick={() => handleStatusChange(selectedBooking.id || selectedBooking.bookingCode, "Chờ xác nhận")}
                      disabled={isUpdating}
                    >
                      Chờ xác nhận
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${(selectedBooking.status === "Đã xác nhận" || selectedBooking.status === "Khách yêu cầu nhận phòng") ? "btn-info active-btn" : "btn-outline-info"}`}
                      onClick={() => handleStatusChange(selectedBooking.id || selectedBooking.bookingCode, "Đã xác nhận")}
                      disabled={isUpdating}
                    >
                      Xác nhận
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedBooking.status === "Đã nhận phòng" ? "btn-success active-btn" : "btn-outline-success"}`}
                      onClick={() => handleStatusChange(selectedBooking.id || selectedBooking.bookingCode, "Đã nhận phòng")}
                      disabled={isUpdating}
                    >
                      Nhận phòng
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedBooking.status === "Đã trả phòng" ? "btn-secondary active-btn" : "btn-outline-secondary"}`}
                      onClick={() => handleStatusChange(selectedBooking.id || selectedBooking.bookingCode, "Đã trả phòng")}
                      disabled={isUpdating}
                    >
                      Trả phòng
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedBooking.status === "Đã hủy" ? "btn-danger active-btn" : "btn-outline-danger"}`}
                      onClick={() => handleStatusChange(selectedBooking.id || selectedBooking.bookingCode, "Đã hủy")}
                      disabled={isUpdating}
                    >
                      Hủy đơn
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedBooking(null)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

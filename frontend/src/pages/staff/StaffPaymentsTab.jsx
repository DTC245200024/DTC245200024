import React, { useState, useEffect, useMemo } from "react";
import { 
  CreditCard, Wallet, Search, Filter, RefreshCw, CheckCircle2, 
  Clock, DollarSign, AlertCircle, X, ChevronRight, Check
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { bookingApi } from "../../services/api";

export default function StaffPaymentsTab({ onToast }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("Tất cả");
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmModalBooking, setConfirmModalBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingApi.getAll();
      if (res.success) {
        setBookings(res.data.filter(b => b.status !== "Đã hủy"));
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Không thể tải danh sách thanh toán" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirmPayment = async (booking) => {
    const bookingKey = booking.id || booking.bookingCode;
    try {
      setUpdatingId(bookingKey);
      const res = await bookingApi.update(bookingKey, {
        paymentStatus: "Đã thanh toán",
        status: booking.status === "Chờ thanh toán" ? "Đã xác nhận" : booking.status
      });

      if (res.success) {
        setBookings(prev => prev.map(b => (b.id === bookingKey || b.bookingCode === bookingKey) ? { ...b, paymentStatus: "Đã thanh toán" } : b));
        setConfirmModalBooking(null);
        if (onToast) onToast({ type: "success", message: `Đã xác nhận thanh toán thành công cho đơn ${booking.bookingCode || booking.id}` });
      } else {
        if (onToast) onToast({ type: "error", message: res.message || "Lỗi khi xác nhận thanh toán" });
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi xác nhận: " + err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  // Quick statistics calculation
  const stats = useMemo(() => {
    let totalExpected = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let paidCount = 0;
    let pendingCount = 0;

    bookings.forEach(b => {
      const price = Number(b.totalPrice) || 0;
      totalExpected += price;
      const isPaid = b.paymentStatus === "Đã thanh toán" || b.status === "Đã thanh toán";
      if (isPaid) {
        totalPaid += price;
        paidCount++;
      } else {
        totalPending += price;
        pendingCount++;
      }
    });

    return { totalExpected, totalPaid, totalPending, paidCount, pendingCount };
  }, [bookings]);

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const isPaid = b.paymentStatus === "Đã thanh toán" || b.status === "Đã thanh toán";
      if (paymentFilter === "paid" && !isPaid) return false;
      if (paymentFilter === "pending" && isPaid) return false;

      if (searchTerm.trim() !== "") {
        const q = searchTerm.toLowerCase();
        const matchCode = b.bookingCode && b.bookingCode.toLowerCase().includes(q);
        const matchName = b.customerName && b.customerName.toLowerCase().includes(q);
        const matchPhone = b.phone && b.phone.includes(q);
        const matchRoom = b.roomName && b.roomName.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPhone && !matchRoom) return false;
      }
      return true;
    });
  }, [bookings, paymentFilter, searchTerm]);

  return (
    <div className="staff-payments-container">
      {/* 1. Header Area */}
      <div className="staff-payments-header-row">
        <div className="staff-payments-header-text">
          <h1 className="staff-payments-main-title">
            Quản Lý Thu Tiền & Xác Nhận Thanh Toán
          </h1>
          <p className="staff-payments-main-desc">
            Thu ngân & Lễ tân đối soát chuyển khoản ngân hàng (VietQR) hoặc thu tiền mặt khi khách làm thủ tục nhận/trả phòng.
          </p>
        </div>
        <button 
          type="button" 
          className="staff-payments-refresh-btn" 
          onClick={fetchBookings}
          disabled={loading}
          title="Tải lại dữ liệu thu chi"
        >
          <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 2. Overview Metrics Cards */}
      <div className="staff-payments-stats-grid">
        <div className="staff-payments-stat-card">
          <div className="staff-payments-stat-icon icon-navy">
            <Wallet size={24} />
          </div>
          <div className="staff-payments-stat-info">
            <span className="staff-payments-stat-label">Tổng tiền cần thu</span>
            <strong className="staff-payments-stat-value">{formatCurrency(stats.totalExpected)}</strong>
            <small className="staff-payments-stat-sub">{bookings.length} giao dịch đặt phòng</small>
          </div>
        </div>

        <div className="staff-payments-stat-card">
          <div className="staff-payments-stat-icon icon-warning">
            <Clock size={24} />
          </div>
          <div className="staff-payments-stat-info">
            <span className="staff-payments-stat-label">Chờ thu tiền</span>
            <strong className="staff-payments-stat-value text-warning">{formatCurrency(stats.totalPending)}</strong>
            <small className="staff-payments-stat-sub">{stats.pendingCount} đơn chưa thanh toán</small>
          </div>
        </div>

        <div className="staff-payments-stat-card">
          <div className="staff-payments-stat-icon icon-success">
            <CheckCircle2 size={24} />
          </div>
          <div className="staff-payments-stat-info">
            <span className="staff-payments-stat-label">Đã thu tiền</span>
            <strong className="staff-payments-stat-value text-success">{formatCurrency(stats.totalPaid)}</strong>
            <small className="staff-payments-stat-sub">{stats.paidCount} đơn đã thu đủ</small>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Card */}
      <div className="staff-payments-card">
        {/* Full-width Search Input */}
        <div className="staff-payments-search-row">
          <div className="staff-payments-search-wrapper">
            <Search size={20} className="staff-payments-search-icon" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, họ tên khách hàng, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="staff-payments-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="staff-payments-clear-search-btn"
                onClick={() => setSearchTerm("")}
                title="Xóa ô tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="staff-payments-filter-row">
          <div className="staff-payments-filter-left">
            <div className="staff-payments-filter-label-wrap">
              <Filter size={16} className="text-muted" />
              <span className="staff-payments-filter-label">Thanh toán:</span>
            </div>
            
            <div className="staff-payments-filter-pills">
              <button
                type="button"
                className={`staff-payment-pill pill-all ${paymentFilter === "Tất cả" ? "active" : ""}`}
                onClick={() => setPaymentFilter("Tất cả")}
              >
                <span>Tất cả</span>
                <span className="pill-count-tag">{bookings.length}</span>
              </button>

              <button
                type="button"
                className={`staff-payment-pill pill-pending ${paymentFilter === "pending" ? "active" : ""}`}
                onClick={() => setPaymentFilter("pending")}
              >
                <span>Chờ thu tiền</span>
                <span className="pill-count-tag">{stats.pendingCount}</span>
              </button>

              <button
                type="button"
                className={`staff-payment-pill pill-paid ${paymentFilter === "paid" ? "active" : ""}`}
                onClick={() => setPaymentFilter("paid")}
              >
                <span>Đã thu tiền</span>
                <span className="pill-count-tag">{stats.paidCount}</span>
              </button>
            </div>
          </div>

          <div className="staff-payments-filter-result-count">
            Hiển thị <strong>{filtered.length}</strong> / {bookings.length} đơn
          </div>
        </div>
      </div>

      {/* 4. Payments Table */}
      <div className="staff-payments-table-card">
        <div className="staff-payments-table-wrapper">
          <table className="staff-payments-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Phòng Đặt</th>
                <th>Hình Thức</th>
                <th>Tổng Tiền Cần Thu</th>
                <th>Trạng Thái Thanh Toán</th>
                <th className="text-right">Xác Nhận Thu Tiền</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center p-5 text-muted">
                    <RefreshCw size={22} className="spin-icon mx-auto mb-2 text-gold" />
                    <div>Đang tải dữ liệu thu chi & thanh toán...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-5 text-muted">
                    <AlertCircle size={28} className="mx-auto mb-2 text-muted" />
                    <div>Không tìm thấy giao dịch thanh toán nào phù hợp với bộ lọc.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const isPaid = b.paymentStatus === "Đã thanh toán" || b.status === "Đã thanh toán";
                  const bookingKey = b.id || b.bookingCode;
                  return (
                    <tr key={bookingKey}>
                      <td>
                        <strong className="staff-payments-code-badge">
                          {b.bookingCode || b.id}
                        </strong>
                      </td>
                      <td>
                        <div className="staff-payments-customer-cell">
                          <strong>{b.customerName}</strong>
                          <small>{b.phone}</small>
                        </div>
                      </td>
                      <td>
                        <div className="staff-payments-room-name">{b.roomName}</div>
                      </td>
                      <td>
                        <span className="staff-payments-method-tag">
                          {b.paymentMethod === "bank_transfer" ? (
                            <>
                              <CreditCard size={14} className="text-info" />
                              <span>VietQR Ngân hàng</span>
                            </>
                          ) : (
                            <>
                              <Wallet size={14} className="text-gold" />
                              <span>Tiền mặt tại KS</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td>
                        <strong className="staff-payments-price-cell">
                          {formatCurrency(b.totalPrice)}
                        </strong>
                      </td>
                      <td>
                        {isPaid ? (
                          <span className="badge-status-paid">
                            <CheckCircle2 size={14} /> Đã thanh toán
                          </span>
                        ) : (
                          <span className="badge-status-pending">
                            <Clock size={14} /> Chờ thu tiền
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        {isPaid ? (
                          <span className="text-paid-confirmed">
                            <CheckCircle2 size={16} /> Đã thu đủ
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn-confirm-payment-action"
                            disabled={updatingId === bookingKey}
                            onClick={() => setConfirmModalBooking(b)}
                          >
                            <Check size={14} />
                            <span>Xác nhận đã thu</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Payment Confirmation Modal */}
      {confirmModalBooking && (
        <div 
          className="payment-confirm-modal-overlay" 
          onClick={() => setConfirmModalBooking(null)}
        >
          <div 
            className="payment-confirm-modal-box" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="payment-confirm-modal-header">
              <h3>Xác Nhận Thu Tiền Khách Hàng</h3>
              <button 
                type="button" 
                className="payment-confirm-modal-close" 
                onClick={() => setConfirmModalBooking(null)}
              >
                ✕
              </button>
            </div>

            <div className="payment-confirm-modal-body">
              <p className="text-muted mb-3 font-size-sm">
                Vui lòng kiểm tra kỹ thông tin đơn đặt phòng và xác nhận đã thu đủ số tiền từ khách hàng:
              </p>

              <div className="payment-confirm-booking-card">
                <div className="payment-confirm-item">
                  <span>Mã đơn đặt phòng:</span>
                  <strong className="font-mono text-gold">{confirmModalBooking.bookingCode || confirmModalBooking.id}</strong>
                </div>
                <div className="payment-confirm-item">
                  <span>Khách hàng:</span>
                  <strong>{confirmModalBooking.customerName}</strong>
                </div>
                <div className="payment-confirm-item">
                  <span>Số điện thoại:</span>
                  <strong>{confirmModalBooking.phone}</strong>
                </div>
                <div className="payment-confirm-item">
                  <span>Phòng đặt:</span>
                  <strong>{confirmModalBooking.roomName}</strong>
                </div>
                <div className="payment-confirm-item">
                  <span>Hình thức thanh toán:</span>
                  <strong>{confirmModalBooking.paymentMethod === "bank_transfer" ? "Chuyển khoản VietQR" : "Tiền mặt tại khách sạn"}</strong>
                </div>
                <div className="payment-confirm-item pt-2 border-top mt-2">
                  <span className="font-weight-600">Tổng tiền cần thu:</span>
                  <strong className="text-gold font-size-lg">{formatCurrency(confirmModalBooking.totalPrice)}</strong>
                </div>
              </div>

              <div className="font-size-xs text-muted flex-align-center gap-1">
                <AlertCircle size={14} className="text-info flex-shrink-0" />
                <span>Sau khi xác nhận, đơn đặt phòng sẽ được đánh dấu "Đã thanh toán" và lưu vào hồ sơ lưu trú.</span>
              </div>
            </div>

            <div className="payment-confirm-modal-footer">
              <button 
                type="button" 
                className="btn-modal-cancel" 
                onClick={() => setConfirmModalBooking(null)}
                disabled={updatingId !== null}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="btn-modal-confirm-pay" 
                onClick={() => handleConfirmPayment(confirmModalBooking)}
                disabled={updatingId !== null}
              >
                {updatingId ? (
                  <>
                    <RefreshCw size={15} className="spin-icon" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Xác nhận thu đủ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

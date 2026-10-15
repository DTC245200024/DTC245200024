import React, { useState, useEffect, useMemo } from "react";
import { 
  ClipboardList, Calendar, Users, DollarSign, Eye, Search, 
  RefreshCw, CheckCircle2, Clock, ArrowRight, ShieldCheck, Copy, 
  CreditCard, Building, QrCode, Check, LogOut, Key, AlertCircle, AlertTriangle, XCircle
} from "lucide-react";
import { formatCurrency, formatDate, getStatusBadge, getTodayDateString } from "../utils/formatters";
import { bookingApi } from "../services/api";

export default function MyBookingsPage({ currentUser, setActiveTab, onToast, hotelSettings }) {
  const hotelName = hotelSettings?.hotelName || "HOTEL 5 SAO";
  const bankName = hotelSettings?.bankName || "MB Bank (Ngân hàng Quân Đội)";
  const bankAccount = hotelSettings?.bankAccount || "0964880630";
  const bankAccountName = hotelSettings?.bankAccountName || hotelName.toUpperCase();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Modal state for Check-out requests
  const [checkoutRequestBooking, setCheckoutRequestBooking] = useState(null);
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  // Cancellation Modal State
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Payment Modal State for Unpaid Bookings
  const [payingBooking, setPayingBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyBankSuccess, setCopyBankSuccess] = useState(false);
  const [copyContentSuccess, setCopyContentSuccess] = useState(false);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingApi.getAll();
      if (res.success) {
        const myData = res.data
          .map(b => (
            b.status === "Khách yêu cầu nhận phòng"
              ? { ...b, status: "Đã xác nhận", checkInStatus: "Chưa nhận phòng" }
              : b
          ))
          .filter(b => {
          if (!currentUser) return false;
          const matchUserId = b.userId && currentUser.id && b.userId === currentUser.id;
          const matchEmail = b.email && currentUser.email && b.email.toLowerCase() === currentUser.email.toLowerCase();
          const matchPhone = b.phone && currentUser.phone && b.phone === currentUser.phone;
          const matchName = b.customerName && currentUser.name && b.customerName.toLowerCase() === currentUser.name.toLowerCase();
          return matchUserId || matchEmail || matchPhone || matchName;
        });
        setBookings(myData);
      }
    } catch (err) {
      console.error("Error fetching my bookings:", err);
      if (onToast) onToast({ type: "error", message: "Không thể tải danh sách đơn đặt phòng" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchMyBookings();
    }
  }, [currentUser]);

  // Customer Send Check-out Request
  const handleSendCheckoutRequest = async () => {
    if (!checkoutRequestBooking) return;
    const bookingId = checkoutRequestBooking.id || checkoutRequestBooking.bookingCode;
    const today = getTodayDateString();

    try {
      setIsSubmittingReq(true);
      const res = await bookingApi.requestCheckout(bookingId, {
        requestedDate: today,
        reason: "Khách hàng yêu cầu trả phòng từ tài khoản cá nhân"
      });

      if (res.success) {
        setBookings(prev => prev.map(b => (b.id === bookingId || b.bookingCode === bookingId) 
          ? { ...b, status: "Khách yêu cầu trả phòng", checkOutStatus: "Chờ lễ tân xác nhận", checkoutRequestedDate: today } 
          : b
        ));
        setCheckoutRequestBooking(null);
        if (onToast) onToast({ 
          type: "success", 
          message: "Đã gửi yêu cầu trả phòng. Vui lòng chờ Lễ tân xác nhận." 
        });
      } else {
        if (onToast) onToast({ type: "error", message: res.message || "Lỗi khi gửi yêu cầu" });
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi kết nối: " + err.message });
    } finally {
      setIsSubmittingReq(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    const bookingId = cancelModalBooking.id || cancelModalBooking.bookingCode;

    try {
      setIsCancelling(true);
      const res = await bookingApi.cancelBooking(bookingId, {
        userId: currentUser?.id,
        reason: "Khách hàng xác nhận hủy đơn trên website"
      });

      if (res.success) {
        setBookings(prev => prev.map(b => 
          (b.id === bookingId || b.bookingCode === bookingId)
            ? { ...b, status: "Đã hủy" }
            : b
        ));
        if (selectedBooking && (selectedBooking.id === bookingId || selectedBooking.bookingCode === bookingId)) {
          setSelectedBooking(prev => prev ? { ...prev, status: "Đã hủy" } : null);
        }
        setCancelModalBooking(null);
        if (onToast) {
          onToast({ type: "success", message: "Đã hủy đơn đặt phòng thành công." });
        }
      } else {
        if (onToast) {
          onToast({ type: "error", message: res.message || "Không thể hủy đơn đặt phòng." });
        }
        setCancelModalBooking(null);
        fetchMyBookings();
      }
    } catch (err) {
      console.error("Cancel booking error:", err);
      if (onToast) {
        onToast({ type: "error", message: err.message || "Lỗi khi hủy đơn đặt phòng." });
      } else {
        alert(err.message || "Lỗi khi hủy đơn đặt phòng.");
      }
      setCancelModalBooking(null);
      fetchMyBookings();
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmModalPayment = async () => {
    if (!payingBooking) return;

    try {
      setIsProcessingPayment(true);
      const newPaymentStatus = "Đã thanh toán";
      
      const res = await bookingApi.update(payingBooking.id, {
        paymentMethod: paymentMethod,
        paymentStatus: newPaymentStatus
      });

      if (res.success) {
        setBookings(prev => prev.map(b => b.id === payingBooking.id ? { ...b, paymentStatus: newPaymentStatus, paymentMethod } : b));
        setPayingBooking(null);
        if (onToast) onToast({ type: "success", message: "Xác nhận thanh toán thành công!" });
      }
    } catch (err) {
      alert("Lỗi khi xác nhận thanh toán: " + err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "voucher") {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } else if (type === "bank") {
      setCopyBankSuccess(true);
      setTimeout(() => setCopyBankSuccess(false), 2500);
    } else if (type === "content") {
      setCopyContentSuccess(true);
      setTimeout(() => setCopyContentSuccess(false), 2500);
    }
  };

  const today = getTodayDateString();

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      if (searchTerm.trim() === "") return true;
      const q = searchTerm.toLowerCase();
      return (
        (b.bookingCode && b.bookingCode.toLowerCase().includes(q)) ||
        (b.roomName && b.roomName.toLowerCase().includes(q))
      );
    });
  }, [bookings, searchTerm]);

  return (
    <div className="my-bookings-page">
      <div className="page-hero-banner">
        <div className="container text-center">
          <div className="section-subtitle text-gold">LỊCH SỬ LƯU TRÚ</div>
          <h1 className="page-hero-title">Đơn Đặt Phòng Của Tôi</h1>
          <p className="page-hero-desc">
            Quản lý các phòng bạn đã đặt, theo dõi trạng thái nhận phòng & trả phòng theo thời gian thực.
          </p>
        </div>
      </div>

      <div className="container page-main-content">
        {/* User Summary Bar */}
        <div className="my-user-bar card-glass mb-4">
          <div className="user-bar-left">
            <div className="user-avatar-circle">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h3>{currentUser?.name || "Khách hàng"}</h3>
              <p className="text-muted">{currentUser?.email} • SĐT: {currentUser?.phone}</p>
            </div>
          </div>
          <div className="user-bar-right">
            <button className="btn btn-gold btn-sm" onClick={() => setActiveTab("rooms")}>
              <Calendar size={15} />
              <span>Đặt thêm phòng mới</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="filter-card card-glass mb-4">
          <div className="my-bookings-filter">
            <div className="input-with-icon flex-grow">
              <Search size={16} className="input-icon" />
              <input
                type="text"
                placeholder="Tìm theo Mã đặt phòng hoặc Tên phòng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-control"
              />
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchMyBookings}>
              <RefreshCw size={14} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="card-glass p-5 text-center">
            <p>Đang tải danh sách đơn đặt phòng của bạn...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="no-results-card card-glass text-center p-5">
            <ClipboardList size={48} className="text-muted mb-3 mx-auto" />
            <h3>Chưa có đơn đặt phòng nào</h3>
            <p className="text-muted">
              Quý khách chưa có đơn đặt phòng nào trên hệ thống hoặc không có đơn nào phù hợp từ khóa tìm kiếm.
            </p>
            <button className="btn btn-gold mt-3" onClick={() => setActiveTab("rooms")}>
              <span>Khám phá danh sách phòng ngay</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="my-bookings-grid">
            {filtered.map((b) => {
              const statusBadge = getStatusBadge(b.status);

              // Precise Check-in state evaluation
              const isCheckedIn = b.checkInStatus === "Đã nhận phòng" || b.status === "Đã nhận phòng" || b.status === "Khách yêu cầu trả phòng" || b.status === "Đã trả phòng";
              
              // Precise Check-out state evaluation
              const isCheckedOut = b.checkOutStatus === "Đã trả phòng" || b.status === "Đã trả phòng";
              const isCheckOutPending = b.checkOutStatus === "Chờ lễ tân xác nhận" || b.status === "Khách yêu cầu trả phòng";

              return (
                <div key={b.id || b.bookingCode} className="my-booking-card card-glass">
                  {/* Card Top: Code & Status */}
                  <div className="booking-card-top">
                    <div className="code-and-date">
                      <span className="code-badge font-mono">{b.bookingCode || b.id}</span>
                      <small className="text-muted">Ngày đặt: {formatDate(b.createdAt)}</small>
                    </div>
                    <span className={`badge ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Card Mid: Room info & Dates table */}
                  <div className="booking-card-mid">
                    <h3 className="room-title-text uppercase text-navy">{b.roomName}</h3>
                    <div className="room-type-sub text-gold">{b.roomType} • {b.guests} khách</div>

                    {/* Check-in / Check-out 2-Column Schedule Box */}
                    <div className="stay-schedule-container my-3">
                      <div className="schedule-box checkin-box">
                        <div className="schedule-header">NHẬN PHÒNG</div>
                        <div className="schedule-date">{b.checkIn}</div>
                        <div className="schedule-time">14:00</div>
                      </div>
                      <div className="schedule-box checkout-box">
                        <div className="schedule-header">TRẢ PHÒNG</div>
                        <div className="schedule-date">{b.checkOut}</div>
                        <div className="schedule-time">12:00</div>
                      </div>
                    </div>

                    {/* Dual Check-in & Check-out Status Badges */}
                    <div className="dual-status-section">
                      <div className="status-indicator-item">
                        <span className="indicator-label">Trạng thái nhận phòng:</span>
                        {isCheckedIn ? (
                          <span className="indicator-badge badge-status-done">Đã nhận phòng ✓</span>
                        ) : (
                          <span className="indicator-badge badge-status-notyet">Chưa nhận phòng</span>
                        )}
                      </div>

                      <div className="status-indicator-item">
                        <span className="indicator-label">Trạng thái trả phòng:</span>
                        {isCheckedOut ? (
                          <span className="indicator-badge badge-status-done">Đã trả phòng ✓</span>
                        ) : isCheckOutPending ? (
                          <span className="indicator-badge badge-status-pending">Chờ lễ tân xác nhận</span>
                        ) : (
                          <span className="indicator-badge badge-status-notyet">Chưa trả phòng</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Price & Smart Action Buttons */}
                  <div className="booking-card-bottom mt-3 pt-3">
                    <div className="price-tag-col">
                      <span className="price-sub">Tổng chi phí:</span>
                      <strong className="price-val text-gold">{formatCurrency(b.totalPrice)}</strong>
                    </div>

                    <div className="action-btns-row">

                      {/* Button 2: Request Check-out (ONLY available when customer HAS ALREADY checked in) */}
                      {isCheckedIn && !isCheckedOut && !isCheckOutPending && (
                        <button
                          type="button"
                          className="btn btn-warning btn-sm btn-action-orange"
                          onClick={() => setCheckoutRequestBooking(b)}
                          title="Gửi yêu cầu trả phòng đến Lễ tân"
                        >
                          <LogOut size={14} />
                          <span>Yêu cầu trả phòng</span>
                        </button>
                      )}

                      {/* Button 3: Payment button if unpaid */}
                      {b.paymentStatus !== "Đã thanh toán" && b.status !== "Đã hủy" && b.status !== "Đã trả phòng" && (
                        <button
                          type="button"
                          className="btn btn-gold btn-sm"
                          onClick={() => setPayingBooking(b)}
                        >
                          <CreditCard size={14} /> Thanh toán
                        </button>
                      )}

                      {/* Button 4: View Voucher */}
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setSelectedBooking(b)}
                      >
                        <Eye size={14} /> Phiếu phòng
                      </button>
                      
                      {/* Button 5: Cancel if pending receptionist confirmation */}
                      {b.status === "Chờ xác nhận" && (
                        <button
                          type="button"
                          className="btn-cancel-light-red"
                          onClick={() => setCancelModalBooking(b)}
                          title="Hủy đơn đặt phòng này"
                        >
                          <XCircle size={14} />
                          <span>Hủy đặt phòng</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: Customer Request Check-out Confirmation */}
        {checkoutRequestBooking && (
          <div className="modal-overlay" onClick={() => !isSubmittingReq && setCheckoutRequestBooking(null)}>
            <div className="modal-content card-glass max-w-500 confirm-dialog-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="flex-align-center gap-2">
                  <div className="confirm-bubble-icon bg-orange-light text-orange">
                    <LogOut size={22} />
                  </div>
                  <div>
                    <h3 className="modal-title font-serif m-0">Yêu Cầu Trả Phòng</h3>
                    <small className="text-muted">Đơn #{checkoutRequestBooking.bookingCode || checkoutRequestBooking.id}</small>
                  </div>
                </div>
                <button type="button" className="modal-close-btn" onClick={() => setCheckoutRequestBooking(null)}>✕</button>
              </div>

              <div className="modal-body pt-2 pb-2">
                <p className="text-muted font-size-sm mb-3">
                  Bạn có chắc muốn gửi yêu cầu trả phòng cho phòng này?
                </p>

                <div className="confirm-details-box">
                  <div className="c-info-row">
                    <span className="c-label">Phòng:</span>
                    <strong className="c-value text-gold">{checkoutRequestBooking.roomName}</strong>
                  </div>
                  <div className="c-info-row">
                    <span className="c-label">Ngày nhận phòng:</span>
                    <span className="c-value">{checkoutRequestBooking.checkIn}</span>
                  </div>
                  <div className="c-info-row">
                    <span className="c-label">Ngày trả dự kiến:</span>
                    <span className="c-value">{checkoutRequestBooking.checkOut} - 12:00</span>
                  </div>
                  <div className="c-info-row border-top-dashed pt-2 mt-1">
                    <span className="c-label text-orange font-weight-600">Trạng thái sau khi gửi:</span>
                    <strong className="c-value text-orange">Chờ lễ tân xác nhận</strong>
                  </div>
                </div>

                <div className="info-sub-box mt-3 p-2 bg-light-soft rounded font-size-xs text-muted">
                  ℹ Lễ tân sẽ tiến hành kiểm tra tình trạng phòng và hoàn tất thủ tục trả phòng cho quý khách.
                </div>
              </div>

              <div className="modal-footer pt-3 gap-2">
                <button 
                  type="button" 
                  className="btn btn-secondary flex-1" 
                  onClick={() => setCheckoutRequestBooking(null)}
                  disabled={isSubmittingReq}
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  className="btn btn-warning flex-1 btn-warning-glow" 
                  onClick={handleSendCheckoutRequest}
                  disabled={isSubmittingReq}
                >
                  {isSubmittingReq ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Phiếu Xác Nhận Đặt Phòng */}
        {selectedBooking && (
          <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
            <div className="modal-content card-glass" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Phiếu Xác Nhận Đặt Phòng #{selectedBooking.bookingCode}</h3>
                <button className="modal-close-btn" onClick={() => setSelectedBooking(null)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="voucher-code-box">
                  <span className="code-label">MÃ ĐƠN:</span>
                  <span className="code-val font-mono">{selectedBooking.bookingCode}</span>
                  <button className="btn btn-sm btn-outline-gold" onClick={() => handleCopy(selectedBooking.bookingCode, "voucher")}>
                    <Copy size={14} />
                    <span>{copySuccess ? "Đã chép!" : "Sao chép"}</span>
                  </button>
                </div>

                <div className="booking-modal-grid">
                  <div className="modal-info-item">
                    <span className="m-label">Khách hàng:</span>
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
                    <span className="m-label">Ngày nhận (Check-in):</span>
                    <strong>{selectedBooking.checkIn} (từ 14:00)</strong>
                  </div>
                  <div className="modal-info-item">
                    <span className="m-label">Ngày trả (Check-out):</span>
                    <strong>{selectedBooking.checkOut} (trước 12:00)</strong>
                  </div>
                  <div className="modal-info-item">
                    <span className="m-label">Số khách:</span>
                    <span>{selectedBooking.guests} người ({selectedBooking.nights} đêm)</span>
                  </div>
                  <div className="modal-info-item">
                    <span className="m-label">Trạng thái nhận phòng:</span>
                    <strong>{selectedBooking.checkInStatus || (selectedBooking.status === "Đã nhận phòng" ? "Đã nhận phòng" : "Chưa nhận phòng")}</strong>
                  </div>
                  <div className="modal-info-item">
                    <span className="m-label">Trạng thái trả phòng:</span>
                    <strong>{selectedBooking.checkOutStatus || (selectedBooking.status === "Đã trả phòng" ? "Đã trả phòng" : "Chưa trả phòng")}</strong>
                  </div>
                  <div className="modal-info-item" style={{ gridColumn: "span 2" }}>
                    <span className="m-label">Tổng thanh toán:</span>
                    <strong className="text-gold font-size-lg">{formatCurrency(selectedBooking.totalPrice)}</strong>
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div className="modal-note-box mt-3">
                    <strong>Ghi chú / Yêu cầu:</strong>
                    <p>{selectedBooking.specialRequests}</p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {selectedBooking.status === "Chờ xác nhận" && (
                  <button
                    type="button"
                    className="btn-cancel-light-red"
                    style={{ marginRight: "auto" }}
                    onClick={() => {
                      const target = selectedBooking;
                      setSelectedBooking(null);
                      setCancelModalBooking(target);
                    }}
                  >
                    <XCircle size={14} />
                    <span>Hủy đặt phòng</span>
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => setSelectedBooking(null)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Thanh toán trực tiếp từ My Bookings */}
        {payingBooking && (
          <div className="modal-overlay" onClick={() => setPayingBooking(null)}>
            <div className="modal-content modal-lg card-glass" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Thanh Toán Đơn Đặt Phòng #{payingBooking.bookingCode}</h3>
                <button className="modal-close-btn" onClick={() => setPayingBooking(null)}>✕</button>
              </div>

              <div className="modal-body modal-scrollable">
                <div className="payment-total-bar mb-3">
                  <div>
                    <span>Phòng: <strong>{payingBooking.roomName}</strong> ({payingBooking.nights} đêm)</span>
                    <small className="d-block text-muted">Khách hàng: {payingBooking.customerName}</small>
                  </div>
                  <div className="total-amount-val text-gold">
                    {formatCurrency(payingBooking.totalPrice)}
                  </div>
                </div>

                <div className="methods-options-grid mb-3">
                  <div 
                    className={`payment-method-option ${paymentMethod === "cash" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    <div className="method-radio">
                      <input 
                        type="radio" 
                        name="pay_modal_method" 
                        value="cash" 
                        checked={paymentMethod === "cash"} 
                        onChange={() => setPaymentMethod("cash")}
                      />
                    </div>
                    <div className="method-icon-box"><Building size={20} /></div>
                    <div className="method-info">
                      <strong>Thanh toán tại khách sạn</strong>
                      <small>Thanh toán tại quầy lễ tân khi nhận phòng.</small>
                    </div>
                  </div>

                  <div 
                    className={`payment-method-option ${paymentMethod === "bank_transfer" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("bank_transfer")}
                  >
                    <div className="method-radio">
                      <input 
                        type="radio" 
                        name="pay_modal_method" 
                        value="bank_transfer" 
                        checked={paymentMethod === "bank_transfer"} 
                        onChange={() => setPaymentMethod("bank_transfer")}
                      />
                    </div>
                    <div className="method-icon-box"><QrCode size={20} /></div>
                    <div className="method-info">
                      <strong>Chuyển khoản ngân hàng (VietQR)</strong>
                      <small>Quét mã QR qua app ngân hàng 24/7.</small>
                    </div>
                  </div>
                </div>

                {paymentMethod === "cash" ? (
                  <div className="method-instruction-box cash-box">
                    <strong>Bạn sẽ thanh toán tại quầy khi nhận phòng.</strong>
                    <p className="mt-1">Vui lòng xuất trình mã đơn <strong>{payingBooking.bookingCode}</strong> khi đến check-in.</p>
                  </div>
                ) : (
                  <div className="method-instruction-box bank-box">
                    <div className="bank-info-layout">
                      <div className="bank-details-list">
                        <div className="bank-row">
                          <span className="b-label">Ngân hàng:</span>
                          <strong>{bankName}</strong>
                        </div>
                        <div className="bank-row">
                          <span className="b-label">Chủ tài khoản:</span>
                          <strong>{bankAccountName}</strong>
                        </div>
                        <div className="bank-row">
                          <span className="b-label">Số tài khoản:</span>
                          <div className="copy-field">
                            <strong className="font-mono text-gold">{bankAccount}</strong>
                            <button className="btn btn-sm btn-outline-gold" onClick={() => handleCopy(bankAccount, "bank")}>
                              <Copy size={12} /> {copyBankSuccess ? "Đã chép" : "Chép STK"}
                            </button>
                          </div>
                        </div>
                        <div className="bank-row">
                          <span className="b-label">Nội dung:</span>
                          <div className="copy-field">
                            <strong className="font-mono">{payingBooking.bookingCode} {payingBooking.customerName.replace(/\s+/g, "")}</strong>
                            <button className="btn btn-sm btn-outline-gold" onClick={() => handleCopy(`${payingBooking.bookingCode} ${payingBooking.customerName.replace(/\s+/g, "")}`, "content")}>
                              <Copy size={12} /> {copyContentSuccess ? "Đã chép" : "Chép ND"}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="bank-qr-box">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=2|99|${bankAccount}|MB|${encodeURIComponent(bankAccountName)}|${payingBooking.totalPrice}|${payingBooking.bookingCode}`} 
                          alt="VietQR"
                          className="qr-image"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setPayingBooking(null)}>
                  Hủy bỏ
                </button>
                <button 
                  className="btn btn-gold btn-glow" 
                  onClick={handleConfirmModalPayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? "Đang xử lý..." : "Xác Nhận Thanh Toán"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Hộp thoại xác nhận Hủy Đặt Phòng */}
        {cancelModalBooking && (
          <div className="modal-overlay" onClick={() => !isCancelling && setCancelModalBooking(null)}>
            <div className="modal-content card-glass max-w-500 confirm-dialog-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="flex-align-center gap-2">
                  <div className="confirm-bubble-icon bg-red-light text-red">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h3 className="modal-title font-serif m-0 text-navy">Xác Nhận Hủy Đặt Phòng</h3>
                    <small className="text-muted">Mã đơn: #{cancelModalBooking.bookingCode || cancelModalBooking.id}</small>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="modal-close-btn" 
                  onClick={() => !isCancelling && setCancelModalBooking(null)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body pt-2 pb-2">
                <p className="text-muted font-size-sm mb-3">
                  Quý khách có chắc chắn muốn hủy đơn đặt phòng này? Trạng thái đơn sẽ được cập nhật thành <strong>“Đã hủy”</strong> và phòng giữ chỗ sẽ được giải phóng.
                </p>

                <div className="confirm-details-box">
                  <div className="c-info-row">
                    <span className="c-label">Phòng nghỉ:</span>
                    <strong className="c-value text-gold">{cancelModalBooking.roomName}</strong>
                  </div>
                  <div className="c-info-row">
                    <span className="c-label">Ngày nhận phòng:</span>
                    <span className="c-value">{cancelModalBooking.checkIn} (từ 14:00)</span>
                  </div>
                  <div className="c-info-row">
                    <span className="c-label">Ngày trả phòng:</span>
                    <span className="c-value">{cancelModalBooking.checkOut} (trước 12:00)</span>
                  </div>
                  <div className="c-info-row">
                    <span className="c-label">Tổng tiền:</span>
                    <strong className="c-value text-gold">{formatCurrency(cancelModalBooking.totalPrice)}</strong>
                  </div>
                  <div className="c-info-row border-top-dashed pt-2 mt-1">
                    <span className="c-label">Trạng thái hiện tại:</span>
                    <span className="badge badge-warning">{cancelModalBooking.status}</span>
                  </div>
                </div>

                <div className="info-sub-box mt-3 p-3 bg-red-soft rounded font-size-xs text-danger border-red-soft">
                  <strong>⚠️ Quy định hủy phòng Grand Palace:</strong>
                  <ul className="m-0 pl-3 mt-1">
                    <li>Khách hàng chỉ được hủy khi đơn ở trạng thái <em>“Chờ xác nhận”</em> (Lễ tân chưa duyệt đơn).</li>
                    <li>Nếu lễ tân đã duyệt đơn, hệ thống sẽ từ chối và không cho phép tự hủy.</li>
                    <li>Sau khi xác nhận hủy, thao tác này không thể hoàn tác.</li>
                  </ul>
                </div>
              </div>

              <div className="modal-footer pt-3 gap-2">
                <button 
                  type="button" 
                  className="btn btn-secondary flex-1" 
                  onClick={() => setCancelModalBooking(null)}
                  disabled={isCancelling}
                >
                  Quay lại
                </button>
                <button 
                  type="button" 
                  className="btn btn-cancel-confirm flex-1" 
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Đang xử lý..." : "Xác nhận hủy đặt phòng"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

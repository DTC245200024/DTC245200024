import React, { useState, useEffect } from "react";
import { 
  Calendar, Users, BedDouble, User, Phone, Mail, MessageSquare, 
  CheckCircle2, Sparkles, ArrowRight, ShieldCheck, Copy, Eye, UserCheck, 
  CreditCard, Building, QrCode, Check, AlertCircle, ArrowLeft 
} from "lucide-react";
import { formatCurrency, calculateNights, getTodayDateString, getTomorrowDateString, getStatusBadge } from "../utils/formatters";
import { bookingApi } from "../services/api";

export default function BookingPage({ 
  rooms, 
  currentUser,
  preSelectedBooking, 
  onBookingSuccess, 
  setActiveTab,
  hotelSettings 
}) {
  const hotelName = hotelSettings?.hotelName || "HOTEL 5 SAO";
  const bankName = hotelSettings?.bankName || "MB Bank (Ngân hàng Quân Đội)";
  const bankAccount = hotelSettings?.bankAccount || "0964880630";
  const bankAccountName = hotelSettings?.bankAccountName || hotelName.toUpperCase();
  // Step State: 'form' -> 'payment' -> 'completed'
  const [bookingStep, setBookingStep] = useState("form");
  
  const [selectedRoomId, setSelectedRoomId] = useState(preSelectedBooking?.roomId || (rooms.length > 0 ? rooms[0].id : ""));
  const [customerName, setCustomerName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [checkIn, setCheckIn] = useState(preSelectedBooking?.checkIn || getTodayDateString());
  const [checkOut, setCheckOut] = useState(preSelectedBooking?.checkOut || getTomorrowDateString());
  const [guests, setGuests] = useState(preSelectedBooking?.guests || "2");
  const [specialRequests, setSpecialRequests] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  
  // Payment State (ONLY used in step 2: 'payment')
  const [paymentMethod, setPaymentMethod] = useState("cash"); // 'cash' | 'bank_transfer'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [copyBankSuccess, setCopyBankSuccess] = useState(false);
  const [copyContentSuccess, setCopyContentSuccess] = useState(false);

  // Sync user info if available
  useEffect(() => {
    if (currentUser) {
      if (!customerName) setCustomerName(currentUser.name || "");
      if (!phone) setPhone(currentUser.phone || "");
      if (!email) setEmail(currentUser.email || "");
    }
  }, [currentUser]);

  useEffect(() => {
    if (preSelectedBooking?.roomId) {
      setSelectedRoomId(preSelectedBooking.roomId);
    }
    if (preSelectedBooking?.checkIn) setCheckIn(preSelectedBooking.checkIn);
    if (preSelectedBooking?.checkOut) setCheckOut(preSelectedBooking.checkOut);
    if (preSelectedBooking?.guests) setGuests(preSelectedBooking.guests);
  }, [preSelectedBooking]);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0] || null;
  const nights = calculateNights(checkIn, checkOut);
  const roomPrice = selectedRoom ? selectedRoom.price : 0;
  const totalPrice = nights * roomPrice;

  // BƯỚC 4: Nhấn nút "Xác nhận đặt phòng"
  const handleConfirmBooking = async (e) => {
    e.preventDefault();

    if (!selectedRoom) {
      alert("Vui lòng chọn phòng để đặt!");
      return;
    }

    if (!customerName || !phone || !email) {
      alert("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Email liên hệ!");
      return;
    }

    try {
      setIsSubmitting(true);
      const bookingData = {
        userId: currentUser?.id || undefined,
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        roomType: selectedRoom.type,
        roomPrice: roomPrice,
        checkIn,
        checkOut,
        nights,
        guests: Number(guests),
        totalPrice,
        paymentMethod: paymentMethod, // Requirement 2: Lưu phương thức thanh toán vào database cùng đơn
        status: "Chờ xác nhận", // Requirement 3: Bắt buộc ở trạng thái Chờ xác nhận (Pending)
        paymentStatus: paymentMethod === "bank_transfer" ? "Chờ xác nhận chuyển khoản" : "Chưa thanh toán",
        specialRequests: specialRequests.trim()
      };

      const res = await bookingApi.create(bookingData);
      if (res.success) {
        setConfirmedBooking(res.data);
        // Chuyển sang Bước 2: Hướng dẫn thanh toán / xác nhận phương thức
        setBookingStep("payment");
        if (onBookingSuccess) {
          onBookingSuccess(res.data);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Đặt phòng không thành công: " + (error.message || "Lỗi máy chủ"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // BƯỚC 2: Xác nhận phương thức thanh toán & Hoàn tất bước đặt phòng
  const handleConfirmPayment = async () => {
    if (!confirmedBooking) return;

    try {
      setIsProcessingPayment(true);
      // Requirement 3 & 6: Không tự ý chuyển thành đã thanh toán hoặc đã xác nhận
      const currentPaymentStatus = paymentMethod === "bank_transfer" ? "Chờ xác nhận chuyển khoản" : "Chưa thanh toán";
      
      const res = await bookingApi.update(confirmedBooking.id, {
        paymentMethod: paymentMethod,
        paymentStatus: currentPaymentStatus,
        status: "Chờ xác nhận" // Giữ nguyên trạng thái Chờ xác nhận (Pending)
      });

      if (res.success) {
        setConfirmedBooking(res.data);
        setBookingStep("completed");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error("Payment confirmation failed:", err);
      alert("Lỗi khi xác nhận thông tin thanh toán: " + err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopyCodeSuccess(true);
      setTimeout(() => setCopyCodeSuccess(false), 2500);
    } else if (type === "bank") {
      setCopyBankSuccess(true);
      setTimeout(() => setCopyBankSuccess(false), 2500);
    } else if (type === "content") {
      setCopyContentSuccess(true);
      setTimeout(() => setCopyContentSuccess(false), 2500);
    }
  };

  const handleBookAnother = () => {
    setBookingStep("form");
    setConfirmedBooking(null);
    setSpecialRequests("");
  };

  return (
    <div className="booking-page-container">
      {/* Page Header */}
      <div className="page-hero-banner">
        <div className="container text-center">
          <div className="section-subtitle text-gold">
            {bookingStep === "form" && "BƯỚC 1/2: ĐẶT PHÒNG TRỰC TUYẾN"}
            {bookingStep === "payment" && "BƯỚC 2/2: THANH TOÁN ĐƠN ĐẶT PHÒNG"}
            {bookingStep === "completed" && "HOÀN TẤT ĐẶT PHÒNG"}
          </div>
          <h1 className="page-hero-title">
            {bookingStep === "form" && "Xác Nhận Thông Tin Đặt Phòng"}
            {bookingStep === "payment" && "Thanh Toán Đơn Đặt Phòng"}
            {bookingStep === "completed" && "Đặt Phòng & Thanh Toán Thành Công"}
          </h1>
          <p className="page-hero-desc">
            {bookingStep === "form" && "Vui lòng kiểm tra thông tin khách hàng và thời gian lưu trú trước khi xác nhận."}
            {bookingStep === "payment" && "Chọn phương thức thanh toán phù hợp để hoàn tất thủ tục giữ phòng."}
            {bookingStep === "completed" && "Đơn đặt phòng của quý khách đã được lưu an toàn vào hệ thống."}
          </p>
        </div>
      </div>

      <div className="container page-main-content">
        {/* ========================================================================= */}
        {/* BƯỚC 5A: GIAO DIỆN THANH TOÁN (CHỈ XUẤT HIỆN SAU KHI ĐẶT PHÒNG THÀNH CÔNG) */}
        {/* ========================================================================= */}
        {bookingStep === "payment" && confirmedBooking && (
          <div className="payment-page-layout max-w-800 mx-auto">
            {/* Thông báo đặt phòng thành công */}
            <div className="booking-success-alert card-glass mb-4">
              <div className="alert-left-icon">
                <CheckCircle2 size={36} className="text-success" />
              </div>
              <div className="alert-content">
                <h3 className="text-success">Đặt Phòng Thành Công!</h3>
                <p>
                  Mã đơn đặt phòng của quý khách là <strong className="text-gold font-mono">{confirmedBooking.bookingCode}</strong>. Vui lòng tiến hành chọn phương thức thanh toán bên dưới.
                </p>
              </div>
            </div>

            {/* Chi tiết đơn đặt phòng */}
            <div className="payment-summary-card card-glass mb-4">
              <div className="payment-card-header">
                <CreditCard size={22} className="text-gold" />
                <h3>Thanh Toán Đơn Đặt Phòng</h3>
              </div>

              <div className="payment-details-grid">
                <div className="p-detail-item">
                  <span className="p-label">Mã đặt phòng:</span>
                  <div className="code-copy-row">
                    <strong className="code-badge text-gold font-mono font-size-lg">{confirmedBooking.bookingCode}</strong>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => handleCopy(confirmedBooking.bookingCode, "code")}>
                      <Copy size={13} />
                      <span>{copyCodeSuccess ? "Đã chép!" : "Sao chép"}</span>
                    </button>
                  </div>
                </div>

                <div className="p-detail-item">
                  <span className="p-label">Tên khách hàng:</span>
                  <strong>{confirmedBooking.customerName}</strong>
                </div>

                <div className="p-detail-item">
                  <span className="p-label">Phòng nghỉ:</span>
                  <strong className="text-gold">{confirmedBooking.roomName}</strong>
                </div>

                <div className="p-detail-item">
                  <span className="p-label">Số khách:</span>
                  <span>{confirmedBooking.guests} người lớn</span>
                </div>

                <div className="p-detail-item">
                  <span className="p-label">Ngày nhận phòng (Check-in):</span>
                  <strong>{confirmedBooking.checkIn} (14:00)</strong>
                </div>

                <div className="p-detail-item">
                  <span className="p-label">Ngày trả phòng (Check-out):</span>
                  <strong>{confirmedBooking.checkOut} (12:00)</strong>
                </div>

                <div className="p-detail-item">
                  <span className="p-label">Số đêm lưu trú:</span>
                  <span>{confirmedBooking.nights} đêm</span>
                </div>

                <div className="p-detail-item">
                  <span className="p-label">Trạng thái hiện tại:</span>
                  <span className="badge badge-warning">{confirmedBooking.status}</span>
                </div>
              </div>

              <div className="payment-total-bar">
                <div className="total-title-box">
                  <span>Tổng tiền thanh toán:</span>
                  <small>Đã bao gồm thuế VAT & phí dịch vụ 5 sao</small>
                </div>
                <div className="total-amount-val text-gold">
                  {formatCurrency(confirmedBooking.totalPrice)}
                </div>
              </div>
            </div>

            {/* Chọn Phương thức thanh toán */}
            <div className="payment-methods-card card-glass mb-4">
              <h3 className="section-block-title">Chọn Phương Thức Thanh Toán</h3>

              <div className="methods-options-grid">
                {/* Phương thức 1: Thanh toán tại khách sạn */}
                <div 
                  className={`payment-method-option ${paymentMethod === "cash" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("cash")}
                >
                  <div className="method-radio">
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="cash" 
                      checked={paymentMethod === "cash"} 
                      onChange={() => setPaymentMethod("cash")}
                    />
                  </div>
                  <div className="method-icon-box">
                    <Building size={24} />
                  </div>
                  <div className="method-info">
                    <strong>1. Thanh toán tại khách sạn</strong>
                    <p>Thanh toán bằng tiền mặt hoặc thẻ tại quầy Lễ tân khi làm thủ tục nhận phòng.</p>
                  </div>
                </div>

                {/* Phương thức 2: Chuyển khoản ngân hàng */}
                <div 
                  className={`payment-method-option ${paymentMethod === "bank_transfer" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("bank_transfer")}
                >
                  <div className="method-radio">
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="bank_transfer" 
                      checked={paymentMethod === "bank_transfer"} 
                      onChange={() => setPaymentMethod("bank_transfer")}
                    />
                  </div>
                  <div className="method-icon-box">
                    <QrCode size={24} />
                  </div>
                  <div className="method-info">
                    <strong>2. Chuyển khoản ngân hàng (VietQR)</strong>
                    <p>Quét mã QR hoặc chuyển khoản qua Internet Banking / Mobile Banking 24/7.</p>
                  </div>
                </div>
              </div>

              {/* Chi tiết Phương thức 1: Thanh toán tại khách sạn */}
              {paymentMethod === "cash" && (
                <div className="method-instruction-box cash-box">
                  <div className="instruction-header">
                    <CheckCircle2 size={20} className="text-info" />
                    <strong>Bạn sẽ thanh toán tại quầy khi nhận phòng.</strong>
                  </div>
                  <p className="instruction-desc">
                    Quý khách vui lòng đến quầy Lễ tân khách sạn tại địa chỉ: <strong>188 Hoàng Diệu, Quận 1, TP.HCM</strong> vào ngày <strong>{confirmedBooking.checkIn}</strong> (từ 14:00) và xuất trình mã đặt phòng <strong>{confirmedBooking.bookingCode}</strong> để nhận phòng.
                  </p>
                </div>
              )}

              {/* Chi tiết Phương thức 2: Chuyển khoản ngân hàng */}
              {paymentMethod === "bank_transfer" && (
                <div className="method-instruction-box bank-box">
                  <h4 className="bank-guide-title">Thông Tin Tài Khoản Ngân Hàng Khách Sạn</h4>
                  
                  <div className="bank-info-layout">
                    {/* Thông tin chuyển khoản */}
                    <div className="bank-details-list">
                      <div className="bank-row">
                        <span className="b-label">Ngân hàng thụ hưởng:</span>
                        <strong>{bankName}</strong>
                      </div>

                      <div className="bank-row">
                        <span className="b-label">Chủ tài khoản:</span>
                        <strong>{bankAccountName}</strong>
                      </div>

                      <div className="bank-row">
                        <span className="b-label">Số tài khoản:</span>
                        <div className="copy-field">
                          <strong className="font-mono text-gold font-size-lg">{bankAccount}</strong>
                          <button className="btn btn-sm btn-outline-gold" onClick={() => handleCopy(bankAccount, "bank")}>
                            <Copy size={13} />
                            <span>{copyBankSuccess ? "Đã chép!" : "Sao chép"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="bank-row">
                        <span className="b-label">Số tiền chuyển khoản:</span>
                        <strong className="text-gold font-size-lg">{formatCurrency(confirmedBooking.totalPrice)}</strong>
                      </div>

                      <div className="bank-row">
                        <span className="b-label">Nội dung chuyển khoản:</span>
                        <div className="copy-field">
                          <strong className="font-mono">{confirmedBooking.bookingCode} {confirmedBooking.customerName.replace(/\s+/g, '')}</strong>
                          <button className="btn btn-sm btn-outline-gold" onClick={() => handleCopy(`${confirmedBooking.bookingCode} ${confirmedBooking.customerName.replace(/\s+/g, '')}`, "content")}>
                            <Copy size={13} />
                            <span>{copyContentSuccess ? "Đã chép!" : "Sao chép"}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* QR Code mô phỏng chuẩn VietQR */}
                    <div className="bank-qr-box">
                      <div className="qr-wrapper">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=2|99|${bankAccount}|MB|${encodeURIComponent(bankAccountName)}|${confirmedBooking.totalPrice}|${confirmedBooking.bookingCode}`} 
                          alt="VietQR Chuyển Khoản"
                          className="qr-image"
                        />
                        <span className="qr-note">Quét mã QR bằng App Ngân Hàng</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Nút Xác nhận phương thức thanh toán */}
              <div className="payment-action-footer mt-4">
                <button
                  className="btn btn-gold btn-block btn-lg btn-glow"
                  onClick={handleConfirmPayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <span>Đang cập nhật...</span>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>{paymentMethod === "bank_transfer" ? "Tôi Đã Chuyển Khoản - Hoàn Tất Đặt Phòng" : "Xác Nhận Đặt Phòng (Thanh Toán Tại Quầy)"}</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BƯỚC 3: MÀN HÌNH HOÀN TẤT ĐẶT PHÒNG (COMPLETED) */}
        {/* ========================================================================= */}
        {bookingStep === "completed" && confirmedBooking && (
          <div className="booking-voucher-card card-glass max-w-700 mx-auto">
            <div className="voucher-header text-center">
              <div className="success-icon-wrap">
                <CheckCircle2 size={48} className="text-warning mx-auto" />
              </div>
              <h2 className="voucher-title">Đặt Phòng Thành Công - Chờ Xác Nhận!</h2>
              <p className="voucher-subtitle">
                Cảm ơn quý khách <strong>{confirmedBooking.customerName}</strong>. Đơn đặt phòng của quý khách đã được ghi nhận trên hệ thống ở trạng thái <strong className="text-warning">Chờ xác nhận (Pending)</strong>. Lễ tân khách sạn sẽ kiểm tra và xác nhận đơn của quý khách.
              </p>
            </div>

            <div className="voucher-code-box">
              <span className="code-label">MÃ ĐƠN ĐẶT PHÒNG:</span>
              <span className="code-val font-mono">{confirmedBooking.bookingCode}</span>
              <button className="btn btn-sm btn-outline-gold" onClick={() => handleCopy(confirmedBooking.bookingCode, "code")}>
                <Copy size={14} />
                <span>{copyCodeSuccess ? "Đã sao chép!" : "Sao chép"}</span>
              </button>
            </div>

            <div className="voucher-details-grid">
              <div className="voucher-item">
                <span className="v-label">Khách hàng:</span>
                <strong>{confirmedBooking.customerName}</strong>
              </div>
              <div className="voucher-item">
                <span className="v-label">Số điện thoại:</span>
                <strong>{confirmedBooking.phone}</strong>
              </div>
              <div className="voucher-item">
                <span className="v-label">Phòng nghỉ:</span>
                <strong className="text-gold">{confirmedBooking.roomName}</strong>
              </div>
              <div className="voucher-item">
                <span className="v-label">Loại phòng:</span>
                <span>{confirmedBooking.roomType}</span>
              </div>
              <div className="voucher-item">
                <span className="v-label">Ngày nhận (Check-in):</span>
                <strong>{confirmedBooking.checkIn} (14:00)</strong>
              </div>
              <div className="voucher-item">
                <span className="v-label">Ngày trả (Check-out):</span>
                <strong>{confirmedBooking.checkOut} (12:00)</strong>
              </div>
              <div className="voucher-item">
                <span className="v-label">Thời gian lưu trú:</span>
                <span>{confirmedBooking.nights} đêm ({confirmedBooking.guests} khách)</span>
              </div>
              <div className="voucher-item">
                <span className="v-label">Trạng thái đơn:</span>
                <span className={`badge badge-${getStatusBadge(confirmedBooking.status).className}`}>
                  {confirmedBooking.status}
                </span>
              </div>
            </div>

            <div className="voucher-total-box">
              <span>Tổng thanh toán:</span>
              <strong className="voucher-price text-gold">{formatCurrency(confirmedBooking.totalPrice)}</strong>
            </div>

            {confirmedBooking.specialRequests && (
              <div className="voucher-note">
                <strong>Ghi chú / Yêu cầu đặc biệt:</strong> {confirmedBooking.specialRequests}
              </div>
            )}

            <div className="voucher-actions">
              <button
                className="btn btn-gold btn-block"
                onClick={() => setActiveTab("my-bookings")}
              >
                <Eye size={16} />
                <span>Xem trong Đơn Đặt Phòng Của Tôi</span>
              </button>
              <button
                className="btn btn-outline-secondary btn-block mt-2"
                onClick={handleBookAnother}
              >
                Đặt thêm phòng khác
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BƯỚC 3 & 4: FORM ĐẶT PHÒNG (HOÀN TOÀN KHÔNG CHỨA PHẦN THANH TOÁN) */}
        {/* ========================================================================= */}
        {bookingStep === "form" && (
          <div className="booking-layout-grid">
            {/* Left Column: Form */}
            <div className="booking-form-col">
              <form className="booking-form card-glass" onSubmit={handleConfirmBooking}>
                {currentUser && (
                  <div className="user-autofill-notice">
                    <UserCheck size={18} className="text-success" />
                    <span>Đang đặt phòng với tài khoản: <strong>{currentUser.name}</strong> ({currentUser.email})</span>
                  </div>
                )}

                <div className="form-section-title">
                  <User size={20} className="text-gold" />
                  <h3>1. Thông Tin Khách Hàng</h3>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Họ và tên khách hàng <span className="text-danger">*</span></label>
                    <div className="input-with-icon">
                      <User size={16} className="input-icon" />
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Nguyễn Văn An"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="input-control"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Số điện thoại liên hệ <span className="text-danger">*</span></label>
                    <div className="input-with-icon">
                      <Phone size={16} className="input-icon" />
                      <input
                        type="tel"
                        required
                        placeholder="Ví dụ: 0912345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="input-control"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Địa chỉ Email nhận xác nhận <span className="text-danger">*</span></label>
                  <div className="input-with-icon">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      required
                      placeholder="Ví dụ: customer@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-control"
                    />
                  </div>
                </div>

                <div className="form-section-title mt-4">
                  <BedDouble size={20} className="text-gold" />
                  <h3>2. Lựa Chọn Phòng & Thời Gian Lưu Trú</h3>
                </div>

                <div className="form-group">
                  <label>Chọn phòng nghỉ <span className="text-danger">*</span></label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="input-control select-large"
                    required
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} - ({r.type}) - {formatCurrency(r.price)}/đêm [{r.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label><Calendar size={15} /> Ngày nhận phòng</label>
                    <input
                      type="date"
                      required
                      min={getTodayDateString()}
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="input-control"
                    />
                  </div>

                  <div className="form-group">
                    <label><Calendar size={15} /> Ngày trả phòng</label>
                    <input
                      type="date"
                      required
                      min={checkIn || getTodayDateString()}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="input-control"
                    />
                  </div>

                  <div className="form-group">
                    <label><Users size={15} /> Số lượng khách</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="input-control"
                    >
                      <option value="1">1 Khách</option>
                      <option value="2">2 Khách</option>
                      <option value="3">3 Khách</option>
                      <option value="4">4+ Khách</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Yêu cầu đặc biệt (nếu có)</label>
                  <div className="input-with-icon">
                    <MessageSquare size={16} className="input-icon textarea-icon" />
                    <textarea
                      rows="3"
                      placeholder="Ví dụ: Phòng tầng cao, nôi em bé, check-in muộn sau 18:00..."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="input-control"
                    />
                  </div>
                </div>

                <div className="form-group mb-4">
                  <label className="font-weight-600 mb-2 d-block">
                    <CreditCard size={15} /> Phương thức thanh toán <span className="text-danger">*</span>
                  </label>
                  <div className="methods-options-grid">
                    <div 
                      className={`payment-method-option ${paymentMethod === "cash" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("cash")}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="method-radio">
                        <input 
                          type="radio" 
                          name="form_payment_method" 
                          value="cash" 
                          checked={paymentMethod === "cash"} 
                          onChange={() => setPaymentMethod("cash")}
                        />
                      </div>
                      <div className="method-icon-box">
                        <Building size={22} />
                      </div>
                      <div className="method-info">
                        <strong>Thanh toán tại quầy</strong>
                        <p>Thanh toán bằng tiền mặt hoặc thẻ tại quầy Lễ tân khi làm thủ tục nhận phòng.</p>
                      </div>
                    </div>

                    <div 
                      className={`payment-method-option ${paymentMethod === "bank_transfer" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("bank_transfer")}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="method-radio">
                        <input 
                          type="radio" 
                          name="form_payment_method" 
                          value="bank_transfer" 
                          checked={paymentMethod === "bank_transfer"} 
                          onChange={() => setPaymentMethod("bank_transfer")}
                        />
                      </div>
                      <div className="method-icon-box">
                        <QrCode size={22} />
                      </div>
                      <div className="method-info">
                        <strong>Chuyển khoản ngân hàng (VietQR)</strong>
                        <p>Quét mã QR hoặc chuyển khoản Internet Banking 24/7 theo thông tin ngân hàng.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BƯỚC 4: Nút Xác nhận đặt phòng */}
                <button
                  type="submit"
                  className="btn btn-gold btn-block btn-lg btn-glow mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Đang xử lý đặt phòng...</span>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Xác Nhận Đặt Phòng</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Real-time Order Summary Card */}
            <div className="booking-summary-col">
              <div className="order-summary-card card-glass sticky-top">
                <h3 className="summary-title">Tóm Tắt Đơn Đặt Phòng</h3>

                {selectedRoom ? (
                  <>
                    <div className="summary-room-box">
                      <img
                        src={selectedRoom.image || "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=400&q=80"}
                        alt={selectedRoom.name}
                        className="summary-room-img"
                      />
                      <div className="summary-room-info">
                        <span className="room-badge-type">{selectedRoom.type}</span>
                        <h4>{selectedRoom.name}</h4>
                        <div className="summary-room-spec">
                          <span>{selectedRoom.bed || "1 Giường đôi"}</span> • <span>Tối đa {selectedRoom.maxGuests} khách</span>
                        </div>
                      </div>
                    </div>

                    <div className="summary-details-list">
                      <div className="summary-detail-row">
                        <span>Ngày nhận phòng:</span>
                        <strong>{checkIn}</strong>
                      </div>
                      <div className="summary-detail-row">
                        <span>Ngày trả phòng:</span>
                        <strong>{checkOut}</strong>
                      </div>
                      <div className="summary-detail-row">
                        <span>Thời gian lưu trú:</span>
                        <strong>{nights} đêm</strong>
                      </div>
                      <div className="summary-detail-row">
                        <span>Số lượng khách:</span>
                        <strong>{guests} người</strong>
                      </div>
                      <div className="summary-detail-row">
                        <span>Giá phòng / đêm:</span>
                        <span>{formatCurrency(roomPrice)}</span>
                      </div>
                    </div>

                    <hr className="divider" />

                    <div className="summary-total-row">
                      <div className="total-label">
                        <span>Tổng tiền dự tính:</span>
                        <small>Đã bao gồm thuế & phí</small>
                      </div>
                      <div className="total-val text-gold">
                        {formatCurrency(totalPrice)}
                      </div>
                    </div>

                    <div className="summary-benefits">
                      <div className="benefit-item">
                        <ShieldCheck size={16} className="text-success" />
                        <span>Bảo đảm có phòng 100%</span>
                      </div>
                      <div className="benefit-item">
                        <CheckCircle2 size={16} className="text-success" />
                        <span>Thanh toán linh hoạt sau khi xác nhận</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted">Vui lòng chọn một phòng nghỉ để xem báo giá.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

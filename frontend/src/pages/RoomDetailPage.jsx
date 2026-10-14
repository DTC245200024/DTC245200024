import React, { useState } from "react";
import { 
  X, Users, Bed, Maximize2, Eye, Calendar, Check, ShieldCheck, 
  Clock, ArrowLeft, ArrowRight, Star, Heart, MapPin, Sparkles 
} from "lucide-react";
import { formatCurrency, calculateNights, getTodayDateString, getTomorrowDateString, getStatusBadge } from "../utils/formatters";

export default function RoomDetailPage({ room, onBack, onBookRoom, hotelSettings }) {
  if (!room) return null;
  const hotelName = hotelSettings?.hotelName || "HOTEL 5 SAO";
  const hotelAddress = hotelSettings?.hotelAddress || "188 Hoàng Diệu, Q1, TP.HCM";

  const [checkIn, setCheckIn] = useState(getTodayDateString());
  const [checkOut, setCheckOut] = useState(getTomorrowDateString());
  const [guests, setGuests] = useState("2");

  const nights = calculateNights(checkIn, checkOut);
  const totalPrice = nights * (room.price || 0);
  const statusBadge = getStatusBadge(room.status);

  const handleProceedBooking = () => {
    onBookRoom({
      roomId: room.id,
      roomName: room.name,
      roomType: room.type,
      roomPrice: room.price,
      checkIn,
      checkOut,
      nights,
      guests,
      totalPrice
    });
  };

  return (
    <div className="room-detail-page">
      <div className="container">
        {/* Breadcrumb & Back button */}
        <div className="detail-top-nav">
          <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Quay lại danh sách phòng</span>
          </button>
          <div className="detail-breadcrumb">
            <span>Trang chủ</span> / <span>Danh sách phòng</span> / <strong className="text-gold">{room.name}</strong>
          </div>
        </div>

        {/* Room Header Info */}
        <div className="room-detail-header">
          <div className="detail-header-left">
            <div className="detail-badges-row">
              <span className="room-badge-type">{room.type}</span>
              <span className={`room-badge-status ${statusBadge.className}`}>{statusBadge.label}</span>
              <span className="badge-room-code">Mã phòng: {room.roomCode}</span>
            </div>
            <h1 className="room-detail-title">{room.name}</h1>
            <div className="room-detail-location">
              <MapPin size={16} className="text-gold" />
              <span>Tầng 12 - Khách sạn {hotelName} ({hotelAddress})</span>
            </div>
          </div>
          <div className="detail-header-price">
            <span className="price-tag-sub">Giá niêm yết</span>
            <div className="detail-price-number">{formatCurrency(room.price)}</div>
            <span className="price-tag-unit">/ 1 đêm (Đã gồm VAT & Phí phục vụ)</span>
          </div>
        </div>

        {/* Hero Gallery Grid */}
        <div className="room-gallery-grid mb-5">
          <div className="gallery-main">
            <img
              src={room.image || "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80"}
              alt={room.name}
              className="gallery-main-img"
            />
          </div>
          <div className="gallery-sub-grid">
            <img
              src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80"
              alt="Phòng tắm sang trọng"
              className="gallery-sub-img"
            />
            <img
              src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80"
              alt="Góc nhìn ban công"
              className="gallery-sub-img"
            />
          </div>
        </div>

        {/* 2-Column Content: Left Details & Right Booking Calculator */}
        <div className="room-detail-layout">
          {/* Left Column: Room Specs & Description */}
          <div className="room-detail-info">
            {/* Quick Specs Cards */}
            <div className="specs-bar card-glass">
              <div className="spec-card">
                <Users size={22} className="text-gold" />
                <div>
                  <span className="spec-label">Sức chứa</span>
                  <strong>Tối đa {room.capacity || room.maxGuests || 2} người lớn</strong>
                </div>
              </div>
              <div className="spec-card">
                <Bed size={22} className="text-gold" />
                <div>
                  <span className="spec-label">Loại giường</span>
                  <strong>{room.bed || "1 Giường King lớn"}</strong>
                </div>
              </div>
              <div className="spec-card">
                <Maximize2 size={22} className="text-gold" />
                <div>
                  <span className="spec-label">Diện tích</span>
                  <strong>{room.size || "35m²"}</strong>
                </div>
              </div>
              <div className="spec-card">
                <Eye size={22} className="text-gold" />
                <div>
                  <span className="spec-label">Tầm nhìn</span>
                  <strong>{room.view || "Hướng thành phố & Biển"}</strong>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="detail-section card-glass">
              <h3 className="detail-block-title">Mô Tả Chi Tiết Phòng</h3>
              <p className="detail-text-p">
                {room.description || "Phòng nghỉ được thiết kế theo phong cách hiện đại kết hợp cổ điển hoàng gia Châu Âu. Toàn bộ nội thất được trang bị cao cấp, giường nệm tiêu chuẩn 5 sao cùng không gian thoáng mát ngập tràn ánh sáng tự nhiên."}
              </p>
              <p className="detail-text-p">
                Đặc biệt, phòng trang bị hệ thống rèm cửa tự động thông minh, máy lọc không khí khử khuẩn Ion và cửa sổ kính 2 lớp cách âm tuyệt đối đảm bảo giấc ngủ trọn vẹn và thư thái.
              </p>
            </div>

            {/* Amenities Section */}
            <div className="detail-section card-glass">
              <h3 className="detail-block-title">Tiện Nghi & Dịch Vụ Đi Kèm</h3>
              <div className="amenities-full-grid">
                {room.amenities && room.amenities.map((amenity, idx) => (
                  <div key={idx} className="amenity-item-full">
                    <div className="amenity-check-circle"><Check size={14} /></div>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hotel Policies */}
            <div className="detail-section card-glass">
              <h3 className="detail-block-title">Quy Định & Chính Sách Khách Sạn</h3>
              <div className="policies-grid">
                <div className="policy-item">
                  <Clock size={20} className="text-gold" />
                  <div>
                    <strong>Giờ nhận & Trả phòng</strong>
                    <p>Nhận phòng từ: 14:00 | Trả phòng trước: 12:00 hôm sau</p>
                  </div>
                </div>
                <div className="policy-item">
                  <ShieldCheck size={20} className="text-gold" />
                  <div>
                    <strong>Chính sách hoàn hủy</strong>
                    <p>Miễn phí hủy phòng trước 48 giờ so với giờ check-in.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Booking Calculator Card */}
          <div className="room-booking-sidebar">
            <div className="booking-calc-card card-glass sticky-top">
              <div className="calc-header">
                <h3>Đặt Phòng Ngay</h3>
                <div className="calc-price-badge">
                  <span>{formatCurrency(room.price)}</span>
                  <small> / đêm</small>
                </div>
              </div>

              <div className="calc-body">
                <div className="calc-field">
                  <label><Calendar size={15} /> Ngày nhận phòng</label>
                  <input
                    type="date"
                    value={checkIn}
                    min={getTodayDateString()}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="input-control"
                  />
                </div>

                <div className="calc-field">
                  <label><Calendar size={15} /> Ngày trả phòng</label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || getTodayDateString()}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="input-control"
                  />
                </div>

                <div className="calc-field">
                  <label><Users size={15} /> Số lượng khách</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="input-control"
                  >
                    {[...Array(room.capacity || room.maxGuests || 4)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} Khách</option>
                    ))}
                  </select>
                </div>

                {/* Calculation breakdown */}
                <div className="calc-breakdown">
                  <div className="breakdown-row">
                    <span>Số đêm lưu trú:</span>
                    <strong>{nights} đêm</strong>
                  </div>
                  <div className="breakdown-row">
                    <span>Đơn giá phòng:</span>
                    <span>{formatCurrency(room.price)} x {nights}</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Phí dịch vụ & VAT:</span>
                    <span className="text-success">Đã bao gồm</span>
                  </div>
                  <hr className="divider" />
                  <div className="breakdown-row total-row">
                    <span>Tổng tiền thanh toán:</span>
                    <strong className="total-val text-gold">{formatCurrency(totalPrice)}</strong>
                  </div>
                </div>

                <button
                  className="btn btn-gold btn-block btn-lg btn-glow mt-3"
                  onClick={handleProceedBooking}
                  disabled={room.status === "Đang bảo trì"}
                >
                  <Sparkles size={18} />
                  <span>Tiến hành Đặt phòng</span>
                  <ArrowRight size={18} />
                </button>

                <p className="instant-confirm-note">
                  🔒 Xác nhận tức thì • Không cần thanh toán trước
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Users, Bed, Eye, Maximize2, Check, ArrowRight } from "lucide-react";
import { formatCurrency, getStatusBadge } from "../utils/formatters";

export default function RoomCard({ room, onSelectRoom, onViewDetails }) {
  const statusBadge = getStatusBadge(room.status);

  return (
    <div className="room-card card-glass">
      {/* 2. Ảnh phòng & Badges */}
      <div className="room-card-image-wrap">
        <img
          src={room.image || "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"}
          alt={room.name}
          className="room-card-image"
          loading="lazy"
        />
        {/* Góc trái trên: Loại phòng */}
        <div className="room-badge-type">{room.type}</div>

        {/* Góc phải trên: Trạng thái phòng */}
        <div className={`room-badge-status ${statusBadge.className}`}>
          {room.status === "Trống" ? "🟢 Còn trống" : statusBadge.label}
        </div>

        {/* Góc trái dưới: Mã phòng */}
        <div className="room-code-tag">Mã: {room.roomCode || room.id}</div>
      </div>

      {/* 3. Phần thông tin phòng */}
      <div className="room-content">
        {/* Title & Price Row */}
        <div className="room-title-row">
          <h3 className="room-name" title={room.name}>
            {room.name}
          </h3>

          <div className="room-price">
            {formatCurrency(room.price)}
            <span>/ đêm</span>
          </div>
        </div>

        {/* Description */}
        <div className="room-description">
          {room.description || "Phòng nghỉ cao cấp tiện nghi, không gian thoáng đãng, phục vụ chuẩn 5 sao."}
        </div>

        <div className="room-divider"></div>

        {/* Info Grid 2x2 */}
        <div className="room-info-grid">
          <div className="room-info-item">
            <Users size={16} className="room-info-icon" />
            <span>Tối đa {room.capacity || room.maxGuests || 1} khách</span>
          </div>

          <div className="room-info-item">
            <Bed size={16} className="room-info-icon" />
            <span>{room.bed || "1 Giường đôi lớn"}</span>
          </div>

          <div className="room-info-item">
            <Maximize2 size={16} className="room-info-icon" />
            <span>{room.size || "32m²"}</span>
          </div>

          <div className="room-info-item">
            <Eye size={16} className="room-info-icon" />
            <span>{room.view || "Hướng thành phố"}</span>
          </div>
        </div>

        <div className="room-divider"></div>

        {/* Amenities Pills */}
        <div className="room-amenities">
          {room.amenities && room.amenities.slice(0, 3).map((amenity, idx) => (
            <div key={idx} className="amenity">
              <Check size={13} className="text-gold flex-shrink-0" />
              <span>{amenity}</span>
            </div>
          ))}
          {room.amenities && room.amenities.length > 3 && (
            <div className="amenity more">
              +{room.amenities.length - 3} tiện ích
            </div>
          )}
        </div>

        {/* Actions Button Row */}
        <div className="room-actions">
          <button
            type="button"
            className="detail-button"
            onClick={() => onViewDetails(room)}
          >
            Chi tiết
          </button>

          <button
            type="button"
            className="booking-button"
            onClick={() => onSelectRoom(room)}
            disabled={room.status === "Đang bảo trì"}
          >
            <span>Đặt phòng</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

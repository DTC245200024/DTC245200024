import React from "react";
import { Hotel, Phone, Mail, MapPin, Award, ShieldCheck } from "lucide-react";
import { getBrandLogoDetails } from "../utils/formatters";

export default function Footer({ setActiveTab, hotelSettings }) {
  const hotelName = hotelSettings?.hotelName || "HOTEL 5 SAO";
  const brandLogo = getBrandLogoDetails(hotelName);

  return (
    <footer className="footer-section">
      <div className="footer-top">
        <div className="container footer-grid">
          <div className="footer-col brand-col">
            <div className="brand-logo footer-logo">
              <div className="brand-icon-box">
                <Hotel className="brand-icon" size={24} />
              </div>
              <div className="brand-text">
                <span className="brand-title text-white">{brandLogo.title}</span>
                {brandLogo.subtitle ? (
                  <span className="brand-subtitle text-gold">{brandLogo.subtitle} ★★★★★</span>
                ) : (
                  <span className="brand-subtitle text-gold">★★★★★</span>
                )}
              </div>
            </div>
            <p className="footer-desc">
              Trải nghiệm kỳ nghỉ thượng lưu hoàn mỹ tại {hotelName} với dịch vụ chuẩn quốc tế 5 sao. Không gian nghỉ dưỡng sang trọng, ấm cúng và đầy cảm hứng tại trung tâm thành phố.
            </p>
            <div className="footer-badges">
              <span className="badge-outline"><Award size={14} /> Khách sạn 5 Sao</span>
              <span className="badge-outline"><ShieldCheck size={14} /> Dịch vụ uy tín</span>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Khám Phá</h4>
            <ul className="footer-links">
              <li><a href="#home" onClick={(e) => { e.preventDefault(); setActiveTab("home"); }}>Trang chủ</a></li>
              <li><a href="#rooms" onClick={(e) => { e.preventDefault(); setActiveTab("rooms"); }}>Danh sách phòng</a></li>
              <li><a href="#booking" onClick={(e) => { e.preventDefault(); setActiveTab("booking"); }}>Đặt phòng trực tuyến</a></li>
              <li><a href="#admin-bookings" onClick={(e) => { e.preventDefault(); setActiveTab("admin-bookings"); }}>Tra cứu & Quản lý đơn</a></li>
              <li><a href="#admin-rooms" onClick={(e) => { e.preventDefault(); setActiveTab("admin-rooms"); }}>Quản trị khách sạn</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Loại Phòng</h4>
            <ul className="footer-links">
              <li><span className="link-text">Phòng Đơn Tiêu Chuẩn & Superior</span></li>
              <li><span className="link-text">Phòng Đôi Standard & Ocean View</span></li>
              <li><span className="link-text">Phòng Deluxe Ban Công & Gia Đình</span></li>
              <li><span className="link-text">Phòng VIP Suite Tổng Thống</span></li>
              <li><span className="link-text">Penthouse Hoàng Gia View 360°</span></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Thông Tin Liên Hệ</h4>
            <div className="contact-list">
              <div className="contact-item">
                <MapPin size={18} className="text-gold" />
                <span>{hotelSettings?.hotelAddress || "188 Hoàng Diệu, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"}</span>
              </div>
              <div className="contact-item">
                <Phone size={18} className="text-gold" />
                <span>{hotelSettings?.hotelPhone || "1900 6868 - 028 3822 9999"}</span>
              </div>
              <div className="contact-item">
                <Mail size={18} className="text-gold" />
                <span>{hotelSettings?.hotelEmail || "contact@grandpalacehotel.vn"}</span>
              </div>
              <div className="contact-item">
                <ShieldCheck size={18} className="text-gold" />
                <span>Lễ tân & Phục vụ 24/7 quanh năm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-content">
          <p>© {new Date().getFullYear()} {hotelName.toUpperCase()}. Đề 6: Hệ thống Đặt phòng Khách sạn.</p>
          <p className="made-with">Thiết kế chuẩn REST API & React Express Full Stack</p>
        </div>
      </div>
    </footer>
  );
}

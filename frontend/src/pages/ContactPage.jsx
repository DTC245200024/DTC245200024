import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Sparkles } from "lucide-react";

export default function ContactPage({ onToast, hotelSettings }) {
  const hotelName = hotelSettings?.hotelName || "HOTEL 5 SAO";
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (onToast) onToast({ type: "success", message: "Cảm ơn quý khách! Chúng tôi đã nhận được thông tin liên hệ." });
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    }, 4000);
  };

  return (
    <div className="contact-page">
      <div className="page-hero-banner">
        <div className="container text-center">
          <div className="section-subtitle text-gold">KẾT NỐI VỚI CHÚNG TÔI</div>
          <h1 className="page-hero-title">Liên Hệ {hotelName}</h1>
          <p className="page-hero-desc">
            Đội ngũ chăm sóc khách hàng luôn sẵn sàng lắng nghe và hỗ trợ quý khách 24/7.
          </p>
        </div>
      </div>

      <div className="container page-main-content">
        <div className="contact-layout-grid">
          {/* Contact Info Box */}
          <div className="contact-info-col card-glass">
            <h3 className="detail-block-title">Thông Tin Khách Sạn</h3>
            <p className="text-muted mb-4">
              Quý khách có thể liên hệ trực tiếp qua Hotline hoặc đến trực tiếp sảnh lễ tân khách sạn để được hỗ trợ nhanh nhất.
            </p>

            <div className="contact-info-list">
              <div className="c-info-item">
                <div className="c-icon-box"><MapPin size={20} /></div>
                <div>
                  <strong>Địa chỉ khách sạn</strong>
                  <p>{hotelSettings?.hotelAddress || "188 Hoàng Diệu, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"}</p>
                </div>
              </div>

              <div className="c-info-item">
                <div className="c-icon-box"><Phone size={20} /></div>
                <div>
                  <strong>Hotline Lễ Tân (24/7)</strong>
                  <p>{hotelSettings?.hotelPhone || "1900 6868 - 028 3822 9999"}</p>
                </div>
              </div>

              <div className="c-info-item">
                <div className="c-icon-box"><Mail size={20} /></div>
                <div>
                  <strong>Email Đặt Phòng</strong>
                  <p>{hotelSettings?.hotelEmail || "contact@grandpalacehotel.vn"}</p>
                </div>
              </div>

              <div className="c-info-item">
                <div className="c-icon-box"><Clock size={20} /></div>
                <div>
                  <strong>Thời gian làm việc</strong>
                  <p>Lễ tân, dịch vụ buồng phòng & bảo vệ hoạt động 24 giờ mỗi ngày</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form-col card-glass">
            <h3 className="detail-block-title">Gửi Tin Nhắn Cho Khách Sạn</h3>
            {submitted ? (
              <div className="contact-success-box text-center p-4">
                <CheckCircle2 size={48} className="text-success mx-auto mb-2" />
                <h3>Gửi Tin Nhắn Thành Công!</h3>
                <p className="text-muted">Bộ phận Chăm sóc khách hàng sẽ liên hệ lại với quý khách trong vòng 30 phút.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Họ và tên <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn An"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Số điện thoại <span className="text-danger">*</span></label>
                    <input
                      type="tel"
                      required
                      placeholder="0912345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-control"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Địa chỉ Email <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-control"
                  />
                </div>

                <div className="form-group">
                  <label>Chủ đề liên hệ</label>
                  <input
                    type="text"
                    placeholder="Tư vấn đặt phòng tiệc / Đưa đón / Hợp tác..."
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input-control"
                  />
                </div>

                <div className="form-group">
                  <label>Nội dung tin nhắn <span className="text-danger">*</span></label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Nhập nội dung cần hỗ trợ..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input-control"
                  />
                </div>

                <button type="submit" className="btn btn-gold btn-block btn-lg btn-glow">
                  <Send size={16} />
                  <span>Gửi Tin Nhắn</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

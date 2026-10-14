import React from "react";
import { Award, ShieldCheck, Heart, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

export default function AboutPage({ setActiveTab, hotelSettings }) {
  const hotelName = hotelSettings?.hotelName || "HOTEL 5 SAO";

  return (
    <div className="about-page">
      <div className="page-hero-banner">
        <div className="container text-center">
          <div className="section-subtitle text-gold">VỀ CHÚNG TÔI</div>
          <h1 className="page-hero-title">{hotelName}</h1>
          <p className="page-hero-desc">
            Biểu tượng nghỉ dưỡng thượng lưu kết hợp hoàn hảo giữa nét quý phái Châu Âu và lòng hiếu khách Việt Nam.
          </p>
        </div>
      </div>

      <div className="container page-main-content">
        <div className="about-story-grid">
          <div className="about-story-text">
            <div className="section-subtitle">CÂU CHUYỆN THƯƠNG HIỆU</div>
            <h2 className="section-title">Hành Trình Kiến Tạo Kỳ Nghỉ Đáng Nhớ</h2>
            <p className="detail-text-p">
              Tọa lạc tại vị trí vàng trung tâm thành phố, {hotelName} được kiến tạo nhằm mang đến một không gian nghỉ dưỡng tĩnh tại, sang trọng và đầy cảm hứng cho du khách trong nước và quốc tế.
            </p>
            <p className="detail-text-p">
              Với hơn 10 năm kinh nghiệm vận hành khách sạn 5 sao quốc tế, chúng tôi tự hào sở hữu đội ngũ nhân viên tận tâm, chu đáo cùng cơ sở vật chất hiện đại, đáp ứng những tiêu chuẩn khắt khe nhất của du khách thượng lưu.
            </p>

            <div className="about-metrics-row">
              <div className="ab-metric">
                <strong className="text-gold">150+</strong>
                <span>Phòng nghỉ cao cấp</span>
              </div>
              <div className="ab-metric">
                <strong className="text-gold">98%</strong>
                <span>Hài lòng tuyệt đối</span>
              </div>
              <div className="ab-metric">
                <strong className="text-gold">5★</strong>
                <span>Tiêu chuẩn quốc tế</span>
              </div>
            </div>
          </div>

          <div className="about-story-img">
            <img
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80"
              alt={`Sảnh chính ${hotelName}`}
              className="story-img-main"
            />
          </div>
        </div>

        <div className="about-values-section mt-5">
          <div className="section-header text-center">
            <div className="section-subtitle">GIÁ TRỊ CỐT LÕI</div>
            <h2 className="section-title">Cam Kết Chất Lượng Vượt Trội</h2>
          </div>

          <div className="values-grid">
            <div className="value-card card-glass">
              <Award size={32} className="text-gold mb-3" />
              <h3>Đẳng Cấp 5 Sao</h3>
              <p>Mỗi chi tiết nhỏ nhất trong phòng nghỉ và dịch vụ đều được chăm chút theo quy chuẩn quốc tế.</p>
            </div>
            <div className="value-card card-glass">
              <Heart size={32} className="text-gold mb-3" />
              <h3>Tận Tâm Phục Vụ</h3>
              <p>Sự hài lòng và nụ cười của quý khách là niềm hạnh phúc lớn nhất của toàn thể đội ngũ khách sạn.</p>
            </div>
            <div className="value-card card-glass">
              <ShieldCheck size={32} className="text-gold mb-3" />
              <h3>Minh Bạch & Uy Tín</h3>
              <p>Cam kết giá tốt nhất, không chi phí ẩn, xác nhận đặt phòng tức thì và bảo mật thông tin tuyệt đối.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

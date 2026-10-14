import React from "react";
import { Waves, Utensils, Sparkles, Car, Dumbbell, Award, Coffee, ShieldCheck, Heart, ArrowRight } from "lucide-react";

export default function ServicesPage({ setActiveTab, hotelSettings }) {
  const hotelName = hotelSettings?.hotelName || "HOTEL 5 SAO";
  const services = [
    {
      icon: Waves,
      title: "Hồ Bơi Vô Cực Tầng Thượng",
      desc: "Trải nghiệm làn nước trong xanh với tầm nhìn toàn cảnh 360 độ ngắm hoàng hôn tuyệt đẹp từ tầng 25.",
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
    },
    {
      icon: Utensils,
      title: "Nhà Hàng Ẩm Thực 5 Sao",
      desc: "Thưởng thức tinh hoa ẩm thực Á - Âu chuẩn quốc tế do các bếp trưởng tài hoa trực tiếp chế biến.",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
    },
    {
      icon: Sparkles,
      title: "Lotus Spa & Wellness",
      desc: "Liệu trình massage thảo dược, xông hơi đá muối Himalaya giúp tái tạo năng lượng và cân bằng tâm trí.",
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
    },
    {
      icon: Car,
      title: "Xe Đưa Đón Sân Bay VIP",
      desc: "Dịch vụ xe hạng sang Limousine đưa đón tận sân bay 24/7 với tài xế chuyên nghiệp, chu đáo.",
      image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"
    },
    {
      icon: Dumbbell,
      title: "Trung Tâm Fitness & Yoga",
      desc: "Phòng tập trang bị máy móc hiện đại Technogym với huấn luyện viên cá nhân và lớp Yoga mỗi sáng.",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"
    },
    {
      icon: Coffee,
      title: "Skyline Lounge & Bar",
      desc: "Thưởng thức cocktail signature và trà chiều phong cách quý tộc trong không gian âm nhạc acoustic du dương.",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
    }
  ];

  return (
    <div className="services-page">
      <div className="page-hero-banner">
        <div className="container text-center">
          <div className="section-subtitle text-gold">TRẢI NGHIỆM ĐẲNG CẤP</div>
          <h1 className="page-hero-title">Dịch Vụ & Tiện Ích Chuẩn 5 Sao</h1>
          <p className="page-hero-desc">
            {hotelName} mang đến cho quý khách chuỗi dịch vụ tiện ích thượng lưu và trọn vẹn nhất.
          </p>
        </div>
      </div>

      <div className="container page-main-content">
        <div className="services-grid-full">
          {services.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="service-card-full card-glass">
                <div className="service-img-wrap">
                  <img src={s.image} alt={s.title} />
                </div>
                <div className="service-content-body">
                  <div className="service-icon-box">
                    <Icon size={24} />
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cta-banner mt-5 card-glass">
          <div className="container cta-box">
            <div className="cta-text">
              <h2>Trải Nghiệm Kỳ Nghỉ Trong Mơ</h2>
              <p>Đặt phòng trực tiếp trên website để nhận ngay ưu đãi miễn phí ăn sáng và voucher Spa 20%.</p>
            </div>
            <div className="cta-buttons">
              <button className="btn btn-gold btn-lg btn-glow" onClick={() => setActiveTab("rooms")}>
                <span>Xem danh sách phòng</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

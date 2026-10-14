import React, { useState } from "react";
import { 
  Search, ShieldCheck, Sparkles, Award, 
  Utensils, Waves, Wifi, Clock, ArrowRight, Star, Heart, CheckCircle2 
} from "lucide-react";
import RoomCard from "../components/RoomCard";

export default function HomePage({ 
  rooms, 
  onSelectRoom, 
  onViewDetails, 
  setActiveTab, 
  setFilterParams,
  hotelSettings 
}) {
  const hotelName = hotelSettings?.hotelName || "HOTEL 5 SAO";
  const [searchKeyword, setSearchKeyword] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilterParams({
      search: searchKeyword.trim(),
      type: "Tất cả",
      status: "Tất cả",
      guests: "Tất cả"
    });
    setActiveTab("rooms");
  };

  // Top 4 featured rooms
  const featuredRooms = rooms.slice(0, 4);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Kỳ Nghỉ Thượng Lưu Đẳng Cấp 5 Sao</span>
          </div>
          <h1 className="hero-title">
            Nơi Nghỉ Dưỡng Hoàn Hảo <br />
            <span className="hero-highlight">Khởi Đầu Trải Nghiệm Thăng Hoa</span>
          </h1>
          <p className="hero-desc">
            Chào mừng bạn đến với {hotelName}. Tận hưởng không gian sang trọng, dịch vụ chuẩn quốc tế, hồ bơi vô cực và ẩm thực tinh hoa ngay giữa lòng thành phố.
          </p>

          {/* Hero Single Room Search Bar */}
          <div className="hero-search-wrapper">
            <form className="hero-single-search-form" onSubmit={handleSearchSubmit}>
              <div className="hero-search-input-group">
                <Search size={22} className="hero-search-icon" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm kiếm phòng theo tên, mã phòng hoặc loại phòng..."
                  className="hero-search-input"
                  aria-label="Tìm kiếm phòng"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    className="hero-search-clear"
                    onClick={() => setSearchKeyword("")}
                    title="Xóa tìm kiếm"
                    aria-label="Xóa tìm kiếm"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button type="submit" className="btn btn-gold hero-search-submit-btn">
                <Search size={18} />
                <span>Tìm phòng</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Highlights / Features Bar */}
      <section className="highlights-section">
        <div className="container highlights-grid">
          <div className="highlight-item">
            <div className="highlight-icon"><Waves size={24} /></div>
            <div>
              <h4 className="highlight-title">Hồ Bơi Vô Cực</h4>
              <p className="highlight-desc">Tầm nhìn 360 độ ngắm trọn cảnh hoàng hôn</p>
            </div>
          </div>
          <div className="highlight-item">
            <div className="highlight-icon"><Utensils size={24} /></div>
            <div>
              <h4 className="highlight-title">Ẩm Thực 5 Sao</h4>
              <p className="highlight-desc">Đầu bếp quốc tế phục vụ buffet & thực đơn Á-Âu</p>
            </div>
          </div>
          <div className="highlight-item">
            <div className="highlight-icon"><Clock size={24} /></div>
            <div>
              <h4 className="highlight-title">Lễ Tân 24/7</h4>
              <p className="highlight-desc">Hỗ trợ check-in & chăm sóc khách hàng chu đáo</p>
            </div>
          </div>
          <div className="highlight-item">
            <div className="highlight-icon"><Award size={24} /></div>
            <div>
              <h4 className="highlight-title">Cam Kết Giá Tốt Nhất</h4>
              <p className="highlight-desc">Không phí ẩn, hoàn hủy linh hoạt</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="section featured-rooms-section">
        <div className="container">
          <div className="section-header">
            <div className="section-subtitle">DANH MỤC NGHỈ DƯỠNG</div>
            <h2 className="section-title">Phòng Nổi Bật Được Yêu Thích Nhất</h2>
            <p className="section-desc">
              Tất cả các phòng đều được chăm chút tỉ mỉ từ nệm lông vũ êm ái, bồn tắm cao cấp đến tầm nhìn hướng biển tuyệt đẹp.
            </p>
          </div>

          <div className="rooms-grid">
            {featuredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onSelectRoom={onSelectRoom}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>

          <div className="text-center mt-4">
            <button
              className="btn btn-outline-gold btn-lg"
              onClick={() => {
                setFilterParams({});
                setActiveTab("rooms");
              }}
            >
              <span>Xem tất cả {rooms.length} phòng & suites</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Us & Luxury Experience */}
      <section className="section experience-section bg-slate">
        <div className="container experience-grid">
          <div className="experience-images">
            <div className="exp-img-main">
              <img
                src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
                alt={`Khách sạn ${hotelName}`}
              />
            </div>
            <div className="exp-badge-float">
              <Star className="text-gold fill-gold" size={24} />
              <div>
                <strong>4.9 / 5.0</strong>
                <p>Hơn 3,500 lượt đánh giá xuất sắc</p>
              </div>
            </div>
          </div>

          <div className="experience-content">
            <div className="section-subtitle">TẠI SAO CHỌN CHÚNG TÔI</div>
            <h2 className="section-title">Trải Nghiệm Đẳng Cấp Hoàng Gia Trong Từng Khoảnh Khắc</h2>
            <p className="experience-desc">
              {hotelName} không chỉ là điểm dừng chân nghỉ ngơi, mà là một hành trình tận hưởng nghệ thuật sống đích thực. Từ hương thơm tinh dầu tự nhiên tại sảnh chính đến nụ cười chào đón thân thiện của đội ngũ nhân viên.
            </p>

            <ul className="experience-list">
              <li>
                <CheckCircle2 className="text-gold" size={20} />
                <span>Vị trí đắc địa ngay trung tâm, di chuyển thuận tiện tới các điểm tham quan</span>
              </li>
              <li>
                <CheckCircle2 className="text-gold" size={20} />
                <span>Hệ thống phòng cách âm tuyệt đối, chăn ga đệm cao cấp chuẩn khách sạn quốc tế</span>
              </li>
              <li>
                <CheckCircle2 className="text-gold" size={20} />
                <span>Bữa sáng buffet phong phú hơn 50 món ăn Á - Âu mỗi ngày</span>
              </li>
              <li>
                <CheckCircle2 className="text-gold" size={20} />
                <span>Bảo mật thông tin & Đặt phòng nhanh chóng qua REST API hiện đại</span>
              </li>
            </ul>

            <div className="experience-cta">
              <button
                className="btn btn-gold btn-lg"
                onClick={() => setActiveTab("booking")}
              >
                <span>Đặt phòng ngay hôm nay</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="section-header">
            <div className="section-subtitle">CẢM NHẬN KHÁCH HÀNG</div>
            <h2 className="section-title">Khách Hàng Nói Gì Về Chúng Tôi</h2>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card card-glass">
              <div className="stars-row">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="text-gold fill-gold" />
                ))}
              </div>
              <p className="testimonial-text">
                "Kỳ nghỉ tuyệt vời nhất từ trước đến nay của gia đình tôi! Phòng Deluxe Ban Công rất rộng rãi, view hoàng hôn đẹp ngỡ ngàng, nhân viên thân thiện và nhiệt tình hỗ trợ."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">TN</div>
                <div>
                  <strong>Trần Ngọc Lan</strong>
                  <p>Du khách từ Hà Nội</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card card-glass">
              <div className="stars-row">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="text-gold fill-gold" />
                ))}
              </div>
              <p className="testimonial-text">
                "Tôi đặt phòng VIP Suite Tổng Thống cho chuyến công tác và tiếp đón đối tác. Dịch vụ hoàn hảo, phòng cách âm tốt, đồ ăn sáng buffet rất ngon và chất lượng."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">LH</div>
                <div>
                  <strong>Lê Hữu Minh</strong>
                  <p>Doanh nhân TP. HCM</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card card-glass">
              <div className="stars-row">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="text-gold fill-gold" />
                ))}
              </div>
              <p className="testimonial-text">
                "Hệ thống website đặt phòng rất mượt mà, chọn phòng và tính tiền tự động minh bạch. Đến khách sạn check-in nhanh chỉ trong 2 phút. Nhất định sẽ quay lại!"
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">VA</div>
                <div>
                  <strong>Vũ Ánh Tuyết</strong>
                  <p>Du khách từ Đà Nẵng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="cta-banner">
        <div className="container cta-box">
          <div className="cta-text">
            <h2>Sẵn Sàng Cho Kỳ Nghỉ Đáng Nhớ Của Bạn?</h2>
            <p>Đặt phòng trực tiếp trên website để nhận ngay ưu đãi 15% cùng voucher ẩm thực miễn phí.</p>
          </div>
          <div className="cta-buttons">
            <button
              className="btn btn-gold btn-lg btn-glow"
              onClick={() => setActiveTab("booking")}
            >
              <span>Đặt phòng ngay</span>
              <ArrowRight size={18} />
            </button>
            <button
              className="btn btn-outline-light btn-lg"
              onClick={() => setActiveTab("rooms")}
            >
              <span>Khám phá các phòng</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

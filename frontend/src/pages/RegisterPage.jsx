import React, { useState } from "react";
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus, ArrowRight, LogIn } from "lucide-react";
import { authApi } from "../services/api";

export default function RegisterPage({ onRegisterSuccess, onNavigateLogin, hotelSettings }) {
  const hotelName = hotelSettings?.hotelName || "HOTEL 5 SAO";
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setErrorMsg("Vui lòng điền đầy đủ tất cả các trường bắt buộc.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("Mật khẩu phải có tối thiểu 6 ký tự.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await authApi.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (res.success) {
        onRegisterSuccess(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || "Đăng ký không thành công. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="container">
        <div className="auth-card card-glass max-w-500 mx-auto">
          <div className="auth-header text-center">
            <div className="auth-icon-badge">
              <UserPlus size={28} className="text-gold" />
            </div>
            <h2 className="auth-title">Đăng Ký Tài Khoản</h2>
            <p className="auth-subtitle">
              Trở thành thành viên {hotelName} để tận hưởng ưu đãi 15% cùng dịch vụ đặt phòng tiện lợi.
            </p>
          </div>

          {errorMsg && (
            <div className="auth-error-alert">
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Họ và tên khách hàng <span className="text-danger">*</span></label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Địa chỉ Email <span className="text-danger">*</span></label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="khachhang@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="phone"
                  required
                  placeholder="0912345678"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-control"
                />
              </div>
            </div>

            {/* Mật khẩu with Eye toggle */}
            <div className="form-group">
              <label>Mật khẩu <span className="text-danger">*</span></label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-control has-toggle"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu with independent Eye toggle */}
            <div className="form-group">
              <label>Xác nhận lại mật khẩu <span className="text-danger">*</span></label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  placeholder="Nhập lại mật khẩu..."
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-control has-toggle"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-gold btn-block btn-lg btn-glow mt-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Đang tạo tài khoản...</span>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Hoàn Tất Đăng Ký</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-switch-box text-center mt-4">
            <p>
              Đã có tài khoản?{" "}
              <button
                type="button"
                className="link-btn text-gold"
                onClick={onNavigateLogin}
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

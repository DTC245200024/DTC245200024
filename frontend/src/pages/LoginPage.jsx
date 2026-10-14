import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, ShieldAlert } from "lucide-react";
import { authApi } from "../services/api";

export default function LoginPage({ onLoginSuccess, onNavigateRegister, redirectReason, hotelSettings }) {
  const hotelName = hotelSettings?.hotelName || "HOTEL 5 SAO";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!identifier || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ Email/SĐT và Mật khẩu");
      return;
    }

    try {
      setIsLoading(true);
      const res = await authApi.login({ identifier: identifier.trim(), password });
      if (res.success) {
        onLoginSuccess(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="container">
        <div className="auth-card card-glass max-w-500 mx-auto">
          {/* Banner notification if redirected from booking or protected action */}
          {redirectReason && (
            <div className="auth-redirect-alert">
              <ShieldAlert size={20} className="text-warning flex-shrink-0" />
              <div>
                <strong>Yêu cầu đăng nhập:</strong>
                <p>{redirectReason}</p>
              </div>
            </div>
          )}

          <div className="auth-header text-center">
            <div className="auth-icon-badge">
              <LogIn size={28} className="text-gold" />
            </div>
            <h2 className="auth-title">Đăng Nhập</h2>
            <p className="auth-subtitle">
              Chào mừng quý khách quay trở lại với {hotelName}.
            </p>
          </div>

          {errorMsg && (
            <div className="auth-error-alert">
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email hoặc Số điện thoại <span className="text-danger">*</span></label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  type="text"
                  required
                  placeholder="Nhập email hoặc số điện thoại..."
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="input-control"
                  autoComplete="username"
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
                  required
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-control has-toggle"
                  autoComplete="current-password"
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

            <button
              type="submit"
              className="btn btn-gold btn-block btn-lg btn-glow mt-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Đăng Nhập</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-switch-box text-center mt-4">
            <p>
              Chưa có tài khoản?{" "}
              <button
                type="button"
                className="link-btn text-gold font-weight-600"
                onClick={onNavigateRegister}
              >
                Đăng ký tài khoản khách hàng
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { 
  Hotel, LogIn, UserPlus, LogOut, User, ClipboardList, 
  ChevronDown, ShieldCheck, UserCheck, Menu, X, Phone, Mail 
} from "lucide-react";
import { getBrandLogoDetails } from "../utils/formatters";

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onNavigateLogin,
  onNavigateRegister,
  hotelSettings
}) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const brandLogo = getBrandLogoDetails(hotelSettings?.hotelName);

  const navItems = [
    { id: "home", label: "Trang chủ" },
    { id: "rooms", label: "Danh sách phòng" },
    { id: "services", label: "Dịch vụ" },
    { id: "about", label: "Giới thiệu" },
    { id: "contact", label: "Liên hệ" }
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const role = (currentUser?.role || "").toUpperCase();

  return (
    <header className="navbar-header">
      <div className="navbar-main">
        <div className="navbar-container">
          {/* Group Trái: Logo + Menu Điều Hướng */}
          <div className="nav-left-group">
            {/* Logo Khách Sạn */}
            <div className="brand-logo" onClick={() => handleNavClick("home")}>
              <div className="brand-icon-box">
                <Hotel className="brand-icon" size={24} />
              </div>
              <div className="brand-text">
                <span className="brand-title">{brandLogo.title}</span>
                {brandLogo.subtitle ? (
                  <span className="brand-subtitle">{brandLogo.subtitle}</span>
                ) : null}
              </div>
            </div>

            {/* Menu Links */}
            <nav className="desktop-nav-menu">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-link-btn ${isActive ? "active" : ""}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="nav-active-pill" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Group Phải: Căn sát góc phải (28px) */}
          <div className="navbar-right-cluster">
            {!currentUser ? (
              /* Chưa đăng nhập: [Đăng nhập] [Đăng ký] */
              <div className="auth-btn-row">
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm"
                  onClick={onNavigateLogin}
                >
                  <LogIn size={15} />
                  <span>Đăng nhập</span>
                </button>
                <button
                  type="button"
                  className="btn btn-gold btn-sm"
                  onClick={onNavigateRegister}
                >
                  <UserPlus size={15} />
                  <span>Đăng ký</span>
                </button>
              </div>
            ) : (
              /* Đã đăng nhập: [Admin/Staff Portal] [Tài khoản] [Đơn đặt phòng] [👤 Nguyễn Thị Vịt ▾] */
              <div className="logged-in-nav-group">
                {/* Admin Portal Quick Button */}
                {role === "ADMIN" && (
                  <button
                    type="button"
                    className="nav-action-btn text-gold font-weight-600"
                    onClick={() => handleNavClick("admin")}
                    title="Truy cập Admin Portal"
                  >
                    <ShieldCheck size={16} />
                    <span>Admin Portal</span>
                  </button>
                )}

                {/* Staff Portal Quick Button */}
                {role === "STAFF" && (
                  <button
                    type="button"
                    className="nav-action-btn text-info font-weight-600"
                    onClick={() => handleNavClick("staff")}
                    title="Truy cập Bàn Lễ Tân"
                  >
                    <UserCheck size={16} />
                    <span>Bàn Lễ Tân</span>
                  </button>
                )}

                {/* 1. Nút RIÊNG: Tài khoản */}
                <button
                  type="button"
                  className={`nav-action-btn ${activeTab === "account" ? "active" : ""}`}
                  onClick={() => handleNavClick("account")}
                  title="Xem thông tin tài khoản của bạn"
                >
                  <User size={15} />
                  <span>Tài khoản</span>
                </button>

                {/* 2. Nút RIÊNG: Đơn đặt phòng */}
                <button
                  type="button"
                  className={`nav-action-btn ${activeTab === "my-bookings" ? "active" : ""}`}
                  onClick={() => handleNavClick("my-bookings")}
                  title="Xem danh sách đơn đặt phòng"
                >
                  <ClipboardList size={15} />
                  <span>Đơn đặt phòng</span>
                </button>

                {/* 3. Dropdown Tên / Avatar người dùng */}
                <div className="user-profile-menu-wrap">
                  <button
                    type="button"
                    className="user-profile-btn"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  >
                    <div 
                      className="user-avatar-mini"
                      style={{ 
                        background: role === "ADMIN" ? "var(--accent-gold-dark)" : role === "STAFF" ? "#3B82F6" : "var(--primary-navy)" 
                      }}
                    >
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="user-display-name">{currentUser.name}</span>
                    <ChevronDown size={14} className="chevron-icon" />
                  </button>

                  {userDropdownOpen && (
                    <div className="user-dropdown-menu card-glass">
                      {/* Header Dropdown */}
                      <div className="dropdown-user-header">
                        <div className="dropdown-avatar-row">
                          <div 
                            className="dropdown-avatar-circle"
                            style={{ 
                              background: role === "ADMIN" ? "var(--accent-gold-dark)" : role === "STAFF" ? "#3B82F6" : "var(--primary-navy)" 
                            }}
                          >
                            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <strong className="user-name-title">{currentUser.name}</strong>
                            <span className="user-badge-role">
                              {role === "ADMIN" 
                                ? "👑 Quản Trị Viên (ADMIN)" 
                                : role === "STAFF" 
                                ? "👔 Lễ Tân (STAFF)" 
                                : "⭐ Khách Hàng Thành Viên"}
                            </span>
                          </div>
                        </div>

                        <div className="dropdown-contact-info mt-2">
                          <div className="d-contact-item">
                            <Mail size={13} className="text-gold" />
                            <span>{currentUser.email}</span>
                          </div>
                          {currentUser.phone && (
                            <div className="d-contact-item">
                              <Phone size={13} className="text-gold" />
                              <span>{currentUser.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {role === "ADMIN" && (
                        <>
                          <hr className="divider" />
                          <button
                            type="button"
                            className="dropdown-item text-gold font-weight-600"
                            onClick={() => handleNavClick("admin")}
                          >
                            <ShieldCheck size={16} />
                            <span>Trang Quản Trị Admin</span>
                          </button>
                        </>
                      )}

                      {(role === "STAFF" || role === "ADMIN") && (
                        <>
                          <hr className="divider" />
                          <button
                            type="button"
                            className="dropdown-item text-info font-weight-600"
                            onClick={() => handleNavClick("staff")}
                          >
                            <UserCheck size={16} />
                            <span>Bàn Nghiệp Vụ Lễ Tân (Buồng Phòng)</span>
                          </button>
                        </>
                      )}

                      <hr className="divider" />
                      
                      {/* Đăng xuất */}
                      <button
                        type="button"
                        className="dropdown-item text-danger"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                      >
                        <LogOut size={16} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nút bật Menu Mobile */}
            <button
              type="button"
              className="mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-links">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`mobile-nav-link ${isActive ? "active" : ""}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}

            {currentUser ? (
              <>
                <hr className="divider" />
                <div className="mobile-user-info">
                  <span>👤 Đang đăng nhập: <strong>{currentUser.name}</strong> ({role})</span>
                </div>
                {role === "ADMIN" && (
                  <button
                    type="button"
                    className="mobile-nav-link text-gold font-weight-600"
                    onClick={() => handleNavClick("admin")}
                  >
                    <ShieldCheck size={18} />
                    <span>Trang Quản Trị Admin</span>
                  </button>
                )}
                {role === "STAFF" && (
                  <button
                    type="button"
                    className="mobile-nav-link text-info font-weight-600"
                    onClick={() => handleNavClick("staff")}
                  >
                    <UserCheck size={18} />
                    <span>Bàn Làm Việc Lễ Tân</span>
                  </button>
                )}
                <button
                  type="button"
                  className={`mobile-nav-link ${activeTab === "account" ? "active" : ""}`}
                  onClick={() => handleNavClick("account")}
                >
                  <User size={18} />
                  <span>Tài khoản</span>
                </button>
                <button
                  type="button"
                  className={`mobile-nav-link ${activeTab === "my-bookings" ? "active" : ""}`}
                  onClick={() => handleNavClick("my-bookings")}
                >
                  <ClipboardList size={18} />
                  <span>Đơn đặt phòng</span>
                </button>
                <button
                  type="button"
                  className="mobile-nav-link text-danger"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={18} />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <div className="mobile-auth-btns mt-3">
                <button
                  type="button"
                  className="btn btn-outline-light btn-block mb-2"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateLogin();
                  }}
                >
                  <LogIn size={16} />
                  <span>Đăng nhập</span>
                </button>
                <button
                  type="button"
                  className="btn btn-gold btn-block"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateRegister();
                  }}
                >
                  <UserPlus size={16} />
                  <span>Đăng ký</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

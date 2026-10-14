import React, { useState } from "react";
import { 
  Hotel, LayoutDashboard, BedDouble, ClipboardList, CreditCard, 
  Users, LogOut, Globe, ShieldAlert, ChevronRight, Clock, UserCheck 
} from "lucide-react";
import StaffDashboardTab from "./StaffDashboardTab";
import StaffBookingsTab from "./StaffBookingsTab";
import StaffRoomsTab from "./StaffRoomsTab";
import StaffPaymentsTab from "./StaffPaymentsTab";
import StaffCustomersTab from "./StaffCustomersTab";
import { getBrandLogoDetails } from "../../utils/formatters";

export default function StaffLayout({ 
  currentUser, 
  onLogout, 
  onNavigateHome, 
  onToast,
  hotelSettings 
}) {
  const hotelName = hotelSettings?.hotelName || "HOTEL 5 SAO";
  const brandLogo = getBrandLogoDetails(hotelName);
  // Tabs: dashboard | bookings | rooms | payments | customers
  const [staffTab, setStaffTab] = useState("dashboard");
  const [bookingFilter, setBookingFilter] = useState("Tất cả");

  // Role Guard: Only STAFF or ADMIN is allowed
  if (!currentUser || (currentUser.role?.toUpperCase() !== "STAFF" && currentUser.role?.toUpperCase() !== "ADMIN")) {
    return (
      <div className="admin-access-denied card-glass text-center p-5 max-w-500 mx-auto mt-5">
        <ShieldAlert size={54} className="text-danger mb-3 mx-auto" />
        <h2>Quyền Truy Cập Bị Từ Chối (403)</h2>
        <p className="text-muted mt-2">
          Khu vực này chỉ dành riêng cho <strong>Lễ tân (STAFF)</strong>. Tài khoản của bạn không có quyền truy cập vào phân hệ này.
        </p>
        <button className="btn btn-gold mt-4" onClick={onNavigateHome}>
          Quay về Trang chủ
        </button>
      </div>
    );
  }

  const handleSelectBookingFilter = (filter) => {
    setBookingFilter(filter);
    setStaffTab("bookings");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const menuItems = [
    { id: "dashboard", label: "Bàn Làm Việc Lễ Tân", icon: LayoutDashboard },
    { id: "bookings", label: "Quản Lý Đặt Phòng", icon: ClipboardList },
    { id: "rooms", label: "Quản Lý Phòng & Buồng", icon: BedDouble },
    { id: "payments", label: "Thu Ngân & Thanh Toán", icon: CreditCard },
    { id: "customers", label: "Quản Lý Khách Hàng", icon: Users }
  ];

  return (
    <div className="admin-portal-layout">
      {/* Staff Sidebar */}
      <aside className="admin-sidebar staff-sidebar-theme">
        <div className="admin-sidebar-header">
          <div className="brand-logo admin-brand">
            <div className="brand-icon-box">
              <Hotel className="brand-icon" size={24} />
            </div>
            <div className="brand-text">
              <span className="brand-title">{brandLogo.title}</span>
              <span className="staff-badge-tag">LỄ TÂN PORTAL</span>
            </div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="nav-group-label">NGHIỆP VỤ LỄ TÂN TOÀN DIỆN</div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = staffTab === item.id;
            return (
              <button
                key={item.id}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  if (item.id === "bookings") {
                    setBookingFilter("Tất cả");
                  }
                  setStaffTab(item.id);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {isActive && <ChevronRight size={16} className="active-arrow" />}
              </button>
            );
          })}

          <div className="nav-group-label mt-4">HỆ THỐNG</div>
          <button className="admin-nav-item text-gold" onClick={onNavigateHome}>
            <Globe size={19} />
            <span>Xem Website Khách Hàng</span>
          </button>
          
          <button className="admin-nav-item text-danger" onClick={onLogout}>
            <LogOut size={19} />
            <span>Đăng Xuất Lễ Tân</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <div className="user-avatar-mini" style={{ background: "#3B82F6" }}>L</div>
            <div className="admin-user-info">
              <strong>{currentUser.name}</strong>
              <small className="text-info font-weight-600">LỄ TÂN (STAFF)</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrapper">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <span className="admin-portal-title">
              Cổng Nghiệp Vụ Vận Hành Khách Sạn • Bàn Lễ Tân {hotelName}
            </span>
          </div>
          <div className="admin-topbar-right">
            <span className="admin-time-badge">
              <Clock size={14} /> {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
            <div className="admin-status-pill">
              <span className="status-dot-pulse"></span>
              <span>Ca trực Lễ tân hoạt động</span>
            </div>
          </div>
        </header>

        <div className="admin-tab-body">
          {staffTab === "dashboard" && (
            <StaffDashboardTab
              onNavigateTab={setStaffTab}
              onSelectBookingFilter={handleSelectBookingFilter}
              onToast={onToast}
            />
          )}

          {staffTab === "bookings" && (
            <StaffBookingsTab
              initialFilter={bookingFilter}
              onToast={onToast}
            />
          )}

          {staffTab === "rooms" && (
            <StaffRoomsTab
              onToast={onToast}
            />
          )}

          {staffTab === "payments" && (
            <StaffPaymentsTab
              onToast={onToast}
            />
          )}

          {staffTab === "customers" && (
            <StaffCustomersTab
              onToast={onToast}
            />
          )}
        </div>
      </div>
    </div>
  );
}

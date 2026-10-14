import React, { useState } from "react";
import { 
  Hotel, LayoutDashboard, BedDouble, ClipboardList, Users, 
  LogOut, Globe, ShieldCheck, ChevronRight, Bell, Clock, DollarSign,
  UserCheck, Settings, ShieldAlert 
} from "lucide-react";
import AdminDashboardTab from "./AdminDashboardTab";
import AdminRoomsPage from "../AdminRoomsPage";
import AdminBookingsPage from "../AdminBookingsPage";
import AdminCustomersTab from "./AdminCustomersTab";
import AdminRevenueTab from "./AdminRevenueTab";
import AdminStaffTab from "./AdminStaffTab";
import AdminSettingsTab from "./AdminSettingsTab";
import { getBrandLogoDetails } from "../../utils/formatters";

export default function AdminLayout({ 
  currentUser, 
  rooms, 
  onReloadRooms, 
  onLogout, 
  onNavigateHome,
  onToast,
  hotelSettings,
  onReloadSettings
}) {
  const hotelName = hotelSettings?.hotelName || "HOTEL 5 SAO";
  const brandLogo = getBrandLogoDetails(hotelName);
  // Tabs: dashboard | rooms | bookings | revenue | customers | staff | settings
  const [adminTab, setAdminTab] = useState("dashboard");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("Tất cả");

  // Strict Role Guard for ADMIN
  if (!currentUser || currentUser.role?.toUpperCase() !== "ADMIN") {
    return (
      <div className="admin-access-denied card-glass text-center p-5 max-w-500 mx-auto mt-5">
        <ShieldAlert size={54} className="text-danger mb-3 mx-auto" />
        <h2>Quyền Quản Trị Viên Bị Từ Chối (403)</h2>
        <p className="text-muted mt-2">
          Khu vực này chỉ dành riêng cho tài khoản Quản trị viên tối cao (ADMIN).
          Tài khoản của bạn ({currentUser ? `${currentUser.name} - ${currentUser.role}` : "Chưa đăng nhập"}) không có quyền truy cập.
        </p>
        <button className="btn btn-gold mt-4" onClick={onNavigateHome}>
          Quay về Trang chủ
        </button>
      </div>
    );
  }

  const handleNavigateBookings = (status = "Tất cả") => {
    setBookingStatusFilter(status);
    setAdminTab("bookings");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigateRevenue = () => {
    setAdminTab("revenue");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigateRooms = () => {
    setAdminTab("rooms");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigateCustomers = () => {
    setAdminTab("customers");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard Quản Trị", icon: LayoutDashboard },
    { id: "bookings", label: "Quản Lý Đặt Phòng", icon: ClipboardList },
    { id: "revenue", label: "Doanh Thu Khách Sạn", icon: DollarSign },
    { id: "rooms", label: "Quản Lý Phòng", icon: BedDouble },
    { id: "customers", label: "Quản Lý Khách Hàng", icon: Users },
    { id: "staff", label: "Quản Lý Lễ Tân", icon: UserCheck },
    { id: "settings", label: "Cấu Hình Hệ Thống", icon: Settings }
  ];

  return (
    <div className="admin-portal-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="brand-logo admin-brand">
            <div className="brand-icon-box">
              <Hotel className="brand-icon" size={24} />
            </div>
            <div className="brand-text">
              <span className="brand-title">{brandLogo.title}</span>
              <span className="admin-badge-tag">ADMIN PORTAL</span>
            </div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="nav-group-label">QUẢN TRỊ TOÀN DIỆN</div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = adminTab === item.id;
            return (
              <button
                key={item.id}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  if (item.id === "bookings") {
                    setBookingStatusFilter("Tất cả");
                  }
                  setAdminTab(item.id);
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
            <span>Đăng Xuất Admin</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <div className="user-avatar-mini">A</div>
            <div className="admin-user-info">
              <strong>{currentUser.name}</strong>
              <small className="text-gold font-weight-600">QUẢN TRỊ VIÊN (ADMIN)</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content View */}
      <div className="admin-main-wrapper">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <span className="admin-portal-title">
              Hệ Thống Quản Trị Khách Sạn 5 Sao • {hotelName}
            </span>
          </div>
          <div className="admin-topbar-right">
            <span className="admin-time-badge">
              <Clock size={14} /> {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
            <div className="admin-status-pill">
              <span className="status-dot-pulse"></span>
              <span>Hệ thống online</span>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="admin-tab-body">
          {adminTab === "dashboard" && (
            <AdminDashboardTab
              setActiveAdminTab={setAdminTab}
              onNavigateBookings={handleNavigateBookings}
              onNavigateRevenue={handleNavigateRevenue}
              onNavigateRooms={handleNavigateRooms}
              onNavigateCustomers={handleNavigateCustomers}
              onToast={onToast}
            />
          )}

          {adminTab === "bookings" && (
            <AdminBookingsPage
              initialFilter={bookingStatusFilter}
              onNavigateRevenue={handleNavigateRevenue}
              onToast={onToast}
            />
          )}

          {adminTab === "revenue" && (
            <AdminRevenueTab
              onNavigateBookings={handleNavigateBookings}
              onToast={onToast}
            />
          )}

          {adminTab === "rooms" && (
            <AdminRoomsPage
              rooms={rooms}
              onReloadRooms={onReloadRooms}
              onToast={onToast}
            />
          )}

          {adminTab === "customers" && (
            <AdminCustomersTab
              onToast={onToast}
            />
          )}

          {adminTab === "staff" && (
            <AdminStaffTab
              onToast={onToast}
            />
          )}

          {adminTab === "settings" && (
            <AdminSettingsTab
              onToast={onToast}
              onReloadSettings={onReloadSettings}
            />
          )}
        </div>
      </div>
    </div>
  );
}

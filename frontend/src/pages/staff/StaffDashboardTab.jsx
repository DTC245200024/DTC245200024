import React, { useState, useEffect } from "react";
import { 
  ClipboardList, Clock, CheckCircle2, BedDouble, Users, 
  CreditCard, RefreshCw, Eye, ArrowRight, UserCheck, Shield 
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { statsApi, bookingApi, roomApi } from "../../services/api";

export default function StaffDashboardTab({ 
  onNavigateTab, 
  onSelectBookingFilter, 
  onToast 
}) {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes] = await Promise.all([
        statsApi.getStats(),
        bookingApi.getAll()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (bookingsRes.success) setRecentBookings(bookingsRes.data.slice(0, 6));
    } catch (err) {
      console.error("Staff fetch error:", err);
      if (onToast) onToast({ type: "error", message: "Lỗi tải số liệu lễ tân" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  return (
    <div className="staff-dashboard-content">
      {/* Top Header */}
      <div className="admin-tab-header">
        <div>
          <h2>Bàn Làm Việc Lễ Tân & Phục Vụ Khách Hàng</h2>
          <p className="text-muted">
            Theo dõi tình trạng phòng thực tế, duyệt đơn đặt phòng và quản lý thủ tục Check-in / Check-out.
          </p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchStaffData}>
          <RefreshCw size={14} /> Cập nhật số liệu
        </button>
      </div>

      {/* 4 Core Staff Metric Cards */}
      <div className="admin-dashboard-metrics-grid mb-4">
        {/* 1. Đơn Chờ Xác Nhận */}
        <div 
          className="admin-metric-box card-glass clickable"
          onClick={() => onSelectBookingFilter("Chờ xác nhận")}
          title="Click để duyệt các đơn chờ xác nhận"
        >
          <div className="a-metric-icon bg-yellow"><Clock size={22} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Đơn Chờ Xác Nhận</span>
            <h3 className="a-metric-val text-warning">{stats?.pendingConfirmation || 0}</h3>
            <small className="text-muted click-action-hint">Cần lễ tân duyệt →</small>
          </div>
        </div>

        {/* 2. Đơn Đã Xác Nhận */}
        <div 
          className="admin-metric-box card-glass clickable"
          onClick={() => onSelectBookingFilter("Đã xác nhận")}
          title="Click để quản lý đón khách check-in"
        >
          <div className="a-metric-icon bg-blue"><CheckCircle2 size={22} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Đã Xác Nhận</span>
            <h3 className="a-metric-val text-info">{stats?.confirmedBookings || 0}</h3>
            <small className="text-muted click-action-hint">Sẵn sàng đón khách →</small>
          </div>
        </div>

        {/* 3. Phòng Đang Trống */}
        <div 
          className="admin-metric-box card-glass clickable"
          onClick={() => onNavigateTab("rooms")}
          title="Click để xem phòng trống sẵn sàng đón khách"
        >
          <div className="a-metric-icon bg-green"><BedDouble size={22} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Phòng Đang Trống</span>
            <h3 className="a-metric-val text-success">{stats?.availableRooms || 0}</h3>
            <small className="text-muted click-action-hint">Xem tình trạng phòng →</small>
          </div>
        </div>

        {/* 4. Đơn Chờ Thu Tiền */}
        <div 
          className="admin-metric-box card-glass clickable"
          onClick={() => onNavigateTab("payments")}
          title="Click để xem các đơn cần thu tiền"
        >
          <div className="a-metric-icon bg-orange"><CreditCard size={22} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Chờ Thu Tiền</span>
            <h3 className="a-metric-val" style={{ color: "#FF6500" }}>{stats?.pendingPayment || 0}</h3>
            <small className="text-muted click-action-hint">Quản lý thanh toán →</small>
          </div>
        </div>
      </div>

      {/* Quick Action Table */}
      <div className="card-glass p-4 mb-4">
        <div className="section-header-flex mb-3">
          <div>
            <h3>Đơn Đặt Phòng Mới Nhất Cần Xử Lý</h3>
            <p className="text-muted">Danh sách các giao dịch khách vừa gửi lên hệ thống.</p>
          </div>
          <button className="btn btn-outline-gold btn-sm" onClick={() => onSelectBookingFilter("Tất cả")}>
            <span>Xem toàn bộ đơn</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Phòng Đặt</th>
                <th>Ngày Lưu Trú</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th className="text-right">Thao Tác Nhanh</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center p-3">Đang tải dữ liệu lễ tân...</td></tr>
              ) : recentBookings.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-3 text-muted">Không có đơn nào cần xử lý.</td></tr>
              ) : (
                recentBookings.map((b) => (
                  <tr key={b.id || b.bookingCode}>
                    <td><strong className="code-badge text-gold font-mono">{b.bookingCode || b.id}</strong></td>
                    <td>
                      <div><strong>{b.customerName}</strong><br /><small className="text-muted">{b.phone}</small></div>
                    </td>
                    <td>{b.roomName}</td>
                    <td><small>{b.checkIn} → {b.checkOut} ({b.nights} đêm)</small></td>
                    <td><strong className="text-gold">{formatCurrency(b.totalPrice)}</strong></td>
                    <td>
                      <span className={`badge badge-${
                        (b.status === "Đã xác nhận" || b.status === "Khách yêu cầu nhận phòng") ? "info" :
                        b.status === "Đã nhận phòng" ? "success" :
                        b.status === "Đã thanh toán" ? "success" :
                        b.status === "Đã trả phòng" ? "secondary" :
                        b.status === "Đã hủy" ? "danger" : "warning"
                      }`}>
                        {b.status === "Khách yêu cầu nhận phòng" ? "Đã xác nhận" : b.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button 
                        className="btn btn-gold btn-sm"
                        onClick={() => onSelectBookingFilter(b.status === "Khách yêu cầu nhận phòng" ? "Đã xác nhận" : (b.status || "Tất cả"))}
                      >
                        <Eye size={14} /> Xử lý đơn
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

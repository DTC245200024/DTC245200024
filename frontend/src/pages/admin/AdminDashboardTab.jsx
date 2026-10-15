import React, { useState, useEffect } from "react";
import { 
  BedDouble, CheckCircle2, Users, ClipboardList, Clock, 
  CreditCard, DollarSign, TrendingUp, RefreshCw, Eye, ArrowRight, ShieldCheck, Sparkles 
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { statsApi, bookingApi } from "../../services/api";

export default function AdminDashboardTab({ 
  setActiveAdminTab, 
  onNavigateBookings, 
  onNavigateRevenue, 
  onNavigateRooms, 
  onNavigateCustomers, 
  onToast 
}) {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes] = await Promise.all([
        statsApi.getStats(),
        bookingApi.getAll()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (bookingsRes.success) setRecentBookings(bookingsRes.data.slice(0, 6));
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      if (onToast) onToast({ type: "error", message: "Lỗi tải số liệu thống kê quản trị" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Đã xác nhận": return { className: "badge-info" };
      case "Đã nhận phòng": return { className: "badge-success" };
      case "Đã thanh toán": return { className: "badge-success" };
      case "Khách yêu cầu trả phòng": return { className: "badge-warning" };
      case "Đã trả phòng": return { className: "badge-secondary" };
      case "Đã hủy": return { className: "badge-danger" };
      default: return { className: "badge-warning" };
    }
  };

  const handleGoToBookings = (statusFilter = "Tất cả") => {
    if (onNavigateBookings) {
      onNavigateBookings(statusFilter);
    } else if (setActiveAdminTab) {
      setActiveAdminTab("bookings");
    }
  };

  const handleGoToRevenue = () => {
    if (onNavigateRevenue) {
      onNavigateRevenue();
    } else if (setActiveAdminTab) {
      setActiveAdminTab("revenue");
    }
  };

  const handleGoToRooms = (filter) => {
    if (onNavigateRooms) {
      onNavigateRooms(filter);
    } else if (setActiveAdminTab) {
      setActiveAdminTab("rooms");
    }
  };

  const handleGoToCustomers = () => {
    if (onNavigateCustomers) {
      onNavigateCustomers();
    } else if (setActiveAdminTab) {
      setActiveAdminTab("customers");
    }
  };

  return (
    <div className="admin-dashboard-content">
      {/* Top Header */}
      <div className="admin-tab-header">
        <div>
          <h2>Tổng Quan Hoạt Động Khách Sạn</h2>
          <p className="text-muted">
            Theo dõi thời gian thực số lượng phòng, doanh thu và đơn đặt phòng. Click vào từng thẻ để xem chi tiết.
          </p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchDashboardData} title="Làm mới số liệu">
          <RefreshCw size={14} /> Làm mới số liệu
        </button>
      </div>

      {/* 8 Interactive Metric Cards Grid */}
      <div className="admin-dashboard-metrics-grid mb-4">
        {/* 1. Tổng số phòng */}
        <div 
          className="admin-metric-box card-glass clickable" 
          onClick={() => handleGoToRooms("Tất cả")}
          title="Click để quản lý danh sách phòng"
        >
          <div className="a-metric-icon bg-navy"><BedDouble size={22} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Tổng Số Phòng</span>
            <h3 className="a-metric-val">{stats?.totalRooms || 0}</h3>
            <small className="text-muted click-action-hint">Quản lý phòng →</small>
          </div>
        </div>

        {/* 2. Phòng đang trống */}
        <div 
          className="admin-metric-box card-glass clickable" 
          onClick={() => handleGoToRooms("Trống")}
          title="Click để xem các phòng đang trống"
        >
          <div className="a-metric-icon bg-green"><CheckCircle2 size={22} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Phòng Đang Trống</span>
            <h3 className="a-metric-val text-success">{stats?.availableRooms || 0}</h3>
            <small className="text-muted click-action-hint">Sẵn sàng đón khách →</small>
          </div>
        </div>

        {/* 3. Tổng số khách hàng */}
        <div 
          className="admin-metric-box card-glass clickable" 
          onClick={handleGoToCustomers}
          title="Click để quản lý tài khoản khách hàng"
        >
          <div className="a-metric-icon bg-purple"><Users size={22} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Tổng Khách Hàng</span>
            <h3 className="a-metric-val text-info">{stats?.totalCustomers || 0}</h3>
            <small className="text-muted click-action-hint">Quản lý khách hàng →</small>
          </div>
        </div>

        {/* 4. Tổng số đơn đặt (User requested card 1) */}
        <div 
          className="admin-metric-box card-glass clickable" 
          onClick={() => handleGoToBookings("Tất cả")}
          title="Click để xem toàn bộ danh sách đơn đặt phòng"
        >
          <div className="a-metric-icon bg-blue"><ClipboardList size={22} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Tổng Đơn Đặt</span>
            <h3 className="a-metric-val">{stats?.totalBookings || 0}</h3>
            <small className="text-muted click-action-hint">Xem tất cả đơn →</small>
          </div>
        </div>

        {/* 5. Chờ xác nhận (User requested card 2) */}
        <div 
          className="admin-metric-box card-glass clickable" 
          onClick={() => handleGoToBookings("Chờ xác nhận")}
          title="Click để lọc các đơn đang chờ xác nhận"
        >
          <div className="a-metric-icon bg-yellow"><Clock size={22} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Chờ Xác Nhận</span>
            <h3 className="a-metric-val text-warning">{stats?.pendingConfirmation || 0}</h3>
            <small className="text-muted click-action-hint">Lọc đơn chờ duyệt →</small>
          </div>
        </div>

        {/* 6. Đã xác nhận (User requested card 3) */}
        <div 
          className="admin-metric-box card-glass clickable" 
          onClick={() => handleGoToBookings("Đã xác nhận")}
          title="Click để lọc các đơn đã xác nhận"
        >
          <div className="a-metric-icon bg-green"><CheckCircle2 size={22} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Đã Xác Nhận</span>
            <h3 className="a-metric-val text-success">{stats?.confirmedBookings || 0}</h3>
            <small className="text-muted click-action-hint">Lọc đơn đã duyệt →</small>
          </div>
        </div>

        {/* 7. Đơn chờ thanh toán */}
        <div 
          className="admin-metric-box card-glass clickable" 
          onClick={() => handleGoToBookings("Chờ thanh toán")}
          title="Click để lọc các đơn chờ thanh toán"
        >
          <div className="a-metric-icon bg-orange"><CreditCard size={22} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Chờ Thanh Toán</span>
            <h3 className="a-metric-val" style={{ color: "#FF6500" }}>{stats?.pendingPayment || 0}</h3>
            <small className="text-muted click-action-hint">Chưa hoàn tất tiền →</small>
          </div>
        </div>

        {/* 8. Doanh thu dự kiến (User requested card 4) */}
        <div 
          className="admin-metric-box card-glass revenue-box clickable highlight-revenue" 
          onClick={handleGoToRevenue}
          title="Click để xem báo cáo doanh thu dự kiến và danh sách đơn tính tiền"
        >
          <div className="a-metric-icon bg-gold"><DollarSign size={22} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Doanh Thu Dự Kiến</span>
            <h3 className="a-metric-val text-gold font-size-lg">{formatCurrency(stats?.totalRevenue || 0)}</h3>
            <small className="text-muted click-action-hint">Xem báo cáo doanh thu →</small>
          </div>
        </div>
      </div>

      {/* Recent Bookings Section */}
      <div className="admin-recent-section card-glass p-4 mb-4">
        <div className="section-header-flex mb-3">
          <div>
            <h3>Đơn Đặt Phòng Mới Nhất</h3>
            <p className="text-muted">Danh sách các đơn đặt phòng vừa được gửi lên hệ thống.</p>
          </div>
          <button className="btn btn-outline-gold btn-sm" onClick={() => handleGoToBookings("Tất cả")}>
            <span>Xem tất cả đơn</span>
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
                <th>Ngày Nhận - Trả</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th className="text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center p-3">Đang tải dữ liệu...</td></tr>
              ) : recentBookings.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-3 text-muted">Chưa có đơn đặt phòng nào.</td></tr>
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
                    <td><span className={`badge ${getStatusBadge(b.status).className}`}>{b.status === "Khách yêu cầu nhận phòng" ? "Đã xác nhận" : b.status}</span></td>
                    <td className="text-right">
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => handleGoToBookings(b.status === "Khách yêu cầu nhận phòng" ? "Đã xác nhận" : (b.status || "Tất cả"))}>
                        <Eye size={14} /> Xem
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

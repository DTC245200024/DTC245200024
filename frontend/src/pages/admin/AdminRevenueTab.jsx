import React, { useState, useEffect, useMemo } from "react";
import { 
  DollarSign, TrendingUp, CreditCard, Wallet, Calendar, 
  ArrowLeft, Search, Filter, RefreshCw, Eye, Download, CheckCircle2, Clock
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { bookingApi } from "../../services/api";

export default function AdminRevenueTab({ onNavigateBookings, onToast }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("Tất cả");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingApi.getAll();
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error("Failed to load revenue data:", err);
      if (onToast) onToast({ type: "error", message: "Không thể tải dữ liệu doanh thu" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Filter out cancelled bookings from expected revenue
  const revenueBookings = useMemo(() => {
    return bookings.filter(b => b.status !== "Đã hủy");
  }, [bookings]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalExpectedRevenue = revenueBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
    
    const paidRevenue = revenueBookings
      .filter(b => b.paymentStatus === "Đã thanh toán" || b.status === "Đã thanh toán")
      .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

    const pendingRevenue = totalExpectedRevenue - paidRevenue;

    const totalValidBookings = revenueBookings.length;

    return {
      totalExpectedRevenue,
      paidRevenue,
      pendingRevenue,
      totalValidBookings
    };
  }, [revenueBookings]);

  // Filtered list for search and payment type
  const displayBookings = useMemo(() => {
    return revenueBookings.filter(b => {
      if (paymentFilter === "paid") {
        if (b.paymentStatus !== "Đã thanh toán" && b.status !== "Đã thanh toán") return false;
      } else if (paymentFilter === "pending") {
        if (b.paymentStatus === "Đã thanh toán" || b.status === "Đã thanh toán") return false;
      }

      if (searchTerm.trim() !== "") {
        const q = searchTerm.toLowerCase();
        const matchCode = b.bookingCode && b.bookingCode.toLowerCase().includes(q);
        const matchName = b.customerName && b.customerName.toLowerCase().includes(q);
        const matchPhone = b.phone && b.phone.includes(q);
        const matchEmail = b.email && b.email.toLowerCase().includes(q);
        const matchRoom = b.roomName && b.roomName.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPhone && !matchEmail && !matchRoom) return false;
      }

      return true;
    });
  }, [revenueBookings, paymentFilter, searchTerm]);

  const getPaymentBadge = (b) => {
    const isPaid = b.paymentStatus === "Đã thanh toán" || b.status === "Đã thanh toán";
    if (isPaid) {
      return {
        label: "Đã thanh toán (Chuyển khoản QR)",
        className: "badge-success",
        icon: CheckCircle2
      };
    }
    if (b.paymentMethod === "pay_at_hotel") {
      return {
        label: "Thanh toán tại nhận phòng (Tiền mặt)",
        className: "badge-info",
        icon: Wallet
      };
    }
    return {
      label: "Chờ thanh toán",
      className: "badge-warning",
      icon: Clock
    };
  };

  return (
    <div className="admin-revenue-content">
      {/* Top Header */}
      <div className="admin-tab-header">
        <div>
          <h2>Báo Cáo Doanh Thu Khách Sạn</h2>
          <p className="text-muted">
            Thống kê chi tiết danh sách các đơn đặt phòng được tính vào Doanh thu Dự kiến của khách sạn.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchBookings}>
            <RefreshCw size={14} /> Làm mới
          </button>
          <button className="btn btn-gold btn-sm" onClick={() => onNavigateBookings("Tất cả")}>
            <span>Xem quản lý đặt phòng</span>
          </button>
        </div>
      </div>

      {/* 4 Revenue Summary Metric Cards */}
      <div className="admin-dashboard-metrics-grid mb-4">
        {/* 1. Tổng Doanh Thu Dự Kiến */}
        <div className="admin-metric-box card-glass revenue-box highlight-revenue">
          <div className="a-metric-icon bg-gold"><DollarSign size={24} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Doanh Thu Dự Kiến</span>
            <h3 className="a-metric-val text-gold font-size-lg">{formatCurrency(stats.totalExpectedRevenue)}</h3>
            <small className="text-muted">Tính từ {stats.totalValidBookings} đơn hợp lệ</small>
          </div>
        </div>

        {/* 2. Đã Thu (Đã Thanh Toán) */}
        <div 
          className={`admin-metric-box card-glass clickable ${paymentFilter === "paid" ? "active-filter-card" : ""}`}
          onClick={() => setPaymentFilter(paymentFilter === "paid" ? "Tất cả" : "paid")}
          title="Click để lọc đơn đã thanh toán"
        >
          <div className="a-metric-icon bg-green"><CheckCircle2 size={24} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Đã Thực Thu</span>
            <h3 className="a-metric-val text-success">{formatCurrency(stats.paidRevenue)}</h3>
            <small className="text-muted">Đã chuyển khoản / thanh toán xong</small>
          </div>
        </div>

        {/* 3. Chờ Thu (Tại khách sạn / Chờ thanh toán) */}
        <div 
          className={`admin-metric-box card-glass clickable ${paymentFilter === "pending" ? "active-filter-card" : ""}`}
          onClick={() => setPaymentFilter(paymentFilter === "pending" ? "Tất cả" : "pending")}
          title="Click để lọc đơn chờ thu"
        >
          <div className="a-metric-icon bg-orange"><CreditCard size={24} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Chờ Thu Tiền</span>
            <h3 className="a-metric-val" style={{ color: "#FF6500" }}>{formatCurrency(stats.pendingRevenue)}</h3>
            <small className="text-muted">Thu khi nhận phòng / duyệt</small>
          </div>
        </div>

        {/* 4. Tổng Số Đơn Tính Doanh Thu */}
        <div 
          className="admin-metric-box card-glass clickable"
          onClick={() => onNavigateBookings("Tất cả")}
          title="Click để chuyển sang Quản lý đặt phòng"
        >
          <div className="a-metric-icon bg-blue"><TrendingUp size={24} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Tổng Đơn Hợp Lệ</span>
            <h3 className="a-metric-val text-info">{stats.totalValidBookings} đơn</h3>
            <small className="text-muted">Không tính các đơn đã hủy</small>
          </div>
        </div>
      </div>

      {/* Revenue Bookings Table Card */}
      <div className="card-glass p-4 mb-4">
        <div className="section-header-flex mb-3">
          <div>
            <h3>Danh Sách Đơn Tính Doanh Thu Dự Kiến</h3>
            <p className="text-muted">
              Toàn bộ các đơn đặt phòng hợp lệ (Chờ xác nhận, Đã xác nhận, Đã nhận phòng, Đã thanh toán).
            </p>
          </div>

          <div className="filter-controls-row">
            <div className="search-box-mini">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm mã đơn, tên khách, phòng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-control"
              />
            </div>

            <div className="status-pill-group">
              <button
                className={`btn btn-sm ${paymentFilter === "Tất cả" ? "btn-gold" : "btn-outline-secondary"}`}
                onClick={() => setPaymentFilter("Tất cả")}
              >
                Tất cả ({revenueBookings.length})
              </button>
              <button
                className={`btn btn-sm ${paymentFilter === "paid" ? "btn-success" : "btn-outline-secondary"}`}
                onClick={() => setPaymentFilter("paid")}
              >
                Đã thanh toán
              </button>
              <button
                className={`btn btn-sm ${paymentFilter === "pending" ? "btn-warning" : "btn-outline-secondary"}`}
                onClick={() => setPaymentFilter("pending")}
              >
                Chờ thu
              </button>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Đặt Phòng</th>
                <th>Khách Hàng</th>
                <th>Phòng Đặt</th>
                <th>Ngày Đặt & Lưu Trú</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái Thanh Toán</th>
                <th>Trạng Thái Đơn</th>
                <th className="text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center p-4">
                    <RefreshCw size={24} className="spin-icon mx-auto text-gold mb-2" />
                    <p className="text-muted">Đang tải dữ liệu doanh thu...</p>
                  </td>
                </tr>
              ) : displayBookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-5">
                    <p className="text-muted font-size-lg mb-2">Không có đơn đặt phòng nào</p>
                    <small className="text-muted">
                      {searchTerm ? "Không tìm thấy đơn nào khớp với từ khóa tìm kiếm." : "Chưa có đơn đặt phòng nào được ghi nhận vào doanh thu."}
                    </small>
                  </td>
                </tr>
              ) : (
                displayBookings.map((b) => {
                  const payBadge = getPaymentBadge(b);
                  const PayIcon = payBadge.icon;
                  const createdDateStr = b.createdAt ? new Date(b.createdAt).toLocaleDateString("vi-VN") : "N/A";
                  
                  return (
                    <tr key={b.id || b.bookingCode}>
                      <td>
                        <strong className="code-badge text-gold font-mono">
                          {b.bookingCode || b.id}
                        </strong>
                      </td>
                      <td>
                        <div className="table-customer">
                          <strong>{b.customerName}</strong>
                          <small className="text-muted">{b.phone} • {b.email}</small>
                        </div>
                      </td>
                      <td>
                        <div className="table-room">
                          <strong>{b.roomName}</strong>
                          <small className="text-muted">{b.roomType} • {b.guests} khách</small>
                        </div>
                      </td>
                      <td>
                        <div className="table-dates">
                          <span>{b.checkIn} → {b.checkOut} ({b.nights} đêm)</span>
                          <small className="text-muted">Ngày đặt: {createdDateStr}</small>
                        </div>
                      </td>
                      <td>
                        <strong className="text-gold font-weight-700 font-size-md">
                          {formatCurrency(b.totalPrice)}
                        </strong>
                      </td>
                      <td>
                        <span className={`badge ${payBadge.className} flex-align-center gap-1`}>
                          <PayIcon size={12} />
                          <span>{payBadge.label}</span>
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${
                          b.status === "Đã xác nhận" ? "info" :
                          b.status === "Đã nhận phòng" ? "success" :
                          b.status === "Đã thanh toán" ? "success" :
                          b.status === "Đã trả phòng" ? "secondary" :
                          b.status === "Đã hủy" ? "danger" : "warning"
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => onNavigateBookings(b.status || "Tất cả")}
                          title="Xem trong Quản lý đặt phòng"
                        >
                          <Eye size={14} /> Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

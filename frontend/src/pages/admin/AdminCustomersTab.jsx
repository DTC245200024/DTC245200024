import React, { useState, useEffect, useMemo } from "react";
import { Users, Search, RefreshCw, Eye, Calendar, DollarSign, Phone, Mail, Clock } from "lucide-react";
import { formatCurrency, formatDate, getStatusBadge } from "../../utils/formatters";
import { authApi } from "../../services/api";

export default function AdminCustomersTab({ onToast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Customer Detail & History Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await authApi.getAllUsers();
      if (res.success) {
        // Only show customers (or all accounts)
        setCustomers(res.data.filter(u => u.role?.toUpperCase() !== "ADMIN"));
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      if (onToast) onToast({ type: "error", message: "Lỗi tải danh sách khách hàng" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleViewCustomerHistory = async (user) => {
    setSelectedCustomer(user);
    try {
      setLoadingHistory(true);
      const res = await authApi.getUserBookings(user.id);
      if (res.success) {
        setCustomerBookings(res.data);
      }
    } catch (err) {
      console.error("Error loading user bookings:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filtered = useMemo(() => {
    return customers.filter(c => {
      if (searchTerm.trim() === "") return true;
      const q = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        c.id.toLowerCase().includes(q)
      );
    });
  }, [customers, searchTerm]);

  return (
    <div className="admin-customers-tab">
      <div className="admin-tab-header">
        <div>
          <h2>Quản Lý Danh Sách Khách Hàng</h2>
          <p className="text-muted">Xem thông tin tài khoản khách hàng, số lượng đơn và lịch sử đặt phòng chi tiết.</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchCustomers}>
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* Filter bar */}
      <div className="filter-card card-glass mb-4">
        <div className="input-with-icon">
          <Search size={16} className="input-icon" />
          <input
            type="text"
            placeholder="Tìm theo Tên khách hàng, Email, Số điện thoại hoặc Mã ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-control"
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive card-glass">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã KH</th>
              <th>Họ và Tên</th>
              <th>Email</th>
              <th>Số Điện Thoại</th>
              <th>Ngày Đăng Ký</th>
              <th>Số Đơn Đặt</th>
              <th>Tổng Chi Tiêu</th>
              <th className="text-right">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center p-4">Đang tải danh sách khách hàng...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="8" className="text-center p-4 text-muted">Không tìm thấy khách hàng nào.</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td><strong className="code-badge">{c.id}</strong></td>
                  <td>
                    <div className="user-name-cell">
                      <div className="user-avatar-mini">{c.name.charAt(0).toUpperCase()}</div>
                      <strong>{c.name}</strong>
                    </div>
                  </td>
                  <td>{c.email}</td>
                  <td>{c.phone || "Chưa cập nhật"}</td>
                  <td><small>{formatDate(c.createdAt)}</small></td>
                  <td><span className="badge badge-info">{c.bookingsCount || 0} đơn</span></td>
                  <td><strong className="text-gold">{formatCurrency(c.totalSpent || 0)}</strong></td>
                  <td className="text-right">
                    <button
                      className="btn btn-outline-gold btn-sm"
                      onClick={() => handleViewCustomerHistory(c)}
                    >
                      <Eye size={14} /> Lịch sử đặt
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Booking History Modal */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content modal-lg card-glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Lịch Sử Đặt Phòng: {selectedCustomer.name}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedCustomer(null)}>✕</button>
            </div>

            <div className="modal-body modal-scrollable">
              <div className="customer-info-box mb-3">
                <div className="c-info-grid">
                  <div><span className="text-muted">Email:</span> <strong>{selectedCustomer.email}</strong></div>
                  <div><span className="text-muted">Số điện thoại:</span> <strong>{selectedCustomer.phone}</strong></div>
                  <div><span className="text-muted">Tổng đơn:</span> <strong>{customerBookings.length} đơn</strong></div>
                </div>
              </div>

              {loadingHistory ? (
                <p className="text-center p-4">Đang tải lịch sử đơn đặt...</p>
              ) : customerBookings.length === 0 ? (
                <p className="text-center p-4 text-muted">Khách hàng này chưa có đơn đặt phòng nào.</p>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Mã Đơn</th>
                        <th>Phòng</th>
                        <th>Ngày Lưu Trú</th>
                        <th>Số Đêm</th>
                        <th>Tổng Tiền</th>
                        <th>Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerBookings.map((b) => (
                        <tr key={b.id}>
                          <td><strong className="code-badge text-gold font-mono">{b.bookingCode || b.id}</strong></td>
                          <td>{b.roomName}</td>
                          <td><small>{b.checkIn} → {b.checkOut}</small></td>
                          <td>{b.nights} đêm</td>
                          <td><strong className="text-gold">{formatCurrency(b.totalPrice)}</strong></td>
                          <td><span className={`badge ${getStatusBadge(b.status).className}`}>{b.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

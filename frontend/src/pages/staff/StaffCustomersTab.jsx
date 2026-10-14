import React, { useState, useEffect } from "react";
import { Users, Search, RefreshCw, Eye, Calendar, DollarSign, Phone, Mail, ShieldAlert } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { authApi } from "../../services/api";

export default function StaffCustomersTab({ onToast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await authApi.getAllUsers();
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Không thể tải danh sách khách hàng" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleViewCustomerBookings = async (customer) => {
    setSelectedCustomer(customer);
    try {
      setLoadingBookings(true);
      const res = await authApi.getUserBookings(customer.id);
      if (res.success) {
        setCustomerBookings(res.data);
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi tải lịch sử đặt phòng: " + err.message });
    } finally {
      setLoadingBookings(false);
    }
  };

  const filtered = customers.filter(c => {
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      const matchName = c.name && c.name.toLowerCase().includes(q);
      const matchEmail = c.email && c.email.toLowerCase().includes(q);
      const matchPhone = c.phone && c.phone.includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="staff-customers-content">
      {/* Header */}
      <div className="admin-tab-header">
        <div>
          <h2>Quản Lý Thông Tin Khách Hàng (LỄ TÂN)</h2>
          <p className="text-muted">
            Tra cứu thông tin khách hàng, kiểm tra lịch sử lưu trú để hỗ trợ chăm sóc khách hàng tốt nhất.
          </p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchCustomers}>
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* Filter and Search */}
      <div className="admin-filter-bar card-glass mb-4">
        <div className="search-input-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo họ tên khách, số điện thoại, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-control"
          />
        </div>
        <div className="results-count-badge">
          Tổng số: <strong>{filtered.length}</strong> khách hàng
        </div>
      </div>

      {/* Customers Table */}
      <div className="admin-table-container card-glass">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã KH</th>
              <th>Khách Hàng</th>
              <th>Email</th>
              <th>Số Điện Thoại</th>
              <th>Số Đơn Đặt</th>
              <th>Tổng Chi Tiêu</th>
              <th className="text-right">Lịch Sử Lưu Trú</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center p-4">Đang tải danh sách khách hàng...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" className="text-center p-4 text-muted">Không tìm thấy khách hàng nào.</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td><strong className="code-badge text-gold">{c.id}</strong></td>
                  <td>
                    <div className="flex-align-center gap-2">
                      <div className="user-avatar-mini" style={{ width: "32px", height: "32px", fontSize: "13px" }}>
                        {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                      </div>
                      <strong>{c.name}</strong>
                    </div>
                  </td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td><span className="badge badge-info">{c.bookingsCount || 0} đơn</span></td>
                  <td><strong className="text-gold">{formatCurrency(c.totalSpent || 0)}</strong></td>
                  <td className="text-right">
                    <button
                      className="btn btn-outline-gold btn-sm"
                      onClick={() => handleViewCustomerBookings(c)}
                    >
                      <Eye size={14} /> Xem lịch sử
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* History Modal */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content card-glass max-w-700" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Lịch Sử Đặt Phòng: {selectedCustomer.name}</h3>
                <small className="text-muted">{selectedCustomer.phone} • {selectedCustomer.email}</small>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedCustomer(null)}>✕</button>
            </div>

            <div className="modal-body">
              {loadingBookings ? (
                <div className="text-center p-4">Đang tải lịch sử...</div>
              ) : customerBookings.length === 0 ? (
                <div className="text-center p-4 text-muted">Khách hàng chưa có giao dịch đặt phòng nào.</div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Mã Đơn</th>
                        <th>Phòng</th>
                        <th>Thời Gian</th>
                        <th>Tổng Tiền</th>
                        <th>Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerBookings.map((b) => (
                        <tr key={b.id || b.bookingCode}>
                          <td><strong className="code-badge text-gold font-mono">{b.bookingCode || b.id}</strong></td>
                          <td>{b.roomName}</td>
                          <td><small>{b.checkIn} → {b.checkOut} ({b.nights} đêm)</small></td>
                          <td><strong className="text-gold">{formatCurrency(b.totalPrice)}</strong></td>
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

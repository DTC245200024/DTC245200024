import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, Lock, Unlock, Trash2, Search, 
  RefreshCw, CheckCircle2, ShieldAlert, Key, Mail, Phone, AlertCircle 
} from "lucide-react";
import { authApi } from "../../services/api";

export default function AdminStaffTab({ onToast }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "Staff@123",
    role: "STAFF",
    department: "Lễ tân"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await authApi.getStaffList();
      if (res.success) {
        setStaffList(res.data);
      }
    } catch (err) {
      const msg = err.message || "Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend.";
      if (onToast) onToast({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenModal = () => {
    setErrorMsg("");
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "Staff@123",
      role: "STAFF",
      department: "Lễ tân"
    });
    setShowAddModal(true);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ: Họ tên, Email và Số điện thoại");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authApi.createStaff(formData);
      if (res.success) {
        if (onToast) onToast({ 
          type: "success", 
          title: "Thành công", 
          message: res.message || `Tạo tài khoản lễ tân ${formData.name} thành công!` 
        });
        setShowAddModal(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "Staff@123",
          role: "STAFF",
          department: "Lễ tân"
        });
        fetchStaff();
      }
    } catch (err) {
      const msg = err.message || "Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend.";
      setErrorMsg(msg);
      if (onToast) onToast({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff) => {
    try {
      const res = await authApi.toggleStaffStatus(staff.id);
      if (res.success) {
        setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, status: s.status === "active" ? "locked" : "active" } : s));
        if (onToast) onToast({ type: "success", message: res.message });
      }
    } catch (err) {
      const msg = err.message || "Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend.";
      if (onToast) onToast({ type: "error", message: msg });
    }
  };

  const handleDeleteStaff = async (staff) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản Lễ tân ${staff.name} (${staff.id})?`)) {
      return;
    }
    try {
      const res = await authApi.deleteStaff(staff.id);
      if (res.success) {
        setStaffList(prev => prev.filter(s => s.id !== staff.id));
        if (onToast) onToast({ type: "success", message: "Đã xóa tài khoản lễ tân thành công" });
      }
    } catch (err) {
      const msg = err.message || "Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend.";
      if (onToast) onToast({ type: "error", message: msg });
    }
  };

  const filteredStaff = staffList.filter(s => {
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      const matchName = s.name && s.name.toLowerCase().includes(q);
      const matchEmail = s.email && s.email.toLowerCase().includes(q);
      const matchPhone = s.phone && s.phone.includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="admin-staff-content">
      {/* Top Header */}
      <div className="admin-tab-header">
        <div>
          <h2>Quản Lý Tài Khoản Lễ Tân (STAFF)</h2>
          <p className="text-muted">
            Thêm mới tài khoản Lễ tân, cấp quyền truy cập, tạm khóa hoặc xóa tài khoản Lễ tân khách sạn.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchStaff}>
            <RefreshCw size={14} /> Làm mới
          </button>
          <button className="btn btn-gold btn-sm" onClick={handleOpenModal}>
            <UserPlus size={16} /> Thêm Lễ tân mới
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="admin-dashboard-metrics-grid mb-4">
        <div className="admin-metric-box card-glass">
          <div className="a-metric-icon bg-blue"><Users size={22} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Tổng Số Lễ Tân</span>
            <h3 className="a-metric-val">{staffList.length}</h3>
            <small className="text-muted">Đang làm việc</small>
          </div>
        </div>
        <div className="admin-metric-box card-glass">
          <div className="a-metric-icon bg-green"><CheckCircle2 size={22} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Đang Hoạt Động</span>
            <h3 className="a-metric-val text-success">{staffList.filter(s => s.status !== "locked").length}</h3>
            <small className="text-muted">Có quyền vào /staff</small>
          </div>
        </div>
        <div className="admin-metric-box card-glass">
          <div className="a-metric-icon bg-yellow"><Lock size={22} /></div>
          <div className="a-metric-data">
            <span className="a-metric-label">Tài Khoản Đang Khóa</span>
            <h3 className="a-metric-val text-warning">{staffList.filter(s => s.status === "locked").length}</h3>
            <small className="text-muted">Tạm ngưng quyền</small>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="admin-table-container card-glass">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Họ Và Tên</th>
              <th>Email Đăng Nhập</th>
              <th>Số Điện Thoại</th>
              <th>Chức Vụ</th>
              <th>Trạng Thái</th>
              <th className="text-right">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center p-4">Đang tải danh sách lễ tân...</td></tr>
            ) : filteredStaff.length === 0 ? (
              <tr><td colSpan="7" className="text-center p-4 text-muted">Chưa có tài khoản lễ tân nào.</td></tr>
            ) : (
              filteredStaff.map((staff) => {
                const isLocked = staff.status === "locked";
                return (
                  <tr key={staff.id}>
                    <td><strong className="code-badge text-gold font-mono">{staff.id}</strong></td>
                    <td>
                      <div className="flex-align-center gap-2">
                        <div className="user-avatar-mini" style={{ width: "30px", height: "30px", fontSize: "12px", background: "#3B82F6" }}>L</div>
                        <strong>{staff.name}</strong>
                      </div>
                    </td>
                    <td>{staff.email}</td>
                    <td>{staff.phone}</td>
                    <td><span className="badge badge-info">Lễ tân</span></td>
                    <td>
                      <span className={`badge ${isLocked ? "badge-danger" : "badge-success"}`}>
                        {isLocked ? "🔒 Đã khóa" : "🟢 Đang hoạt động"}
                      </span>
                    </td>
                    <td className="text-right table-actions">
                      <button
                        className={`btn-icon ${isLocked ? "text-success" : "text-warning"}`}
                        title={isLocked ? "Mở khóa tài khoản" : "Tạm khóa tài khoản"}
                        onClick={() => handleToggleStatus(staff)}
                      >
                        {isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                      </button>
                      <button
                        className="btn-icon text-danger"
                        title="Xóa tài khoản lễ tân"
                        onClick={() => handleDeleteStaff(staff)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content card-glass max-w-500" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tạo Tài Khoản Lễ Tân Mới (STAFF)</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div className="modal-body">
                {errorMsg && (
                  <div className="auth-error-alert mb-3">
                    <AlertCircle size={16} className="text-danger flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="form-group mb-3">
                  <label>Họ và tên Lễ tân <span className="text-danger">*</span></label>
                  <div className="input-with-icon">
                    <Users size={16} className="input-icon" />
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Hoàng Thị Mai"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-control"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label>Email đăng nhập <span className="text-danger">*</span></label>
                  <div className="input-with-icon">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      required
                      placeholder="letan3@grandpalace.vn"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-control"
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label>Số điện thoại liên hệ <span className="text-danger">*</span></label>
                  <div className="input-with-icon">
                    <Phone size={16} className="input-icon" />
                    <input
                      type="text"
                      required
                      placeholder="0988223344"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-control"
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label>Mật khẩu khởi tạo</label>
                  <div className="input-with-icon">
                    <Key size={16} className="input-icon" />
                    <input
                      type="text"
                      required
                      placeholder="Staff@123"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input-control"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-gold" disabled={isSubmitting}>
                  {isSubmitting ? "Đang tạo..." : "Xác nhận tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

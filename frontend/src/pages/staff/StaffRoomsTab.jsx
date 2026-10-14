import React, { useState, useEffect } from "react";
import { 
  BedDouble, Search, Filter, RefreshCw, CheckCircle2, 
  AlertCircle, Sparkles, Wrench, Plus, Edit2, Check 
} from "lucide-react";
import { formatCurrency } from "../../utils/formatters";
import { roomApi } from "../../services/api";

export default function StaffRoomsTab({ onToast }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [updatingId, setUpdatingId] = useState(null);

  // Modal State for Add / Edit Room
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "Phòng đơn",
    price: 600000,
    maxGuests: 2,
    size: "30m²",
    bed: "1 Giường Queen",
    view: "Hướng thành phố",
    status: "Trống",
    description: "",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"
  });
  const [savingRoom, setSavingRoom] = useState(false);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await roomApi.getAll();
      if (res.success) {
        setRooms(res.data);
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Không thể tải danh sách phòng" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleUpdateStatus = async (roomId, newStatus) => {
    try {
      setUpdatingId(roomId);
      const res = await roomApi.update(roomId, { status: newStatus });
      if (res.success) {
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
        if (onToast) onToast({ type: "success", message: `Phòng ${roomId} đã đổi trạng thái sang "${newStatus}"` });
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi cập nhật phòng: " + err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenAddModal = () => {
    setEditingRoom(null);
    setFormData({
      name: "",
      type: "Phòng đơn",
      price: 600000,
      maxGuests: 2,
      size: "30m²",
      bed: "1 Giường Queen",
      view: "Hướng thành phố",
      status: "Trống",
      description: "",
      image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"
    });
    setShowRoomModal(true);
  };

  const handleOpenEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      type: room.type,
      price: room.price,
      maxGuests: room.maxGuests || room.capacity || 2,
      size: room.size || "30m²",
      bed: room.bed || "1 Giường đôi",
      view: room.view || "Hướng thành phố",
      status: room.status || "Trống",
      description: room.description || "",
      image: room.image || ""
    });
    setShowRoomModal(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    try {
      setSavingRoom(true);
      if (editingRoom) {
        // Update room
        const res = await roomApi.update(editingRoom.id, formData);
        if (res.success) {
          if (onToast) onToast({ type: "success", message: `Cập nhật thông tin phòng ${editingRoom.id} thành công!` });
          setShowRoomModal(false);
          fetchRooms();
        }
      } else {
        // Add room
        const res = await roomApi.create(formData);
        if (res.success) {
          if (onToast) onToast({ type: "success", message: "Thêm phòng mới thành công!" });
          setShowRoomModal(false);
          fetchRooms();
        }
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi lưu phòng: " + err.message });
    } finally {
      setSavingRoom(false);
    }
  };

  const filteredRooms = rooms.filter(r => {
    if (statusFilter !== "Tất cả" && r.status !== statusFilter) return false;
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      const matchName = r.name && r.name.toLowerCase().includes(q);
      const matchType = r.type && r.type.toLowerCase().includes(q);
      const matchId = r.id && r.id.toLowerCase().includes(q);
      if (!matchName && !matchType && !matchId) return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Trống": return "badge-status-available";
      case "Đã đặt": return "badge-status-booked";
      case "Đang dọn dẹp": return "badge-status-cleaning";
      case "Đang bảo trì": return "badge-status-maintenance";
      default: return "badge-secondary";
    }
  };

  return (
    <div className="staff-rooms-content">
      {/* Header */}
      <div className="admin-tab-header room-mgmt-header">
        <div className="room-mgmt-title-group">
          <h2 className="room-mgmt-main-title">QUẢN LÝ PHÒNG KHÁCH SẠN & TÌNH TRẠNG BUỒNG PHÒNG</h2>
          <p className="room-mgmt-desc">
            Lễ tân có toàn quyền xem, thêm phòng mới, chỉnh sửa thông tin phòng và cập nhật tình trạng phòng theo thời gian thực.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchRooms} type="button">
            <RefreshCw size={15} /> Làm mới
          </button>
          <button className="btn btn-gold btn-sm" onClick={handleOpenAddModal} type="button">
            <Plus size={16} /> Thêm phòng mới
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="room-mgmt-filter-card mb-4">
        <div className="search-input-box">
          <Search size={19} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo mã phòng, tên phòng, loại phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-field"
          />
        </div>

        <div className="filter-select-box">
          <span className="filter-label">Lọc trạng thái:</span>
          <div className="status-tags">
            {[
              { id: "Tất cả", label: "Tất cả", type: "all" },
              { id: "Trống", label: "Trống", type: "available" },
              { id: "Đã đặt", label: "Đã đặt", type: "booked" },
              { id: "Đang dọn dẹp", label: "Đang dọn dẹp", type: "cleaning" },
              { id: "Đang bảo trì", label: "Đang bảo trì", type: "maintenance" }
            ].map(st => (
              <button
                key={st.id}
                type="button"
                className={`status-filter-btn status-btn-${st.type} ${statusFilter === st.id ? "active" : ""}`}
                onClick={() => setStatusFilter(st.id)}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="room-mgmt-table-card">
        <div className="table-responsive">
          <table className="admin-table room-status-table">
            <thead>
              <tr>
                <th style={{ width: "85px" }}>Hình Ảnh</th>
                <th style={{ width: "105px" }}>Mã Phòng</th>
                <th>Tên Phòng & Loại</th>
                <th style={{ width: "115px" }}>Sức Chứa</th>
                <th style={{ width: "140px" }}>Giá / Đêm</th>
                <th style={{ width: "165px" }}>Trạng Thái Hiện Tại</th>
                <th style={{ width: "195px" }}>Đổi Trạng Thái Nhanh</th>
                <th style={{ width: "95px" }} className="text-right">Sửa Phòng</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center p-5 font-weight-500">Đang tải danh sách phòng...</td></tr>
              ) : filteredRooms.length === 0 ? (
                <tr><td colSpan="8" className="text-center p-5 text-muted">Không có phòng nào phù hợp.</td></tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr key={room.id} className="room-row-item">
                    <td>
                      <img 
                        src={room.image || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80"} 
                        alt={room.name}
                        className="room-table-thumbnail"
                      />
                    </td>
                    <td><strong className="code-badge text-gold">{room.id}</strong></td>
                    <td>
                      <div className="room-table-info">
                        <strong className="room-table-name">{room.name}</strong>
                        <div className="room-table-sub">{room.type} • Tầng {room.floor || 1}</div>
                      </div>
                    </td>
                    <td><span className="room-capacity-badge">{room.maxGuests || room.capacity || 2} khách</span></td>
                    <td><strong className="room-price-val">{formatCurrency(room.price)}</strong></td>
                    <td>
                      <span className={`badge ${getStatusBadge(room.status)}`}>
                        {room.status}
                      </span>
                    </td>
                    <td>
                      <select
                        className="room-status-dropdown"
                        value={room.status}
                        disabled={updatingId === room.id}
                        onChange={(e) => handleUpdateStatus(room.id, e.target.value)}
                      >
                        <option value="Trống">🟢 Trống (Sẵn sàng)</option>
                        <option value="Đã đặt">🔵 Đã đặt (Có khách)</option>
                        <option value="Đang dọn dẹp">🟡 Đang dọn dẹp</option>
                        <option value="Đang bảo trì">🔴 Đang bảo trì</option>
                      </select>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn-room-edit"
                        onClick={() => handleOpenEditModal(room)}
                        title="Chỉnh sửa thông tin phòng"
                      >
                        <Edit2 size={14} /> Sửa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Room Modal */}
      {showRoomModal && (
        <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="modal-content card-glass max-w-650" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRoom ? `Chỉnh Sửa Phòng ${editingRoom.id}` : "Thêm Phòng Khách Sạn Mới"}</h3>
              <button className="modal-close-btn" onClick={() => setShowRoomModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveRoom}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label>Tên phòng nghỉ <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: P203 - Phòng Đôi Ban Công Hướng Biển"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-control"
                  />
                </div>

                <div className="form-row-2 mb-3">
                  <div className="form-group">
                    <label>Loại phòng</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="input-control"
                    >
                      <option value="Phòng đơn">Phòng đơn</option>
                      <option value="Phòng đôi">Phòng đôi</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Giá phòng / đêm (VNĐ) <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      required
                      min="100000"
                      step="50000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="input-control"
                    />
                  </div>
                </div>

                <div className="form-row-3 mb-3">
                  <div className="form-group">
                    <label>Sức chứa (người)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.maxGuests}
                      onChange={(e) => setFormData({ ...formData, maxGuests: Number(e.target.value) })}
                      className="input-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Diện tích</label>
                    <input
                      type="text"
                      placeholder="35m²"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="input-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tình trạng ban đầu</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input-control"
                    >
                      <option value="Trống">Trống</option>
                      <option value="Đã đặt">Đã đặt</option>
                      <option value="Đang dọn dẹp">Đang dọn dẹp</option>
                      <option value="Đang bảo trì">Đang bảo trì</option>
                    </select>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label>Mô tả phòng</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả không gian, tiện nghi phòng..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-control"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRoomModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-gold" disabled={savingRoom}>
                  {savingRoom ? "Đang lưu..." : editingRoom ? "Cập nhật phòng" : "Xác nhận thêm phòng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo } from "react";
import { 
  BedDouble, Plus, Edit2, Trash2, Search, Filter, RefreshCw, 
  CheckCircle, AlertTriangle, Users, DollarSign, Image as ImageIcon, Check 
} from "lucide-react";
import { 
  formatCurrency, 
  getStatusBadge, 
  getCanonicalRoomType, 
  getRoomTypeLabel, 
  ROOM_TYPE_OPTIONS 
} from "../utils/formatters";
import { roomApi } from "../services/api";

export default function AdminRoomsPage({ rooms, onReloadRooms, onToast }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Tất cả");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    roomCode: "",
    name: "",
    type: "Phòng đơn",
    price: 500000,
    maxGuests: 2,
    status: "Trống",
    size: "30m²",
    bed: "1 Giường đôi Queen",
    view: "Hướng thành phố",
    image: "",
    description: "",
    amenitiesStr: "Wifi tốc độ cao, Điều hòa 2 chiều, Smart TV, Minibar"
  });

  const roomTypes = ROOM_TYPE_OPTIONS;
  const roomStatuses = [
    { value: "Tất cả", label: "Tất cả trạng thái" },
    { value: "Trống", label: "Trống" },
    { value: "Đã đặt", label: "Đã đặt" },
    { value: "Đang sử dụng", label: "Đang sử dụng" },
    { value: "Đang dọn dẹp", label: "Đang dọn dẹp" },
    { value: "Đang bảo trì", label: "Đang bảo trì" }
  ];

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingRoom(null);
    setFormData({
      roomCode: "RM-" + (100 + rooms.length + 1),
      name: "",
      type: "Phòng đơn",
      price: 650000,
      maxGuests: 2,
      status: "Trống",
      size: "28m²",
      bed: "1 Giường đôi Queen",
      view: "Hướng thành phố",
      image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
      description: "Phòng nghỉ sang trọng, nội thất cao cấp với đầy đủ tiện nghi chuẩn khách sạn 5 sao.",
      amenitiesStr: "Wifi tốc độ cao, Điều hòa 2 chiều, Smart TV 50 inch, Minibar, Bàn làm việc"
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      roomCode: room.roomCode || room.id,
      name: room.name,
      type: room.type,
      price: room.price,
      maxGuests: room.maxGuests,
      status: room.status,
      size: room.size || "30m²",
      bed: room.bed || "1 Giường đôi",
      view: room.view || "Hướng phố",
      image: room.image || "",
      description: room.description || "",
      amenitiesStr: Array.isArray(room.amenities) ? room.amenities.join(", ") : (room.amenities || "")
    });
    setShowModal(true);
  };

  // Handle Save
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert("Vui lòng nhập tên phòng và giá phòng!");
      return;
    }

    try {
      setIsSaving(true);
      const amenitiesArr = formData.amenitiesStr
        ? formData.amenitiesStr.split(",").map(s => s.trim()).filter(Boolean)
        : ["Wifi miễn phí", "Điều hòa"];

      const payload = {
        ...formData,
        price: Number(formData.price),
        maxGuests: Number(formData.maxGuests),
        amenities: amenitiesArr
      };

      if (editingRoom) {
        // Update
        const res = await roomApi.update(editingRoom.id, payload);
        if (res.success) {
          if (onToast) onToast({ type: "success", message: `Đã cập nhật phòng ${res.data.name} thành công!` });
        }
      } else {
        // Create
        const res = await roomApi.create(payload);
        if (res.success) {
          if (onToast) onToast({ type: "success", message: `Đã thêm phòng mới "${res.data.name}" thành công!` });
        }
      }

      setShowModal(false);
      if (onReloadRooms) onReloadRooms();
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi khi lưu phòng: " + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Room
  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phòng "${room.name}" (Mã: ${room.roomCode})?`)) {
      return;
    }

    try {
      const res = await roomApi.delete(room.id);
      if (res.success) {
        if (onToast) onToast({ type: "success", message: `Đã xóa phòng ${room.name} thành công!` });
        if (onReloadRooms) onReloadRooms();
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi xóa phòng: " + err.message });
    }
  };

  // Quick Status Toggle
  const handleQuickStatusToggle = async (room, newStatus) => {
    try {
      const res = await roomApi.update(room.id, { status: newStatus });
      if (res.success) {
        if (onToast) onToast({ type: "success", message: `Đã đổi trạng thái phòng ${room.roomCode} sang "${newStatus}"` });
        if (onReloadRooms) onReloadRooms();
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi cập nhật: " + err.message });
    }
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      // 1. Lọc theo Loại Phòng
      if (typeFilter && typeFilter !== "Tất cả" && typeFilter !== "ALL") {
        const filterCanonical = getCanonicalRoomType(typeFilter);
        const roomRawType = r.type || r.roomType || r.category || "";
        const roomCanonical = getCanonicalRoomType(roomRawType);
        if (filterCanonical !== roomCanonical) return false;
      }

      // 2. Lọc theo Trạng Thái Phòng
      if (statusFilter && statusFilter !== "Tất cả" && statusFilter !== "ALL") {
        const normFilter = String(statusFilter).trim().toLowerCase();
        const normRoom = String(r.status || "").trim().toLowerCase();
        if (normFilter !== normRoom) return false;
      }

      // 3. Lọc theo Ô Tìm Kiếm
      if (searchTerm.trim() !== "") {
        const q = searchTerm.toLowerCase().trim();
        const name = (r.name || "").toLowerCase();
        const code = (r.roomCode || r.id || "").toLowerCase();
        const rawType = (r.type || r.roomType || r.category || "").toLowerCase();
        const labelType = getRoomTypeLabel(r.type || r.roomType || r.category).toLowerCase();
        if (!name.includes(q) && !code.includes(q) && !rawType.includes(q) && !labelType.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [rooms, searchTerm, typeFilter, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = rooms.length;
    const available = rooms.filter(r => r.status === "Trống").length;
    const booked = rooms.filter(r => r.status === "Đã đặt" || r.status === "Đang sử dụng").length;
    const maintenance = rooms.filter(r => r.status === "Đang bảo trì" || r.status === "Đang dọn dẹp").length;
    return { total, available, booked, maintenance };
  }, [rooms]);

  return (
    <div className="admin-rooms-page">
      {/* Page Header */}
      <div className="page-hero-banner">
        <div className="container text-center">
          <div className="section-subtitle text-gold">QUẢN TRỊ VIÊN</div>
          <h1 className="page-hero-title">Quản Lý Danh Sách Phòng Khách Sạn</h1>
          <p className="page-hero-desc">
            Thêm mới phòng, điều chỉnh giá, thay đổi hình ảnh và cập nhật trạng thái phòng.
          </p>
        </div>
      </div>

      <div className="container page-main-content">
        {/* Metrics Row */}
        <div className="admin-metrics-grid mb-4">
          <div className="metric-card card-glass">
            <div className="metric-icon bg-blue"><BedDouble size={24} /></div>
            <div>
              <span className="metric-label">Tổng Số Phòng</span>
              <h3 className="metric-val">{metrics.total}</h3>
            </div>
          </div>
          <div className="metric-card card-glass">
            <div className="metric-icon bg-green"><CheckCircle size={24} /></div>
            <div>
              <span className="metric-label">Phòng Đang Trống</span>
              <h3 className="metric-val text-success">{metrics.available}</h3>
            </div>
          </div>
          <div className="metric-card card-glass">
            <div className="metric-icon bg-red"><Users size={24} /></div>
            <div>
              <span className="metric-label">Phòng Đã Đặt</span>
              <h3 className="metric-val text-danger">{metrics.booked}</h3>
            </div>
          </div>
          <div className="metric-card card-glass">
            <div className="metric-icon bg-yellow"><AlertTriangle size={24} /></div>
            <div>
              <span className="metric-label">Đang Bảo Trì</span>
              <h3 className="metric-val text-warning">{metrics.maintenance}</h3>
            </div>
          </div>
        </div>

        {/* Action & Filter Bar */}
        <div className="filter-card card-glass mb-4">
          <div className="admin-rooms-filter-row">
            <div className="search-field-grow">
              <div className="input-with-icon">
                <Search size={16} className="input-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm mã phòng, tên phòng, loại phòng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-control"
                />
              </div>
            </div>

            <div className="select-filter-group">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-control"
                id="admin-room-type-filter"
                title="Lọc theo loại phòng"
              >
                {roomTypes.map(t => (
                  <option key={t.value || t} value={t.value || t}>
                    {t.label || t}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-control"
                id="admin-room-status-filter"
                title="Lọc theo trạng thái phòng"
              >
                {roomStatuses.map(s => (
                  <option key={s.value || s} value={s.value || s}>
                    {s.label || s}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn btn-gold btn-add-room" onClick={handleOpenAdd}>
              <Plus size={18} />
              <span>Thêm phòng mới</span>
            </button>
          </div>
        </div>

        {/* Rooms Table */}
        <div className="table-responsive card-glass">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Hình Ảnh</th>
                <th>Mã & Tên Phòng</th>
                <th>Loại Phòng</th>
                <th>Giá / Đêm</th>
                <th>Sức Chứa</th>
                <th>Trạng Thái</th>
                <th className="text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-5 text-muted">
                    <div className="py-4">
                      <BedDouble size={36} className="text-gold mx-auto mb-2 opacity-50" />
                      <p className="font-size-md font-weight-600 mb-1 text-navy">Không tìm thấy phòng nào phù hợp</p>
                      <small className="text-muted mb-3 d-block">
                        Không có phòng nào thỏa mãn các điều kiện lọc hiện tại.
                      </small>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => {
                          setTypeFilter("Tất cả");
                          setStatusFilter("Tất cả");
                          setSearchTerm("");
                        }}
                      >
                        Đặt lại bộ lọc
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  const statusBadge = getStatusBadge(room.status);
                  return (
                    <tr key={room.id}>
                      <td style={{ width: "80px" }}>
                        <img
                          src={room.image || "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=200&q=80"}
                          alt={room.name}
                          className="admin-room-thumb"
                        />
                      </td>
                      <td>
                        <div>
                          <strong className="code-badge">{room.roomCode || room.id}</strong>
                          <div className="font-weight-600">{room.name}</div>
                          <small className="text-muted">{room.size} • {room.view}</small>
                        </div>
                      </td>
                      <td>
                        <span className="room-type-tag">{getRoomTypeLabel(room.type || room.roomType)}</span>
                      </td>
                      <td>
                        <strong className="text-gold">{formatCurrency(room.price)}</strong>
                      </td>
                      <td>
                        <span>{room.maxGuests} người lớn</span>
                      </td>
                      <td>
                        <select
                          value={room.status}
                          onChange={(e) => handleQuickStatusToggle(room, e.target.value)}
                          className={`status-dropdown badge-${statusBadge.className}`}
                        >
                          <option value="Trống">Trống</option>
                          <option value="Đã đặt">Đã đặt</option>
                          <option value="Đang sử dụng">Đang sử dụng</option>
                          <option value="Đang dọn dẹp">Đang dọn dẹp</option>
                          <option value="Đang bảo trì">Đang bảo trì</option>
                        </select>
                      </td>
                      <td className="text-right table-actions">
                        <button
                          className="btn-icon text-info"
                          title="Chỉnh sửa thông tin phòng"
                          onClick={() => handleOpenEdit(room)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon text-danger"
                          title="Xóa phòng"
                          onClick={() => handleDeleteRoom(room)}
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

        {/* Add / Edit Room Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content modal-lg card-glass" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingRoom ? `Chỉnh Sửa Phòng: ${editingRoom.roomCode}` : "Thêm Phòng Nghỉ Mới"}</h3>
                <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveRoom}>
                <div className="modal-body modal-scrollable">
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Mã phòng <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.roomCode}
                        onChange={(e) => setFormData({ ...formData, roomCode: e.target.value })}
                        className="input-control"
                        placeholder="Ví dụ: RM-103"
                      />
                    </div>

                    <div className="form-group">
                      <label>Tên hiển thị phòng <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input-control"
                        placeholder="Ví dụ: Phòng Deluxe Ban Công Hoàng Hôn"
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Loại phòng</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="input-control"
                      >
                        <option value="Phòng đơn">Phòng đơn</option>
                        <option value="Phòng đôi">Phòng đôi</option>
                        <option value="Phòng Deluxe">Phòng Deluxe</option>
                        <option value="Phòng VIP">Phòng VIP</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Giá phòng / đêm (VND) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        step="50000"
                        min="100000"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="input-control"
                      />
                    </div>

                    <div className="form-group">
                      <label>Sức chứa tối đa (Khách)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.maxGuests}
                        onChange={(e) => setFormData({ ...formData, maxGuests: e.target.value })}
                        className="input-control"
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Diện tích</label>
                      <input
                        type="text"
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        className="input-control"
                        placeholder="Ví dụ: 35m²"
                      />
                    </div>

                    <div className="form-group">
                      <label>Loại giường</label>
                      <input
                        type="text"
                        value={formData.bed}
                        onChange={(e) => setFormData({ ...formData, bed: e.target.value })}
                        className="input-control"
                        placeholder="Ví dụ: 1 Giường King lớn"
                      />
                    </div>

                    <div className="form-group">
                      <label>Hướng nhìn (View)</label>
                      <input
                        type="text"
                        value={formData.view}
                        onChange={(e) => setFormData({ ...formData, view: e.target.value })}
                        className="input-control"
                        placeholder="Ví dụ: Hướng biển Panorama"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input-control"
                    >
                      <option value="Trống">Trống</option>
                      <option value="Đã đặt">Đã đặt</option>
                      <option value="Đang sử dụng">Đang sử dụng</option>
                      <option value="Đang dọn dẹp">Đang dọn dẹp</option>
                      <option value="Đang bảo trì">Đang bảo trì</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Link hình ảnh phòng (URL)</label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="input-control"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Tiện nghi phòng (cách nhau bằng dấu phẩy)</label>
                    <input
                      type="text"
                      value={formData.amenitiesStr}
                      onChange={(e) => setFormData({ ...formData, amenitiesStr: e.target.value })}
                      className="input-control"
                      placeholder="Wifi tốc độ cao, Điều hòa, Smart TV, Bồn tắm sục, Minibar"
                    />
                  </div>

                  <div className="form-group">
                    <label>Mô tả chi tiết phòng</label>
                    <textarea
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input-control"
                      placeholder="Mô tả trải nghiệm, phong cách thiết kế, tiện ích nổi bật..."
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-gold btn-glow" disabled={isSaving}>
                    {isSaving ? "Đang lưu..." : (editingRoom ? "Lưu Thay Đổi" : "Thêm Phòng")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

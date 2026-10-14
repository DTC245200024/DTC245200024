import React, { useState, useMemo, useEffect } from "react";
import RoomCard from "../components/RoomCard";
import { formatCurrency, getCanonicalRoomType, getRoomTypeLabel } from "../utils/formatters";
import { 
  SlidersHorizontal, Search, RefreshCw, BedDouble, 
  ChevronDown, DollarSign, Users, CheckCircle2 
} from "lucide-react";
import { INITIAL_ROOMS } from "../data/mockRooms";

export default function RoomsPage({ 
  rooms = INITIAL_ROOMS, 
  onSelectRoom, 
  onViewDetails, 
  filterParams = {}, 
  setFilterParams,
  hotelSettings 
}) {
  const hotelName = hotelSettings?.hotelName || "HOTEL 5 SAO";
  // If rooms prop is empty for any reason, fallback to INITIAL_ROOMS
  const safeRooms = (rooms && rooms.length > 0) ? rooms : INITIAL_ROOMS;

  const [searchTerm, setSearchTerm] = useState(filterParams.search || "");
  const [selectedType, setSelectedType] = useState(filterParams.type || "Tất cả");
  const [selectedStatus, setSelectedStatus] = useState(filterParams.status || "Tất cả");
  const [maxPrice, setMaxPrice] = useState(filterParams.maxPrice ? Number(filterParams.maxPrice) : 5000000);
  const [guestsFilter, setGuestsFilter] = useState(filterParams.guests || "Tất cả");
  const [sortBy, setSortBy] = useState("default");

  // Đồng bộ lại state khi filterParams thay đổi (ví dụ tìm kiếm từ Trang chủ)
  useEffect(() => {
    if (filterParams.search !== undefined) {
      setSearchTerm(filterParams.search);
    }
    if (filterParams.type !== undefined) {
      setSelectedType(filterParams.type);
    }
    if (filterParams.status !== undefined) {
      setSelectedStatus(filterParams.status);
    }
    if (filterParams.maxPrice !== undefined) {
      setMaxPrice(Number(filterParams.maxPrice));
    }
    if (filterParams.guests !== undefined) {
      setGuestsFilter(filterParams.guests);
    }
  }, [filterParams]);

  const roomTypes = ["Tất cả", "Phòng đơn", "Phòng đôi", "Deluxe", "VIP"];
  const roomStatuses = ["Tất cả", "Trống", "Đã đặt", "Đang bảo trì"];

  // Filter and Sort rooms
  const filteredRooms = useMemo(() => {
    return safeRooms.filter((room) => {
      // 1. Type filter
      if (selectedType !== "Tất cả" && selectedType !== "ALL") {
        const filterCanonical = getCanonicalRoomType(selectedType);
        const roomCanonical = getCanonicalRoomType(room.type || room.roomType || room.category);
        if (filterCanonical !== roomCanonical) {
          return false;
        }
      }

      // 2. Status filter
      if (selectedStatus !== "Tất cả" && room.status !== selectedStatus) {
        return false;
      }

      // 3. Price filter
      if (Number(room.price) > maxPrice) {
        return false;
      }

      // 4. Guests filter
      if (guestsFilter !== "Tất cả") {
        const capacity = Number(room.capacity || room.maxGuests || 1);
        if (capacity < Number(guestsFilter)) {
          return false;
        }
      }

      // 5. Search term (hỗ trợ tiếng Việt có dấu, không dấu, chữ hoa/thường)
      if (searchTerm.trim() !== "") {
        const rawQ = searchTerm.toLowerCase().trim();
        const normQ = rawQ.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d");

        const rawName = (room.name || "").toLowerCase();
        const normName = rawName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d");

        const rawCode = (room.roomCode || room.id || "").toLowerCase();
        const normCode = rawCode.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d");

        const rawType = (room.type || room.roomType || room.category || "").toLowerCase();
        const normType = rawType.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d");

        const rawDesc = (room.description || "").toLowerCase();
        const normDesc = rawDesc.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d");

        const isMatch = 
          rawName.includes(rawQ) || normName.includes(normQ) ||
          rawCode.includes(rawQ) || normCode.includes(normQ) ||
          rawType.includes(rawQ) || normType.includes(normQ) ||
          rawDesc.includes(rawQ) || normDesc.includes(normQ);

        if (!isMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "guests-desc") return (b.capacity || b.maxGuests || 1) - (a.capacity || a.maxGuests || 1);
      return 0;
    });
  }, [safeRooms, searchTerm, selectedType, selectedStatus, maxPrice, guestsFilter, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedType("Tất cả");
    setSelectedStatus("Tất cả");
    setMaxPrice(5000000);
    setGuestsFilter("Tất cả");
    setSortBy("default");
    if (setFilterParams) setFilterParams({});
  };

  return (
    <div className="rooms-page-container">
      {/* Page Header */}
      <div className="page-hero-banner">
        <div className="container text-center">
          <div className="section-subtitle text-gold">DANH SÁCH PHÒNG NGHỈ</div>
          <h1 className="page-hero-title">Khám Phá Các Hạng Phòng Nghỉ Dưỡng</h1>
          <p className="page-hero-desc">
            Lựa chọn không gian nghỉ ngơi phù hợp nhất với nhu cầu của bạn và gia đình tại {hotelName}.
          </p>
        </div>
      </div>

      <div className="container page-main-content">
        {/* Filters Card */}
        <div className="filter-card card-glass mb-4">
          <div className="filter-card-header">
            <div className="filter-header-left">
              <SlidersHorizontal size={20} className="text-gold" />
              <h3 className="filter-title">Bộ Lọc & Tìm Kiếm Phòng</h3>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={handleResetFilters}>
              <RefreshCw size={14} />
              <span>Đặt lại bộ lọc</span>
            </button>
          </div>

          <div className="filter-grid">
            {/* Search text */}
            <div className="filter-item">
              <label>Tìm kiếm từ khóa</label>
              <div className="input-with-icon">
                <Search size={16} className="input-icon" />
                <input
                  type="text"
                  placeholder="Tên phòng, mã phòng (P101, P201...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-control"
                />
              </div>
            </div>

            {/* Room Type */}
            <div className="filter-item">
              <label>Loại phòng</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-control"
              >
                {roomTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="filter-item">
              <label>Trạng thái</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-control"
              >
                {roomStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Guests */}
            <div className="filter-item">
              <label>Sức chứa tối thiểu</label>
              <select
                value={guestsFilter}
                onChange={(e) => setGuestsFilter(e.target.value)}
                className="input-control"
              >
                <option value="Tất cả">Tất cả số khách</option>
                <option value="1">1 người trở lên</option>
                <option value="2">2 người trở lên</option>
                <option value="4">4 người trở lên</option>
                <option value="6">6 người trở lên</option>
              </select>
            </div>

            {/* Price slider */}
            <div className="filter-item filter-price-col">
              <div className="price-label-row">
                <label>Giá tối đa / đêm:</label>
                <span className="price-current-value">{formatCurrency(maxPrice)}</span>
              </div>
              <input
                type="range"
                min="500000"
                max="5000000"
                step="100000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="range-slider"
              />
              <div className="range-min-max">
                <span>500.000 ₫</span>
                <span>5.000.000 ₫</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Bar */}
        <div className="results-bar">
          <div className="results-count">
            Hiển thị <strong>{filteredRooms.length}</strong> / {safeRooms.length} phòng nghỉ phù hợp
          </div>
          <div className="sort-box">
            <label>Sắp xếp theo:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-control sort-select"
            >
              <option value="default">Mặc định</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
              <option value="guests-desc">Sức chứa: Nhiều nhất</option>
            </select>
          </div>
        </div>

        {/* Rooms Grid */}
        {filteredRooms.length > 0 ? (
          <div className="rooms-grid">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id || room.roomCode}
                room={room}
                onSelectRoom={onSelectRoom}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        ) : (
          <div className="no-results-card card-glass text-center p-5">
            <BedDouble size={48} className="text-muted mb-3" />
            <h3>Không tìm thấy phòng nào phù hợp</h3>
            <p className="text-muted">
              Vui lòng thử điều chỉnh lại bộ lọc giá, loại phòng hoặc từ khóa tìm kiếm.
            </p>
            <button className="btn btn-gold mt-3" onClick={handleResetFilters}>
              Xem tất cả các phòng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

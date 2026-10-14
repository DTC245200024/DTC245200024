const Room = require("../models/roomModel");

module.exports = {
  // GET /api/rooms
  async getAllRooms(req, res) {
    try {
      const { type, status, minPrice, maxPrice, guests, search } = req.query;
      const rooms = await Room.getAll({ type, status, minPrice, maxPrice, guests, search });
      res.json({
        success: true,
        count: rooms.length,
        data: rooms
      });
    } catch (error) {
      console.error("Error in getAllRooms:", error);
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy danh sách phòng" });
    }
  },

  // GET /api/rooms/:id
  async getRoomById(req, res) {
    try {
      const room = await Room.getById(req.params.id);
      if (!room) {
        return res.status(404).json({ success: false, message: "Không tìm thấy phòng" });
      }
      res.json({ success: true, data: room });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy chi tiết phòng" });
    }
  },

  // POST /api/rooms
  async createRoom(req, res) {
    try {
      const { name, type, price, maxGuests } = req.body;
      if (!name || !type || !price) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ tên phòng, loại phòng và giá" });
      }

      const newRoom = await Room.create(req.body);
      res.status(201).json({
        success: true,
        message: "Tạo phòng thành công",
        data: newRoom
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi tạo phòng mới" });
    }
  },

  // PUT /api/rooms/:id
  async updateRoom(req, res) {
    try {
      const updated = await Room.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: "Không tìm thấy phòng để cập nhật" });
      }
      res.json({
        success: true,
        message: "Cập nhật thông tin phòng thành công",
        data: updated
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi cập nhật phòng" });
    }
  },

  // DELETE /api/rooms/:id
  async deleteRoom(req, res) {
    try {
      const success = await Room.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: "Không tìm thấy phòng để xóa" });
      }
      res.json({
        success: true,
        message: "Xóa phòng thành công"
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi xóa phòng" });
    }
  }
};

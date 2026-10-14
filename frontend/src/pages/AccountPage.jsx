import React, { useState } from "react";
import { User, Mail, Phone, Shield, Calendar, Edit2, Check, ArrowRight } from "lucide-react";
import { authApi } from "../services/api";

export default function AccountPage({ currentUser, onUpdateUser, onToast, setActiveTab, hotelSettings }) {
  const hotelName = hotelSettings?.hotelName || "HOTEL 5 SAO";
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Vui lòng điền họ tên và số điện thoại.");
      return;
    }

    try {
      setIsSaving(true);
      const res = await authApi.updateProfile(currentUser.id, { name, phone });
      if (res.success) {
        onUpdateUser(res.data);
        setIsEditing(false);
        if (onToast) onToast({ type: "success", message: "Đã cập nhật thông tin cá nhân thành công!" });
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi cập nhật: " + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="account-page-container">
      <div className="page-hero-banner">
        <div className="container text-center">
          <div className="section-subtitle text-gold">HỒ SƠ KHÁCH HÀNG</div>
          <h1 className="page-hero-title">Thông Tin Tài Khoản</h1>
          <p className="page-hero-desc">
            Quản lý thông tin cá nhân và thông tin liên hệ của quý khách tại {hotelName}.
          </p>
        </div>
      </div>

      <div className="container page-main-content">
        <div className="account-card card-glass max-w-700 mx-auto">
          <div className="account-header">
            <div className="account-avatar-wrap">
              <div className="account-avatar-big">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </div>
            </div>
            <div className="account-title-box">
              <h2>{currentUser?.name || "Khách Hàng"}</h2>
              <span className="badge badge-info">{currentUser?.role === "admin" ? "Quản Trị Viên" : "Khách Hàng Thành Viên"}</span>
            </div>
          </div>

          {!isEditing ? (
            <div className="account-details-view">
              <div className="acc-info-row">
                <div className="acc-info-icon"><User size={18} className="text-gold" /></div>
                <div className="acc-info-content">
                  <span className="acc-label">Họ và tên</span>
                  <strong>{currentUser?.name}</strong>
                </div>
              </div>

              <div className="acc-info-row">
                <div className="acc-info-icon"><Mail size={18} className="text-gold" /></div>
                <div className="acc-info-content">
                  <span className="acc-label">Địa chỉ Email</span>
                  <strong>{currentUser?.email}</strong>
                </div>
              </div>

              <div className="acc-info-row">
                <div className="acc-info-icon"><Phone size={18} className="text-gold" /></div>
                <div className="acc-info-content">
                  <span className="acc-label">Số điện thoại</span>
                  <strong>{currentUser?.phone}</strong>
                </div>
              </div>

              <div className="acc-info-row">
                <div className="acc-info-icon"><Shield size={18} className="text-gold" /></div>
                <div className="acc-info-content">
                  <span className="acc-label">Loại tài khoản</span>
                  <span>{currentUser?.role === "admin" ? "Quản trị hệ thống" : "Thành viên thân thiết 5 sao"}</span>
                </div>
              </div>

              <div className="account-actions-row mt-4">
                <button className="btn btn-outline-gold" onClick={() => setIsEditing(true)}>
                  <Edit2 size={16} />
                  <span>Chỉnh sửa thông tin</span>
                </button>
                <button className="btn btn-gold" onClick={() => setActiveTab("my-bookings")}>
                  <Calendar size={16} />
                  <span>Xem đơn đặt phòng của tôi</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="account-edit-form">
              <div className="form-group">
                <label>Họ và tên khách hàng</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-control"
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-control"
                />
              </div>

              <div className="account-actions-row mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-gold" disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

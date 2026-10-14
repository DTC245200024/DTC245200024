import React, { useState, useEffect } from "react";
import { 
  Settings, Save, Building, ShieldCheck, 
  CreditCard, RefreshCw, CheckCircle2 
} from "lucide-react";
import { authApi } from "../../services/api";

export default function AdminSettingsTab({ onToast, onReloadSettings }) {
  const [settings, setSettings] = useState({
    hotelName: "HOTEL 5 SAO",
    hotelAddress: "ngã ba bản kè, xã Lâm Bình, tỉnh Tuyên Quang",
    hotelPhone: "1900 6868 - (028) 3822 8888",
    hotelEmail: "nguyenthuychang519@gmail.com",
    checkInTime: "14:00",
    checkOutTime: "12:00",
    cancelPolicyHours: 24,
    vatRate: 10,
    bankName: "Ngân hàng TMCP Quân Đội (MB Bank)",
    bankAccount: "0964880630",
    bankAccountName: "NGUYEN THUY CHANG",
    allowPayAtHotel: true,
    maintenanceMode: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await authApi.getSettings();
      if (res.success && res.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await authApi.updateSettings(settings);
      if (res.success) {
        if (onToast) onToast({ type: "success", message: "Đã lưu thiết lập hệ thống thành công!" });
        if (onReloadSettings) onReloadSettings();
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi lưu cấu hình: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-settings-content main-content">
      {/* Top Header */}
      <div className="admin-tab-header">
        <div>
          <h2>Cấu Hình Thiết Lập Hệ Thống (ADMIN ONLY)</h2>
          <p className="text-muted">
            Quản lý thông tin khách sạn và thông tin tài khoản ngân hàng nhận thanh toán VietQR.
          </p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchSettings} type="button">
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      <div className="content-area">
        <form onSubmit={handleSave} className="card-glass p-4 form-container mb-4">
          {/* Section 1: Thông tin khách sạn */}
          <h4 className="settings-sec-title text-gold mb-3 flex-align-center gap-2">
            <Building size={18} /> 1. Thông Tin Khách Sạn
          </h4>
          <div className="form-row-2 mb-3">
            <div className="form-group">
              <label>Tên khách sạn / Resort</label>
              <input
                type="text"
                className="input-control"
                value={settings.hotelName || ""}
                onChange={(e) => setSettings({ ...settings, hotelName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Hotline CSKH</label>
              <input
                type="text"
                className="input-control"
                value={settings.hotelPhone || ""}
                onChange={(e) => setSettings({ ...settings, hotelPhone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-2 mb-4">
            <div className="form-group">
              <label>Địa chỉ khách sạn</label>
              <input
                type="text"
                className="input-control"
                value={settings.hotelAddress || ""}
                onChange={(e) => setSettings({ ...settings, hotelAddress: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Email liên hệ</label>
              <input
                type="email"
                className="input-control"
                value={settings.hotelEmail || ""}
                onChange={(e) => setSettings({ ...settings, hotelEmail: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Section 2: Ngân hàng & Thanh toán (VietQR) */}
          <h4 className="settings-sec-title text-gold mb-3 flex-align-center gap-2">
            <CreditCard size={18} /> 2. Tài Khoản Ngân Hàng Nhận Chuyển Khoản (VietQR)
          </h4>
          <div className="form-row-3 mb-4">
            <div className="form-group">
              <label>Tên Ngân hàng</label>
              <input
                type="text"
                className="input-control"
                value={settings.bankName || ""}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Số tài khoản</label>
              <input
                type="text"
                className="input-control"
                value={settings.bankAccount || ""}
                onChange={(e) => setSettings({ ...settings, bankAccount: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Chủ tài khoản (Người thụ hưởng)</label>
              <input
                type="text"
                className="input-control"
                value={settings.bankAccountName || ""}
                onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-gold btn-lg btn-glow" disabled={saving}>
            <Save size={18} />
            <span>{saving ? "Đang lưu cấu hình..." : "Lưu Thay Đổi Cấu Hình"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

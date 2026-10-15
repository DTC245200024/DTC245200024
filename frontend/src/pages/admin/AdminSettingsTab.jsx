import React, { useState, useEffect, useRef } from "react";
import { 
  Settings, Save, Building, ShieldCheck, 
  CreditCard, RefreshCw, CheckCircle2, Upload, Trash2,
  Eye, Image as ImageIcon, AlertCircle, X, QrCode, Sparkles, ExternalLink
} from "lucide-react";
import { authApi } from "../../services/api";
import { generateVietQRUrl } from "../../utils/formatters";

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
    maintenanceMode: false,
    qrCodeUrl: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  // File upload & preview state
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState("");
  const [qrFileName, setQrFileName] = useState("");
  const [qrFileSize, setQrFileSize] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [showDynamicQrPreview, setShowDynamicQrPreview] = useState(false);

  const fileInputRef = useRef(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await authApi.getSettings();
      if (res.success && res.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      if (onToast) onToast({ type: "error", message: "Không thể tải cấu hình: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // Get full displayable image URL
  const getFullImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
      return url;
    }
    return `http://localhost:5001${url.startsWith("/") ? url : "/" + url}`;
  };

  // Active QR image URL (preview from file or server url)
  const currentQrImage = qrPreview || (settings.qrCodeUrl ? getFullImageUrl(settings.qrCodeUrl) : "");

  // Validate and select file
  const validateAndSetFile = (file) => {
    if (!file) return false;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/jpg"];
    const ext = file.name.split(".").pop().toLowerCase();
    const validExts = ["png", "jpg", "jpeg", "webp", "svg"];

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      if (onToast) onToast({ 
        type: "error", 
        message: "Định dạng không hợp lệ! Vui lòng chọn tệp ảnh PNG, JPG, JPEG, WEBP hoặc SVG." 
      });
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      if (onToast) onToast({ 
        type: "error", 
        message: "Dung lượng ảnh vượt quá 5MB. Vui lòng chọn tệp ảnh nhỏ hơn 5MB." 
      });
      return false;
    }

    setQrFile(file);
    setQrFileName(file.name);
    setQrFileSize(file.size);
    const objectUrl = URL.createObjectURL(file);
    setQrPreview(objectUrl);

    if (onToast) onToast({ 
      type: "info", 
      message: `Đã chọn ảnh "${file.name}". Bấm "Lưu Thay Đổi Cấu Hình" bên dưới để lưu vĩnh viễn vào hệ thống.` 
    });
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  // Delete QR code
  const handleDeleteQr = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh mã QR thanh toán này không?")) {
      return;
    }

    try {
      setUploadingQr(true);
      if (settings.qrCodeUrl) {
        await authApi.deleteQrCode();
      }
      setQrFile(null);
      setQrPreview("");
      setQrFileName("");
      setQrFileSize(0);
      setSettings(prev => ({ ...prev, qrCodeUrl: "" }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (onToast) onToast({ type: "success", message: "Đã xóa ảnh mã QR thanh toán thành công!" });
      if (onReloadSettings) onReloadSettings();
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi xóa ảnh QR: " + err.message });
    } finally {
      setUploadingQr(false);
    }
  };

  // Submit form
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      let updatedQrUrl = settings.qrCodeUrl;

      // 1. Nếu có tệp mới được chọn từ máy, upload lên server trước
      if (qrFile) {
        const formData = new FormData();
        formData.append("qrImage", qrFile);
        const uploadRes = await authApi.uploadQrCode(formData);
        if (uploadRes.success && uploadRes.data?.qrCodeUrl) {
          updatedQrUrl = uploadRes.data.qrCodeUrl;
        } else {
          throw new Error(uploadRes.message || "Không thể tải lên ảnh mã QR");
        }
      }

      // 2. Lưu toàn bộ thông tin cấu hình vào database bền vững
      const newSettings = {
        ...settings,
        qrCodeUrl: updatedQrUrl
      };
      const res = await authApi.updateSettings(newSettings);
      if (res.success) {
        setSettings(newSettings);
        setQrFile(null);
        setQrPreview("");
        if (onToast) onToast({ 
          type: "success", 
          message: "Đã lưu thiết lập hệ thống và ảnh mã QR VietQR thành công!" 
        });
        if (onReloadSettings) onReloadSettings();
      } else {
        throw new Error(res.message || "Lỗi cập nhật cấu hình");
      }
    } catch (err) {
      if (onToast) onToast({ type: "error", message: "Lỗi lưu cấu hình: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  // Dynamic VietQR preview URL for test
  const dynamicVietQRTestUrl = generateVietQRUrl({
    bankName: settings.bankName,
    bankAccount: settings.bankAccount,
    bankAccountName: settings.bankAccountName,
    amount: 1500000,
    content: "BK2026 TEST",
    customQrUrl: ""
  });

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
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchSettings} type="button" disabled={loading}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Làm mới
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
                placeholder="VD: Ngân hàng Quân Đội (MB Bank)"
                required
              />
            </div>
            <div className="form-group">
              <label>Số tài khoản</label>
              <input
                type="text"
                className="input-control font-mono font-weight-600"
                value={settings.bankAccount || ""}
                onChange={(e) => setSettings({ ...settings, bankAccount: e.target.value })}
                placeholder="VD: 0964880630"
                required
              />
            </div>
            <div className="form-group">
              <label>Chủ tài khoản (Người thụ hưởng)</label>
              <input
                type="text"
                className="input-control text-uppercase"
                value={settings.bankAccountName || ""}
                onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })}
                placeholder="VD: NGUYEN THUY CHANG"
                required
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MỤC MỚI: QUẢN LÝ ẢNH MÃ QR THANH TOÁN VIETQR (ADMIN ONLY) */}
          {/* ========================================================================= */}
          <div className="admin-qr-management-section card-glass p-4 mb-4">
            <div className="qr-sec-header mb-3">
              <div className="flex-align-center gap-2">
                <div className="qr-icon-badge">
                  <QrCode size={20} className="text-gold" />
                </div>
                <div>
                  <h4 className="font-size-md font-weight-700 m-0 text-navy">
                    Ảnh Mã QR Thanh Toán (VietQR)
                  </h4>
                  <p className="text-muted font-size-xs m-0">
                    Ảnh mã QR chính thức sẽ được hiển thị cho khách hàng khi chọn phương thức thanh toán Chuyển khoản ngân hàng.
                  </p>
                </div>
              </div>

              {/* Status pill */}
              <div>
                {currentQrImage ? (
                  <span className="badge badge-success flex-align-center gap-1 font-size-xs">
                    <CheckCircle2 size={13} /> {qrFile ? "Ảnh mới chờ lưu" : "Đã kích hoạt ảnh QR"}
                  </span>
                ) : (
                  <span className="badge badge-warning flex-align-center gap-1 font-size-xs">
                    <AlertCircle size={13} /> Dùng VietQR động mặc định
                  </span>
                )}
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              style={{ display: "none" }}
            />

            <div className="qr-management-grid">
              {/* Left Column: QR Image Preview / Dropzone */}
              <div className="qr-preview-container">
                {currentQrImage ? (
                  <div className="qr-active-card">
                    <div className="qr-img-frame">
                      <img
                        src={currentQrImage}
                        alt="Mã QR thanh toán VietQR"
                        className="qr-active-image"
                        onClick={() => setPreviewModalOpen(true)}
                        title="Click để phóng to ảnh"
                      />
                      <div className="qr-img-overlay" onClick={() => setPreviewModalOpen(true)}>
                        <Eye size={20} />
                        <span>Xem lớn</span>
                      </div>
                    </div>

                    <div className="qr-meta-info mt-2">
                      <span className="qr-meta-filename font-size-xs text-navy font-weight-600 truncate">
                        {qrFileName || (settings.qrCodeUrl ? settings.qrCodeUrl.split("/").pop() : "vietqr.png")}
                      </span>
                      {qrFileSize > 0 && (
                        <span className="qr-meta-size font-size-xs text-muted">
                          ({formatFileSize(qrFileSize)})
                        </span>
                      )}
                    </div>

                    <div className="qr-card-actions mt-3 flex-align-center gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-gold btn-sm flex-1"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving || uploadingQr}
                      >
                        <RefreshCw size={13} />
                        <span>Thay ảnh mới</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleDeleteQr}
                        disabled={saving || uploadingQr}
                        title="Xóa ảnh mã QR này"
                      >
                        <Trash2 size={13} />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Drag and drop upload zone */
                  <div
                    className={`qr-dropzone ${isDragOver ? "drag-active" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="dropzone-inner text-center">
                      <div className="upload-icon-circle mx-auto mb-2">
                        <Upload size={24} className="text-gold" />
                      </div>
                      <h5 className="font-size-sm font-weight-600 mb-1 text-navy">
                        Tải ảnh mã QR từ máy tính lên
                      </h5>
                      <p className="text-muted font-size-xs mb-3">
                        Kéo thả tệp ảnh vào đây hoặc nhấp để duyệt từ máy tính
                      </p>
                      <button
                        type="button"
                        className="btn btn-gold btn-sm btn-glow"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        <ImageIcon size={14} />
                        <span>Chọn tệp ảnh QR</span>
                      </button>
                      <div className="mt-3 font-size-xs text-muted">
                        Hỗ trợ định dạng: <strong>PNG, JPG, JPEG, WEBP, SVG</strong> (Tối đa <strong>5MB</strong>)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Explanations, Live Banking Info & VietQR Dynamic Preview */}
              <div className="qr-info-container">
                <div className="qr-specs-box card-glass p-3 mb-3">
                  <h5 className="font-size-sm font-weight-600 text-gold mb-2 flex-align-center gap-1">
                    <ShieldCheck size={16} /> Thông Tin VietQR Đang Thiết Lập
                  </h5>
                  <div className="specs-list font-size-xs">
                    <div className="specs-row">
                      <span className="specs-label text-muted">Ngân hàng:</span>
                      <strong className="specs-val text-navy">{settings.bankName || "Chưa nhập"}</strong>
                    </div>
                    <div className="specs-row">
                      <span className="specs-label text-muted">Số tài khoản:</span>
                      <strong className="specs-val font-mono text-gold">{settings.bankAccount || "Chưa nhập"}</strong>
                    </div>
                    <div className="specs-row">
                      <span className="specs-label text-muted">Chủ tài khoản:</span>
                      <strong className="specs-val text-navy">{settings.bankAccountName || "Chưa nhập"}</strong>
                    </div>
                    <div className="specs-row">
                      <span className="specs-label text-muted">Cơ chế lưu trữ:</span>
                      <span className="specs-val text-success font-weight-600">
                        {settings.qrCodeUrl ? "Đã lưu trữ bền vững trên Server (/uploads/qr/)" : "Tự động tạo VietQR động"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Option to toggle Dynamic VietQR preview */}
                <div className="dynamic-qr-box p-3 card-glass">
                  <div className="flex-between flex-align-center mb-2">
                    <span className="font-size-xs font-weight-600 text-navy flex-align-center gap-1">
                      <Sparkles size={14} className="text-gold" />
                      Xem thử VietQR động chuẩn NAPAS:
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-xs"
                      onClick={() => setShowDynamicQrPreview(!showDynamicQrPreview)}
                    >
                      {showDynamicQrPreview ? "Ẩn xem thử" : "Hiển thị QR mẫu"}
                    </button>
                  </div>

                  {showDynamicQrPreview && (
                    <div className="dynamic-qr-preview-area text-center pt-2">
                      {settings.bankAccount ? (
                        <>
                          <img
                            src={dynamicVietQRTestUrl}
                            alt="VietQR Động Mẫu"
                            className="dynamic-qr-img mx-auto"
                            style={{ maxWidth: "160px", height: "auto", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                          />
                          <p className="font-size-xs text-muted mt-2 mb-0">
                            VietQR động tự động truyền STK: <strong>{settings.bankAccount}</strong>, số tiền và mã đơn của khách hàng.
                          </p>
                        </>
                      ) : (
                        <p className="font-size-xs text-warning m-0">
                          Vui lòng nhập Số tài khoản và Tên ngân hàng ở trên để xem trước VietQR động.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="admin-notice-box mt-3 p-2 bg-light-soft rounded font-size-xs text-muted">
                    ℹ️ <strong>Quy tắc bảo mật:</strong> Chỉ tài khoản Quản trị viên (ADMIN) mới có quyền cập nhật ảnh mã QR. Khách hàng quét mã chuyển khoản sẽ không tự động đánh dấu đã thanh toán mà phải qua bước đối soát xác nhận của Lễ tân/Admin.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="form-submit-row">
            <button type="submit" className="btn btn-gold btn-lg btn-glow" disabled={saving || uploadingQr}>
              <Save size={18} />
              <span>{saving ? "Đang lưu cấu hình & ảnh QR..." : "Lưu Thay Đổi Cấu Hình"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* MODAL: Full Size QR Image Preview */}
      {previewModalOpen && currentQrImage && (
        <div className="modal-overlay" onClick={() => setPreviewModalOpen(false)}>
          <div className="modal-content card-glass max-w-500 text-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex-between flex-align-center mb-3">
              <h4 className="font-size-md font-weight-700 m-0 text-navy">
                Xem Trước Ảnh Mã QR Thanh Toán
              </h4>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setPreviewModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="qr-modal-image-wrap p-3 bg-white rounded my-2" style={{ display: "inline-block" }}>
              <img
                src={currentQrImage}
                alt="Ảnh mã QR lớn"
                style={{ maxWidth: "100%", maxHeight: "380px", objectFit: "contain" }}
              />
            </div>
            <div className="mt-2 text-muted font-size-xs">
              {settings.bankName} • STK: {settings.bankAccount} • {settings.bankAccountName}
            </div>
            <div className="modal-footer mt-4 justify-content-center">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPreviewModalOpen(false)}
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

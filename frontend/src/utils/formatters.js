// Utility formatters for Hotel Booking System

export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
  }).format(amount);
}

export function formatDate(dateString) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch (e) {
    return dateString;
  }
}

export function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

export function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

export function getTomorrowDateString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

export function getStatusBadge(status) {
  switch (status) {
    case "Trống":
      return { label: "Còn trống", className: "badge-success" };
    case "Đã đặt":
      return { label: "Đã có khách", className: "badge-danger" };
    case "Đang bảo trì":
      return { label: "Bảo trì", className: "badge-warning" };
    case "Chờ thanh toán":
      return { label: "Chờ thanh toán", className: "badge-warning" };
    case "Đã thanh toán":
      return { label: "Đã thanh toán", className: "badge-success" };
    case "Thanh toán tại khách sạn":
      return { label: "Thanh toán tại khách sạn", className: "badge-info" };
    case "Đang dọn dẹp":
      return { label: "Đang dọn dẹp", className: "badge-warning" };
    case "Đang sử dụng":
      return { label: "Đang sử dụng", className: "badge-danger" };
    case "Chờ xác nhận":
      return { label: "Chờ xác nhận", className: "badge-warning" };
    case "Khách yêu cầu nhận phòng":
    case "Đã xác nhận":
      return { label: "Đã xác nhận", className: "badge-info" };
    case "Đã nhận phòng":
      return { label: "Đã nhận phòng", className: "badge-success" };
    case "Khách yêu cầu trả phòng":
    case "Yêu cầu trả phòng":
      return { label: "Khách yêu cầu trả phòng", className: "badge-checkout-req" };
    case "Đã trả phòng":
      return { label: "Đã trả phòng", className: "badge-secondary" };
    case "Đã hủy":
      return { label: "Đã hủy", className: "badge-danger" };
    default:
      return { label: status || "N/A", className: "badge-secondary" };
  }
}

/**
 * Chuẩn hóa giá trị loại phòng thành mã định danh ổn định (Canonical Room Type)
 * Xử lý triệt để khoảng trắng thừa, chữ hoa/thường, có/không dấu, và các biến thể viết:
 * - "Phòng đơn", "phong don", "single", "don" => "SINGLE"
 * - "Phòng đôi", "phong doi", "double", "doi" => "DOUBLE"
 * - "Phòng Deluxe", "Deluxe", "deluxe", "phong deluxe", "dlx" => "DELUXE"
 * - "Phòng VIP", "VIP", "vip", "phong vip", "suite" => "VIP"
 */
export function getCanonicalRoomType(rawType) {
  if (!rawType) return "";
  const s = String(rawType)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Xóa dấu tiếng Việt

  if (s === "all" || s === "tat ca" || s === "tat ca loai phong") return "ALL";
  if (s.includes("deluxe") || s === "dlx") return "DELUXE";
  if (s.includes("vip") || s.includes("suite")) return "VIP";
  if (s.includes("doi") || s.includes("double") || s.includes("twin")) return "DOUBLE";
  if (s.includes("don") || s.includes("single")) return "SINGLE";

  return s.toUpperCase();
}

/**
 * Lấy nhãn tiếng Việt chuẩn hiển thị cho từng loại phòng
 */
export function getRoomTypeLabel(rawType) {
  const canonical = getCanonicalRoomType(rawType);
  switch (canonical) {
    case "SINGLE":
      return "Phòng đơn";
    case "DOUBLE":
      return "Phòng đôi";
    case "DELUXE":
      return "Phòng Deluxe";
    case "VIP":
      return "Phòng VIP";
    default:
      return rawType || "Tiêu chuẩn";
  }
}

/**
 * Danh sách lựa chọn loại phòng dùng cho Dropdown
 */
export const ROOM_TYPE_OPTIONS = [
  { value: "Tất cả", label: "Tất cả loại phòng" },
  { value: "Phòng đơn", label: "Phòng đơn" },
  { value: "Phòng đôi", label: "Phòng đôi" },
  { value: "Phòng Deluxe", label: "Phòng Deluxe" },
  { value: "Phòng VIP", label: "Phòng VIP" }
];

/**
 * Trích xuất tiêu đề chính và phụ đề từ tên khách sạn để hiển thị Logo thương hiệu
 * - Nếu tên chứa các cụm như "Luxury Hotel & Resort", "Hotel & Resort", "Resort & Spa", v.v...
 *   thì tách thành title và subtitle riêng.
 * - Nếu là tên ngắn như "HOTEL 5 SAO", "GRAND PALACE", v.v...
 *   thì title = tên đầy đủ, subtitle = "".
 * - Có giá trị dự phòng mặc định nếu tên khách sạn rỗng.
 */
export function getBrandLogoDetails(hotelName) {
  const defaultName = "HOTEL 5 SAO";
  const rawName = (hotelName && String(hotelName).trim()) ? String(hotelName).trim() : defaultName;

  const regexPatterns = [
    /^(.*?)\s+[-–—•|]\s+(.*)$/i,
    /^(.*?)\s+(Luxury Hotel\s*&\s*Resort.*)$/i,
    /^(.*?)\s+(Hotel\s*&\s*Resort.*)$/i,
    /^(.*?)\s+(Resort\s*&\s*Spa.*)$/i,
    /^(.*?)\s+(Hotel\s*&\s*Spa.*)$/i,
    /^(.*?)\s+(Luxury Hotel.*)$/i
  ];

  for (const pattern of regexPatterns) {
    const match = rawName.match(pattern);
    if (match && match[1].trim() && match[2].trim()) {
      return {
        fullName: rawName,
        title: match[1].trim().toUpperCase(),
        subtitle: match[2].trim().toUpperCase()
      };
    }
  }

  return {
    fullName: rawName,
    title: rawName.toUpperCase(),
    subtitle: ""
  };
}

/**
 * Trích xuất mã viết tắt chuẩn ngân hàng cho VietQR QuickLink
 */
export function getVietQRBankCode(bankName) {
  if (!bankName) return "MB";
  const s = String(bankName).toLowerCase();
  if (s.includes("quân đội") || s.includes("mb")) return "MB";
  if (s.includes("vietcombank") || s.includes("vcb")) return "VCB";
  if (s.includes("techcombank") || s.includes("tcb")) return "TCB";
  if (s.includes("bidv")) return "BIDV";
  if (s.includes("vietinbank") || s.includes("ctg") || s.includes("icb")) return "ICB";
  if (s.includes("vpbank") || s.includes("vpb")) return "VPB";
  if (s.includes("acb")) return "ACB";
  if (s.includes("tpbank") || s.includes("tpb")) return "TPB";
  if (s.includes("sacombank") || s.includes("stb")) return "STB";
  if (s.includes("vib")) return "VIB";
  if (s.includes("hdbank") || s.includes("hdb")) return "HDB";
  if (s.includes("shb")) return "SHB";
  if (s.includes("agribank") || s.includes("vba")) return "VBA";
  return "MB";
}

/**
 * Tạo URL mã QR thanh toán chuẩn VietQR
 * - Ưu tiên ảnh QR tải lên nếu có
 * - Tự động tạo VietQR động đúng tài khoản, số tiền và nội dung chuyển khoản
 */
export function generateVietQRUrl({ bankName, bankAccount, bankAccountName, amount = 0, content = "", customQrUrl = "" }) {
  if (customQrUrl && String(customQrUrl).trim()) {
    const url = String(customQrUrl).trim();
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    const rawEnv = typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL 
      ? String(import.meta.env.VITE_API_URL).trim() 
      : "";
    const serverBase = rawEnv 
      ? rawEnv.replace(/\/api\/?$/, "").replace(/\/+$/, "")
      : (typeof import.meta !== "undefined" && import.meta.env?.PROD ? "" : "http://localhost:5001");
    return `${serverBase}${url.startsWith("/") ? url : "/" + url}`;
  }

  const bankCode = getVietQRBankCode(bankName);
  const cleanAccount = String(bankAccount || "").replace(/\s+/g, "");
  const numAmount = Math.max(0, Math.round(Number(amount) || 0));
  const cleanContent = encodeURIComponent(String(content || "").trim());
  const cleanName = encodeURIComponent(String(bankAccountName || "").trim());

  if (!cleanAccount) return "";

  return `https://img.vietqr.io/image/${bankCode}-${cleanAccount}-compact2.png?amount=${numAmount}&addInfo=${cleanContent}&accountName=${cleanName}`;
}



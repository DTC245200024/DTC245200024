const fs = require("fs");
const path = require("path");
const http = require("http");

async function runTests() {
  console.log("=================================================");
  console.log("🧪 BẮT ĐẦU KIỂM TRA CHỨC NĂNG QUẢN LÝ ẢNH MÃ QR VIETQR");
  console.log("=================================================");

  const BASE_URL = "http://localhost:5001";
  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition, message) {
    testsTotal++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  // 1. Tạo 1 file ảnh PNG test tạm
  const testQrImagePath = path.join(__dirname, "temp_test_qr.png");
  // 1x1 transparent PNG buffer
  const samplePngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  fs.writeFileSync(testQrImagePath, samplePngBuffer);

  // Helper hàm gọi fetch
  // Node 18+ có fetch tích hợp
  try {
    // TEST 1: Lấy cấu hình ban đầu
    console.log("\n--- TEST 1: Kiểm tra API Lấy cấu hình hệ thống ---");
    const getSettingsRes = await fetch(`${BASE_URL}/api/auth/settings`);
    const getSettingsData = await getSettingsRes.json();
    assert(getSettingsRes.status === 200, "GET /api/auth/settings trả về status 200");
    assert(getSettingsData.success === true, "GET /api/auth/settings có success = true");
    assert("qrCodeUrl" in getSettingsData.data, "Cấu hình chứa trường 'qrCodeUrl'");

    // TEST 2: Kiểm tra bảo mật RBAC - Người dùng không phải ADMIN tải lên bị từ chối 403
    console.log("\n--- TEST 2: Kiểm tra phân quyền RBAC (Chỉ ADMIN được phép) ---");
    const formDataCustomer = new FormData();
    const customerBlob = new Blob([samplePngBuffer], { type: "image/png" });
    formDataCustomer.append("qrImage", customerBlob, "qr_customer.png");

    const nonAdminUploadRes = await fetch(`${BASE_URL}/api/auth/settings/qr-upload`, {
      method: "POST",
      headers: {
        "x-user-role": "CUSTOMER",
        "x-user-id": "USR-CUSTOMER"
      },
      body: formDataCustomer
    });
    assert(nonAdminUploadRes.status === 403, "Khách hàng thông thường (CUSTOMER) tải lên bị từ chối 403 Forbidden");

    const staffUploadRes = await fetch(`${BASE_URL}/api/auth/settings/qr-upload`, {
      method: "POST",
      headers: {
        "x-user-role": "STAFF",
        "x-user-id": "USR-STAFF"
      },
      body: formDataCustomer
    });
    assert(staffUploadRes.status === 403, "Nhân viên (STAFF) tải lên bị từ chối 403 Forbidden (chỉ ADMIN)");

    // TEST 3: Kiểm tra định dạng tệp không hợp lệ (.txt)
    console.log("\n--- TEST 3: Kiểm tra lọc định dạng tệp tải lên ---");
    const formDataInvalid = new FormData();
    const textBlob = new Blob(["test text content"], { type: "text/plain" });
    formDataInvalid.append("qrImage", textBlob, "malicious.txt");

    const invalidExtRes = await fetch(`${BASE_URL}/api/auth/settings/qr-upload`, {
      method: "POST",
      headers: {
        "x-user-role": "ADMIN",
        "x-user-id": "USR-001"
      },
      body: formDataInvalid
    });
    assert(invalidExtRes.status === 400, "Tệp không phải hình ảnh (.txt) bị từ chối 400 Bad Request");
    const invalidExtData = await invalidExtRes.json();
    assert(invalidExtData.success === false, "Phản hồi có success = false khi gửi tệp sai định dạng");

    // TEST 4: ADMIN tải lên ảnh QR hợp lệ
    console.log("\n--- TEST 4: ADMIN tải ảnh QR VietQR lên hệ thống ---");
    const formDataAdmin = new FormData();
    const validPngBlob = new Blob([samplePngBuffer], { type: "image/png" });
    formDataAdmin.append("qrImage", validPngBlob, "vietqr_official_test.png");

    const adminUploadRes = await fetch(`${BASE_URL}/api/auth/settings/qr-upload`, {
      method: "POST",
      headers: {
        "x-user-role": "ADMIN",
        "x-user-id": "USR-001"
      },
      body: formDataAdmin
    });
    assert(adminUploadRes.status === 200, "ADMIN tải ảnh QR thành công trả về status 200");
    const adminUploadData = await adminUploadRes.json();
    assert(adminUploadData.success === true, "ADMIN upload trả về success = true");
    const uploadedQrUrl = adminUploadData.qrCodeUrl || adminUploadData.data?.qrCodeUrl;
    assert(typeof uploadedQrUrl === "string" && uploadedQrUrl.startsWith("/uploads/qr/"), `qrCodeUrl trả về đường dẫn hợp lệ: ${uploadedQrUrl}`);

    // TEST 5: Kiểm tra ảnh được lưu vào ổ đĩa và phục vụ tĩnh qua HTTP GET
    console.log("\n--- TEST 5: Kiểm tra cơ chế lưu trữ bền vững & Static Serving ---");
    const filename = path.basename(uploadedQrUrl);
    const diskFilePath = path.join(__dirname, "uploads", "qr", filename);
    assert(fs.existsSync(diskFilePath), `Tệp ảnh tồn tại trên ổ cứng server: ${diskFilePath}`);

    const staticServeRes = await fetch(`${BASE_URL}${uploadedQrUrl}`);
    assert(staticServeRes.status === 200, `Truy cập ảnh tĩnh qua HTTP (${BASE_URL}${uploadedQrUrl}) thành công 200 OK`);
    assert(staticServeRes.headers.get("content-type")?.includes("image/"), "Header content-type trả về đúng định dạng image");

    // TEST 6: Kiểm tra lưu trữ cấu hình bền vững trong backend/data/settings.json
    console.log("\n--- TEST 6: Kiểm tra dữ liệu được lưu bền vững trong settings.json ---");
    const settingsJsonContent = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "settings.json"), "utf8"));
    assert(settingsJsonContent.qrCodeUrl === uploadedQrUrl, `settings.json lưu chính xác qrCodeUrl: ${uploadedQrUrl}`);

    // TEST 7: Kiểm tra khi Admin cập nhật cấu hình chung
    console.log("\n--- TEST 7: Kiểm tra PUT /api/auth/settings vẫn bảo toàn qrCodeUrl ---");
    const updateSettingsRes = await fetch(`${BASE_URL}/api/auth/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "ADMIN",
        "x-user-id": "USR-001"
      },
      body: JSON.stringify({
        ...settingsJsonContent,
        bankName: "Ngân hàng TMCP Quân Đội (MB Bank)",
        bankAccount: "0964880630",
        bankAccountName: "NGUYEN THUY CHANG"
      })
    });
    assert(updateSettingsRes.status === 200, "PUT /api/auth/settings trả về status 200");
    const updatedSettingsData = await updateSettingsRes.json();
    assert(updatedSettingsData.data.qrCodeUrl === uploadedQrUrl, "qrCodeUrl được giữ nguyên và bảo toàn sau khi lưu cấu hình");

    // TEST 8: Kiểm tra chức năng XÓA ảnh QR (Chỉ ADMIN)
    console.log("\n--- TEST 8: Kiểm tra chức năng XÓA ảnh QR ---");
    // Non-admin xóa -> 403
    const nonAdminDeleteRes = await fetch(`${BASE_URL}/api/auth/settings/qr-code`, {
      method: "DELETE",
      headers: {
        "x-user-role": "CUSTOMER"
      }
    });
    assert(nonAdminDeleteRes.status === 403, "CUSTOMER gọi DELETE /api/auth/settings/qr-code bị từ chối 403 Forbidden");

    // ADMIN xóa -> 200
    const adminDeleteRes = await fetch(`${BASE_URL}/api/auth/settings/qr-code`, {
      method: "DELETE",
      headers: {
        "x-user-role": "ADMIN",
        "x-user-id": "USR-001"
      }
    });
    assert(adminDeleteRes.status === 200, "ADMIN xóa ảnh QR thành công 200 OK");
    const adminDeleteData = await adminDeleteRes.json();
    assert(adminDeleteData.success === true, "Xóa ảnh QR trả về success = true");
    assert(adminDeleteData.data.qrCodeUrl === "", "qrCodeUrl trong settings trả về rỗng sau khi xóa");
    assert(!fs.existsSync(diskFilePath), "Tệp ảnh vật lý đã được xóa dọn dẹp sạch sẽ khỏi ổ cứng server");

    // TEST 9: Dọn dẹp tệp test tạm
    if (fs.existsSync(testQrImagePath)) {
      fs.unlinkSync(testQrImagePath);
    }

    console.log("\n=================================================");
    console.log(`📊 KẾT QUẢ KIỂM TRA: ${testsPassed}/${testsTotal} BÀI TEST THÀNH CÔNG!`);
    console.log("=================================================");

    if (testsPassed === testsTotal) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("Lỗi trong quá trình kiểm tra:", err);
    process.exit(1);
  }
}

runTests();

import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Toast from "./components/Toast";

// Public & Customer Pages
import HomePage from "./pages/HomePage";
import RoomsPage from "./pages/RoomsPage";
import RoomDetailPage from "./pages/RoomDetailPage";
import ServicesPage from "./pages/ServicesPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BookingPage from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import AccountPage from "./pages/AccountPage";

// Role-Based Portals
import AdminLayout from "./pages/admin/AdminLayout";
import StaffLayout from "./pages/staff/StaffLayout";

import { roomApi, authApi } from "./services/api";
import { INITIAL_ROOMS } from "./data/mockRooms";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function App() {
  // Navigation: "home" | "rooms" | "room-detail" | "services" | "about" | "contact" | "login" | "register" | "booking" | "my-bookings" | "account" | "staff" | "admin"
  const [activeTab, setActiveTab] = useState("home");
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
  const [preSelectedBooking, setPreSelectedBooking] = useState(null);
  const [filterParams, setFilterParams] = useState({});
  const [toast, setToast] = useState(null);

  // System Hotel Configuration State
  const [hotelSettings, setHotelSettings] = useState({
    hotelName: "HOTEL 5 SAO",
    hotelAddress: "ngã ba bản kè, xã Lâm Bình, tỉnh Tuyên Quang",
    hotelPhone: "1900 6868 - (028) 3822 8888",
    hotelEmail: "nguyenthuychang519@gmail.com",
    bankName: "Ngân hàng TMCP Quân Đội (MB Bank)",
    bankAccount: "0964880630",
    bankAccountName: "NGUYEN THUY CHANG"
  });

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("grand_palace_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Redirect handling for protected actions
  const [redirectAfterAuth, setRedirectAfterAuth] = useState(null);
  const [redirectReason, setRedirectReason] = useState("");

  const showToast = (options) => {
    setToast(options);
  };

  const fetchRooms = async () => {
    try {
      const res = await roomApi.getAll();
      if (res.success && res.data && res.data.length > 0) {
        setRooms(res.data);
      }
    } catch (err) {
      console.error("Failed to load rooms:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await authApi.getSettings();
      if (res.success && res.data) {
        setHotelSettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (hotelSettings?.hotelName) {
      document.title = `${hotelSettings.hotelName} - Hệ Thống Đặt Phòng Khách Sạn Cao Cấp`;
    }
  }, [hotelSettings?.hotelName]);

  const handleSaveUser = (userData) => {
    setCurrentUser(userData);
    if (userData) {
      localStorage.setItem("grand_palace_user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("grand_palace_user");
    }
  };

  const handleLogout = () => {
    handleSaveUser(null);
    showToast({
      type: "info",
      title: "Đã đăng xuất",
      message: "Bạn đã đăng xuất tài khoản thành công."
    });
    setActiveTab("home");
    setPreSelectedBooking(null);
    setRedirectAfterAuth(null);
    setRedirectReason("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // RBAC Tab Navigation Guard
  const handleNavigateTab = (tabId) => {
    // 1. Customer Protected Routes: booking, my-bookings, account
    if (["booking", "my-bookings", "account"].includes(tabId)) {
      if (!currentUser) {
        setRedirectAfterAuth({ tab: tabId });
        setRedirectReason(
          tabId === "booking" 
            ? "Vui lòng đăng nhập để đặt phòng." 
            : tabId === "my-bookings" 
            ? "Vui lòng đăng nhập để xem thông tin đơn đặt phòng." 
            : "Vui lòng đăng nhập để xem thông tin tài khoản."
        );
        showToast({
          type: "warning",
          title: "Yêu cầu đăng nhập",
          message: tabId === "booking" ? "Vui lòng đăng nhập để đặt phòng." : "Vui lòng đăng nhập để tiếp tục."
        });
        setActiveTab("login");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    // 2. Staff Protected Routes: staff
    if (tabId === "staff") {
      if (!currentUser) {
        setRedirectAfterAuth({ tab: "staff" });
        setRedirectReason("Vui lòng đăng nhập bằng tài khoản Lễ tân (STAFF) để truy cập.");
        setActiveTab("login");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (currentUser.role?.toUpperCase() !== "STAFF" && currentUser.role?.toUpperCase() !== "ADMIN") {
        showToast({
          type: "error",
          title: "Từ chối truy cập (403)",
          message: "Chỉ tài khoản Lễ tân (STAFF) mới có quyền truy cập khu vực này."
        });
        setActiveTab("access-denied");
        return;
      }
    }

    // 3. Admin Protected Routes: admin
    if (tabId === "admin") {
      if (!currentUser) {
        setRedirectAfterAuth({ tab: "admin" });
        setRedirectReason("Vui lòng đăng nhập bằng tài khoản Quản trị viên (ADMIN) để truy cập.");
        setActiveTab("login");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (currentUser.role?.toUpperCase() !== "ADMIN") {
        showToast({
          type: "error",
          title: "Từ chối truy cập (403)",
          message: "Chỉ Quản trị viên (ADMIN) mới có quyền truy cập vào Admin Portal."
        });
        setActiveTab("access-denied");
        return;
      }
    }

    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectRoomToBook = (room) => {
    const bookingDraft = {
      roomId: room.id,
      roomName: room.name,
      roomType: room.type,
      roomPrice: room.price
    };

    if (!currentUser) {
      setPreSelectedBooking(bookingDraft);
      setRedirectAfterAuth({
        tab: "booking",
        preSelectedBooking: bookingDraft
      });
      setRedirectReason("Vui lòng đăng nhập để đặt phòng.");
      showToast({
        type: "warning",
        title: "Yêu cầu đăng nhập",
        message: "Vui lòng đăng nhập để đặt phòng."
      });
      setActiveTab("login");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setPreSelectedBooking(bookingDraft);
      setActiveTab("booking");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBookFromDetail = (bookingDraft) => {
    if (!currentUser) {
      setPreSelectedBooking(bookingDraft);
      setRedirectAfterAuth({
        tab: "booking",
        preSelectedBooking: bookingDraft
      });
      setRedirectReason("Vui lòng đăng nhập để đặt phòng.");
      showToast({
        type: "warning",
        title: "Yêu cầu đăng nhập",
        message: "Vui lòng đăng nhập để đặt phòng."
      });
      setActiveTab("login");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setPreSelectedBooking(bookingDraft);
      setActiveTab("booking");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleViewDetails = (room) => {
    setSelectedRoomDetail(room);
    setActiveTab("room-detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Login Success Handler: Role-based destination
  const handleLoginSuccess = (userData) => {
    handleSaveUser(userData);
    const role = (userData.role || "").toUpperCase();

    if (role === "ADMIN") {
      showToast({
        type: "success",
        title: "Đăng nhập Quản Trị Viên thành công!",
        message: `Chào mừng Quản trị viên ${userData.name}. Đang chuyển đến Admin Portal.`
      });
      setActiveTab("admin");
    } else if (role === "STAFF") {
      showToast({
        type: "success",
        title: "Đăng nhập Lễ Tân thành công!",
        message: `Chào mừng ${userData.name}. Đang chuyển đến Staff Portal.`
      });
      setActiveTab("staff");
    } else {
      // CUSTOMER
      showToast({
        type: "success",
        title: "Đăng nhập thành công!",
        message: `Chào mừng ${userData.name} quay trở lại ${hotelSettings?.hotelName || "khách sạn"}.`
      });

      if (redirectAfterAuth) {
        const destination = redirectAfterAuth.tab;
        if (redirectAfterAuth.preSelectedBooking) {
          setPreSelectedBooking(redirectAfterAuth.preSelectedBooking);
        }
        setRedirectAfterAuth(null);
        setRedirectReason("");
        setActiveTab(destination);
      } else {
        setActiveTab("home");
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRegisterSuccess = (userData) => {
    handleSaveUser(userData);
    showToast({
      type: "success",
      title: "Đăng ký thành công!",
      message: `Chúc mừng ${userData.name} đã tạo tài khoản khách hàng thành công.`
    });

    if (redirectAfterAuth) {
      const destination = redirectAfterAuth.tab;
      if (redirectAfterAuth.preSelectedBooking) {
        setPreSelectedBooking(redirectAfterAuth.preSelectedBooking);
      }
      setRedirectAfterAuth(null);
      setRedirectReason("");
      setActiveTab(destination);
    } else {
      setActiveTab("home");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBookingSuccess = (newBooking) => {
    showToast({
      type: "success",
      title: "Đặt phòng thành công!",
      message: `Mã đơn: ${newBooking.bookingCode}. Thông tin đã được ghi nhận trên hệ thống.`
    });
    fetchRooms();
  };

  // 1. Dedicated ADMIN Portal Layout
  if (activeTab === "admin" || activeTab.startsWith("admin-")) {
    if (!currentUser || currentUser.role?.toUpperCase() !== "ADMIN") {
      return (
        <div className="app-layout">
          <Toast toast={toast} onClose={() => setToast(null)} />
          <div className="container py-5 text-center">
            <div className="card-glass max-w-500 mx-auto p-5">
              <ShieldAlert size={56} className="text-danger mb-3 mx-auto" />
              <h2>Quyền Truy Cập Bị Từ Chối (403)</h2>
              <p className="text-muted mt-2">
                Chức năng này yêu cầu quyền <strong>Quản trị viên (ADMIN)</strong>.
                Khách hàng hoặc Lễ tân không được phép truy cập.
              </p>
              <button className="btn btn-gold mt-4" onClick={() => setActiveTab("home")}>
                Quay về Trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <Toast toast={toast} onClose={() => setToast(null)} />
        <AdminLayout
          currentUser={currentUser}
          rooms={rooms}
          onReloadRooms={fetchRooms}
          onLogout={handleLogout}
          onNavigateHome={() => setActiveTab("home")}
          onToast={showToast}
          hotelSettings={hotelSettings}
          onReloadSettings={fetchSettings}
        />
      </>
    );
  }

  // 2. Dedicated STAFF Portal Layout
  if (activeTab === "staff" || activeTab.startsWith("staff-")) {
    if (!currentUser || (currentUser.role?.toUpperCase() !== "STAFF" && currentUser.role?.toUpperCase() !== "ADMIN")) {
      return (
        <div className="app-layout">
          <Toast toast={toast} onClose={() => setToast(null)} />
          <div className="container py-5 text-center">
            <div className="card-glass max-w-500 mx-auto p-5">
              <ShieldAlert size={56} className="text-danger mb-3 mx-auto" />
              <h2>Quyền Truy Cập Bị Từ Chối (403)</h2>
              <p className="text-muted mt-2">
                Chức năng này chỉ dành cho <strong>Nhân viên Lễ tân (STAFF)</strong>.
                Tài khoản khách hàng không có quyền truy cập.
              </p>
              <button className="btn btn-gold mt-4" onClick={() => setActiveTab("home")}>
                Quay về Trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <Toast toast={toast} onClose={() => setToast(null)} />
        <StaffLayout
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigateHome={() => setActiveTab("home")}
          onToast={showToast}
          hotelSettings={hotelSettings}
        />
      </>
    );
  }

  // 3. Access Denied Fallback Screen
  if (activeTab === "access-denied") {
    return (
      <div className="app-layout">
        <Toast toast={toast} onClose={() => setToast(null)} />
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleNavigateTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          hotelSettings={hotelSettings}
          onNavigateLogin={() => {
            setRedirectReason("");
            setActiveTab("login");
          }}
          onNavigateRegister={() => {
            setRedirectReason("");
            setActiveTab("register");
          }}
        />
        <main className="main-content py-5">
          <div className="container text-center">
            <div className="card-glass max-w-500 mx-auto p-5">
              <ShieldAlert size={60} className="text-danger mb-3 mx-auto" />
              <h2>403 - Quyền Truy Cập Bị Từ Chối</h2>
              <p className="text-muted mt-2">
                Hệ thống phân quyền đã chặn yêu cầu này. Tài khoản hiện tại của bạn không có đủ thẩm quyền để truy cập trang này.
              </p>
              <div className="mt-4 flex-justify-center gap-3">
                <button className="btn btn-outline-secondary" onClick={() => setActiveTab("home")}>
                  Trang chủ
                </button>
                {currentUser?.role === "STAFF" && (
                  <button className="btn btn-gold" onClick={() => setActiveTab("staff")}>
                    Vào Bàn Lễ Tân (Staff)
                  </button>
                )}
                {currentUser?.role === "ADMIN" && (
                  <button className="btn btn-gold" onClick={() => setActiveTab("admin")}>
                    Vào Admin Portal
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer setActiveTab={handleNavigateTab} hotelSettings={hotelSettings} />
      </div>
    );
  }

  // 4. Public & Customer Layout
  return (
    <div className="app-layout">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        hotelSettings={hotelSettings}
        onNavigateLogin={() => {
          setRedirectReason("");
          setActiveTab("login");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onNavigateRegister={() => {
          setRedirectReason("");
          setActiveTab("register");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <main className="main-content">
        {activeTab === "home" && (
          <HomePage
            rooms={rooms}
            onSelectRoom={handleSelectRoomToBook}
            onViewDetails={handleViewDetails}
            setActiveTab={handleNavigateTab}
            setFilterParams={setFilterParams}
            hotelSettings={hotelSettings}
          />
        )}

        {activeTab === "rooms" && (
          <RoomsPage
            rooms={rooms}
            onSelectRoom={handleSelectRoomToBook}
            onViewDetails={handleViewDetails}
            filterParams={filterParams}
            setFilterParams={setFilterParams}
            hotelSettings={hotelSettings}
          />
        )}

        {activeTab === "room-detail" && (
          <RoomDetailPage
            room={selectedRoomDetail}
            onBack={() => handleNavigateTab("rooms")}
            onBookRoom={handleBookFromDetail}
            hotelSettings={hotelSettings}
          />
        )}

        {activeTab === "services" && (
          <ServicesPage setActiveTab={handleNavigateTab} hotelSettings={hotelSettings} />
        )}

        {activeTab === "about" && (
          <AboutPage setActiveTab={handleNavigateTab} hotelSettings={hotelSettings} />
        )}

        {activeTab === "contact" && (
          <ContactPage onToast={showToast} hotelSettings={hotelSettings} />
        )}

        {activeTab === "login" && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateRegister={() => {
              setActiveTab("register");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            redirectReason={redirectReason}
            hotelSettings={hotelSettings}
          />
        )}

        {activeTab === "register" && (
          <RegisterPage
            onRegisterSuccess={handleRegisterSuccess}
            onNavigateLogin={() => {
              setActiveTab("login");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            hotelSettings={hotelSettings}
          />
        )}

        {activeTab === "booking" && (
          <BookingPage
            rooms={rooms}
            currentUser={currentUser}
            preSelectedBooking={preSelectedBooking}
            onBookingSuccess={handleBookingSuccess}
            setActiveTab={handleNavigateTab}
            hotelSettings={hotelSettings}
          />
        )}

        {activeTab === "my-bookings" && (
          <MyBookingsPage
            currentUser={currentUser}
            setActiveTab={handleNavigateTab}
            onToast={showToast}
            hotelSettings={hotelSettings}
          />
        )}

        {activeTab === "account" && (
          <AccountPage
            currentUser={currentUser}
            onUpdateUser={handleSaveUser}
            onToast={showToast}
            setActiveTab={handleNavigateTab}
            hotelSettings={hotelSettings}
          />
        )}
      </main>

      <Footer setActiveTab={handleNavigateTab} hotelSettings={hotelSettings} />
    </div>
  );
}

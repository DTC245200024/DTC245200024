// API Service connecting to Backend REST APIs with RBAC Headers
const API_BASE = "http://localhost:5001/api";

function getAuthHeaders() {
  try {
    const savedUser = localStorage.getItem("grand_palace_user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      return {
        "x-user-id": user.id || "",
        "x-user-role": user.role || "CUSTOMER"
      };
    }
  } catch (e) {}
  return {};
}

async function request(endpoint, options = {}) {
  const authHeaders = getAuthHeaders();
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers
    },
    ...options
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      throw new Error(`Phản hồi máy chủ không hợp lệ (HTTP ${res.status})`);
    }

    if (!res.ok) {
      throw new Error(data.message || `Lỗi yêu cầu (HTTP ${res.status})`);
    }
    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      console.error(`Không thể kết nối đến máy chủ ${API_BASE}${endpoint}:`, error);
      throw new Error("Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend.");
    }
    console.error(`API error on ${endpoint}:`, error);
    throw error;
  }
}

export const authApi = {
  register: async (userData) => {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData)
    });
  },

  login: async (credentials) => {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });
  },

  getAllUsers: async () => {
    return request("/auth/users");
  },

  getUserBookings: async (userId) => {
    return request(`/auth/users/${userId}/bookings`);
  },

  getStaffList: async () => {
    return request("/staff");
  },

  createStaff: async (staffData) => {
    return request("/staff", {
      method: "POST",
      body: JSON.stringify({
        ...staffData,
        role: "STAFF"
      })
    });
  },

  toggleStaffStatus: async (id) => {
    return request(`/staff/${id}/status`, {
      method: "PUT"
    });
  },

  deleteStaff: async (id) => {
    return request(`/staff/${id}`, {
      method: "DELETE"
    });
  },

  getSettings: async () => {
    return request("/auth/settings");
  },

  updateSettings: async (settings) => {
    return request("/auth/settings", {
      method: "PUT",
      body: JSON.stringify(settings)
    });
  },

  getProfile: async (id) => {
    return request(`/auth/me/${id}`);
  },

  updateProfile: async (id, data) => {
    return request(`/auth/profile/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }
};

export const roomApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== "") {
        query.append(key, params[key]);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request(`/rooms${queryString}`);
  },

  getById: async (id) => {
    return request(`/rooms/${id}`);
  },

  create: async (roomData) => {
    return request("/rooms", {
      method: "POST",
      body: JSON.stringify(roomData)
    });
  },

  update: async (id, roomData) => {
    return request(`/rooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(roomData)
    });
  },

  delete: async (id) => {
    return request(`/rooms/${id}`, {
      method: "DELETE"
    });
  }
};

export const bookingApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== "") {
        query.append(key, params[key]);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request(`/bookings${queryString}`);
  },

  getById: async (id) => {
    return request(`/bookings/${id}`);
  },

  create: async (bookingData) => {
    return request("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData)
    });
  },

  cancelBooking: async (id, data = {}) => {
    return request(`/bookings/${id}/cancel`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  requestCheckIn: async (id, data = {}) => {
    return request(`/bookings/${id}/request-checkin`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  requestCheckout: async (id, data = {}) => {
    return request(`/bookings/${id}/request-checkout`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  checkIn: async (id, data = {}) => {
    return request(`/bookings/${id}/checkin`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  checkOut: async (id, data = {}) => {
    return request(`/bookings/${id}/checkout`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  confirmBooking: async (id) => {
    return request(`/bookings/${id}/confirm`, {
      method: "PUT"
    });
  },

  confirmPayment: async (id, data = {}) => {
    return request(`/bookings/${id}/payment`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  update: async (id, bookingData) => {
    return request(`/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(bookingData)
    });
  },

  delete: async (id) => {
    return request(`/bookings/${id}`, {
      method: "DELETE"
    });
  }
};

export const statsApi = {
  getStats: async () => {
    return request("/stats");
  }
};

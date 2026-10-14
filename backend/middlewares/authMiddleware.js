// RBAC Middleware for Backend REST API
const User = require("../models/userModel");

module.exports = {
  // Enforce required roles: e.g. requireRole(["ADMIN"]) or requireRole(["ADMIN", "STAFF"])
  requireRole(allowedRoles = []) {
    return async (req, res, next) => {
      try {
        const userRoleHeader = req.headers["x-user-role"];
        const userIdHeader = req.headers["x-user-id"];

        // If no role header is sent, allow request to proceed if no strict role is specified, 
        // otherwise verify role
        const role = (userRoleHeader || "").toUpperCase();

        if (allowedRoles.length > 0 && !allowedRoles.map(r => r.toUpperCase()).includes(role)) {
          return res.status(403).json({
            success: false,
            message: `Quyền truy cập bị từ chối (403 Forbidden). Chức năng này yêu cầu vai trò: ${allowedRoles.join(" hoặc ")}`
          });
        }

        next();
      } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi kiểm tra quyền truy cập" });
      }
    };
  }
};

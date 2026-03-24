const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHeader");
const authServices = require("../../services/Auth/auth.service");
const validateEmail = require("../../validations/validateEmail");
const validatePassword = require("../../validations/validatePassword");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator")
exports.createAdmin = async (req, res) => {
  try {
    let { email, username, password } = req.body || {};
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (/[A-Z]/.test(email)) {
      return errorResponse(res, "Email must be in lowercase only", 400);
    }
    if (!username) {
      return errorResponse(res, "Username is required", 400);
    }
    if (!password) {
      return errorResponse(res, "Password is required", 400);
    }
    username = username.trim()
    if (!validateEmail(email)) {
      return errorResponse(res, "Enter a valid email", 400);
    }
    if (!validatePassword(password)) {
      return errorResponse(
        res,
        "Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        400
      );
    }
    if (username.length < 3) {
      return errorResponse(res, "Username must be at least 3 characters long", 400)
    }
    if (username.length > 15) {
      return errorResponse(res, "Username must be at most 15 characters long", 400)
    }
    if (/^\d+$/.test(username)) {
      return errorResponse(res, "Username cannot contain only numbers", 400);
    }
    let existingEmail = await authServices.getAdminByEmail(email);
    if (existingEmail) {
      return errorResponse(res, "Email already exists", 409);
    }
    let existingUsername = await authServices.getAdminByUsername(username);
    if (existingUsername) {
      return errorResponse(res, "Username already exists", 409);
    }
    let hasedPassword = await bcrypt.hash(password, 10);
    await authServices.createAdmin(email, username, hasedPassword);
    return successResponse(res, {}, "Admin created successfully");
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    let allAdmins = await authServices.getAdmins();
    return successResponse(res, allAdmins, "All admins fetched successfully");
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    let { id } = req.params || {};
    let { email, username, password } = req.body || {};
    if (!id) {
      return errorResponse(res, "Admin id is required", 400);
    }
    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (!username) {
      return errorResponse(res, "Username is required", 400);
    }
    if (!password) {
      return errorResponse(res, "Password is required", 400);
    }
    if (!validateEmail(email)) {
      return errorResponse(res, "Enter a valid email", 400);
    }
    if (!validatePassword(password)) {
      return errorResponse(
        res,
        "Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        400
      );
    }
    let existingAdmin = await authServices.getAdminById(id);
    if (!existingAdmin) {
      return errorResponse(res, "Admin not found", 400);
    }
    let existingEmail = await authServices.getAdminByEmailAndNotId(email, id);
    if (existingEmail) {
      return errorResponse(res, "Email already exists", 400);
    }
    let existingUsername = await authServices.getAdminByUsernameAndNotId(
      username,
      id
    );
    if (existingUsername) {
      return errorResponse(res, "Username already exists", 400);
    }
    let hasedPassword = await bcrypt.hash(password, 10);
    await authServices.updateAdmin(id, email, username, hasedPassword);
    return successResponse(res, {}, "Admin updated successfully");
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    let { id } = req.params || {};
    if (!id) {
      return errorResponse(res, "Admin id is required", 400);
    }
    let existingAdmin = await authServices.getAdminById(id);
    if (!existingAdmin) {
      return errorResponse(res, "Admin not found", 400);
    }
    await authServices.deleteAdmin(id);
    return successResponse(res, {}, "Admin deleted successfully");
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.adminPanelLogin = async (req, res) => {
  try {
    let { username, password } = req.body || {};

    if (!username) {
      return errorResponse(res, "Username is required", 400);
    }
    if (!password) {
      return errorResponse(res, "Password is required", 400);
    }
    // let hasedPassword = await bcrypt.hashSync(password, 10);

    let existingAdmin = await authServices.getAdminByUsername(username);
    if (!existingAdmin) {
      return errorResponse(res, "Username not registered", 400);
    }

    let isPasswordCorrect = await bcrypt.compare(
      password,
      existingAdmin.password
    );
    if (!isPasswordCorrect) {
      return errorResponse(res, "Password is incorrect", 400);
    }
    let token = await jwt.sign(
      {
        id: existingAdmin.id,
        email: existingAdmin.email,
        username: existingAdmin.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const refreshToken = jwt.sign(
      {
        id: existingAdmin.id,
        email: existingAdmin.email,
        username: existingAdmin.username,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    let adminData = {
      id: existingAdmin.id,
      email: existingAdmin.email,
      username: existingAdmin.username,
    };
    return successResponse(
      res,
      { adminData, accessToken: token },
      "Admin logged in successfully"
    );
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.changeAdminPassword = async (req, res) => {
  try {
    let { email, newPassword, oldPassword } = req.body || {};

    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }
    if (!oldPassword) {
      return errorResponse(res, "Old password is required", 400);
    }
    if (!newPassword) {
      return errorResponse(res, "New password is required", 400);
    }
    if (oldPassword === newPassword) {
      return errorResponse(
        res,
        "New password must be different from old password",
        400
      );
    }
    let existingAdmin = await authServices.getChangeAdminPassword(email);
    if (!existingAdmin) {
      return errorResponse(res, "Email not registered", 400);
    }
    let isPasswordCorrect = await bcrypt.compare(
      oldPassword,
      existingAdmin.password
    );
    if (!isPasswordCorrect) {
      return errorResponse(res, "Old password is incorrect", 400);
    }
    if (!validatePassword(newPassword)) {
      return errorResponse(
        res,
        "NewPassword must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        400
      );
    }
    let hasedPassword = await bcrypt.hash(newPassword, 10);
    await authServices.changeAdminPassword(email, hasedPassword);
    return successResponse(res, {}, "Password changed successfully");
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return errorResponse(res, "No refresh token found", 401);
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) return errorResponse(res, "Invalid refresh token", 403);

      const accessToken = jwt.sign(
        {
          id: decoded.id,
          email: decoded.email,
          username: decoded.username,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1m" }
      );

      return successResponse(
        res,
        { accessToken },
        "Token refreshed successfully"
      );
    });
  } catch (error) {
    return errorResponse(res, "Internal server error", 500);
  }
};

exports.getCompantDetails = async (req, res) => {
  try {
    let { companyId } = req.params || {}
    if (!companyId) {
      return errorResponse(res, "Company Id is required")
    }
    if (!validator.isUUID(companyId)) {
      return errorResponse(res, "Invalid company id", 400)
    }
    let companyDetails = await authServices.getCompanyDetailsBasedOnId(companyId)
    if (!companyDetails) {
      return errorResponse(res, "Company details not found", 404)
    }
    return successResponse(res, companyDetails, "Company details fetched successfully", 200)
  } catch (error) {
    return errorResponse(res, "Internal server error", 500)
  }
}
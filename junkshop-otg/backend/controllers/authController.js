const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Junkshop = require('../models/Junkshop');
const {
  evaluateProfile,
  syncProfileComplete,
  hasValidPhone,
  normalizePhone,
} = require('../utils/profileCompletion');

const DEFAULT_SHOP_LOCATION = { lat: 14.5995, lng: 121.0055 };
const nameRegex = /^[A-Za-zÀ-ÿÑñ\s.'-]+$/;
const phoneRegex = /^(\+63|0)9\d{9}$/;

// Create JWT token for logged-in users
const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
};

const userPayload = (user) => ({
  id: user._id,
  role: user.role,
  firstName: user.firstName,
  middleName: user.middleName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  junkshopName: user.junkshopName,
  address: user.address,
  status: user.status,
  pickupServiceFee: user.pickupServiceFee ?? 0,
  pickupEnabled: user.pickupEnabled !== false,
  gcashNumber: user.gcashNumber || '',
  gcashQrUrl: user.gcashQrUrl || '',
  profileComplete: Boolean(user.profileComplete),
  leaderboardVisible: user.leaderboardVisible !== false,
});

async function buildUserResponse(user) {
  const profileStatus = await evaluateProfile(user);
  return {
    ...userPayload(user),
    profileComplete: profileStatus.complete,
    profileStatus,
  };
}

// Register new user
const registerUser = async (req, res) => {
  try {
    const {
      role = 'customer',
      firstName,
      middleName,
      lastName,
      email,
      phone,
      password,
      junkshopName,
      address,
    } = req.body;

    const cleanedRole = role.trim().toLowerCase();
    const cleanedFirstName = firstName?.trim();
    const cleanedMiddleName = middleName?.trim() || '';
    const cleanedLastName = lastName?.trim();
    const cleanedEmail = email?.trim().toLowerCase();
    const cleanedPhone = phone?.trim() || '';
    const cleanedJunkshopName = junkshopName?.trim() || '';
    const cleanedAddress = address?.trim() || '';

    const allowedRoles = ['customer', 'provider'];
    const nameRegex = /^[A-Za-zÀ-ÿÑñ\s.'-]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+63|0)9\d{9}$/;

    if (!allowedRoles.includes(cleanedRole)) {
      return res.status(400).json({ message: 'Invalid account role.' });
    }

    if (!cleanedFirstName || !cleanedLastName || !cleanedEmail || !password) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    if (!nameRegex.test(cleanedFirstName)) {
      return res.status(400).json({ message: 'First name must contain letters only.' });
    }

    if (cleanedMiddleName && !nameRegex.test(cleanedMiddleName)) {
      return res.status(400).json({ message: 'Middle name must contain letters only.' });
    }

    if (!nameRegex.test(cleanedLastName)) {
      return res.status(400).json({ message: 'Last name must contain letters only.' });
    }

    if (!emailRegex.test(cleanedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    if (cleanedPhone && !phoneRegex.test(cleanedPhone)) {
      return res.status(400).json({
        message: 'Please enter a valid Philippine phone number.',
      });
    }

    if (cleanedRole === 'provider') {
      // Shop details collected in Settings after signup.
    }

    const existingUser = await User.findOne({ email: cleanedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      role: cleanedRole,
      firstName: cleanedFirstName,
      middleName: cleanedMiddleName,
      lastName: cleanedLastName,
      email: cleanedEmail,
      phone: cleanedPhone,
      password: hashedPassword,
      junkshopName: cleanedJunkshopName,
      address: cleanedAddress,
    });

    await syncProfileComplete(user._id);
    const freshUser = await User.findById(user._id);
    const token = createToken(freshUser);

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: await buildUserResponse(freshUser),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// Login existing user
const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const cleanedEmail = email?.trim().toLowerCase();
    const cleanedRole = role?.trim().toLowerCase();

    if (!cleanedEmail || !password) {
      return res.status(400).json({ message: 'Please enter both email and password.' });
    }

    const user = await User.findOne({ email: cleanedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (cleanedRole && user.role !== cleanedRole) {
      return res.status(403).json({
        message: 'This account does not match the selected role.',
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ message: 'This account has been banned.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'This account is currently suspended.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    await syncProfileComplete(user._id);
    const freshUser = await User.findById(user._id);
    const token = createToken(freshUser);

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: await buildUserResponse(freshUser),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.' });
  }
};

const getCurrentUser = async (req, res) => {
  await syncProfileComplete(req.user._id);
  const freshUser = await User.findById(req.user._id);
  res.status(200).json({
    user: await buildUserResponse(freshUser),
  });
};

const updateProviderProfile = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Provider account required.' });
    }

    const {
      pickupServiceFee,
      pickupEnabled,
      gcashNumber,
      gcashQrUrl,
      junkshopName,
      phone,
      address,
    } = req.body;

    if (pickupServiceFee !== undefined) {
      req.user.pickupServiceFee = Math.max(0, Number(pickupServiceFee) || 0);
    }
    if (pickupEnabled !== undefined) {
      req.user.pickupEnabled = Boolean(pickupEnabled);
    }
    if (gcashNumber !== undefined) {
      const cleaned = normalizePhone(gcashNumber);
      if (cleaned && !hasValidPhone(cleaned)) {
        return res.status(400).json({
          message: 'GCash number must be 09XXXXXXXXX (11 digits).',
        });
      }
      req.user.gcashNumber = cleaned;
    }
    if (gcashQrUrl !== undefined) {
      req.user.gcashQrUrl = String(gcashQrUrl).trim();
    }
    if (junkshopName !== undefined) {
      req.user.junkshopName = String(junkshopName).trim();
    }
    if (phone !== undefined) {
      const cleaned = normalizePhone(phone);
      if (cleaned && !hasValidPhone(cleaned)) {
        return res.status(400).json({
          message: 'Phone number must be 09XXXXXXXXX (11 digits).',
        });
      }
      req.user.phone = cleaned;
    }
    if (address !== undefined) {
      req.user.address = String(address).trim();
    }

    await req.user.save();

    const shop = await Junkshop.findOne({ provider: req.user._id, isCatalog: { $ne: true } }).sort({
      createdAt: 1,
    });
    if (shop) {
      if (junkshopName !== undefined) shop.name = req.user.junkshopName || shop.name;
      if (phone !== undefined) shop.phone = req.user.phone;
      if (address !== undefined) shop.address = req.user.address || shop.address;
      if (pickupServiceFee !== undefined) shop.pickupServiceFee = req.user.pickupServiceFee;
      if (pickupEnabled !== undefined) shop.pickupEnabled = req.user.pickupEnabled;
      await shop.save();
    }

    await syncProfileComplete(req.user._id);
    const freshUser = await User.findById(req.user._id);

    res.json({
      message: 'Provider profile updated.',
      user: await buildUserResponse(freshUser),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not update provider profile.' });
  }
};

const updateMe = async (req, res) => {
  try {
    const { firstName, middleName, lastName, phone, address, leaderboardVisible } = req.body;

    if (firstName !== undefined) {
      const cleaned = String(firstName).trim();
      if (!cleaned || !nameRegex.test(cleaned)) {
        return res.status(400).json({ message: 'First name must contain letters only.' });
      }
      req.user.firstName = cleaned;
    }
    if (middleName !== undefined) {
      const cleaned = String(middleName).trim();
      if (cleaned && !nameRegex.test(cleaned)) {
        return res.status(400).json({ message: 'Middle name must contain letters only.' });
      }
      req.user.middleName = cleaned;
    }
    if (lastName !== undefined) {
      const cleaned = String(lastName).trim();
      if (!cleaned || !nameRegex.test(cleaned)) {
        return res.status(400).json({ message: 'Last name must contain letters only.' });
      }
      req.user.lastName = cleaned;
    }
    if (phone !== undefined) {
      const cleaned = normalizePhone(phone);
      if (cleaned && !hasValidPhone(cleaned)) {
        return res.status(400).json({
          message: 'Phone number must be 09XXXXXXXXX (11 digits).',
        });
      }
      req.user.phone = cleaned;
    }
    if (address !== undefined) {
      req.user.address = String(address).trim();
    }
    if (leaderboardVisible !== undefined) {
      req.user.leaderboardVisible = Boolean(leaderboardVisible);
    }

    await req.user.save();
    await syncProfileComplete(req.user._id);
    const freshUser = await User.findById(req.user._id);

    res.json({
      message: 'Profile updated.',
      user: await buildUserResponse(freshUser),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not update profile.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const valid = await bcrypt.compare(currentPassword, req.user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    req.user.password = await bcrypt.hash(newPassword, 10);
    await req.user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not change password.' });
  }
};

const deactivateAccount = async (req, res) => {
  try {
    req.user.status = 'suspended';
    await req.user.save();

    res.json({ message: 'Account deactivated. Contact support to restore access.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not deactivate account.' });
  }
};

const shopPublicId = (shop) => shop.slug || String(shop._id);

const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favoriteShops');
    const favoriteShopIds = (user.favoriteShops || [])
      .filter(Boolean)
      .map((shop) => shopPublicId(shop));
    res.json({ favoriteShopIds });
  } catch (error) {
    res.status(500).json({ message: 'Could not load favorites.' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { shopId } = req.body;
    if (!shopId) {
      return res.status(400).json({ message: 'Shop id is required.' });
    }

    const shopQuery = String(shopId).match(/^[a-f\d]{24}$/i)
      ? { _id: shopId }
      : { slug: shopId };
    const shop = await Junkshop.findOne(shopQuery);
    if (!shop) {
      return res.status(404).json({ message: 'Junkshop not found.' });
    }

    const user = await User.findById(req.user._id);
    const key = String(shop._id);
    const exists = user.favoriteShops.some((id) => String(id) === key);

    if (exists) {
      user.favoriteShops = user.favoriteShops.filter((id) => String(id) !== key);
    } else {
      user.favoriteShops.push(shop._id);
    }

    await user.save();

    const populated = await User.findById(user._id).populate('favoriteShops');
    const favoriteShopIds = (populated.favoriteShops || [])
      .filter(Boolean)
      .map((s) => shopPublicId(s));

    res.json({ favoriteShopIds, favorited: !exists });
  } catch (error) {
    res.status(500).json({ message: 'Could not update favorite.' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: 'If that email is registered, a reset code has been generated.',
      });
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    console.log(`[password-reset] ${email} → code: ${resetToken}`);

    res.json({
      message: 'Reset code generated. It expires in 1 hour.',
      resetToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not process password reset.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();
    const { resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ message: 'Email, reset code, and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const hashedToken = crypto.createHash('sha256').update(String(resetToken)).digest('hex');
    const user = await User.findOne({
      email,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful. You can log in now.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not reset password.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProviderProfile,
  updateMe,
  changePassword,
  deactivateAccount,
  getFavorites,
  toggleFavorite,
  forgotPassword,
  resetPassword,
};
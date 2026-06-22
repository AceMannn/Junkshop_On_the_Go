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
const {
  findUserByRecovery,
  resolveRecoveryInput,
  generateResetCode,
  hashResetCode,
  isValidResetCode,
  RESET_CODE_LENGTH,
} = require('../utils/passwordRecovery');
const {
  sendPasswordResetEmail,
  sendPasswordResetSms,
  sendEmailVerificationEmail,
} = require('../utils/deliveryService');
const {
  assignEmailVerificationCode,
  clearEmailVerificationCode,
  isCustomerEmailVerified,
  verifyEmailCode,
  maybeAttachDevVerificationCode,
} = require('../utils/emailVerification');
const {
  sanitizeOperatingHours,
  formatOperatingHoursSummary,
  providerPlaceholderEmail,
  customerPlaceholderEmail,
  isInternalAccountEmail,
} = require('../utils/operatingHours');

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
  recyclingPoints: user.recyclingPoints ?? 0,
  verificationStatus: user.verificationStatus || 'draft',
  verificationRejectNote: user.verificationRejectNote || '',
  badges: user.badges || [],
  emailVerified: isCustomerEmailVerified(user),
  requiresPhoneSetup:
    user.role === 'customer' && !hasValidPhone(user.phone),
});

async function buildUserResponse(user) {
  const profileStatus = await evaluateProfile(user);
  return {
    ...userPayload(user),
    profileComplete: profileStatus.complete,
    profileStatus,
  };
}

async function findCustomerByPhone(rawPhone) {
  const normalizedPhone = normalizePhone(rawPhone);
  if (!hasValidPhone(normalizedPhone)) {
    return null;
  }

  let user = await User.findOne({ phone: normalizedPhone, role: 'customer' });
  if (user) return user;

  const candidates = await User.find({ role: 'customer', phone: { $ne: '' } }).select('phone');
  const match = candidates.find((row) => normalizePhone(row.phone) === normalizedPhone);
  if (!match) return null;

  return User.findById(match._id);
}

async function findProviderByPhone(rawPhone) {
  const normalizedPhone = normalizePhone(rawPhone);
  if (!hasValidPhone(normalizedPhone)) {
    return null;
  }

  let user = await User.findOne({ phone: normalizedPhone, role: 'provider' });
  if (user) return user;

  const candidates = await User.find({ role: 'provider', phone: { $ne: '' } }).select('phone');
  const match = candidates.find((row) => normalizePhone(row.phone) === normalizedPhone);
  if (!match) return null;

  return User.findById(match._id);
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
      location,
      operatingHours,
    } = req.body;

    const cleanedRole = role.trim().toLowerCase();
    const cleanedFirstName = firstName?.trim();
    const cleanedMiddleName = middleName?.trim() || '';
    const cleanedLastName = lastName?.trim();
    const cleanedEmail = email?.trim().toLowerCase() || '';
    const cleanedPhone = phone?.trim() || '';
    const cleanedJunkshopName = junkshopName?.trim() || '';
    const cleanedAddress = address?.trim() || '';

    const allowedRoles = ['customer', 'provider'];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!allowedRoles.includes(cleanedRole)) {
      return res.status(400).json({ message: 'Invalid account role.' });
    }

    if (!cleanedFirstName || !cleanedLastName || !password) {
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

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    if (cleanedRole === 'customer') {
      if (!cleanedPhone || !phoneRegex.test(cleanedPhone)) {
        return res.status(400).json({
          message: 'A valid mobile number (09XXXXXXXXX) is required.',
        });
      }

      const normalizedPhone = normalizePhone(cleanedPhone);

      if (cleanedEmail && !emailRegex.test(cleanedEmail)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
      }

      const existingPhone = await findCustomerByPhone(normalizedPhone);
      if (existingPhone) {
        return res.status(409).json({ message: 'This mobile number is already registered.' });
      }

      const resolvedEmail = cleanedEmail || customerPlaceholderEmail(normalizedPhone);

      if (cleanedEmail) {
        const existingEmail = await User.findOne({ email: cleanedEmail });
        if (existingEmail) {
          return res.status(409).json({ message: 'Email is already registered.' });
        }
      } else {
        const existingPlaceholder = await User.findOne({ email: resolvedEmail });
        if (existingPlaceholder) {
          return res.status(409).json({ message: 'This mobile number is already registered.' });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const hasRealEmail = Boolean(cleanedEmail);

      const user = new User({
        role: cleanedRole,
        firstName: cleanedFirstName,
        middleName: cleanedMiddleName,
        lastName: cleanedLastName,
        email: resolvedEmail,
        phone: normalizedPhone,
        password: hashedPassword,
        emailVerified: !hasRealEmail,
      });

      let verificationCode = null;
      let delivery = { stub: true };

      if (hasRealEmail) {
        verificationCode = assignEmailVerificationCode(user);
        delivery = await sendEmailVerificationEmail(
          cleanedEmail,
          verificationCode,
          cleanedFirstName
        );
      }

      await user.save();
      await syncProfileComplete(user._id);

      if (hasRealEmail) {
        const payload = maybeAttachDevVerificationCode(
          {
            message: delivery.stub
              ? 'Account created. Use the dev verification code below (no email provider configured).'
              : 'Account created. Check your email for a verification code.',
            requiresEmailVerification: true,
            email: cleanedEmail,
            phone: normalizedPhone,
          },
          verificationCode,
          delivery
        );

        return res.status(201).json(payload);
      }

      const freshUser = await User.findById(user._id);
      const token = createToken(freshUser);

      return res.status(201).json({
        message: 'Account created successfully.',
        token,
        user: await buildUserResponse(freshUser),
      });
    }

    // Provider / junkshop owner registration
    if (!cleanedJunkshopName) {
      return res.status(400).json({ message: 'Business name is required.' });
    }

    if (!cleanedAddress) {
      return res.status(400).json({ message: 'Business address is required.' });
    }

    if (!cleanedPhone || !phoneRegex.test(cleanedPhone)) {
      return res.status(400).json({
        message: 'A valid mobile number (09XXXXXXXXX) is required.',
      });
    }

    const normalizedPhone = normalizePhone(cleanedPhone);

    if (cleanedEmail && !emailRegex.test(cleanedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const resolvedEmail = cleanedEmail || providerPlaceholderEmail(normalizedPhone);

    const existingPhone = await findProviderByPhone(normalizedPhone);
    if (existingPhone) {
      return res.status(409).json({ message: 'This mobile number is already registered.' });
    }

    const existingEmail = await User.findOne({ email: resolvedEmail });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const schedule = sanitizeOperatingHours(operatingHours);
    const hoursSummary = formatOperatingHoursSummary(schedule);

    let shopLocation = null;
    if (
      location &&
      Number.isFinite(Number(location.lat)) &&
      Number.isFinite(Number(location.lng))
    ) {
      shopLocation = {
        lat: Number(location.lat),
        lng: Number(location.lng),
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      role: 'provider',
      firstName: cleanedFirstName,
      middleName: cleanedMiddleName,
      lastName: cleanedLastName,
      email: resolvedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      junkshopName: cleanedJunkshopName,
      address: cleanedAddress,
      verificationStatus: 'draft',
      emailVerified: true,
    });

    await Junkshop.create({
      provider: user._id,
      name: cleanedJunkshopName,
      address: cleanedAddress,
      phone: normalizedPhone,
      hours: hoursSummary,
      operatingHours: schedule,
      location: shopLocation || DEFAULT_SHOP_LOCATION,
      isPublished: false,
      pickupEnabled: true,
      pickupServiceFee: 0,
    });

    await syncProfileComplete(user._id);
    const freshUser = await User.findById(user._id);
    const token = createToken(freshUser);

    res.status(201).json({
      message: 'Junkshop account created. Complete verification documents in your dashboard.',
      token,
      user: await buildUserResponse(freshUser),
    });
  } catch (error) {
    console.error('registerUser', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// Login existing user
const loginUser = async (req, res) => {
  try {
    const { email, identifier, password, role } = req.body;

    const cleanedRole = role?.trim().toLowerCase();
    const loginId = String(identifier || email || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Please enter your login details and password.' });
    }

    let user = null;

    if (cleanedRole === 'provider') {
      user = await findProviderByPhone(loginId);
      if (!user) {
        return res.status(401).json({ message: 'Invalid mobile number or password.' });
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const looksLikeEmail = loginId.includes('@');

      if (looksLikeEmail) {
        if (!emailRegex.test(loginId.toLowerCase())) {
          return res.status(400).json({ message: 'Please enter a valid email address.' });
        }
        user = await User.findOne({ email: loginId.toLowerCase(), role: 'customer' });
        if (!user) {
          return res.status(401).json({ message: 'Invalid login details or password.' });
        }
      } else {
        const normalizedPhone = normalizePhone(loginId.replace(/\D/g, '').slice(0, 11));
        if (!hasValidPhone(normalizedPhone)) {
          return res.status(400).json({ message: 'Enter a valid mobile number (09XXXXXXXXX).' });
        }
        user = await findCustomerByPhone(normalizedPhone);
        if (!user) {
          return res.status(401).json({ message: 'Invalid mobile number or password.' });
        }
      }
    }

    if (user.role === 'admin') {
      if (cleanedRole) {
        return res.status(403).json({
          message: 'Admin accounts must sign in through the admin portal.',
        });
      }
    } else if (cleanedRole && user.role !== cleanedRole) {
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
      const message =
        cleanedRole === 'provider' || !loginId.includes('@')
          ? 'Invalid mobile number or password.'
          : 'Invalid login details or password.';
      return res.status(401).json({ message });
    }

    if (
      user.role === 'customer' &&
      user.emailVerified === false &&
      !isInternalAccountEmail(user.email)
    ) {
      return res.status(403).json({
        message: 'Verify your email before signing in. Check your inbox for the code.',
        requiresEmailVerification: true,
        email: user.email,
      });
    }

    await syncProfileComplete(user._id);
    const freshUser = await User.findById(user._id);
    const token = createToken(freshUser);
    const userResponse = await buildUserResponse(freshUser);

    res.status(200).json({
      message: userResponse.requiresPhoneSetup
        ? 'Login successful. Add your mobile number to continue.'
        : 'Login successful.',
      token,
      user: userResponse,
      requiresPhoneSetup: userResponse.requiresPhoneSetup,
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
      const fee = Math.max(0, Number(pickupServiceFee) || 0);
      req.user.pickupServiceFee = fee;
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
      if (!hasValidPhone(cleaned)) {
        return res.status(400).json({
          message: 'Phone number must be 09XXXXXXXXX (11 digits).',
        });
      }

      if (req.user.role === 'customer') {
        const existing = await findCustomerByPhone(cleaned);
        if (existing && existing._id.toString() !== req.user._id.toString()) {
          return res.status(409).json({ message: 'This mobile number is already registered.' });
        }
      }

      req.user.phone = cleaned;

      if (
        req.user.role === 'customer' &&
        isInternalAccountEmail(req.user.email) &&
        !String(req.body.email || '').trim()
      ) {
        req.user.email = customerPlaceholderEmail(cleaned);
        req.user.emailVerified = true;
      }
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
    const parsed = resolveRecoveryInput(req.body);

    if (!parsed.ok) {
      return res.status(400).json({ message: parsed.message });
    }

    const user = await findUserByRecovery(parsed);

    if (!user) {
      return res.json({
        message: 'If that email or number is registered, a reset code has been generated.',
      });
    }

    if (parsed.type === 'phone' && !normalizePhone(user.phone)) {
      return res.json({
        message: 'If that email or number is registered, a reset code has been generated.',
      });
    }

    const resetCode = generateResetCode();
    user.passwordResetToken = hashResetCode(resetCode);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    let delivery;
    try {
      if (parsed.type === 'email') {
        delivery = await sendPasswordResetEmail(user.email, resetCode, user.firstName);
      } else {
        const phone = normalizePhone(user.phone);
        delivery = await sendPasswordResetSms(phone, resetCode);
      }
    } catch (deliveryError) {
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();
      console.error('[password-reset] delivery failed:', deliveryError.message);
      return res.status(503).json({
        message: 'Could not send reset code right now. Please try again later.',
      });
    }

    if (delivery.stub) {
      console.log(
        `[password-reset] stub delivery ${parsed.label} (${user.email}) → code: ${resetCode}`
      );
    }

    const payload = {
      message:
        parsed.type === 'email'
          ? 'Reset code sent to your email. It expires in 1 hour.'
          : 'Reset code sent to your mobile number. It expires in 1 hour.',
      recoveryType: parsed.type,
    };

    if (delivery.stub && process.env.NODE_ENV !== 'production') {
      payload.resetToken = resetCode;
    }

    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: 'Could not process password reset.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const parsed = resolveRecoveryInput(req.body);
    const { resetToken, newPassword } = req.body;

    if (!parsed.ok) {
      return res.status(400).json({ message: parsed.message });
    }

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        message: 'Recovery contact, reset code, and new password are required.',
      });
    }

    if (!isValidResetCode(resetToken)) {
      return res.status(400).json({
        message: `Reset code must be ${RESET_CODE_LENGTH} digits.`,
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const hashedToken = hashResetCode(resetToken);
    const user = await findUserByRecovery(parsed);

    if (
      !user ||
      user.passwordResetToken !== hashedToken ||
      !user.passwordResetExpires ||
      user.passwordResetExpires <= new Date()
    ) {
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

const verifyEmail = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required.' });
    }

    const user = await User.findOne({ email, role: 'customer' });
    if (!user) {
      return res.status(404).json({ message: 'Account not found for that email.' });
    }

    if (user.emailVerified !== false) {
      return res.status(400).json({ message: 'This email is already verified. You can log in.' });
    }

    const result = verifyEmailCode(user, code);
    if (!result.ok) {
      return res.status(400).json({ message: result.message });
    }

    user.emailVerified = true;
    clearEmailVerificationCode(user);
    await user.save();
    await syncProfileComplete(user._id);

    const freshUser = await User.findById(user._id);
    const token = createToken(freshUser);

    res.json({
      message: 'Email verified. Welcome to JunkShop On-The-Go!',
      token,
      user: await buildUserResponse(freshUser),
    });
  } catch (error) {
    console.error('verifyEmail', error);
    res.status(500).json({ message: 'Could not verify email.' });
  }
};

const resendEmailVerification = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email, role: 'customer' });
    if (!user) {
      return res.status(404).json({ message: 'Account not found for that email.' });
    }

    if (user.emailVerified !== false) {
      return res.status(400).json({ message: 'This email is already verified.' });
    }

    const verificationCode = assignEmailVerificationCode(user);
    await user.save();

    const delivery = await sendEmailVerificationEmail(
      user.email,
      verificationCode,
      user.firstName
    );

    const payload = maybeAttachDevVerificationCode(
      {
        message: delivery.stub
          ? 'New verification code generated (dev stub — see code below).'
          : 'A new verification code was sent to your email.',
      },
      verificationCode,
      delivery
    );

    res.json(payload);
  } catch (error) {
    console.error('resendEmailVerification', error);
    res.status(500).json({ message: 'Could not resend verification code.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendEmailVerification,
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
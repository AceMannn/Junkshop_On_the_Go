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
  PASSWORD_REQUIREMENTS_MESSAGE,
  validatePasswordStrength,
} = require('../utils/passwordPolicy');
const {
  sendPasswordResetEmail,
  sendPasswordResetSms,
  sendEmailVerificationEmail,
  sendPhoneVerificationSms,
} = require('../utils/deliveryService');
const {
  assignEmailVerificationCode,
  assignPhoneVerificationCode,
  clearEmailVerificationCode,
  clearPhoneVerificationCode,
  isCustomerEmailVerified,
  isPhoneVerified,
  verifyEmailCode,
  verifyPhoneCode,
  maybeAttachDevVerificationCode,
} = require('../utils/emailVerification');
const {
  sanitizeOperatingHours,
  formatOperatingHoursSummary,
  publicUserEmail,
} = require('../utils/operatingHours');
const {
  findCustomerByPhone,
  findProviderByPhone,
  assertPhoneAvailable,
  assertGcashAvailable,
  assertEmailAvailable,
  emailConflictMessage,
} = require('../utils/accountIdentity');
const { AUTH_LOOKUP_EXCLUDE, SESSION_USER_EXCLUDE } = require('../utils/userQueries');
const { isBanned } = require('../utils/accountModeration');

const DEFAULT_SHOP_LOCATION = { lat: 14.5995, lng: 121.0055 };
const MAX_AMOUNT = 20000;
const nameRegex = /^[A-Za-zÀ-ÿÑñ\s.'-]+$/;
const phoneRegex = /^(\+63|0)9\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Temporary dev switch: keep SMS code intact, but do not require it for account login.
const ACCOUNT_PHONE_VERIFICATION_ENABLED = false;

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
  email: publicUserEmail(user.email),
  phone: user.phone,
  junkshopName: user.junkshopName,
  address: user.address,
  location: user.location || null,
  addressConfirmed: Boolean(user.addressConfirmed),
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
  phoneVerified: isPhoneVerified(user),
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

function verificationPayload({ user, message, emailCode, emailDelivery, phoneCode, phoneDelivery }) {
  const needsEmail = Boolean(user.email && user.emailVerified === false);
  const needsPhone = Boolean(user.phone && user.phoneVerified !== true);
  const payload = {
    message,
    requiresAccountVerification: needsEmail || needsPhone,
    requiresEmailVerification: needsEmail,
    requiresPhoneVerification: needsPhone,
    email: user.email || '',
    phone: user.phone || '',
  };

  if (emailDelivery?.stub && process.env.NODE_ENV !== 'production') {
    payload.devEmailVerificationCode = emailCode;
    payload.devVerificationCode = emailCode;
  }
  if (phoneDelivery?.stub && process.env.NODE_ENV !== 'production') {
    payload.devPhoneVerificationCode = phoneCode;
  }

  return payload;
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
      termsAccepted,
      termsVersion,
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

    if (!allowedRoles.includes(cleanedRole)) {
      return res.status(400).json({ message: 'Invalid account role.' });
    }

    if (termsAccepted !== true) {
      return res.status(400).json({
        message: 'Please read and accept the Terms and Conditions before creating an account.',
      });
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

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.ok) {
      return res.status(400).json({ message: passwordValidation.message });
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

      const phoneConflict = await assertPhoneAvailable(normalizedPhone, {
        intendedRole: 'customer',
        context: 'signup',
      });
      if (phoneConflict) {
        return res.status(phoneConflict.status).json({ message: phoneConflict.message });
      }

      if (cleanedEmail) {
        const emailConflict = await assertEmailAvailable(cleanedEmail, {
          intendedRole: 'customer',
        });
        if (emailConflict) {
          return res.status(emailConflict.status).json({ message: emailConflict.message });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const hasRealEmail = Boolean(cleanedEmail);

      const user = new User({
        role: cleanedRole,
        firstName: cleanedFirstName,
        middleName: cleanedMiddleName,
        lastName: cleanedLastName,
        phone: normalizedPhone,
        password: hashedPassword,
        emailVerified: !hasRealEmail,
        phoneVerified: false,
        acceptedTermsAt: new Date(),
        termsVersion: String(termsVersion || '').trim(),
      });

      if (hasRealEmail) {
        user.email = cleanedEmail;
      }

      let emailCode = null;
      let emailDelivery = null;

      if (hasRealEmail) {
        emailCode = assignEmailVerificationCode(user);
      }

      const phoneCode = assignPhoneVerificationCode(user);

      await user.save();
      await syncProfileComplete(user._id);

      if (hasRealEmail) {
        emailDelivery = await sendEmailVerificationEmail(
          cleanedEmail,
          emailCode,
          cleanedFirstName
        );
      }

      const phoneDelivery = await sendPhoneVerificationSms(normalizedPhone, phoneCode);

      return res.status(201).json(
        verificationPayload({
          user,
          message: hasRealEmail
            ? 'Account created. Verify your mobile number and email to continue.'
            : 'Account created. Verify your mobile number to continue.',
          emailCode,
          emailDelivery,
          phoneCode,
          phoneDelivery,
        })
      );
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

    const phoneConflict = await assertPhoneAvailable(normalizedPhone, {
      intendedRole: 'provider',
      context: 'signup',
    });
    if (phoneConflict) {
      return res.status(phoneConflict.status).json({ message: phoneConflict.message });
    }

    if (cleanedEmail) {
      const emailConflict = await assertEmailAvailable(cleanedEmail, {
        intendedRole: 'provider',
      });
      if (emailConflict) {
        return res.status(emailConflict.status).json({ message: emailConflict.message });
      }
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

    const hasProviderEmail = Boolean(cleanedEmail);
    const user = new User({
      role: 'provider',
      firstName: cleanedFirstName,
      middleName: cleanedMiddleName,
      lastName: cleanedLastName,
      ...(cleanedEmail ? { email: cleanedEmail } : {}),
      phone: normalizedPhone,
      password: hashedPassword,
      junkshopName: cleanedJunkshopName,
      address: cleanedAddress,
      verificationStatus: 'draft',
      emailVerified: !hasProviderEmail,
      phoneVerified: false,
      acceptedTermsAt: new Date(),
      termsVersion: String(termsVersion || '').trim(),
    });

    let emailCode = null;
    let emailDelivery = null;
    if (hasProviderEmail) {
      emailCode = assignEmailVerificationCode(user);
    }
    const phoneCode = assignPhoneVerificationCode(user);
    await user.save();

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
    if (hasProviderEmail) {
      emailDelivery = await sendEmailVerificationEmail(
        cleanedEmail,
        emailCode,
        cleanedFirstName
      );
    }
    const phoneDelivery = await sendPhoneVerificationSms(normalizedPhone, phoneCode);

    res.status(201).json(
      verificationPayload({
        user,
        message: hasProviderEmail
          ? 'Junkshop account created. Verify your mobile number and email to continue.'
          : 'Junkshop account created. Verify your mobile number to continue.',
        emailCode,
        emailDelivery,
        phoneCode,
        phoneDelivery,
      })
    );
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
        const normalizedPhone = normalizePhone(loginId.replace(/\D/g, '').slice(0, 11));
        const phoneConflict = await assertPhoneAvailable(normalizedPhone, {
          intendedRole: 'provider',
          context: 'login',
        });
        if (phoneConflict && phoneConflict.status !== 401) {
          return res.status(phoneConflict.status).json({ message: phoneConflict.message });
        }
        return res.status(401).json({ message: 'Invalid mobile number or password.' });
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const looksLikeEmail = loginId.includes('@');

      if (looksLikeEmail) {
        const normalizedEmail = loginId.toLowerCase();
        if (!emailRegex.test(normalizedEmail)) {
          return res.status(400).json({ message: 'Please enter a valid email address.' });
        }
        const emailRole = cleanedRole || 'admin';
        user = await User.findOne({ email: normalizedEmail, role: emailRole }).select(AUTH_LOOKUP_EXCLUDE);
        if (!user && cleanedRole === 'customer') {
          user = await User.findOne({ email: normalizedEmail, role: 'admin' }).select(AUTH_LOOKUP_EXCLUDE);
        }
        if (!user && (cleanedRole === 'customer' || cleanedRole === 'provider')) {
          const crossRoleUser = await User.findOne({
            email: normalizedEmail,
            role: cleanedRole === 'customer' ? 'provider' : 'customer',
          }).select(AUTH_LOOKUP_EXCLUDE);
          if (crossRoleUser) {
            return res.status(403).json({
              message: emailConflictMessage(crossRoleUser.role),
            });
          }
        }
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
          const phoneConflict = await assertPhoneAvailable(normalizedPhone, {
            intendedRole: 'customer',
            context: 'login',
          });
          if (phoneConflict && phoneConflict.status !== 401) {
            return res.status(phoneConflict.status).json({ message: phoneConflict.message });
          }
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

    if (user.status === 'deleted' || user.deletedAt) {
      return res.status(403).json({ message: 'This account has been deleted.' });
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

    if (!ACCOUNT_PHONE_VERIFICATION_ENABLED && user.phone && user.phoneVerified !== true) {
      user.phoneVerified = true;
      clearPhoneVerificationCode(user);
      await user.save();
      await syncProfileComplete(user._id);
    }

    const needsEmailVerification = Boolean(publicUserEmail(user.email) && user.emailVerified === false);
    const needsPhoneVerification = Boolean(
      ACCOUNT_PHONE_VERIFICATION_ENABLED && user.phone && user.phoneVerified !== true
    );
    if (needsEmailVerification || needsPhoneVerification) {
      return res.status(403).json({
        message: 'Verify your account before signing in. Request a new code if yours expired.',
        requiresAccountVerification: true,
        requiresEmailVerification: needsEmailVerification,
        requiresPhoneVerification: needsPhoneVerification,
        email: user.email,
        phone: user.phone,
      });
    }

    const token = createToken(user);
    const userResponse = await buildUserResponse(user);

    res.status(200).json({
      message: userResponse.requiresPhoneSetup
        ? 'Login successful. Add your mobile number to continue.'
        : 'Login successful.',
      token,
      user: userResponse,
      requiresPhoneSetup: userResponse.requiresPhoneSetup,
      passwordNeedsUpdate: !validatePasswordStrength(password).ok,
      passwordSecurityMessage: PASSWORD_REQUIREMENTS_MESSAGE,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.' });
  }
};

const getCurrentUser = async (req, res) => {
  const freshUser = await User.findById(req.user._id).select(SESSION_USER_EXCLUDE);
  if (!freshUser) {
    return res.status(404).json({ message: 'Account not found.' });
  }
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
      if (fee > MAX_AMOUNT) {
        return res.status(400).json({ message: `Pickup service fee cannot exceed ₱${MAX_AMOUNT.toLocaleString()}.` });
      }
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

      if (cleaned) {
        const gcashConflict = await assertGcashAvailable(cleaned, {
          excludeUserId: req.user._id,
        });
        if (gcashConflict) {
          return res.status(gcashConflict.status).json({ message: gcashConflict.message });
        }
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

      if (cleaned) {
        const phoneConflict = await assertPhoneAvailable(cleaned, {
          intendedRole: 'provider',
          excludeUserId: req.user._id,
          context: 'update',
        });
        if (phoneConflict) {
          return res.status(phoneConflict.status).json({ message: phoneConflict.message });
        }
      }

      req.user.phone = cleaned;
    }
    if (address !== undefined) {
      req.user.address = String(address).trim();
    }

    await req.user.save();

    const shop = await Junkshop.findOne({
      provider: req.user._id,
      isCatalog: { $ne: true },
      deletedAt: null,
    }).sort({ createdAt: 1 });
    if (shop) {
      if (junkshopName !== undefined) shop.name = req.user.junkshopName || shop.name;
      if (phone !== undefined) shop.phone = req.user.phone;
      if (address !== undefined) shop.address = req.user.address || shop.address;
      if (pickupServiceFee !== undefined) shop.pickupServiceFee = req.user.pickupServiceFee;
      if (pickupEnabled !== undefined) shop.pickupEnabled = req.user.pickupEnabled;
      await shop.save();
    }

    await syncProfileComplete(req.user._id);
    const freshUser = await User.findById(req.user._id).select(SESSION_USER_EXCLUDE);

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
    const {
      firstName,
      middleName,
      lastName,
      email,
      phone,
      address,
      location,
      addressConfirmed,
      leaderboardVisible,
    } = req.body;
    let emailCode = null;
    let emailDelivery = null;

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
    if (email !== undefined) {
      const cleaned = String(email || '').trim().toLowerCase();
      const currentEmail = publicUserEmail(req.user.email);

      if (!cleaned) {
        req.user.email = undefined;
        req.user.emailVerified = true;
        clearEmailVerificationCode(req.user);
      } else if (!emailRegex.test(cleaned)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
      } else if (cleaned !== currentEmail) {
        const emailConflict = await assertEmailAvailable(cleaned, {
          intendedRole: 'customer',
          excludeUserId: req.user._id,
        });
        if (emailConflict) {
          return res.status(emailConflict.status).json({ message: emailConflict.message });
        }

        req.user.email = cleaned;
        req.user.emailVerified = false;
        emailCode = assignEmailVerificationCode(req.user);
      }
    }
    if (phone !== undefined) {
      const cleaned = normalizePhone(phone);
      if (!hasValidPhone(cleaned)) {
        return res.status(400).json({
          message: 'Phone number must be 09XXXXXXXXX (11 digits).',
        });
      }

      const phoneConflict = await assertPhoneAvailable(cleaned, {
        intendedRole: 'customer',
        excludeUserId: req.user._id,
        context: 'update',
      });
      if (phoneConflict) {
        return res.status(phoneConflict.status).json({ message: phoneConflict.message });
      }

      req.user.phone = cleaned;
    }
    if (address !== undefined) {
      req.user.address = String(address).trim();
      if (req.user.role === 'customer') {
        req.user.addressConfirmed = false;
      }
    }
    if (location !== undefined) {
      if (location == null) {
        req.user.location = undefined;
        req.user.addressConfirmed = false;
      } else {
        const lat = Number(location.lat);
        const lng = Number(location.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return res.status(400).json({ message: 'Select a valid address on the map.' });
        }
        req.user.location = { lat, lng };
        if (req.user.role === 'customer') {
          req.user.addressConfirmed = false;
        }
      }
    }
    if (addressConfirmed !== undefined) {
      const wantsConfirmed = Boolean(addressConfirmed);
      if (wantsConfirmed) {
        const lat = Number(req.user.location?.lat);
        const lng = Number(req.user.location?.lng);
        if (!req.user.address || !Number.isFinite(lat) || !Number.isFinite(lng)) {
          return res.status(400).json({
            message: 'Search and confirm your address on the map before saving.',
          });
        }
      }
      req.user.addressConfirmed = wantsConfirmed;
    }
    if (leaderboardVisible !== undefined) {
      req.user.leaderboardVisible = Boolean(leaderboardVisible);
    }

    await req.user.save();
    await syncProfileComplete(req.user._id);

    if (emailCode) {
      emailDelivery = await sendEmailVerificationEmail(req.user.email, emailCode, req.user.firstName);
    }

    const freshUser = await User.findById(req.user._id).select(SESSION_USER_EXCLUDE);
    const response = {
      message: emailCode
        ? 'Profile updated. Check your email for the verification code.'
        : 'Profile updated.',
      user: await buildUserResponse(freshUser),
      requiresEmailVerification: Boolean(emailCode),
      email: freshUser.email || '',
    };

    res.json(maybeAttachDevVerificationCode(response, emailCode, emailDelivery));
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

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.ok) {
      return res.status(400).json({ message: passwordValidation.message });
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
    const user = await User.findById(req.user._id).populate({
      path: 'favoriteShops',
      populate: { path: 'provider', select: 'status' },
    });

    const favoriteShopIds = (user.favoriteShops || [])
      .filter((shop) => {
        if (!shop) return false;
        if (shop.deletedAt) {
          return false;
        }
        if (shop.provider && isBanned(shop.provider.status)) {
          return false;
        }
        return true;
      })
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
      ? { _id: shopId, deletedAt: null }
      : { slug: shopId, deletedAt: null };
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

    const populated = await User.findById(user._id).populate({
      path: 'favoriteShops',
      populate: { path: 'provider', select: 'status' },
    });
    const favoriteShopIds = (populated.favoriteShops || [])
      .filter((shop) => {
        if (!shop) return false;
        if (shop.deletedAt) {
          return false;
        }
        if (shop.provider && isBanned(shop.provider.status)) {
          return false;
        }
        return true;
      })
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

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.ok) {
      return res.status(400).json({ message: passwordValidation.message });
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

    const freshUser = await User.findById(user._id).select(SESSION_USER_EXCLUDE);
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

async function findAccountForVerification({ email, phone, role }) {
  const cleanedRole = String(role || '').trim().toLowerCase();
  const roleQuery = ['customer', 'provider'].includes(cleanedRole) ? { role: cleanedRole } : {};

  if (phone) {
    const normalizedPhone = normalizePhone(phone);
    if (hasValidPhone(normalizedPhone)) {
      const user = await User.findOne({ phone: normalizedPhone, ...roleQuery });
      if (user) return user;
    }
  }

  if (email) {
    return User.findOne({ email: String(email).trim().toLowerCase(), ...roleQuery });
  }

  return null;
}

const verifyAccount = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const role = String(req.body.role || '').trim().toLowerCase();
    const emailCode = String(req.body.emailCode || req.body.code || '').trim();
    const phoneCode = String(req.body.phoneCode || '').trim();

    const user = await findAccountForVerification({ email, phone, role });
    if (!user) {
      return res.status(404).json({ message: 'Account not found for verification.' });
    }

    const needsEmail = Boolean(user.email && user.emailVerified === false);
    const bypassPhoneVerification = Boolean(
      !ACCOUNT_PHONE_VERIFICATION_ENABLED && user.phone && user.phoneVerified !== true
    );
    const needsPhone = Boolean(
      ACCOUNT_PHONE_VERIFICATION_ENABLED && user.phone && user.phoneVerified !== true
    );

    if (!needsEmail && !needsPhone && !bypassPhoneVerification) {
      return res.status(400).json({ message: 'This account is already verified. You can log in.' });
    }

    if (needsEmail) {
      const result = verifyEmailCode(user, emailCode);
      if (!result.ok) {
        return res.status(400).json({ message: result.message });
      }
      user.emailVerified = true;
      clearEmailVerificationCode(user);
    }

    if (bypassPhoneVerification) {
      user.phoneVerified = true;
      clearPhoneVerificationCode(user);
    } else if (needsPhone) {
      const result = verifyPhoneCode(user, phoneCode);
      if (!result.ok) {
        return res.status(400).json({ message: result.message });
      }
      user.phoneVerified = true;
      clearPhoneVerificationCode(user);
    }

    await user.save();
    await syncProfileComplete(user._id);

    const freshUser = await User.findById(user._id).select(SESSION_USER_EXCLUDE);
    const token = createToken(freshUser);

    res.json({
      message: 'Account verified. Welcome to JunkShop On-The-Go!',
      token,
      user: await buildUserResponse(freshUser),
    });
  } catch (error) {
    console.error('verifyAccount', error);
    res.status(500).json({ message: 'Could not verify account.' });
  }
};

const resendAccountVerification = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const role = String(req.body.role || '').trim().toLowerCase();

    const user = await findAccountForVerification({ email, phone, role });
    if (!user) {
      return res.status(404).json({ message: 'Account not found for verification.' });
    }

    const needsEmail = Boolean(user.email && user.emailVerified === false);
    const needsPhone = Boolean(user.phone && user.phoneVerified !== true);

    if (!needsEmail && !needsPhone) {
      return res.status(400).json({ message: 'This account is already verified.' });
    }

    let emailCode = null;
    let emailDelivery = null;
    let phoneCode = null;
    let phoneDelivery = null;

    if (needsEmail) {
      emailCode = assignEmailVerificationCode(user);
    }
    if (needsPhone) {
      phoneCode = assignPhoneVerificationCode(user);
    }

    await user.save();

    if (needsEmail) {
      emailDelivery = await sendEmailVerificationEmail(user.email, emailCode, user.firstName);
    }
    if (needsPhone) {
      phoneDelivery = await sendPhoneVerificationSms(user.phone, phoneCode);
    }

    res.json(
      verificationPayload({
        user,
        message: 'A new verification code was sent.',
        emailCode,
        emailDelivery,
        phoneCode,
        phoneDelivery,
      })
    );
  } catch (error) {
    console.error('resendAccountVerification', error);
    res.status(500).json({ message: 'Could not resend verification code.' });
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
  verifyAccount,
  resendAccountVerification,
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
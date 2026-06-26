/** Fields omitted on auth lookups — verification blobs are large base64 payloads. */
const AUTH_LOOKUP_EXCLUDE =
  '-verificationDocuments -verificationArchive -emailVerificationCodeHash';

/** Fields omitted on session / profile API responses and protect middleware. */
const SESSION_USER_EXCLUDE =
  '-password -verificationDocuments -verificationArchive -emailVerificationCodeHash';

module.exports = {
  AUTH_LOOKUP_EXCLUDE,
  SESSION_USER_EXCLUDE,
};

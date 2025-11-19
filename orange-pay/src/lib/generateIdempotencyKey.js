const generateIdempotencyKey = (length = 32) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let key = "";
  for (let i = 0; i < length; i++) {
    key += chars[bytes[i] % chars.length];
  }

  return key;
};

export default generateIdempotencyKey;

const generateIdempotencyKey = (length = 32) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const result = [];
  const cryptoObj =
    (typeof globalThis !== "undefined" && globalThis.crypto) || null;

  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    const randomBytes = new Uint8Array(length);
    cryptoObj.getRandomValues(randomBytes);

    for (let i = 0; i < length; i++) {
      const idx = randomBytes[i] % chars.length;
      result.push(chars.charAt(idx));
    }

    return result.join("");
  }

  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    result.push(chars.charAt(idx));
  }

  return result.join("");
};

export default generateIdempotencyKey;

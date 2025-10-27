// src/services/TransferService.jsx
import api, { refreshToken } from '../lib/api'; // use your lazy proxy

/**
 * sendStepUpToken(phone)
 * Request server to send a step-up OTP/token for a transfer.
 * Returns: { tokenId: string, expiresIn: number } on success
 */
export async function sendStepUpToken(phone) {
  try {
    // Example endpoint: POST /transfer/stepup/send or /otp/send
    const res = await api.post('/transfer/stepup/send', { phone });
    // Expect server to return { tokenId, expiresIn } or similar
    return res?.data ?? res;
  } catch (err) {
    // if API returns 401 you may want to try refresh flow
    const status = err?.response?.status;
    if (status === 401) {
      try {
        await refreshToken();
        const retry = await api.post('/transfer/stepup/send', { phone });
        return retry?.data ?? retry;
      } catch (e) {
        throw e;
      }
    }
    // Fall back to a sensible mock-like return if your lib uses mock mode
    // but prefer throwing so caller can show an error.
    throw err;
  }
}

/**
 * verifyPinAndTransfer({ phone, amount, pin, tokenId, stepUpOtp })
 * Returns: { success: boolean, message?: string, data?: any }
 */
export async function verifyPinAndTransfer({ phone, amount, pin, tokenId, stepUpOtp }) {
  try {
    const payload = { phone, amount, pin, tokenId, stepUpOtp };
    // Example endpoint: POST /transfer/confirm
    const res = await api.post('/transfer/confirm', payload);

    // Different backends return different shapes. Normalize to { success, message }
    if (res && typeof res === 'object') {
      // If server uses axios-like response, it might be { data: { success: true } }
      const body = res.data ?? res;
      if (typeof body.success !== 'undefined') return body;
      // If backend returns a transfer object on success:
      if (body.id || body.transactionId) return { success: true, data: body };
      // default treat non-error as success
      return { success: true, data: body };
    }

    // fallback
    return { success: true, data: res };
  } catch (err) {
    // normalize error to a predictable shape
    const message =
      err?.response?.data?.message ||
      err?.message ||
      'Transfer failed, please try again';
    return { success: false, message };
  }
}

import { useCallback, useMemo } from "react";
import api from "../../lib/api";

export default function useWalletApi() {
  // -----------------------------------------------------
  // GET SINGLE WALLET
  // -----------------------------------------------------
  const getWalletById = useCallback(async (walletId) => {
    try {
      const response = await api.get(`/wallets/${walletId}`);
      return response.data?.data || null;
    } catch (err) {
      console.error("Gagal mengambil wallet:", err);
      throw new Error(err.response?.data?.message || "Gagal mengambil wallet");
    }
  }, []);

  // -----------------------------------------------------
  // GET CURRENT USER ROLE IN WALLET
  // GET /wallets/:walletId/me/role
  // returns string role or null on error
  // -----------------------------------------------------
  const getMyRole = useCallback(async (walletId) => {
    if (!walletId) return null;
    try {
      // your curl used '/wallets/:id/me/role' (no /api/v1) so we keep same path
      const response = await api.get(`/api/v1/wallets/${walletId}/me/role`);
      // adapt depending on API shape; assume { data: { role: "Owner" } } or direct string
      const data = response.data;
      // try common shapes:
      if (!data) return null;
      if (typeof data === "string") return data;
      if (data.role) return data.role;
      if (data.data && data.data.role) return data.data.role;
      // fallback: first string value found
      const maybe = Object.values(data).find((v) => typeof v === "string");
      return maybe || null;
    } catch (err) {
      console.error("Gagal mengambil role wallet:", err);
      // don't throw — return null to let UI decide fallback behavior
      return null;
    }
  }, []);

  const renameWallet = useCallback(async (walletId, newName) => {
    try {
      const body = {
        name: newName,
      };

      const response = await api.patch(`/api/v1/wallets/${walletId}`, body);

      return response.data?.data;
    } catch (err) {
      console.error("Gagal mengganti nama wallet:", err);
      throw new Error(err.response?.data?.message || "Gagal mengganti nama wallet");
    }
  }, []);

  const deleteWallet = useCallback(async (walletId) => {
    try {
      await api.delete(`/api/v1/wallets/${walletId}`);
      return true;
    } catch (err) {
      console.error("Gagal menghapus wallet:", err);
      throw new Error(err.response?.data?.message || "Gagal menghapus wallet");
    }
  }, []);

  // -----------------------------------------------------
  // EXPORT ALL METHODS
  // -----------------------------------------------------
  return useMemo(
    () => ({
      getWalletById,
      getMyRole,       // <-- new
      renameWallet,
      deleteWallet,
    }),
    [getWalletById, getMyRole, renameWallet, deleteWallet]
  );
}

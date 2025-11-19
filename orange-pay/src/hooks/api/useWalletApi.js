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
      renameWallet,
      deleteWallet,
    }),
    [getWalletById, renameWallet, deleteWallet]
  );
}

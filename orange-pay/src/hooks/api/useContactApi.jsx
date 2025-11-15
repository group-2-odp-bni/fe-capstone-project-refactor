import { useCallback, useMemo } from "react";
import api from "../../lib/api";

export default function useContactApi() {
  const getAllAccounts = useCallback(async (page = 0, size = 100) => {
    try {
      const response = await api.get("/api/v1/contacts", {
        params: { page, size },
      });
      return response.data?.data?.content || [];
    } catch (err) {
      console.error("Gagal mengambil kontak:", err);
      return [];
    }
  }, []);

  const searchContacts = useCallback(async (query, page = 0, size = 20) => {
    try {
      const response = await api.get("/api/v1/contacts/search", {
        params: { q: query, page, size },
      });
      return response.data?.data || { content: [], totalElements: 0 };
    } catch (err) {
      console.error("Gagal mencari kontak:", err);
      return { content: [], totalElements: 0 };
    }
  }, []);

  const verifyAndAddContact = useCallback(async (phoneNumber) => {
    try {
      const response = await api.post("/api/v1/contacts/verify", {
        phoneNumber,
      });
      return response.data?.data;
    } catch (err) {
      console.error("Gagal verifikasi kontak:", err);
      throw new Error(err.response?.data?.message || "Gagal menambah kontak");
    }
  }, []);

  const removeContact = useCallback(async (contactId) => {
    try {
      await api.delete(`/api/v1/contacts/${contactId}`);
      return true;
    } catch (err) {
      console.error("Gagal menghapus kontak:", err);
      throw new Error(err.response?.data?.message || "Gagal menghapus kontak");
    }
  }, []);

  return useMemo(
    () => ({
      getAllAccounts,
      searchContacts,
      verifyAndAddContact,
      removeContact,
    }),
    [getAllAccounts, searchContacts, verifyAndAddContact, removeContact]
  );
}

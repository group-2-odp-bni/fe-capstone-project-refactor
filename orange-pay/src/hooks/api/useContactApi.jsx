import api from "../../lib/api";
export default function useContactApi() {
  const getAllAccounts = async (page = 0, size = 100) => {
    try {
      const response = await api.get("/api/v1/contacts", {
        params: { page, size },
      });
      return response.data.data.content || [];
    } catch (err) {
      console.error("Gagal mengambil kontak:", err);
      return [];
    }
  };

  const searchContacts = async (query, page = 0, size = 20) => {
    try {
      const response = await api.get("/api/v1/contacts/search", {
        params: { q: query, page, size },
      });
      return response.data.data;
    } catch (err) {
      console.error("Gagal mencari kontak:", err);
      return { content: [], totalElements: 0 };
    }
  };

  const verifyAndAddContact = async (phoneNumber) => {
    try {
      const response = await api.post("/api/v1/contacts/verify", {
        phoneNumber,
      });
      return response.data.data;
    } catch (err) {
      console.error("Gagal verifikasi kontak:", err);
      throw new Error(err.response?.data?.message || "Gagal menambah kontak");
    }
  };
  const removeContact = async (contactId) => {
    try {
      await api.delete(`/api/v1/contacts/${contactId}`);
      return true;
    } catch (err) {
      console.error("Gagal menghapus kontak:", err);
      throw new Error(err.response?.data?.message || "Gagal menghapus kontak");
    }
  };
  return {
    getAllAccounts,
    searchContacts,
    verifyAndAddContact,
    removeContact,
  };
}

import { useState, useEffect, useCallback } from "react";
import api from "../lib/api";
export const useBillMember = (billId, memberId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMemberInvoice = useCallback(async () => {
    if (!billId || !memberId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(
        `/api/v1/split-bill/bills/${billId}/members/${memberId}`
      );

      setData(response.data.data);
    } catch (err) {
      setError(err.message || "Gagal memuat invoice");
    } finally {
      setLoading(false);
    }
  }, [billId, memberId]);

  useEffect(() => {
    fetchMemberInvoice();
  }, [fetchMemberInvoice]);

  const payBill = async (sourceWalletId) => {
    try {
      const response = await api.post(
        `/api/v1/split-bill/bills/${billId}/members/${memberId}/pay-intent`,
        { sourceWalletId }
      );
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  return { data, loading, error, refetch: fetchMemberInvoice, payBill };
};
export const useBillOwner = (billId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBillDetail = useCallback(async () => {
    if (!billId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/v1/split-bill/bills/${billId}`);
      setData(response.data.data);
    } catch (err) {
      setError(err.message || "Gagal memuat detail tagihan");
    } finally {
      setLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    fetchBillDetail();
  }, [fetchBillDetail]);

  const markAsPaid = async (memberIds) => {
    try {
      const response = await api.post(
        `/api/v1/split-bill/bills/${billId}/mark-paid-batch`,
        { member_ids: memberIds }
      );

      await fetchBillDetail();
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  return { data, loading, error, refetch: fetchBillDetail, markAsPaid };
};

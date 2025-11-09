import { useState, useCallback } from "react";
import api from "../../lib/api";

async function dataURLtoFile(dataUrl, filename) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}

const _parseAmount = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return Math.round(val);
  const s = String(val).replace(/[^\d]/g, "");
  return s ? parseInt(s, 10) : 0;
};
const _normalizeRawItems = (rawItems = []) => {
  return rawItems.map((it, idx) => {
    const name = (it.nama_item || it.name || `Item ${idx + 1}`).trim();
    const qty = _parseAmount(it.kuantitas || it.quantity || it.qty || 1);
    let unit_price = _parseAmount(
      it.unit_price_rp || it.unit_price || it.price
    );
    let line_total = _parseAmount(
      it.line_subtotal_rp || it.line_total || it.harga_total || it.subtotal
    );

    if (unit_price <= 0 && line_total > 0 && qty > 0) {
      unit_price = Math.floor(line_total / qty);
    }
    if (line_total <= 0 && unit_price > 0 && qty > 0) {
      line_total = unit_price * qty;
    }

    return {
      line_id: `L${idx + 1}`,
      name: name,
      qty: qty, 
      unit_price_rp: unit_price,
      line_subtotal_rp: line_total, 
    };
  });
};

export const useOCRImage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrData, setOcrData] = useState(null);
  const [ocrError, setOcrError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setOcrProgress(0);
    setOcrData(null);
    setOcrError(null);
    setIsSuccess(false);
    setIsError(false);
  }, []);

  const processOCR = useCallback(
    async (imageDataUrl) => {
      reset();
      setIsProcessing(true);
      setOcrProgress(0);

      try {
        const imageFile = await dataURLtoFile(imageDataUrl, "receipt.webp");

        const formData = new FormData();
        formData.append("receipt_image", imageFile);

        const config = {
          onUploadProgress: (progressEvent) => {
            const { loaded, total } = progressEvent;
            const percentCompleted = Math.round((loaded * 100) / total);
            setOcrProgress(Math.min(90, percentCompleted));
          },
        };

        const response = await api.post(
          "/api/v1/split-bill/extract-text",
          formData,
          config
        );

        setOcrProgress(95);

        const responseBody = response.data;
        let formattedData;

        if (responseBody.error) {
          if (responseBody.data && responseBody.data.extract) {
            console.warn(
              "OCR: API Error (207), normalisasi data mentah di frontend."
            );
            const extractedData = responseBody.data.extract; // Ini data MENTAH
            const normalizedItems = _normalizeRawItems(extractedData.items);

            const itemsSubtotal = normalizedItems.reduce(
              (sum, item) => sum + item.line_subtotal_rp,
              0
            );
            const pajak = _parseAmount(
              extractedData.tax || extractedData.pajak
            );
            const service = _parseAmount(
              extractedData.service || extractedData.service_charge
            );
            const tip = _parseAmount(extractedData.tip);
            const calculatedTotal = itemsSubtotal + pajak + service + tip;
            const finalTotal =
              _parseAmount(extractedData.total) > 0
                ? _parseAmount(extractedData.total)
                : calculatedTotal;

            formattedData = {
              receiptId: `DRAFT-${Date.now()}`,
              items: normalizedItems, 
              subtotal: itemsSubtotal,
              pajak: pajak,
              service: service,
              tip: tip,
              total: finalTotal,
              receipt_url: extractedData.receipt_url,
            };
          } else {
            throw new Error(responseBody.message || "API returned an error");
          }
        } else {
          const successData = responseBody.data;
          if (!successData || !successData.items_for_assignment) {
            throw new Error("Gagal membaca respons data dari server.");
          }
          formattedData = {
            receiptId: successData.ocr_id,
            items: successData.items_for_assignment,
            subtotal: successData.components.items_subtotal_rp,
            pajak: successData.components.tax_rp,
            service: successData.components.service_rp,
            tip: successData.components.tip_rp,
            total: successData.components.total_rp,
            receipt_url: successData.receipt_url,
          };
        }
        setOcrProgress(100);
        setOcrData(formattedData);
        setIsSuccess(true);
        setIsProcessing(false);
        return formattedData; 
      } catch (error) {
        setOcrError(error);
        setIsError(true);
        setIsProcessing(false);
        setOcrProgress(0);
        throw error;
      }
    },
    [reset]
  );
  const processOCRAsync = useCallback(
    async (imageDataUrl) => {
      return processOCR(imageDataUrl);
    },
    [processOCR]
  );

  return {
    processOCR,
    processOCRAsync,
    isProcessing,
    ocrProgress,
    ocrError,
    ocrData,
    isSuccess,
    isError,
    reset,
  };
};

export default useOCRImage;

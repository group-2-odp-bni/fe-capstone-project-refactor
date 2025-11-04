// import { useState, useCallback } from 'react';

// /**
//  * Custom hook untuk OCR image processing (Dummy version)
//  * Returns only essential receipt data: items, subtotal, service, discount, other, total
//  * ✅ FIXED: Progress reaches exact 100% and sync with animation
//  */
// export const useOCRImage = () => {
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [ocrProgress, setOcrProgress] = useState(0);
//   const [ocrData, setOcrData] = useState(null);
//   const [ocrError, setOcrError] = useState(null);
//   const [isSuccess, setIsSuccess] = useState(false);
//   const [isError, setIsError] = useState(false);

//   const reset = useCallback(() => {
//     setIsProcessing(false);
//     setOcrProgress(0);
//     setOcrData(null);
//     setOcrError(null);
//     setIsSuccess(false);
//     setIsError(false);
//   }, []);

//   const processOCR = useCallback((imageDataUrl) => {
//     reset();
//     setIsProcessing(true);
//     setIsError(false);

//     return new Promise((resolve, reject) => {
//       let currentProgress = 0;
//       const totalDuration = 3000; // 3 seconds
//       const fps = 60;
//       const intervalMs = 1000 / fps;
//       const incrementPerFrame = 100 / (totalDuration / intervalMs);

//       const progressInterval = setInterval(() => {
//         currentProgress += incrementPerFrame;

//         if (currentProgress >= 100) {
//           // ✅ FIX 1: Force EXACT 100
//           currentProgress = 100;
//           clearInterval(progressInterval);

//           // ✅ FIX 2: Set progress to EXACT 100 FIRST
//           setOcrProgress(100);

//           const isSuccess = true; // Always success for dummy

//           if (isSuccess) {
//             const result = {
//               success: true,
//               receiptId: `RCP${Date.now()}`,

//               items: [
//                 {
//                   name: 'WALLS MGNUM STRW PAN',
//                   quantity: 2,
//                   price: 20000,
//                   total: 40000,
//                 },
//                 {
//                   name: 'MAGNUM MATCHA CRBL80',
//                   quantity: 2,
//                   price: 20000,
//                   total: 40000,
//                 },
//                 {
//                   name: 'OBH.C BDHK MNTHL 100',
//                   quantity: 1,
//                   price: 20200,
//                   total: 20200,
//                 },
//                 {
//                   name: 'CADBURY OREO 58.5G',
//                   quantity: 1,
//                   price: 20900,
//                   total: 20900,
//                 },
//               ],

//               subtotal: 121100,
//               pajak: 12001,
//               service: 0,
//               discount: -36000,
//               other: -12001,
//               total: 85100,
//             };

//             // ✅ FIX 3: Set data and success AFTER progress 100
//             setOcrData(result);
//             setIsSuccess(true);
//             setIsProcessing(false);

//             console.log('✅ OCR berhasil: 100%', result);
//             resolve(result);
//           } else {
//             const error = new Error('OCR gagal memproses gambar.');
//             setOcrError(error);
//             setIsError(true);
//             setIsProcessing(false);
//             setOcrProgress(0);
//             console.error('❌ OCR gagal:', error);
//             reject(error);
//           }
//         } else {
//           // Update progress smoothly (rounded for display)
//           setOcrProgress(Math.round(currentProgress));

//           // Log milestones
//           const milestone = Math.round(currentProgress);
//           if (milestone === 20) console.log('OCR: Menganalisis gambar... (20%)');
//           else if (milestone === 40) console.log('OCR: Mendeteksi teks... (40%)');
//           else if (milestone === 60) console.log('OCR: Membaca informasi... (60%)');
//           else if (milestone === 80) console.log('OCR: Memproses data... (80%)');
//         }
//       }, intervalMs);
//     });
//   }, [reset]);

//   const processOCRAsync = useCallback(async (imageDataUrl) => {
//     return processOCR(imageDataUrl);
//   }, [processOCR]);

//   return {
//     processOCR,
//     processOCRAsync,
//     isProcessing,
//     ocrProgress,
//     ocrError,
//     ocrData,
//     isSuccess,
//     isError,
//     reset,
//   };
// };

import { useState, useCallback } from "react";
import api from "../../lib/api";

async function dataURLtoFile(dataUrl, filename) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}

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

  // --- GANTI FUNGSI 'processOCR' DENGAN INI ---
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

        // 1. Cek jika API mengembalikan 'error: true'
        if (responseBody.error) {
          // Menangani kasus 'Ekstraksi OK, simpan gagal' (HTTP 207)
          if (responseBody.data && responseBody.data.extract) {
            console.warn(
              `OCR: API Error ('${responseBody.message}'), proceeding with data.`
            );
            // Lanjutkan seolah-olah sukses, karena kita punya datanya
            const extractedData = responseBody.data.extract;

            // Format data agar sesuai ekspektasi UI
            const formattedData = {
              receiptId: extractedData.ocr_id || `DRAFT-${Date.now()}`,
              items:
                extractedData.items || extractedData.items_for_assignment || [],
              subtotal:
                extractedData.components?.items_subtotal_rp ||
                extractedData.subtotal ||
                0,
              pajak:
                extractedData.components?.tax_rp || extractedData.pajak || 0,
              service:
                extractedData.components?.service_rp ||
                extractedData.service ||
                0,
              tip: extractedData.components?.tip_rp || 0,
              total:
                extractedData.components?.total_rp || extractedData.total || 0,
              receipt_url: extractedData.receipt_url,
            };

            setOcrProgress(100);
            setOcrData(formattedData);
            setIsSuccess(true);
            setIsProcessing(false);
            return formattedData;
          }
          // Error lain
          throw new Error(responseBody.message || "API returned an error");
        }

        // 2. Menangani kasus Sukses (HTTP 201)
        const successData = responseBody.data;
        if (!successData || !successData.items_for_assignment) {
          console.error(
            "OCR Error: Successful response, but data structure is wrong.",
            responseBody
          );
          throw new Error("Gagal membaca respons data dari server.");
        }

        // 3. Format Ulang data API (nested) menjadi data flat (sesuai dummy)
        const formattedData = {
          receiptId: successData.ocr_id,
          // 'items' adalah yang diharapkan UI, 'items_for_assignment' adalah dari API
          items: successData.items_for_assignment,
          // Ambil dari 'components' dan ratakan (flatten)
          subtotal: successData.components.items_subtotal_rp,
          pajak: successData.components.tax_rp,
          service: successData.components.service_rp,
          tip: successData.components.tip_rp,
          total: successData.components.total_rp,
          receipt_url: successData.receipt_url,
        };

        setOcrProgress(100);
        setOcrData(formattedData); // <-- Kirim data yang sudah diformat
        setIsSuccess(true);
        setIsProcessing(false);

        console.log("✅ Real OCR berhasil:", formattedData);
        return formattedData; // <-- Kembalikan data yang sudah diformat
      } catch (error) {
        // Tangkap semua error (network, 400, 500, atau error parsing di atas)
        console.error("❌ Real OCR gagal:", error);
        setOcrError(error);
        setIsError(true);
        setIsProcessing(false);
        setOcrProgress(0);
        throw error;
      }
    },
    [reset]
  );
  // --- AKHIR DARI FUNGSI 'processOCR' ---

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

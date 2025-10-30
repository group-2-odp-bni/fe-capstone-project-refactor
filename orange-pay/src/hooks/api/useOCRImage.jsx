import { useState, useCallback } from 'react';

/**
 * Custom hook untuk OCR image processing (Dummy version)
 * Returns only essential receipt data: items, subtotal, service, discount, other, total
 * ✅ FIXED: Progress reaches exact 100% and sync with animation
 */
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

  const processOCR = useCallback((imageDataUrl) => {
    reset();
    setIsProcessing(true);
    setIsError(false);

    return new Promise((resolve, reject) => {
      let currentProgress = 0;
      const totalDuration = 3000; // 3 seconds
      const fps = 60;
      const intervalMs = 1000 / fps;
      const incrementPerFrame = 100 / (totalDuration / intervalMs);

      const progressInterval = setInterval(() => {
        currentProgress += incrementPerFrame;

        if (currentProgress >= 100) {
          // ✅ FIX 1: Force EXACT 100
          currentProgress = 100;
          clearInterval(progressInterval);

          // ✅ FIX 2: Set progress to EXACT 100 FIRST
          setOcrProgress(100);

          const isSuccess = true; // Always success for dummy

          if (isSuccess) {
            const result = {
              success: true,
              receiptId: `RCP${Date.now()}`,
              
              items: [
                {
                  name: 'WALLS MGNUM STRW PAN',
                  quantity: 2,
                  price: 20000,
                  total: 40000,
                },
                {
                  name: 'MAGNUM MATCHA CRBL80',
                  quantity: 2,
                  price: 20000,
                  total: 40000,
                },
                {
                  name: 'OBH.C BDHK MNTHL 100',
                  quantity: 1,
                  price: 20200,
                  total: 20200,
                },
                {
                  name: 'CADBURY OREO 58.5G',
                  quantity: 1,
                  price: 20900,
                  total: 20900,
                },
              ],
              
              subtotal: 121100,
              pajak: 12001,
              service: 0,
              discount: -36000,
              other: -12001,
              total: 85100,
            };

            // ✅ FIX 3: Set data and success AFTER progress 100
            setOcrData(result);
            setIsSuccess(true);
            setIsProcessing(false);
            
            console.log('✅ OCR berhasil: 100%', result);
            resolve(result);
          } else {
            const error = new Error('OCR gagal memproses gambar.');
            setOcrError(error);
            setIsError(true);
            setIsProcessing(false);
            setOcrProgress(0);
            console.error('❌ OCR gagal:', error);
            reject(error);
          }
        } else {
          // Update progress smoothly (rounded for display)
          setOcrProgress(Math.round(currentProgress));
          
          // Log milestones
          const milestone = Math.round(currentProgress);
          if (milestone === 20) console.log('OCR: Menganalisis gambar... (20%)');
          else if (milestone === 40) console.log('OCR: Mendeteksi teks... (40%)');
          else if (milestone === 60) console.log('OCR: Membaca informasi... (60%)');
          else if (milestone === 80) console.log('OCR: Memproses data... (80%)');
        }
      }, intervalMs);
    });
  }, [reset]);

  const processOCRAsync = useCallback(async (imageDataUrl) => {
    return processOCR(imageDataUrl);
  }, [processOCR]);

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

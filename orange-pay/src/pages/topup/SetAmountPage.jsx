import { useState, useEffect } from "react";
import AmountInput from "../../components/top-up/AmountInput";
import WalletPickerSheet from "../../components/top-up/WalletPickerSheet";
import WalletSelectorButton from "../../components/top-up/WalletSelectorButton";
import ConfirmButton from "../../components/ui/ConfirmButton";
import FormLabel from "../../components/top-up/FormLabel";
import api from "../../lib/api";
import { useTopupContext } from "../../context/TopupContext";
import { useNavigate } from "react-router-dom";
import View from "../../components/view/View";
import Header from "../../components/Header";
import ContentBox from "../../components/common/ContentBox";
import { useToast } from "../../context/ToastContext";

export default function SetAmountPage() {
  const navigate = useNavigate();

  const { setTopupData } = useTopupContext();

  const [walletList, setWalletList] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [amount, setAmount] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  /** === Fetch Wallet List === */
  useEffect(() => {
    const getUserWalletList = async () => {
      try {
        const response = await api.get("/api/v1/wallets");
        const walletData = response.data.data.map((wallet) => ({
          id: wallet.id,
          name: wallet.name,
          amount: wallet.balanceSnapshot,
          transactionId: wallet.transactionId,
        }));
        setWalletList(walletData);
      } catch (err) {
      }
    };
    getUserWalletList();
  }, []);

  /** === Handle Confirm === */
  const handleConfirmAmount = async () => {
    let hasError = false;

    if (!selectedWallet) {
      
      showToast({
        type: "error",
        title: "Wallet belum dipilih",
        message: "Silakan pilih wallet terlebih dahulu."
      });


      hasError = true;
    } else {
      setError(""); // clear error if valid
    }

    if (!amount) {
      return; // You might add amount error later
    }
    if (hasError) return;

    // --- your existing API call ---
    const response = await api.post("/api/v1/topup/initiate", {
      provider: "BNI_VA",
      amount: Number(amount),
      walletId: selectedWallet.id,
    });

    setTopupData({
      walletId: selectedWallet.id,
      walletName: selectedWallet.name,
      amount: Number(amount),
      vaNumber: response.data.data.vaNumber,
      transactionRef: response.data.data.transactionRef,
      createdAt: response.data.data.createdAt,
      transactionId: response.data.data.transactionId,
    });

    navigate("/app/topup/confirm");
  };

  /** === Handle Picker === */
  const handleOpenWalletPicker = () => setIsSheetOpen(true);
  const handleCloseWalletPicker = () => setIsSheetOpen(false);

  return (
    <View>
      <Header title="Tambah Saldo"/>
      <ContentBox>
        <div className="flex flex-col">
          <div className=" pb-28 flex-1">
            {/* Select Wallet */}
            <FormLabel>Pilih Wallet : </FormLabel>

            <WalletSelectorButton
              walletName={selectedWallet?.name || "Pilih wallet"}
              walletAmount={selectedWallet?.amount || "-"}
              onClick={handleOpenWalletPicker}
            />

            {/* Amount Input */}
            <div className="mt-6">
              <FormLabel>Masukkan Nominal : </FormLabel>
              <AmountInput
                error={error}
                value={amount}
                onChange={(val) => setAmount(val)}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
            )}

            <div className="px-9 pt-8">
              {/* Footer */}
              <ConfirmButton
                label="Confirm"
                onClick={handleConfirmAmount}
                loading={false}
              />

              {/* Wallet Picker Sheet */}
              {isSheetOpen && (
                <WalletPickerSheet
                  onClose={handleCloseWalletPicker}
                  walletList={walletList}
                  onSelectWallet={(wallet) => {
                    setSelectedWallet(wallet);
                    handleCloseWalletPicker();
                    setError("")
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </ContentBox>
    </View>
  );
}

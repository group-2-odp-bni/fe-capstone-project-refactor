import { useState, useCallback } from "react";
import { useRegistrationContext } from "../context/RegistrationContext";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function useRegisterForm() {
  const { nextStep, setRegistrationData } = useRegistrationContext();

  const [values, setValues] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState({});

  const setField = useCallback((name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
  }, []);

  const onChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      if (name === "phoneNumber") {
        const onlyDigits = value.replace(/[^\d]/g, "");
        setField(name, onlyDigits);
      } else {
        setField(name, value);
      }
    },
    [setField]
  );

  const validate = useCallback(() => {
    const e = {};
    if (!values.fullName.trim()) e.fullName = "Nama wajib diisi";

    if (!values.email.trim()) e.email = "Email wajib diisi";
    else if (values.email.includes(" ") || values.email.includes("="))
      e.email = "Email tidak boleh mengandung spasi atau '='";
    else if (!emailRe.test(values.email)) e.email = "Format email tidak valid";

    if (!values.phoneNumber) e.phoneNumber = "Nomor telepon wajib diisi";
    else if (!values.phoneNumber.startsWith("8")) e.phoneNumber = "Nomor harus dimulai dengan 8";
    else if (values.phoneNumber.length < 10)
      e.phoneNumber = "Nomor telepon minimal 10 digit";

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [values]);

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const ok = validate();
      if (!ok) return false;

      setRegistrationData({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phoneE164: `+62${values.phoneNumber.replace(/^0+/, "")}`,
        phoneNumber: values.phoneNumber,
      });

      nextStep();
      return true;
    },
    [validate, values, setRegistrationData, nextStep]
  );

  return { values, errors, onChange, onSubmit };
}

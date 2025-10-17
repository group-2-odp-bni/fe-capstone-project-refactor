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
    else if (!emailRe.test(values.email)) e.email = "Format email tidak valid";

    if (!values.phoneNumber) e.phoneNumber = "Nomor telepon wajib diisi";
    else if (values.phoneNumber.length < 9)
      e.phoneNumber = "Nomor telepon terlalu pendek";

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [values]);

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!validate()) return;

      setRegistrationData({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phoneE164: `+62${values.phoneNumber.replace(/^0+/, "")}`,
      });

      nextStep();
    },
    [validate, values, setRegistrationData, nextStep]
  );

  return { values, errors, onChange, onSubmit };
}

import { useState } from "react";

type Errors<T> = Partial<Record<keyof T, string>>;

export function useFormValidation<T extends Record<string, any>>(initialValues: T, validate: (values: T) => Errors<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Errors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === "number" ? (e.target as HTMLInputElement).value : value;
    setValues((prev) => ({ ...prev, [name]: val }));
    // validate on change for the field
    setErrors((prev) => ({ ...prev, ...(validate({ ...values, [name]: val }) as any) }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target as HTMLInputElement;
    setTouched((t) => ({ ...t, [name]: true }));
    const newErrors = validate(values);
    setErrors(newErrors);
  };

  const validateAll = () => {
    const newErrors = validate(values);
    setErrors(newErrors);
    // mark all touched
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    Object.keys(values).forEach((k) => {
      (allTouched as any)[k] = true;
    });
    setTouched(allTouched);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent, onValid: (values: T) => void | Promise<void>) => {
    e.preventDefault();
    const newErrors = validateAll();
    const hasErrors = Object.keys(newErrors).length > 0;
    if (!hasErrors) {
      await onValid(values);
    }
  };

  return {
    values,
    setValues,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    validateAll,
  } as const;
}

export default useFormValidation;

type FormValidator<T> = {
  [key in keyof T]?: (v: T[key]) => (string | true) | Promise<true | string>;
};

export type TSFormError<T> = { [key in keyof T]?: string };

type FormTouched<T> = { [key in keyof T]?: true };

export type TSForm<T> = {
  values: T;
  errors: TSFormError<T>;
  touched: FormTouched<T>;
  validators: FormValidator<T>;
  isSubmitting?: boolean;
  isValidating?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  isValid?: boolean;
  _aName?: string;
  _aGroup?: string;
};

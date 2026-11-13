export const getFieldErrors = (error) => {
  const errors = error?.response?.data?.errors;
  if (!errors || !Array.isArray(errors)) return {};

  return errors.reduce((acc, err) => {
    acc[err.field] = err.message;
    return acc;
  }, {});
};

export const getToastError = (error, fallback) => {
  return error?.response?.data?.message || fallback;
};
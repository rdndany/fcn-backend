export const getSafeNumber = (value: any, defaultValue = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
};

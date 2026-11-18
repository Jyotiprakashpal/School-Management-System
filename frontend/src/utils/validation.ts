export const sanitizeMobileNumber = (value: string) =>
  value.replace(/\D/g, "").slice(0, 10)

export const isValidMobileNumber = (value: string) =>
  /^[6-9]\d{9}$/.test(value.trim())

export const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())

export const sanitizeAadhaarNumber = (value: string) =>
  value.replace(/\D/g, "").slice(0, 12)

export const isValidAadhaarNumber = (value: string) =>
  /^\d{12}$/.test(value.trim())

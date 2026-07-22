export const sanitizeFullName = (value) => {
  return value.replace(/[^A-Za-z\u0600-\u06FF ]/g, '').replace(/\s+/g, ' ')
}

export const sanitizePhoneNumber = (value) => {
  return value.replace(/\D/g, '').slice(0, 10)
}

export const isEmailFormatValid = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(value)
}

export const isPasswordLengthValid = (value) => {
  return value.length >= 8
}

export const doPasswordsMatch = (password, confirmPassword) => {
  return confirmPassword === '' || password === confirmPassword
}

export const getPhoneLengthErrorType = (digits) => {
  if (!digits) return ''
  if (digits.length < 9) return 'min'
  if (digits.length > 10) return 'max'
  return ''
}

export type AuthView = 'login' | 'playerSignup' | 'vendorSignup' | 'confirmPhone' | 'forgotPassword';

export type PhoneVerificationContext = {
  phoneE164: string;
  password: string;
  title: string;
  otpAlreadySent: boolean;
};

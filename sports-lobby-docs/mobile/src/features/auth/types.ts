import {AuthenticatedSession} from '../../services/session/sessionTypes';

export type AuthView = 'login' | 'playerSignup' | 'vendorSignup' | 'confirmPhone' | 'forgotPassword' | 'googleAuth';

export type PhoneVerificationContext = {
  phoneE164: string;
  password?: string;
  accessToken?: string;
  pendingSession?: AuthenticatedSession;
  title: string;
  otpAlreadySent: boolean;
  resendAvailableAt?: string;
};

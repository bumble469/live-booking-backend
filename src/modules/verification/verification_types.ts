export interface SendOTPBody {
  email: string;
}

export interface ConfirmOTPBody {
  email: string;
  otp: string;
}
export interface LockRequestBody {
  seatId: string;
  screeningId: string;
  sessionId: string;
}

export interface UnlockRequestBody {
  seatId: string;
  screeningId: string;
  sessionId: string;
}

export interface LockResult {
  success: boolean;
  seat: {
    id: string;
    status: string;
    lockedBy: string;
    lockExpiresAt: string;
  };
}
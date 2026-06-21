export interface LockRequestBody {
  screenId: string;
  seatId: string;
  sessionId: string;
}

export interface UnlockRequestBody {
  seatId: string;
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
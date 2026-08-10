export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details: Record<string, unknown>;
  };
};

export type HealthResponse = {
  status: 'UP';
  timestamp: string;
};

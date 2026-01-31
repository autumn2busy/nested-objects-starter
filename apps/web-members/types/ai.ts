export interface AIResumeRequest {
  prompt: string;
}

export interface AIResumeResponse {
  response: string;
  tokens_used: number;
  remaining_calls: number;
}

export interface AIError {
  error: string;
  tier?: string;
  limit?: number;
  call_count?: number;
}

export type SyncStepState = 'succeeded' | 'submitted' | 'failed' | 'blocked' | 'skipped';

export interface SyncStep {
    step: string;
    state: SyncStepState;
    code?: string;
    httpStatus?: number;
}

export interface SyncResult {
    status: 'succeeded' | 'submitted' | 'partial' | 'failed';
    recoveryRequired: boolean;
    automaticRetry: false;
    steps: SyncStep[];
    logs: string[];
}

export class AcSyncError extends Error {
    constructor(readonly code: string, readonly httpStatus?: number) {
        super(code);
    }
}

// No payloads, provider messages, email addresses or identifiers in diagnostics.
// A rejected write can have taken effect remotely: never retry it automatically.
export class AcSyncRun {
    readonly steps: SyncStep[] = [];
    readonly logs: string[] = [];

    record(step: string, state: SyncStepState, code?: string) {
        this.steps.push({ step, state, ...(code ? { code } : {}) });
    }

    async attempt<T>(step: string, action: () => Promise<T>, state: 'succeeded' | 'submitted' = 'succeeded'): Promise<T | null> {
        try {
            const result = await action();
            this.record(step, state);
            return result;
        } catch (error) {
            this.steps.push({ step, state: 'failed',
                code: error instanceof AcSyncError ? error.code : 'unexpected_failure',
                ...(error instanceof AcSyncError && error.httpStatus ? { httpStatus: error.httpStatus } : {}),
            });
            return null;
        }
    }

    result(): SyncResult {
        const recoveryRequired = this.steps.some(step => step.state === 'failed' || step.state === 'blocked');
        const progressed = this.steps.some(step => !['profile_context', 'orchestration'].includes(step.step) &&
            (step.state === 'succeeded' || step.state === 'submitted'));
        const submitted = this.steps.some(step => step.state === 'submitted');
        return {
            status: recoveryRequired ? (progressed ? 'partial' : 'failed') : submitted ? 'submitted' : 'succeeded',
            recoveryRequired,
            automaticRetry: false,
            steps: this.steps,
            logs: [...this.logs, ...this.steps.map(step => `${step.step}:${step.state}${step.code ? ':' + step.code : ''}`)],
        };
    }
}

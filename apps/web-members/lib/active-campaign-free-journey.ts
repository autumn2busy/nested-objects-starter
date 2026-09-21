import { createHash } from 'node:crypto';

export type FreeJourneyStage =
    | 'profile_needed'
    | 'calculation_needed'
    | 'onboarding_complete'
    | 'conversion_eligible'
    | 'withheld';

type JourneyStepState = 'succeeded' | 'skipped' | 'failed' | 'blocked';

export interface FreeJourneyWriteStep {
    step: string;
    state: JourneyStepState;
    code?: string;
    httpStatus?: number;
}

export interface FreeJourneyWriteResult {
    status: 'withheld' | 'unchanged' | 'updated' | 'partial' | 'failed';
    desiredStage: FreeJourneyStage | null;
    recoveryRequired: boolean;
    automaticRetry: false;
    attemptedWrites: number;
    confirmedWrites: number;
    steps: FreeJourneyWriteStep[];
}

export interface FreeJourneyMilestoneEvidence {
    memberId: string;
    lifecycleCycleId: string;
    sourceRecordId: string;
    occurredAt: string;
}

export interface FreeJourneyConsentReceipt {
    clientEventId: string;
    eventName: 'lifecycle_email_consent_requested';
    memberUid: string;
    occurredAt: string;
    eventData: {
        sourcePage: '/welcome';
        source: 'member_consent';
        consentContract: 'v1';
        purpose: 'free_onboarding_and_conversion_email';
        lifecycleCycleId: string;
    };
}

export interface FreeJourneyEvidenceInput {
    now: string;
    evidenceObservedAt: string;
    maxEvidenceAgeMs: number;
    evidenceExpiresAt: string;
    membership: {
        canonicalMemberId: string;
        outsetaPersonUid: string;
        outsetaAccountUid: string;
        subscriptionUid: string;
        activeCampaignContactId: string;
        email: string;
        sourceSystem: 'outseta';
        authoritative: true;
        identityState: 'verified' | 'conflict' | 'unknown';
        isCurrent: boolean;
        tier: 'free' | 'starter' | 'founders' | 'pro' | 'elite' | 'agency' | 'unknown';
        lifecycle: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused' | 'inactive' | 'unknown';
        memberSince: string;
        cycleStartedAt: string;
    };
    consentRequest: FreeJourneyConsentReceipt | null;
    audienceTraits: Array<'internal' | 'coworker' | 'test' | 'demo' | 'hiring_firm'>;
    profileInputs: {
        profile: boolean | null;
        geography: boolean | null;
        experience: boolean | null;
        inspectionTypes: boolean | null;
    };
    incomeScenarioStatus: 'accepted' | 'missing' | 'withheld';
    activation: (FreeJourneyMilestoneEvidence & { approved: true }) | null;
    onboardingCompletion: FreeJourneyMilestoneEvidence | null;
}

export interface ActiveCampaignFreeJourneyConfig {
    apiUrl: string;
    apiKey: string;
    consentListId: string;
    consentFormId: string;
    stageFieldId?: string;
    expiryFieldId?: string;
    accountTimeZone: string;
    timeoutMs?: number;
}

interface FieldValue {
    id?: unknown;
    contact?: unknown;
    owner?: unknown;
    field?: unknown;
    value?: unknown;
}

const CONSENT_EVENT = 'lifecycle_email_consent_requested';
const CONSENT_VERSION = 'v1';
const CONSENT_PURPOSE = 'free_onboarding_and_conversion_email';
const STAGE_FIELD_ID = '193';
const EXPIRY_FIELD_ID = '194';
const IDENTIFIER = /^[^\s@\u0000-\u001f]{1,160}$/;
const NUMERIC_ID = /^\d+$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

class JourneyWriterError extends Error {
    constructor(readonly code: string, readonly httpStatus?: number) {
        super(code);
    }
}

function isTimestamp(value: unknown): value is string {
    return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isIdentifier(value: unknown): value is string {
    return typeof value === 'string' && IDENTIFIER.test(value) && value === value.trim();
}

function normalizeEmail(value: string) {
    return value.trim().toLowerCase();
}

function localDate(value: string, timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date(value));
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
}

function validApiUrl(value: string) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:'
            && !url.username
            && !url.password
            && !url.port
            && /^[-a-z0-9]+\.api-[a-z]+\d+\.com$/i.test(url.hostname)
            && (url.pathname === '/' || url.pathname === '')
            && !url.search
            && !url.hash;
    } catch {
        return false;
    }
}

function validateConfig(config: ActiveCampaignFreeJourneyConfig) {
    if (!config) return false;
    const timeout = config.timeoutMs ?? 10_000;
    if (!validApiUrl(config.apiUrl) || !config.apiKey?.trim()
        || !NUMERIC_ID.test(config.consentListId) || !NUMERIC_ID.test(config.consentFormId)
        || !NUMERIC_ID.test(config.stageFieldId ?? STAGE_FIELD_ID)
        || !NUMERIC_ID.test(config.expiryFieldId ?? EXPIRY_FIELD_ID)
        || !Number.isInteger(timeout) || timeout < 1 || timeout > 30_000) return false;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: config.accountTimeZone }).format();
        return true;
    } catch {
        return false;
    }
}

function exactConsentKey(personUid: string, subscriptionUid: string) {
    const hash = createHash('sha256').update(JSON.stringify([
        CONSENT_EVENT,
        CONSENT_VERSION,
        personUid,
        subscriptionUid,
        CONSENT_PURPOSE,
    ])).digest('hex');
    return `${CONSENT_EVENT}:${CONSENT_VERSION}:${hash}`;
}

function validateConsentReceipt(input: FreeJourneyEvidenceInput) {
    const receipt = input.consentRequest;
    const membership = input.membership;
    if (!receipt || receipt.eventName !== CONSENT_EVENT || receipt.memberUid !== membership.outsetaPersonUid
        || receipt.clientEventId !== exactConsentKey(membership.outsetaPersonUid, membership.subscriptionUid)) return false;
    const keys = Object.keys(receipt.eventData).sort().join(',');
    if (keys !== 'consentContract,lifecycleCycleId,purpose,source,sourcePage'
        || receipt.eventData.sourcePage !== '/welcome'
        || receipt.eventData.source !== 'member_consent'
        || receipt.eventData.consentContract !== CONSENT_VERSION
        || receipt.eventData.purpose !== CONSENT_PURPOSE
        || receipt.eventData.lifecycleCycleId !== membership.subscriptionUid
        || !isTimestamp(receipt.occurredAt)) return false;
    const occurredAt = Date.parse(receipt.occurredAt);
    return occurredAt >= Date.parse(membership.memberSince)
        && occurredAt >= Date.parse(membership.cycleStartedAt)
        && occurredAt <= Date.parse(input.evidenceObservedAt)
        && occurredAt <= Date.parse(input.now);
}

function evidenceMatches(evidence: FreeJourneyMilestoneEvidence | null, input: FreeJourneyEvidenceInput) {
    return !!evidence
        && evidence.memberId === input.membership.canonicalMemberId
        && evidence.lifecycleCycleId === input.membership.subscriptionUid
        && isIdentifier(evidence.sourceRecordId)
        && isTimestamp(evidence.occurredAt)
        && Date.parse(evidence.occurredAt) >= Date.parse(input.membership.memberSince)
        && Date.parse(evidence.occurredAt) >= Date.parse(input.membership.cycleStartedAt)
        && Date.parse(evidence.occurredAt) <= Date.parse(input.evidenceObservedAt)
        && Date.parse(evidence.occurredAt) <= Date.parse(input.now);
}

function validateEvidenceContext(input: FreeJourneyEvidenceInput, config: ActiveCampaignFreeJourneyConfig) {
    if (!input) return false;
    const membership = input.membership;
    if (!isTimestamp(input.now) || !isTimestamp(input.evidenceObservedAt)
        || !Number.isFinite(input.maxEvidenceAgeMs) || input.maxEvidenceAgeMs <= 0
        || Date.parse(input.evidenceObservedAt) > Date.parse(input.now)
        || Date.parse(input.now) - Date.parse(input.evidenceObservedAt) > input.maxEvidenceAgeMs
        || !DATE_ONLY.test(input.evidenceExpiresAt)
        || input.evidenceExpiresAt <= localDate(input.now, config.accountTimeZone)
        || Date.parse(`${input.evidenceExpiresAt}T00:00:00.000Z`) > Date.parse(input.evidenceObservedAt) + input.maxEvidenceAgeMs) return false;
    if (!membership || membership.sourceSystem !== 'outseta' || membership.authoritative !== true
        || membership.identityState !== 'verified' || membership.isCurrent !== true
        || !isIdentifier(membership.canonicalMemberId)
        || !isIdentifier(membership.outsetaPersonUid)
        || !isIdentifier(membership.outsetaAccountUid)
        || !isIdentifier(membership.subscriptionUid)
        || !NUMERIC_ID.test(membership.activeCampaignContactId)
        || !/^\S+@\S+\.\S+$/.test(normalizeEmail(membership.email))
        || !isTimestamp(membership.memberSince) || !isTimestamp(membership.cycleStartedAt)
        || Date.parse(membership.memberSince) > Date.parse(input.evidenceObservedAt)
        || Date.parse(membership.cycleStartedAt) > Date.parse(input.evidenceObservedAt)
        || !Array.isArray(input.audienceTraits)
        || !Object.values(input.profileInputs).every(value => value === true || value === false || value === null)) return false;
    return validateConsentReceipt(input);
}

export function deriveFreeJourneyStage(input: FreeJourneyEvidenceInput): FreeJourneyStage {
    if (input.audienceTraits.length > 0 || input.membership.tier !== 'free'
        || !['active', 'trialing'].includes(input.membership.lifecycle)) return 'withheld';
    const values = Object.values(input.profileInputs);
    if (values.some(value => value === null)) return 'withheld';
    if (values.some(value => value === false)) return 'profile_needed';
    if (input.incomeScenarioStatus === 'missing' && !input.activation && !input.onboardingCompletion) {
        return 'calculation_needed';
    }
    if (input.incomeScenarioStatus !== 'accepted'
        || input.activation?.approved !== true
        || !evidenceMatches(input.activation, input)
        || !evidenceMatches(input.onboardingCompletion, input)) return 'withheld';
    if (input.membership.lifecycle === 'trialing') return 'onboarding_complete';
    const ageDays = (Date.parse(input.now) - Date.parse(input.membership.memberSince)) / 86_400_000;
    return Number.isFinite(ageDays) && ageDays >= 30 ? 'conversion_eligible' : 'onboarding_complete';
}

function result(
    status: FreeJourneyWriteResult['status'],
    desiredStage: FreeJourneyStage | null,
    steps: FreeJourneyWriteStep[],
    attemptedWrites = 0,
    confirmedWrites = 0,
): FreeJourneyWriteResult {
    return {
        status,
        desiredStage,
        recoveryRequired: status === 'partial' || status === 'failed',
        automaticRetry: false,
        attemptedWrites,
        confirmedWrites,
        steps,
    };
}

/**
 * Writes only the two pre-approved journey evidence fields. The caller supplies already-collected,
 * current authority/evidence snapshots. This function never creates contacts, changes list status,
 * enrolls contacts, starts automations, sends email, or retries an uncertain write.
 */
export async function syncActiveCampaignFreeJourney(
    input: FreeJourneyEvidenceInput,
    config: ActiveCampaignFreeJourneyConfig,
    fetchImpl: typeof fetch = fetch,
): Promise<FreeJourneyWriteResult> {
    const steps: FreeJourneyWriteStep[] = [];
    if (!validateConfig(config)) {
        steps.push({ step: 'configuration', state: 'blocked', code: 'configuration_invalid' });
        return result('withheld', null, steps);
    }
    if (!validateEvidenceContext(input, config)) {
        steps.push({ step: 'evidence', state: 'blocked', code: 'identity_consent_or_freshness_unverified' });
        return result('withheld', null, steps);
    }
    steps.push({ step: 'evidence', state: 'succeeded' });

    const desiredStage = deriveFreeJourneyStage(input);
    const contactId = input.membership.activeCampaignContactId;
    const stageFieldId = config.stageFieldId ?? STAGE_FIELD_ID;
    const expiryFieldId = config.expiryFieldId ?? EXPIRY_FIELD_ID;
    const timeout = config.timeoutMs ?? 10_000;
    const apiBase = config.apiUrl.replace(/\/$/, '');
    const requestJson = async (path: string, method = 'GET', body?: unknown) => {
        let response: Response;
        try {
            response = await fetchImpl(`${apiBase}/api/3/${path}`, {
                method,
                redirect: 'error',
                headers: { 'Api-Token': config.apiKey, 'Content-Type': 'application/json' },
                ...(body === undefined ? {} : { body: JSON.stringify(body) }),
                signal: AbortSignal.timeout(timeout),
            });
        } catch {
            throw new JourneyWriterError('transport_failure');
        }
        if (!response.ok) throw new JourneyWriterError('http_error', response.status);
        try {
            return await response.json() as Record<string, unknown>;
        } catch {
            throw new JourneyWriterError('invalid_response');
        }
    };
    const fail = (step: string, error: unknown, status: 'failed' | 'partial', attempted = 0, confirmed = 0) => {
        steps.push({
            step,
            state: 'failed',
            code: error instanceof JourneyWriterError ? error.code : 'unexpected_failure',
            ...(error instanceof JourneyWriterError && error.httpStatus ? { httpStatus: error.httpStatus } : {}),
        });
        return result(status, desiredStage, steps, attempted, confirmed);
    };

    let contactData: Record<string, unknown>;
    try {
        contactData = await requestJson(`contacts/${contactId}`);
    } catch (error) {
        return fail('contact', error, 'failed');
    }
    const contact = contactData.contact as Record<string, unknown> | undefined;
    if (!contact || String(contact.id) !== contactId
        || normalizeEmail(String(contact.email ?? '')) !== normalizeEmail(input.membership.email)
        || !['0', '1'].includes(String(contact.bounced_hard))
        || !['0', '1'].includes(String(contact.bounced_soft))
        || !['0', '1'].includes(String(contact.deleted))) {
        return fail('contact', new JourneyWriterError('contact_identity_or_delivery_state_invalid'), 'failed');
    }
    if (String(contact.bounced_hard) !== '0' || String(contact.bounced_soft) !== '0' || String(contact.deleted) !== '0') {
        steps.push({ step: 'contact', state: 'blocked', code: 'contact_delivery_suppressed' });
        return result('withheld', desiredStage, steps);
    }
    steps.push({ step: 'contact', state: 'succeeded' });

    let listData: Record<string, unknown>;
    try {
        listData = await requestJson(`contacts/${contactId}/contactLists`);
    } catch (error) {
        return fail('consent_list', error, 'failed');
    }
    if (!Array.isArray(listData.contactLists)) {
        return fail('consent_list', new JourneyWriterError('list_relationship_invalid'), 'failed');
    }
    const listMatches = (listData.contactLists as Array<Record<string, unknown>>)
        .filter(item => String(item.list) === config.consentListId);
    if (listMatches.length !== 1 || String(listMatches[0].contact) !== contactId) {
        steps.push({ step: 'consent_list', state: 'blocked', code: 'doi_membership_missing_or_ambiguous' });
        return result('withheld', desiredStage, steps);
    }
    if (String(listMatches[0].status) !== '1' || String(listMatches[0].form) !== config.consentFormId) {
        steps.push({ step: 'consent_list', state: 'blocked', code: 'doi_not_confirmed' });
        return result('withheld', desiredStage, steps);
    }
    steps.push({ step: 'consent_list', state: 'succeeded' });

    let fieldData: Record<string, unknown>;
    try {
        fieldData = await requestJson(`contacts/${contactId}/fieldValues`);
    } catch (error) {
        return fail('field_lookup', error, 'failed');
    }
    if (!Array.isArray(fieldData.fieldValues)) {
        return fail('field_lookup', new JourneyWriterError('field_relationship_invalid'), 'failed');
    }
    const fieldValues = fieldData.fieldValues as FieldValue[];
    const findField = (fieldId: string) => fieldValues.filter(item => String(item.field) === fieldId);
    const stageMatches = findField(stageFieldId);
    const expiryMatches = findField(expiryFieldId);
    if (stageMatches.length > 1 || expiryMatches.length > 1
        || [...stageMatches, ...expiryMatches].some(item => String(item.contact ?? item.owner) !== contactId)) {
        return fail('field_lookup', new JourneyWriterError('field_identity_conflict'), 'failed');
    }
    steps.push({ step: 'field_lookup', state: 'succeeded' });

    let attemptedWrites = 0;
    let confirmedWrites = 0;
    const writeField = async (step: string, fieldId: string, value: string, existing?: FieldValue) => {
        if (existing && String(existing.value ?? '') === value) {
            steps.push({ step, state: 'skipped', code: 'already_current' });
            return true;
        }
        const existingId = existing?.id == null ? null : String(existing.id);
        if (existing && (!existingId || !NUMERIC_ID.test(existingId))) throw new JourneyWriterError('field_value_id_invalid');
        attemptedWrites += 1;
        const written = await requestJson(existingId ? `fieldValues/${existingId}` : 'fieldValues', existingId ? 'PUT' : 'POST', {
            fieldValue: { contact: contactId, field: fieldId, value },
        });
        const fieldValue = written.fieldValue as FieldValue | undefined;
        const writtenId = fieldValue?.id == null ? '' : String(fieldValue.id);
        if (!fieldValue || !NUMERIC_ID.test(writtenId) || String(fieldValue.contact ?? fieldValue.owner) !== contactId
            || String(fieldValue.field) !== fieldId || String(fieldValue.value) !== value) {
            throw new JourneyWriterError('field_write_unconfirmed');
        }
        const readback = await requestJson(`fieldValues/${writtenId}`);
        const confirmed = readback.fieldValue as FieldValue | undefined;
        if (!confirmed || String(confirmed.id) !== writtenId
            || String(confirmed.contact ?? confirmed.owner) !== contactId
            || String(confirmed.field) !== fieldId || String(confirmed.value) !== value) {
            throw new JourneyWriterError('field_readback_unconfirmed');
        }
        confirmedWrites += 1;
        steps.push({ step, state: 'succeeded' });
        return true;
    };

    try {
        await writeField('field_expiry', expiryFieldId, input.evidenceExpiresAt, expiryMatches[0]);
    } catch (error) {
        return fail('field_expiry', error, confirmedWrites > 0 ? 'partial' : 'failed', attemptedWrites, confirmedWrites);
    }
    try {
        // Stage is last because field 193 is the automation trigger; expiry must already be confirmed.
        await writeField('field_stage', stageFieldId, desiredStage, stageMatches[0]);
    } catch (error) {
        return fail('field_stage', error, confirmedWrites > 0 ? 'partial' : 'failed', attemptedWrites, confirmedWrites);
    }
    return result(attemptedWrites === 0 ? 'unchanged' : 'updated', desiredStage, steps, attemptedWrites, confirmedWrites);
}

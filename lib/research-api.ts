export type Product = {
  id: string;
  category: string;
  standardName: string;
  imperfectName: string;
  standardImage: string;
  imperfectImage: string;
  unit: string;
  originalPriceCents: number;
  currentPriceCents: number;
  appearance: string;
  quality: string;
  conditionAInformation: string;
  conditionBInformation: string;
  scenario: string;
  sourceStatus: 'not verified' | 'verified';
};

export type StudyMode = 'browse' | 'comprehension' | 'comparison';
export type Condition = 'A' | 'B';
export type ProductKind = 'standard' | 'imperfect';
export type EventType =
  | 'product_details_opened'
  | 'product_chosen'
  | 'task_completed';

const PRODUCTION_API_BASE_URL =
  'https://fresh-choice-research-api.zx5g456.workers.dev';

function apiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  if (configured) return configured;

  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  ) {
    return 'http://127.0.0.1:8787';
  }

  return PRODUCTION_API_BASE_URL;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    cache: 'no-store',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Research API returned ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function loadProducts(signal?: AbortSignal): Promise<Product[]> {
  const result = await request<{ products: Product[] }>('/api/products', {
    signal,
  });
  return result.products;
}

export async function createStudySession(input: {
  participantName: string;
  studyMode: StudyMode;
  condition: Condition;
  scenarioIndex: number;
}): Promise<{ id: string; startedAt: string }> {
  const result = await request<{ id: string; started_at: string }>(
    '/api/sessions',
    {
      method: 'POST',
      body: JSON.stringify({
        participant_name: input.participantName,
        study_mode: input.studyMode,
        condition: input.condition,
        scenario_index: input.scenarioIndex,
      }),
    },
  );
  return { id: result.id, startedAt: result.started_at };
}

export async function recordEvent(
  sessionId: string,
  input: {
    eventType: Exclude<EventType, 'task_completed'>;
    productId?: string;
    productKind?: ProductKind;
    elapsedMs?: number;
    metadata?: Record<string, string | number | boolean | null>;
  },
): Promise<void> {
  await request(`/api/sessions/${sessionId}/events`, {
    method: 'POST',
    body: JSON.stringify({
      event_type: input.eventType,
      product_id: input.productId,
      product_kind: input.productKind,
      elapsed_ms: input.elapsedMs,
      metadata: input.metadata ?? {},
    }),
  });
}

export async function completeStudySession(
  sessionId: string,
  input: {
    elapsedMs: number;
    productId?: string;
    productKind?: ProductKind;
  },
): Promise<void> {
  await request(`/api/sessions/${sessionId}/complete`, {
    method: 'POST',
    body: JSON.stringify({
      elapsed_ms: input.elapsedMs,
      product_id: input.productId,
      product_kind: input.productKind,
    }),
  });
}

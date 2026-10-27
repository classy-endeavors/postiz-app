import {
  ActivityFailure,
  ApplicationFailure,
  CancellationScope,
  proxyActivities,
  sleep,
} from '@temporalio/workflow';
import { ClippingActivity } from '@gitroom/orchestrator/activities/clipping.activity';
import type { ClippingJobState } from '@gitroom/nestjs-libraries/database/prisma/clipping/clipping.service';

const { submitClippingAnalyse } = proxyActivities<ClippingActivity>({
  startToCloseTimeout: '2 minute',
  taskQueue: 'main',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2,
    initialInterval: '10 seconds',
  },
});

const {
  checkClippingAnalyse,
  failClipping,
  markClippingSuggestionsReady,
} = proxyActivities<ClippingActivity>({
  startToCloseTimeout: '2 minute',
  taskQueue: 'main',
  retry: {
    maximumAttempts: 10,
    backoffCoefficient: 2,
    initialInterval: '10 seconds',
    maximumInterval: '2 minutes',
  },
});

const { transcribeClipping, pickClippingClips } =
  proxyActivities<ClippingActivity>({
    startToCloseTimeout: '15 minute',
    taskQueue: 'main',
    retry: {
      maximumAttempts: 3,
      backoffCoefficient: 1,
      initialInterval: '1 minute',
    },
  });

const reason = (err: any, fallback: string) => {
  const cause = err instanceof ActivityFailure ? err.cause : err;
  return {
    error: cause?.message || fallback,
    customer:
      cause instanceof ApplicationFailure && cause.type === 'clipping_stop',
  };
};

const FAST_POLLS = 12;
const FAST_INTERVAL = 5000;
const SLOW_INTERVAL = 15000;
const MAX_POLLS =
  FAST_POLLS + (60 * 60 * 1000 - FAST_POLLS * FAST_INTERVAL) / SLOW_INTERVAL;
const MAX_SUBMITS = 3;

async function runJob<T extends { state: ClippingJobState }>(
  submit: () => Promise<string>,
  check: (jobId: string) => Promise<T>
): Promise<T | { state: 'failed' }> {
  for (let attempt = 0; attempt < MAX_SUBMITS; attempt++) {
    const jobId = await submit();
    let answer: T | undefined;
    for (let i = 0; i < MAX_POLLS; i++) {
      await sleep(i < FAST_POLLS ? FAST_INTERVAL : SLOW_INTERVAL);
      answer = await check(jobId);
      if (answer.state !== 'pending') {
        break;
      }
    }

    if (answer?.state !== 'retry') {
      return !answer || answer.state === 'pending'
        ? { state: 'failed' }
        : answer;
    }
  }

  return { state: 'failed' };
}

// Suggest only: analyse → pick → suggestions_ready. No charge, no render.
export async function clippingSuggestWorkflow({
  clippingId,
}: {
  clippingId: string;
}) {
  try {
    const analysed = await runJob(
      () => submitClippingAnalyse({ clippingId }),
      (jobId) => checkClippingAnalyse({ clippingId, jobId })
    );
    if (analysed.state !== 'done') {
      return failClipping({
        clippingId,
        error: 'The video could not be analysed',
        customer: true,
      });
    }

    if ('transcribe' in analysed && analysed.transcribe) {
      await transcribeClipping({ clippingId });
    }

    await pickClippingClips({ clippingId });
    await markClippingSuggestionsReady({ clippingId });
  } catch (err: any) {
    return CancellationScope.nonCancellable(() =>
      failClipping({ clippingId, ...reason(err, 'Clipping failed') })
    );
  }
}

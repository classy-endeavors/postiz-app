import {
  ActivityFailure,
  ApplicationFailure,
  CancellationScope,
  executeChild,
  proxyActivities,
} from '@temporalio/workflow';
import { ClippingActivity } from '@gitroom/orchestrator/activities/clipping.activity';
import { clippingClipWorkflow } from '@gitroom/orchestrator/workflows/clipping.workflow';

const {
  createClippingDrafts,
  finishClipping,
  failClipping,
  listPendingClippingClips,
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

const reason = (err: any, fallback: string) => {
  const cause = err instanceof ActivityFailure ? err.cause : err;
  return {
    error: cause?.message || fallback,
    customer:
      cause instanceof ApplicationFailure && cause.type === 'clipping_stop',
  };
};

// Render + draft after confirm. Charge already happened in the HTTP confirm path.
// Reuses clippingClipWorkflow from the existing file without modifying it.
export async function clippingRenderWorkflow({
  clippingId,
}: {
  clippingId: string;
}) {
  try {
    const clips = await listPendingClippingClips({ clippingId });
    await Promise.all(
      clips.map((clipId: string) =>
        executeChild(clippingClipWorkflow, {
          workflowId: `clipping_render_clip_${clipId}`,
          args: [{ clipId }],
        }).catch(() => undefined)
      )
    );
  } catch (err: any) {
    return CancellationScope.nonCancellable(() =>
      failClipping({ clippingId, ...reason(err, 'Clipping failed') })
    );
  }

  try {
    await createClippingDrafts({ clippingId });
  } catch (err: any) {
    return CancellationScope.nonCancellable(() =>
      failClipping({
        clippingId,
        ...reason(err, 'The draft posts could not be created'),
      })
    );
  }

  return finishClipping({ clippingId });
}

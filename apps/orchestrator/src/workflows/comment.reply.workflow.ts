import { proxyActivities, sleep } from '@temporalio/workflow';
import { CommentReplyActivity } from '@gitroom/orchestrator/activities/comment.reply.activity';

const { pollYoutubeComments } = proxyActivities<CommentReplyActivity>({
  startToCloseTimeout: '10 minute',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 1,
    initialInterval: '1 minute',
  },
});

export async function commentReplyWorkflow() {
  while (true) {
    await pollYoutubeComments();
    await sleep('10 minutes');
  }
}

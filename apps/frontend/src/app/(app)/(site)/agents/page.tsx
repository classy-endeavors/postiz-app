import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'AI Zyntra - Agent',
  description: '',
};

export default async function Page() {
  // Pre-mint a thread id so the chat never runs on the literal /agents/new
  // URL (CopilotKit would auto-mint an id that never reaches the address bar).
  return redirect(`/agents/${crypto.randomUUID()}`);
}

import {
  SESv2Client,
  SendEmailCommand,
  type SendEmailCommandInput,
} from '@aws-sdk/client-sesv2';
import { EmailInterface } from '@gitroom/nestjs-libraries/emails/email.interface';

const SIMULATOR_DOMAIN = 'simulator.amazonses.com';

function resolveRegion(): string {
  return process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-1';
}

/** Sandbox is ON unless explicitly set to false (production requires AWS approval + this flip). */
export function isSesSandbox(): boolean {
  const raw = process.env.AWS_SES_SANDBOX;
  if (raw === undefined || raw === '') {
    return true;
  }
  return raw.toLowerCase() !== 'false';
}

function parseRecipientList(value?: string): string[] {
  if (!value?.trim()) {
    return [];
  }
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isSesMailboxSimulatorAddress(email: string): boolean {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf('@');
  if (at < 0) {
    return false;
  }
  return normalized.slice(at + 1) === SIMULATOR_DOMAIN;
}

export function getSesAllowedRecipients(): Set<string> {
  return new Set(
    parseRecipientList(process.env.AWS_SES_ALLOWED_RECIPIENTS).map(
      normalizeEmail
    )
  );
}

export function assertSesSandboxRecipientsAllowed(recipients: {
  to?: string[];
  cc?: string[];
  bcc?: string[];
}): void {
  if (!isSesSandbox()) {
    return;
  }

  const allowed = getSesAllowedRecipients();
  const all = [
    ...(recipients.to ?? []),
    ...(recipients.cc ?? []),
    ...(recipients.bcc ?? []),
  ];

  const rejected = all.filter((email) => {
    const normalized = normalizeEmail(email);
    return (
      !isSesMailboxSimulatorAddress(normalized) && !allowed.has(normalized)
    );
  });

  if (rejected.length > 0) {
    throw new Error(
      `SES sandbox: ${rejected.length} recipient(s) are not allowlisted. ` +
        `Add verified addresses to AWS_SES_ALLOWED_RECIPIENTS, use an SES mailbox simulator address (*@${SIMULATOR_DOMAIN}), ` +
        `or set AWS_SES_SANDBOX=false only after AWS grants production access.`
    );
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeAwsErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') {
    return 'SES send failed';
  }
  const e = err as {
    name?: string;
    message?: string;
    Code?: string;
    $metadata?: { httpStatusCode?: number; requestId?: string };
  };
  const code = e.name || e.Code || 'Error';
  const status = e.$metadata?.httpStatusCode;
  const requestId = e.$metadata?.requestId;
  const parts = [`SES ${code}`];
  if (status) {
    parts.push(`status=${status}`);
  }
  if (requestId) {
    parts.push(`requestId=${requestId}`);
  }
  if (
    e.message &&
    !/credential|secret|password|access.?key/i.test(e.message)
  ) {
    parts.push(e.message);
  }
  return parts.join(': ');
}

export class SesProvider implements EmailInterface {
  name = 'ses';
  /** Region has a hard default; From is enforced by EmailService. No Resend/Nodemailer keys. */
  validateEnvKeys: string[] = [];

  private client: SESv2Client | null = null;

  private getClient(): SESv2Client {
    if (!this.client) {
      this.client = new SESv2Client({ region: resolveRegion() });
    }
    return this.client;
  }

  /** Used by tests to inject a mock client. */
  setClientForTests(client: SESv2Client) {
    this.client = client;
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    emailFromName: string,
    emailFromAddress: string,
    replyTo?: string
  ) {
    const toAddresses = parseRecipientList(to);
    if (toAddresses.length === 0) {
      throw new Error('SES send failed: missing To recipient');
    }

    // Interface supplies To only today; validate Destination To/Cc/Bcc the same way if added later.
    const destination: NonNullable<SendEmailCommandInput['Destination']> = {
      ToAddresses: toAddresses,
    };

    assertSesSandboxRecipientsAllowed({
      to: destination.ToAddresses,
      cc: destination.CcAddresses,
      bcc: destination.BccAddresses,
    });

    const input: SendEmailCommandInput = {
      FromEmailAddress: `${emailFromName} <${emailFromAddress}>`,
      Destination: destination,
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: html, Charset: 'UTF-8' },
            Text: { Data: htmlToText(html) || subject, Charset: 'UTF-8' },
          },
        },
      },
      ...(replyTo?.trim() ? { ReplyToAddresses: [replyTo.trim()] } : {}),
    };

    try {
      return await this.getClient().send(new SendEmailCommand(input));
    } catch (err) {
      const safe = safeAwsErrorMessage(err);
      console.error(safe);
      throw new Error(safe);
    }
  }
}

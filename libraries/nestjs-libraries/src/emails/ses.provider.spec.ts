jest.mock('@aws-sdk/client-sesv2', () => {
  const send = jest.fn();
  class SESv2Client {
    send = send;
  }
  class SendEmailCommand {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  }
  return {
    SESv2Client,
    SendEmailCommand,
    __mockSend: send,
  };
});

import {
  SesProvider,
  assertSesSandboxRecipientsAllowed,
  isSesSandbox,
  isSesMailboxSimulatorAddress,
} from './ses.provider';

const { __mockSend: mockSend, SendEmailCommand } = jest.requireMock(
  '@aws-sdk/client-sesv2'
) as {
  __mockSend: jest.Mock;
  SendEmailCommand: new (input: unknown) => { input: unknown };
};

describe('SesProvider sandbox helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AWS_SES_SANDBOX;
    delete process.env.AWS_SES_ALLOWED_RECIPIENTS;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('defaults AWS_SES_SANDBOX to true when unset', () => {
    delete process.env.AWS_SES_SANDBOX;
    expect(isSesSandbox()).toBe(true);
  });

  it('treats only explicit false as production mode', () => {
    process.env.AWS_SES_SANDBOX = 'false';
    expect(isSesSandbox()).toBe(false);
    process.env.AWS_SES_SANDBOX = 'FALSE';
    expect(isSesSandbox()).toBe(false);
    process.env.AWS_SES_SANDBOX = 'true';
    expect(isSesSandbox()).toBe(true);
  });

  it('allows SES mailbox simulator addresses', () => {
    expect(isSesMailboxSimulatorAddress('success@simulator.amazonses.com')).toBe(
      true
    );
    expect(isSesMailboxSimulatorAddress('bounce@simulator.amazonses.com')).toBe(
      true
    );
    expect(isSesMailboxSimulatorAddress('user@example.com')).toBe(false);
  });

  it('rejects non-allowlisted To/Cc/Bcc in sandbox before send', () => {
    process.env.AWS_SES_ALLOWED_RECIPIENTS = 'ok@example.com';
    expect(() =>
      assertSesSandboxRecipientsAllowed({
        to: ['ok@example.com'],
        cc: ['other@example.com'],
        bcc: [],
      })
    ).toThrow(/SES sandbox/);

    expect(() =>
      assertSesSandboxRecipientsAllowed({
        to: ['ok@example.com'],
        bcc: ['hidden@example.com'],
      })
    ).toThrow(/SES sandbox/);
  });

  it('allows allowlisted and simulator recipients in sandbox', () => {
    process.env.AWS_SES_ALLOWED_RECIPIENTS = 'ok@example.com, team@example.com';
    expect(() =>
      assertSesSandboxRecipientsAllowed({
        to: ['ok@example.com'],
        cc: ['success@simulator.amazonses.com'],
        bcc: ['TEAM@example.com'],
      })
    ).not.toThrow();
  });

  it('skips allowlist when sandbox is explicitly false', () => {
    process.env.AWS_SES_SANDBOX = 'false';
    expect(() =>
      assertSesSandboxRecipientsAllowed({ to: ['anyone@example.com'] })
    ).not.toThrow();
  });
});

describe('SesProvider.sendEmail', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.AWS_SES_SANDBOX = 'true';
    process.env.AWS_SES_ALLOWED_RECIPIENTS = 'user@example.com';
    mockSend.mockReset();
    mockSend.mockResolvedValue({ MessageId: 'msg-1' });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('sends HTML and text payload with From/To/ReplyTo', async () => {
    const provider = new SesProvider();
    await provider.sendEmail(
      'user@example.com',
      'Hello',
      '<p>Hi <b>there</b></p>',
      'AI Zyntra',
      'admin@aizyntra.com',
      'noreply@aizyntra.com'
    );

    expect(mockSend).toHaveBeenCalledTimes(1);
    const command = mockSend.mock.calls[0][0] as InstanceType<
      typeof SendEmailCommand
    >;
    const input = command.input as {
      FromEmailAddress: string;
      Destination: { ToAddresses: string[] };
      ReplyToAddresses?: string[];
      Content: {
        Simple: {
          Subject: { Data: string };
          Body: { Html: { Data: string }; Text: { Data: string } };
        };
      };
    };

    expect(input.FromEmailAddress).toBe('AI Zyntra <admin@aizyntra.com>');
    expect(input.Destination.ToAddresses).toEqual(['user@example.com']);
    expect(input.ReplyToAddresses).toEqual(['noreply@aizyntra.com']);
    expect(input.Content.Simple.Subject.Data).toBe('Hello');
    expect(input.Content.Simple.Body.Html.Data).toContain('<p>Hi');
    expect(input.Content.Simple.Body.Text.Data).toContain('Hi there');
  });

  it('rejects sandbox recipients before calling AWS', async () => {
    const provider = new SesProvider();
    await expect(
      provider.sendEmail(
        'stranger@example.com',
        'Hello',
        '<p>Hi</p>',
        'AI Zyntra',
        'admin@aizyntra.com'
      )
    ).rejects.toThrow(/SES sandbox/);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('allows simulator addresses without allowlist entry', async () => {
    delete process.env.AWS_SES_ALLOWED_RECIPIENTS;
    const provider = new SesProvider();
    await provider.sendEmail(
      'success@simulator.amazonses.com',
      'Sim',
      '<p>x</p>',
      'AI Zyntra',
      'admin@aizyntra.com'
    );
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('maps AWS errors safely without leaking credential-like messages', async () => {
    mockSend.mockRejectedValue({
      name: 'MessageRejected',
      message: 'Email address is not verified. AccessKey=AKIASECRETSHOULDNOTAPPEAR',
      $metadata: { httpStatusCode: 400, requestId: 'req-123' },
    });

    const provider = new SesProvider();
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(
      provider.sendEmail(
        'user@example.com',
        'Hello',
        '<p>Hi</p>',
        'AI Zyntra',
        'admin@aizyntra.com'
      )
    ).rejects.toThrow(/SES MessageRejected/);

    const logged = String(errSpy.mock.calls[0]?.[0] ?? '');
    expect(logged).toContain('MessageRejected');
    expect(logged).toContain('req-123');
    expect(logged).not.toMatch(/AKIASECRET/);
    errSpy.mockRestore();
  });

  it('does not require Resend or Nodemailer env keys', () => {
    const provider = new SesProvider();
    expect(provider.validateEnvKeys).toEqual([]);
    expect(provider.name).toBe('ses');
  });
});

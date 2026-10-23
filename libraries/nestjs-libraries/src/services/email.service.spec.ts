jest.mock('nestjs-temporal-core', () => ({
  TemporalService: class TemporalService {},
}));

jest.mock('@gitroom/helpers/utils/timer', () => ({
  timer: jest.fn(),
}));

import { EmailService } from './email.service';
import { TemporalService } from 'nestjs-temporal-core';

describe('EmailService.selectProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.EMAIL_PROVIDER = 'ses';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function createService() {
    return new EmailService({} as TemporalService);
  }

  it('selects ses provider', () => {
    const service = createService();
    expect(service.selectProvider('ses').name).toBe('ses');
  });

  it('selects resend provider', () => {
    const service = createService();
    expect(service.selectProvider('resend').name).toBe('resend');
  });

  it('selects nodemailer provider', () => {
    const service = createService();
    expect(service.selectProvider('nodemailer').name).toBe('nodemailer');
  });

  it('falls back to empty provider', () => {
    const service = createService();
    expect(service.selectProvider('unknown').name).toBe('no provider');
    expect(service.hasProvider()).toBe(true);
  });

  it('hasProvider is false for empty provider selection', () => {
    process.env.EMAIL_PROVIDER = '';
    const service = createService();
    expect(service.hasProvider()).toBe(false);
  });
});

import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '@gitroom/nestjs-libraries/database/prisma/notifications/notifications.repository';
import { EmailService } from '@gitroom/nestjs-libraries/services/email.service';
import { OrganizationRepository } from '@gitroom/nestjs-libraries/database/prisma/organizations/organization.repository';
import { socialIntegrationList } from '@gitroom/nestjs-libraries/integrations/integration.manager';

// Workflows name the channel by identifier ("instagram-standalone"). Swap the
// hyphenated ones for the provider's display name. Single-word identifiers are
// left alone so a link like instagram.com is not rewritten.
const channelLabels = socialIntegrationList
  .map((provider) => ({
    id: provider.identifier,
    name: (provider.name || '').split('\n')[0].trim(),
  }))
  .filter((provider) => provider.id.includes('-') && provider.name)
  .sort((a, b) => b.id.length - a.id.length);

const readableChannels = (text: string) =>
  channelLabels.reduce(
    (current, provider) => current.split(provider.id).join(provider.name),
    text
  );

export type NotificationType = 'success' | 'fail' | 'info';

@Injectable()
export class NotificationService {
  constructor(
    private _notificationRepository: NotificationsRepository,
    private _emailService: EmailService,
    private _organizationRepository: OrganizationRepository
  ) {}

  getMainPageCount(organizationId: string, userId: string) {
    return this._notificationRepository.getMainPageCount(
      organizationId,
      userId
    );
  }

  getNotificationsPaginated(organizationId: string, page: number) {
    return this._notificationRepository.getNotificationsPaginated(
      organizationId,
      page
    );
  }

  getNotifications(organizationId: string, userId: string) {
    return this._notificationRepository.getNotifications(
      organizationId,
      userId
    );
  }

  async inAppNotification(
    orgId: string,
    subject: string,
    message: string,
    sendEmail = false,
    // Kept for Temporal activity / workflow call-site compatibility.
    // Publish status emails always send immediately (real success/fail text).
    _digest = false,
    type: NotificationType = 'success'
  ) {
    const text = readableChannels(message);
    const title = readableChannels(subject);
    await this._notificationRepository.createNotification(orgId, text);
    if (!sendEmail) {
      return;
    }

    await this.sendEmailsToOrg(orgId, title, text, type);
  }

  async sendEmailsToOrg(
    orgId: string,
    subject: string,
    message: string,
    type?: NotificationType
  ) {
    const userOrg = await this._organizationRepository.getAllUsersOrgs(orgId);
    for (const user of userOrg?.users || []) {
      // 'info' type is always sent regardless of preferences
      if (type !== 'info') {
        // Filter users based on their email preferences
        if (type === 'success' && !user.user.sendSuccessEmails) {
          continue;
        }
        if (type === 'fail' && !user.user.sendFailureEmails) {
          continue;
        }
      }
      await this.sendEmail(user.user.email, subject, message);
    }
  }

  async sendEmail(to: string, subject: string, html: string, replyTo?: string) {
    await this._emailService.sendEmail(to, subject, html, 'top', replyTo);
  }

  hasEmailProvider() {
    return this._emailService.hasProvider();
  }
}

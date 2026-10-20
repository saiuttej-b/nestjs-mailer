import { Inject, Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import type { EmailUtilsService as EmailUtils } from '../services/email-utils.service';
import { EmailUtilsService } from '../services/email-utils.service';
import {
  EmailBodyProps,
  EmailClientTypes,
  MailtrapClientConfig,
  MailtrapClientOptions,
  MailtrapSendOptions,
  SendEmailResult,
} from '../types/emails.types';
import { loadOptionalPackage } from './load-optional-package';
import { stableStringify } from './stable-key';

type MailtrapSdk = {
  MailtrapTransport: (config: MailtrapClientConfig) => unknown;
};

type MailTransport = {
  sendMail: (mail: Record<string, unknown>) => Promise<unknown>;
};

@Injectable()
export class MailtrapClientService {
  private readonly transports = new Map<string, MailTransport>();
  private readonly emailUtils: EmailUtils;

  constructor(@Inject(EmailUtilsService) emailUtils: EmailUtils) {
    this.emailUtils = emailUtils;
  }

  async send(props: {
    emailData: EmailBodyProps;
    clientOptions: MailtrapClientOptions;
    options?: MailtrapSendOptions;
  }): Promise<SendEmailResult> {
    const formatted = this.emailUtils.formatContent(
      props.emailData,
      props.clientOptions.MAILTRAP.defaultSenderEmail,
    );
    const transport = this.transportFor(props.clientOptions.MAILTRAP.config);
    const mail = {
      ...this.providerOptions(props.options),
      from: formatted.from,
      to: formatted.to,
      cc: formatted.cc,
      bcc: formatted.bcc,
      subject: formatted.subject,
      text: formatted.text,
      html: formatted.html,
      attachments: formatted.attachments,
      headers: formatted.headers,
    };
    const response = await transport.sendMail(mail as Record<string, unknown>);

    return {
      messageId: this.emailUtils.messageIdFrom(response),
      provider: EmailClientTypes.MAILTRAP,
      raw: response,
    };
  }

  private providerOptions(options: MailtrapSendOptions | undefined): Record<string, unknown> {
    if (!options) {
      return {};
    }

    const providerOptions: Record<string, unknown> = { ...options };
    delete providerOptions.type;
    return providerOptions;
  }

  private transportFor(config: MailtrapClientConfig): MailTransport {
    const key = stableStringify(config);
    const cached = this.transports.get(key);
    if (cached) {
      return cached;
    }

    const sdk = loadOptionalPackage('mailtrap') as MailtrapSdk;
    const transport = createTransport(
      sdk.MailtrapTransport(config) as Parameters<typeof createTransport>[0],
    ) as unknown as MailTransport;
    this.transports.set(key, transport);
    return transport;
  }
}

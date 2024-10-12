import { Injectable } from '@nestjs/common';
import { MailtrapTransport } from 'mailtrap';
import { MailtrapTransporter } from 'mailtrap/dist/types/transport';
import { createTransport } from 'nodemailer';
import { EmailUtilsService } from '../services/email-utils.service';
import {
  AdditionalSendEmailProps,
  EmailBodyProps,
  EmailClientOptions,
  EmailClientTypes,
  MailtrapOptions,
} from '../types/emails.types';
import { EmailClientService } from './email-client.service';

@Injectable()
export class MailtrapClientService implements EmailClientService {
  private readonly mailtrapTransports = new Map<string, MailtrapTransporter>();

  constructor(private readonly emailUtilService: EmailUtilsService) {}

  async send(props: {
    emailData: EmailBodyProps;
    clientOptions: EmailClientOptions;
    options?: AdditionalSendEmailProps;
  }): Promise<any> {
    const { emailData, clientOptions, options } = props;

    if (clientOptions.type !== EmailClientTypes.MAILTRAP) {
      throw new Error('Invalid email service client');
    }

    if (!emailData.from) {
      emailData.from = clientOptions.MAILTRAP.defaultSenderEmail;
    }

    const transport = this.getMailTrapTransport(clientOptions.MAILTRAP);

    const body = this.emailUtilService.formatContent(emailData);
    const response = await transport.sendMail({
      ...options,
      from: body.from,
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject,
      html: body.body,
      attachments: body.attachments,
      headers: body.headers,
    });

    return response;
  }

  private getMailTrapTransport(reqOptions: MailtrapOptions) {
    const credentials = reqOptions.config;

    const key = JSON.stringify(credentials);
    const cachedClient = this.mailtrapTransports.get(key);
    if (cachedClient) return cachedClient;

    const transport = createTransport(MailtrapTransport(reqOptions.config));

    this.mailtrapTransports.set(key, transport);
    return transport;
  }
}

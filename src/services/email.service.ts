import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EmailClientService } from '../clients/email-client.service';
import { EmailSmtpClientService } from '../clients/email-smtp-client.service';
import { SESClientService } from '../clients/ses-client.service';
import { EMAIL_OPTIONS } from '../constants/email.constants';
import {
  DirectEmailProps,
  EmailClientOptions,
  EmailClientTypes,
  EmailModuleOptions,
} from '../types/emails.types';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly clientMap: Map<EmailClientTypes, EmailClientService>;

  constructor(
    @Inject(EMAIL_OPTIONS) private readonly options: EmailModuleOptions,
    private readonly emailSMTPClient: EmailSmtpClientService,
    private readonly sesClient: SESClientService,
  ) {
    this.clientMap = new Map();
    this.clientMap.set(EmailClientTypes.EMAIL_SMTP, this.emailSMTPClient);
    this.clientMap.set(EmailClientTypes.SES, this.sesClient);
  }

  onModuleInit() {
    const defaultOptions = this.options.clients.filter((c) => c.default);
    if (defaultOptions.length > 1) {
      throw new Error('Cannot have more than one default email service client');
    }

    const grouped: Record<string, EmailClientOptions[]> = {};
    this.options.clients.forEach((c) => {
      if (!grouped[c.key]) {
        grouped[c.key] = [];
      }
      grouped[c.key].push(c);
    });

    const duplicates = Object.keys(grouped).filter((k) => grouped[k].length > 1);
    if (duplicates.length) {
      throw new Error(`Duplicate email service client keys found: ${duplicates.join(', ')}`);
    }
  }

  async send(props: DirectEmailProps): Promise<any> {
    const { emailData, client } = props;

    const options = this.getClientOptions(client);
    if (!options) {
      throw new Error('Invalid email service client options');
    }

    const clientService = this.clientMap.get(options.type);
    if (!clientService) {
      throw new Error('Unable to find email service client');
    }

    return clientService.send({ emailData, options });
  }

  private getClientOptions(client?: string | EmailClientOptions) {
    if (!client) {
      const res = this.options.clients.find((c) => c.default);
      if (!res) {
        throw new Error('No default email service client found');
      }
      return res;
    }

    if (typeof client === 'string') {
      const res = this.options.clients.find((c) => c.key === client);
      if (!res) {
        throw new Error(`Invalid email service client key: ${client}`);
      }
      return res;
    }

    return client;
  }
}

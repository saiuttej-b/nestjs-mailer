import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EmailClientService } from '../clients/email-client.service';
import { MailtrapClientService } from '../clients/mailtrap-client.service';
import { SESClientService } from '../clients/ses-client.service';
import { EMAIL_OPTIONS } from '../constants/email.constants';
import { EmailClientOptions, EmailClientTypes, EmailModuleOptions } from '../types/emails.types';

@Injectable()
export class EmailClientHandlerService implements OnModuleInit {
  private readonly clientMap: Map<EmailClientTypes, EmailClientService>;

  constructor(
    @Inject(EMAIL_OPTIONS) private readonly options: EmailModuleOptions,
    private readonly sesClient: SESClientService,
    private readonly mailtrapClient: MailtrapClientService,
  ) {
    this.clientMap = new Map();
    this.clientMap.set(EmailClientTypes.SES, this.sesClient);
    this.clientMap.set(EmailClientTypes.MAILTRAP, this.mailtrapClient);
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

  getClientService(client: EmailClientTypes): EmailClientService {
    const clientService = this.clientMap.get(client);
    if (!clientService) {
      throw new Error('Unable to find email service client');
    }

    return clientService;
  }

  getDefaultClientOptions(): EmailClientOptions {
    const res = this.options.clients.find((c) => c.default);
    if (!res) {
      throw new Error('No default email service client found');
    }
    return res;
  }

  getClientOptions(client: string): EmailClientOptions {
    const res = this.options.clients.find((c) => c.key === client);
    if (!res) {
      throw new Error(`Invalid email service client key: ${client}`);
    }
    return res;
  }
}

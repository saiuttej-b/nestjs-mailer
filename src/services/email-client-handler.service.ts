import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EMAIL_OPTIONS } from '../constants/email.constants';
import { MailtrapClientService } from '../clients/mailtrap-client.service';
import { SESClientService } from '../clients/ses-client.service';
import type { MailtrapClientService as MailtrapClient } from '../clients/mailtrap-client.service';
import type { SESClientService as SesClient } from '../clients/ses-client.service';
import {
  DuplicateEmailClientKeyError,
  EmailClientTypeMismatchError,
  MultipleDefaultEmailClientsError,
  NoDefaultEmailClientError,
  UnknownEmailClientKeyError,
} from '../emails.errors';
import { EmailClientTypes } from '../types/emails.types';
import type {
  AdditionalSendEmailProps,
  EmailClientOptions,
  EmailModuleOptions,
  MailtrapSendOptions,
  SESSendOptions,
  SendEmailProps,
  SendEmailResult,
} from '../types/emails.types';

@Injectable()
export class EmailClientHandlerService implements OnModuleInit {
  constructor(
    @Inject(EMAIL_OPTIONS) private readonly options: EmailModuleOptions,
    @Inject(SESClientService) private readonly sesClient: SesClient,
    @Inject(MailtrapClientService) private readonly mailtrapClient: MailtrapClient,
  ) {}

  onModuleInit(): void {
    const defaults = this.options.clients.filter((client) => client.default);
    if (defaults.length > 1) {
      throw new MultipleDefaultEmailClientsError();
    }

    const seen = new Map<string, number>();
    for (const client of this.options.clients) {
      const count = seen.get(client.key) ?? 0;
      seen.set(client.key, count + 1);
    }

    const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([key]) => key);
    if (duplicates.length > 0) {
      throw new DuplicateEmailClientKeyError(duplicates);
    }
  }

  async send(props: SendEmailProps): Promise<SendEmailResult> {
    const clientOptions = this.resolveClient(props.client);
    if (clientOptions.type === EmailClientTypes.SES) {
      return this.sesClient.send({
        emailData: props.emailData,
        clientOptions,
        options: this.sesOptions(props.options),
      });
    }

    if (clientOptions.type === EmailClientTypes.MAILTRAP) {
      return this.mailtrapClient.send({
        emailData: props.emailData,
        clientOptions,
        options: this.mailtrapOptions(props.options),
      });
    }

    const unsupported: never = clientOptions;
    throw new EmailClientTypeMismatchError(
      `Email client type "${String((unsupported as { type?: string }).type)}" is not supported.`,
    );
  }

  private resolveClient(client?: string | EmailClientOptions): EmailClientOptions {
    if (!client) {
      return this.defaultClient();
    }

    if (typeof client === 'string') {
      return this.clientForKey(client);
    }

    return client;
  }

  private defaultClient(): EmailClientOptions {
    const client = this.options.clients.find((candidate) => candidate.default);
    if (!client) {
      throw new NoDefaultEmailClientError();
    }
    return client;
  }

  private clientForKey(key: string): EmailClientOptions {
    const client = this.options.clients.find((candidate) => candidate.key === key);
    if (!client) {
      throw new UnknownEmailClientKeyError(key);
    }
    return client;
  }

  private sesOptions(options: AdditionalSendEmailProps | undefined): SESSendOptions | undefined {
    if (!options) {
      return undefined;
    }

    if (options.type !== EmailClientTypes.SES) {
      throw new EmailClientTypeMismatchError(
        `Email options for "${options.type}" cannot be used with the "${EmailClientTypes.SES}" client.`,
      );
    }

    return options;
  }

  private mailtrapOptions(
    options: AdditionalSendEmailProps | undefined,
  ): MailtrapSendOptions | undefined {
    if (!options) {
      return undefined;
    }

    if (options.type !== EmailClientTypes.MAILTRAP) {
      throw new EmailClientTypeMismatchError(
        `Email options for "${options.type}" cannot be used with the "${EmailClientTypes.MAILTRAP}" client.`,
      );
    }

    return options;
  }
}

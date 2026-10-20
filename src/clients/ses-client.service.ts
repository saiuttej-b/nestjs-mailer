import { Inject, Injectable } from '@nestjs/common';
import { loadOptionalPackage } from './load-optional-package';
import { stableStringify } from './stable-key';
import { EmailUtilsService } from '../services/email-utils.service';
import type { EmailUtilsService as EmailUtils } from '../services/email-utils.service';
import {
  EmailBodyProps,
  EmailClientTypes,
  SESClientConfig,
  SESClientOptions,
  SESSendOptions,
  SendEmailResult,
} from '../types/emails.types';

type SesSdk = {
  SESClient: new (config?: SESClientConfig) => {
    send: (command: unknown) => Promise<unknown>;
  };
  SendRawEmailCommand: new (input: Record<string, unknown>) => unknown;
};

type SesClient = {
  send: (command: unknown) => Promise<unknown>;
};

@Injectable()
export class SESClientService {
  private readonly clients = new Map<string, SesClient>();
  private readonly emailUtils: EmailUtils;

  constructor(@Inject(EmailUtilsService) emailUtils: EmailUtils) {
    this.emailUtils = emailUtils;
  }

  async send(props: {
    emailData: EmailBodyProps;
    clientOptions: SESClientOptions;
    options?: SESSendOptions;
  }): Promise<SendEmailResult> {
    const message = await this.emailUtils.toMime(
      props.emailData,
      props.clientOptions.SES.defaultSenderEmail,
    );
    const client = this.clientFor(props.clientOptions.SES.config);
    const sdk = this.sdk();
    const response = await client.send(
      new sdk.SendRawEmailCommand({
        ...this.commandOptions(props.options),
        RawMessage: { Data: message },
      }),
    );

    return {
      messageId: this.emailUtils.messageIdFrom(response),
      provider: EmailClientTypes.SES,
      raw: response,
    };
  }

  private clientFor(config: SESClientConfig | undefined): SesClient {
    const key = stableStringify(config ?? {});
    const cached = this.clients.get(key);
    if (cached) {
      return cached;
    }

    const client = new (this.sdk().SESClient)(config ?? {});
    this.clients.set(key, client);
    return client;
  }

  private sdk(): SesSdk {
    return loadOptionalPackage('@aws-sdk/client-ses') as SesSdk;
  }

  private commandOptions(options: SESSendOptions | undefined): Record<string, unknown> {
    if (!options) {
      return {};
    }

    const command: Record<string, unknown> = { ...options };
    delete command.type;
    return command;
  }
}

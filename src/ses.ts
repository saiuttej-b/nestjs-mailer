import type {
  SESClientConfig as AwsSESClientConfig,
  SendRawEmailCommandInput,
} from '@aws-sdk/client-ses';
import { EmailClientTypes } from './types/emails.types';
import type {
  EmailModuleClientOptions,
  SESClientConfig,
  SESSendOptions,
} from './types/emails.types';

export type { AwsSESClientConfig as SESClientConfig, SendRawEmailCommandInput };

/**
 * Registers an SES client using the AWS SDK's own client config.
 * Import this from `@saiuttej/nestjs-mailer/ses` so the main package entry stays free of the AWS types.
 */
export function sesClient(options: {
  key: string;
  default?: boolean;
  defaultSenderEmail: string;
  config?: AwsSESClientConfig;
}): EmailModuleClientOptions {
  return {
    type: EmailClientTypes.SES,
    key: options.key,
    default: options.default,
    SES: {
      defaultSenderEmail: options.defaultSenderEmail,
      config: options.config as SESClientConfig | undefined,
    },
  };
}

/**
 * Builds SES send options from the AWS `SendRawEmail` input.
 * `RawMessage` stays omitted because this package builds that from `emailData`.
 */
export function sesSendOptions(
  options: Omit<SendRawEmailCommandInput, 'RawMessage'>,
): SESSendOptions {
  return {
    type: EmailClientTypes.SES,
    ...options,
  } as SESSendOptions;
}

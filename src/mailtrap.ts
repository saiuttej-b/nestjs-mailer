import type {
  CustomVariables,
  MailtrapClientConfig as AwsMailtrapClientConfig,
  TemplateVariables,
} from 'mailtrap';
import { EmailClientTypes } from './types/emails.types';
import type {
  EmailModuleClientOptions,
  MailtrapClientConfig,
  MailtrapSendOptions,
} from './types/emails.types';

export type { AwsMailtrapClientConfig as MailtrapClientConfig, CustomVariables, TemplateVariables };

export type MailtrapSdkSendOptions = {
  category?: string;
  custom_variables?: CustomVariables;
  sandbox?: boolean;
  templateUuid?: string;
  templateVariables?: TemplateVariables;
};

/**
 * Registers a Mailtrap client using the Mailtrap SDK's own client config.
 * Import this from `@saiuttej/nestjs-mailer/mailtrap`.
 */
export function mailtrapClient(options: {
  key: string;
  default?: boolean;
  defaultSenderEmail: string;
  config: AwsMailtrapClientConfig;
}): EmailModuleClientOptions {
  return {
    type: EmailClientTypes.MAILTRAP,
    key: options.key,
    default: options.default,
    MAILTRAP: {
      defaultSenderEmail: options.defaultSenderEmail,
      config: options.config as MailtrapClientConfig,
    },
  };
}

/**
 * Builds Mailtrap send options, including template fields from the Mailtrap SDK.
 */
export function mailtrapSendOptions(options: MailtrapSdkSendOptions): MailtrapSendOptions {
  return {
    type: EmailClientTypes.MAILTRAP,
    ...options,
  } as MailtrapSendOptions;
}

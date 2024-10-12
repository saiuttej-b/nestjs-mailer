import type { SendRawEmailCommandInput, SESClientConfigType } from '@aws-sdk/client-ses';
import type { ModuleMetadata } from '@nestjs/common';
import type { CustomVariables, MailtrapClientConfig } from 'mailtrap';
import type { Readable } from 'node:stream';
import type { Url } from 'node:url';

export type EmailUserAddress =
  | string
  | {
      name: string;
      address: string;
    };

export type EmailAttachment = {
  filename: string;
  contentType?: string;
  content?: string | Buffer | Readable;
  path?: string | Url;
  cid?: string;
  encoding?: string;
};

export type EmailBodyProps = {
  from?: EmailUserAddress;
  to: EmailUserAddress[];
  cc?: EmailUserAddress[];
  bcc?: EmailUserAddress[];
  subject: string;
  body: string | Buffer;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
};

export enum EmailClientTypes {
  SES = 'SES',
  MAILTRAP = 'MAILTRAP',
}

/**
 * SES Client Types
 */

export type SESSendOptions = Omit<SendRawEmailCommandInput, 'RawMessage'>;

export type SESOptions = {
  config: SESClientConfigType;
  defaultSenderEmail: string;
};

export type SESClientOptions = {
  type: EmailClientTypes.SES;
  SES: SESOptions;
};

/**
 * MailTrap Client Types
 */
export type MailtrapSendOptions = {
  category?: string;
  custom_variables?: CustomVariables;
  sandbox?: boolean | undefined;
};

export type MailtrapOptions = {
  config: MailtrapClientConfig;
  defaultSenderEmail: string;
};

export type MailtrapClientOptions = {
  type: EmailClientTypes.MAILTRAP;
  MAILTRAP: MailtrapOptions;
};

/**
 * Email Client Options Type
 */
export type EmailClientOptions = SESClientOptions | MailtrapClientOptions;

export type AdditionalSendEmailProps = SESSendOptions & MailtrapSendOptions;

export type SendEmailProps = {
  emailData: EmailBodyProps;
  client?: string | EmailClientOptions;
  options?: AdditionalSendEmailProps;
};

/**
 * Module Options Types
 */
export type EmailModuleClientOptions = { key: string; default?: boolean } & EmailClientOptions;

export type EmailModuleOptions = {
  clients: EmailModuleClientOptions[];
};

export type EmailModuleAsyncOptions = {
  imports?: ModuleMetadata['imports'];
  useFactory: (...args: any[]) => Promise<EmailModuleOptions> | EmailModuleOptions;
  inject?: any[];
};

import { SendRawEmailCommandInput, SESClientConfigType } from '@aws-sdk/client-ses';
import { ModuleMetadata } from '@nestjs/common';
import { Readable } from 'node:stream';
import { Url } from 'node:url';

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
};

export type EmailBodyProps = {
  from?: EmailUserAddress;
  to: EmailUserAddress[];
  cc?: EmailUserAddress[];
  bcc?: EmailUserAddress[];
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
};

export enum EmailClientTypes {
  SES = 'SES',
}

/**
 * SES Client Types
 */

export type SESSendOptions = Omit<SendRawEmailCommandInput, 'RawMessage'>;

export type SESOptions = {
  config: SESClientConfigType;
  defaultFromEmail: string;
};

export type SESClientOptions = {
  type: EmailClientTypes.SES;
  SES: SESOptions;
};

/**
 * Email Client Options Type
 */
export type EmailClientOptions = SESClientOptions;

export type AdditionalSendEmailProps = {
  SES?: SESSendOptions;
};

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

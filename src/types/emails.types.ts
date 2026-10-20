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
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
};

export enum EmailClientTypes {
  SES = 'SES',
  MAILTRAP = 'MAILTRAP',
}

export type SESCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
};

export type SESClientConfig = {
  region?: string;
  endpoint?: string;
  credentials?: SESCredentials;
  [option: string]: unknown;
};

export type SESMessageTag = {
  Name: string;
  Value: string;
};

export type SESSendOptions = {
  type: EmailClientTypes.SES;
  Source?: string;
  Destinations?: string[];
  FromArn?: string;
  SourceArn?: string;
  ReturnPathArn?: string;
  Tags?: SESMessageTag[];
  ConfigurationSetName?: string;
};

export type SESOptions = {
  defaultSenderEmail: string;
  config?: SESClientConfig;
};

export type SESClientOptions = {
  type: EmailClientTypes.SES;
  SES: SESOptions;
};

export type MailtrapClientConfig = {
  token: string;
  sandbox?: boolean;
  testInboxId?: number;
  accountId?: number;
  organizationId?: number;
  bulk?: boolean;
  [option: string]: unknown;
};

export type MailtrapSendOptions = {
  type: EmailClientTypes.MAILTRAP;
  category?: string;
  custom_variables?: Record<string, string | number | boolean>;
  sandbox?: boolean;
};

export type MailtrapOptions = {
  config: MailtrapClientConfig;
  defaultSenderEmail: string;
};

export type MailtrapClientOptions = {
  type: EmailClientTypes.MAILTRAP;
  MAILTRAP: MailtrapOptions;
};

export type EmailClientOptions = SESClientOptions | MailtrapClientOptions;

export type AdditionalSendEmailProps = SESSendOptions | MailtrapSendOptions;

export type SendEmailProps = {
  emailData: EmailBodyProps;
  client?: string | EmailClientOptions;
  options?: AdditionalSendEmailProps;
};

export type SendEmailResult = {
  messageId: string | undefined;
  provider: EmailClientTypes;
  raw: unknown;
};

export type EmailModuleClientOptions = { key: string; default?: boolean } & EmailClientOptions;

export type EmailModuleOptions = {
  clients: EmailModuleClientOptions[];
};

export type FormattedEmail = {
  from: EmailUserAddress;
  to: EmailUserAddress[];
  cc?: EmailUserAddress[];
  bcc?: EmailUserAddress[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
};

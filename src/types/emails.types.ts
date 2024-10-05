import { ModuleMetadata } from '@nestjs/common';
import { Readable } from 'node:stream';
import { Url } from 'node:url';

export type EmailUserAddress = {
  name?: string;
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

export type DirectEmailProps = {
  emailData: EmailBodyProps;
  client?: string | EmailClientOptions;
};

export enum EmailClientTypes {
  SES = 'SES',
  EMAIL_SMTP = 'EMAIL_SMTP',
}

export type SESOptions = {
  credentials: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    email: string;
  };
};

export type EmailSmtpOptions = {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
};

export type SESClientOptions = {
  type: EmailClientTypes.SES;
  SES: SESOptions;
};

export type EmailSmtpClientOptions = {
  type: EmailClientTypes.EMAIL_SMTP;
  EMAIL_SMTP: EmailSmtpOptions;
};

export type EmailClientOptions = SESClientOptions | EmailSmtpClientOptions;

export type EmailModuleClientOptions = { key: string; default?: boolean } & EmailClientOptions;

export type EmailModuleOptions = {
  clients: EmailModuleClientOptions[];
};

export type EmailModuleAsyncOptions = {
  imports?: ModuleMetadata['imports'];
  useFactory: (...args: any[]) => Promise<EmailModuleOptions> | EmailModuleOptions;
  inject?: any[];
};

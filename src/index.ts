export { EmailsModule } from './emails.module';
export {
  DuplicateEmailClientKeyError,
  EmailClientTypeMismatchError,
  EmailProviderNotInstalledError,
  InvalidEmailContentError,
  MultipleDefaultEmailClientsError,
  NoDefaultEmailClientError,
  UnknownEmailClientKeyError,
} from './emails.errors';
export { EmailService } from './services/email.service';
export { EmailClientTypes } from './types/emails.types';
export type {
  AdditionalSendEmailProps,
  EmailAttachment,
  EmailBodyProps,
  EmailClientOptions,
  EmailModuleClientOptions,
  EmailModuleOptions,
  EmailUserAddress,
  MailtrapClientConfig,
  MailtrapClientOptions,
  MailtrapOptions,
  MailtrapSendOptions,
  SESClientConfig,
  SESClientOptions,
  SESCredentials,
  SESMessageTag,
  SESOptions,
  SESSendOptions,
  SendEmailProps,
  SendEmailResult,
} from './types/emails.types';

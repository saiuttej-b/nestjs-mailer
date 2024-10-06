import {
  AdditionalSendEmailProps,
  EmailBodyProps,
  EmailClientOptions,
} from '../types/emails.types';

export abstract class EmailClientService {
  abstract send(props: {
    emailData: EmailBodyProps;
    clientOptions: EmailClientOptions;
    options?: AdditionalSendEmailProps;
  }): Promise<any>;
}

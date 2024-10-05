import { EmailBodyProps, EmailClientOptions } from '../types/emails.types';

export abstract class EmailClientService {
  abstract send(props: { emailData: EmailBodyProps; options: EmailClientOptions }): Promise<any>;
}

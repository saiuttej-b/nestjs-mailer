import { Injectable } from '@nestjs/common';
import { EmailClientOptions, SendEmailProps } from '../types/emails.types';
import { EmailClientHandlerService } from './email-client-handler.service';

@Injectable()
export class EmailService {
  constructor(private readonly handler: EmailClientHandlerService) {}

  async send(props: SendEmailProps): Promise<any> {
    const { emailData, client, options } = props;

    const clientOptions = this.getClientOptions(client);
    if (!clientOptions) {
      throw new Error('Invalid email service client options');
    }

    const clientService = this.handler.getClientService(clientOptions.type);
    if (!clientService) {
      throw new Error('Unable to find email service client');
    }

    return clientService.send({ emailData, clientOptions, options });
  }

  private getClientOptions(client?: string | EmailClientOptions) {
    if (!client) return this.handler.getDefaultClientOptions();

    if (typeof client === 'string') {
      return this.handler.getClientOptions(client);
    }

    return client;
  }
}

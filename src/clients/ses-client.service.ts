import { SendRawEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';
import { EmailUtilsService } from '../services/email-utils.service';
import {
  AdditionalSendEmailProps,
  EmailBodyProps,
  EmailClientOptions,
  EmailClientTypes,
  SESOptions,
} from '../types/emails.types';
import { EmailClientService } from './email-client.service';

@Injectable()
export class SESClientService implements EmailClientService {
  private readonly sesClients = new Map<string, SESClient>();

  constructor(private readonly emailUtilsService: EmailUtilsService) {}

  async send(props: {
    emailData: EmailBodyProps;
    clientOptions: EmailClientOptions;
    options?: AdditionalSendEmailProps;
  }): Promise<any> {
    const { emailData, clientOptions, options } = props;

    if (clientOptions.type !== EmailClientTypes.SES) {
      throw new Error('Invalid email service client');
    }

    if (!emailData.from) {
      emailData.from = clientOptions.SES.defaultSenderEmail;
    }

    const sesClient = this.getSESClient(clientOptions.SES);
    const message = await this.emailUtilsService.getParsedContent(emailData);

    const command = new SendRawEmailCommand({
      ...(options || {}),
      RawMessage: { Data: message },
    });

    const response = await sesClient.send(command);
    return response;
  }

  private getSESClient(reqOptions: SESOptions) {
    const credentials = reqOptions.config;

    const key = JSON.stringify(credentials);
    const cachedClient = this.sesClients.get(key);
    if (cachedClient) return cachedClient;

    const client = new SESClient(credentials);

    this.sesClients.set(key, client);
    return client;
  }
}

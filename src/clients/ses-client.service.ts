import { SendRawEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';
import { EmailContentGeneratorService } from '../services/email-content-generator.service';
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

  constructor(private readonly generatorService: EmailContentGeneratorService) {}

  async send(props: {
    emailData: EmailBodyProps;
    clientOptions: EmailClientOptions;
    options?: AdditionalSendEmailProps;
  }): Promise<any> {
    const { emailData, clientOptions } = props;

    if (clientOptions.type !== EmailClientTypes.SES) {
      throw new Error('Invalid email service client');
    }

    if (!emailData.from) {
      emailData.from = clientOptions.SES.defaultFromEmail;
    }

    const message = await this.generatorService.getParsedContent(emailData);

    const sesClient = this.getSESClient(clientOptions.SES);
    const command = new SendRawEmailCommand({
      ...(props.options?.SES || {}),
      RawMessage: { Data: message },
    });

    try {
      const response = await sesClient.send(command);
      return response;
    } catch (err) {
      throw err;
    }
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

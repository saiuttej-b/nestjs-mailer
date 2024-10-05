import { SendRawEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';
import { EmailContentGeneratorService } from '../services/email-content-generator.service';
import {
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

  async send(props: { emailData: EmailBodyProps; options: EmailClientOptions }): Promise<any> {
    const { emailData, options } = props;

    if (options.type !== EmailClientTypes.SES) {
      throw new Error('Invalid email service client');
    }

    if (!emailData.from) {
      emailData.from = {
        address: options.SES.credentials.email,
      };
    }

    const message = await this.generatorService.getParsedContent(emailData);

    const sesClient = this.getSESClient(options.SES);

    const command = new SendRawEmailCommand({ RawMessage: { Data: message } });

    try {
      const response = await sesClient.send(command);
      return response;
    } catch (err) {
      throw err;
    }
  }

  private getSESClient(reqOptions: SESOptions) {
    const credentials = reqOptions.credentials;

    const key = `${credentials.accessKeyId || 'NA'}-${credentials.secretAccessKey || 'NA'}-${credentials.region || 'NA'}`;
    const cachedClient = this.sesClients.get(key);
    if (cachedClient) return cachedClient;

    const client = new SESClient({
      region: credentials.region,
      credentials: credentials
        ? {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
          }
        : undefined,
    });

    this.sesClients.set(key, client);
    return client;
  }
}

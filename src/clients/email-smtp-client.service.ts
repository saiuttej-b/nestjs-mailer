import { Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { EmailContentGeneratorService } from '../services/email-content-generator.service';
import { EmailBodyProps, EmailClientOptions, EmailClientTypes } from '../types/emails.types';
import { EmailClientService } from './email-client.service';

@Injectable()
export class EmailSmtpClientService implements EmailClientService {
  constructor(private readonly generatorService: EmailContentGeneratorService) {}

  async send(props: { emailData: EmailBodyProps; options: EmailClientOptions }): Promise<any> {
    const { emailData, options } = props;

    if (options.type !== EmailClientTypes.EMAIL_SMTP) {
      throw new Error('Invalid email service client');
    }

    const transporter = createTransport(options.EMAIL_SMTP);

    const message = await this.generatorService.getParsedContent(emailData);

    try {
      const res = await transporter.sendMail({ raw: message });
      return res;
    } catch (error: any) {
      throw error;
    }
  }
}

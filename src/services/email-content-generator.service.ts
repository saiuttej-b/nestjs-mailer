import { Injectable } from '@nestjs/common';
import MailComposer from 'nodemailer/lib/mail-composer';
import { EmailBodyProps } from '../types/emails.types';
import { EmailUtilsService } from './email-utils.service';

@Injectable()
export class EmailContentGeneratorService {
  constructor(private readonly emailUtils: EmailUtilsService) {}

  async getParsedContent(body: EmailBodyProps): Promise<Buffer> {
    if (body.from) {
      body.from = this.emailUtils.formatAddress(body.from);
    }

    body.to = this.emailUtils.formatAddresses(body.to);

    if (body.cc) {
      body.cc = this.emailUtils.formatAddresses(body.cc);
    }

    if (body.bcc) {
      body.bcc = this.emailUtils.formatAddresses(body.bcc);
    }

    body.subject = body.subject.trim();
    const html = body.body;

    const mail = new MailComposer({
      from: body.from,
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject,
      html: html,
      attachments: body.attachments,
      headers: body.headers,
    });

    const buffer = await mail.compile().build();
    return buffer;
  }
}

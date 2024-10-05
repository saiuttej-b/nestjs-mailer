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
      from: body.from?.name
        ? { address: body.from.address, name: body.from.name }
        : body.from?.address,
      to: body.to.map((to) => {
        if (!to.name) return to.address;
        return { address: to.address, name: to.name };
      }),
      cc: body.cc?.map((cc) => {
        if (!cc.name) return cc.address;
        return { address: cc.address, name: cc.name };
      }),
      bcc: body.bcc?.map((bcc) => {
        if (!bcc.name) return bcc.address;
        return { address: bcc.address, name: bcc.name };
      }),
      subject: body.subject,
      html: html,
      attachments: body.attachments,
      headers: body.headers,
    });

    const buffer = await mail.compile().build();
    return buffer;
  }
}

import { Injectable } from '@nestjs/common';
import MailComposer from 'nodemailer/lib/mail-composer';
import { EmailBodyProps, EmailUserAddress } from '../types/emails.types';

@Injectable()
export class EmailUtilsService {
  formatAddress(address: EmailUserAddress): EmailUserAddress {
    if (typeof address === 'string') {
      return address.toLowerCase().trim();
    }

    address.address = address.address.toLowerCase().trim();
    address.name = address.name.trim();
    return address;
  }

  formatAddresses(addresses: EmailUserAddress[]) {
    const values = addresses.map((address) => this.formatAddress(address));

    const uniqValues = values.filter(
      (address, index, self) =>
        index ===
        self.findIndex((t) => {
          const a1 = typeof address === 'string' ? address : address.address;
          const a2 = typeof t === 'string' ? t : t.address;
          return a1 === a2;
        }),
    );

    return uniqValues;
  }

  formatContent(body: EmailBodyProps) {
    if (body.from) {
      body.from = this.formatAddress(body.from);
    }

    body.to = this.formatAddresses(body.to);

    if (body.cc) {
      body.cc = this.formatAddresses(body.cc);
    }

    if (body.bcc) {
      body.bcc = this.formatAddresses(body.bcc);
    }

    body.subject = body.subject.trim();

    return body;
  }

  async getParsedContent(body: EmailBodyProps): Promise<Buffer> {
    body = this.formatContent(body);

    const mail = new MailComposer({
      from: body.from,
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject,
      html: body.body,
      attachments: body.attachments,
      headers: body.headers,
    });

    const buffer = await mail.compile().build();
    return buffer;
  }
}

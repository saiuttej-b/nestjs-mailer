import { Injectable } from '@nestjs/common';
import MailComposer from 'nodemailer/lib/mail-composer';
import type { SendMailOptions } from 'nodemailer';
import { InvalidEmailContentError } from '../emails.errors';
import { EmailBodyProps, EmailUserAddress, FormattedEmail } from '../types/emails.types';

@Injectable()
export class EmailUtilsService {
  formatAddress(address: EmailUserAddress): EmailUserAddress {
    if (typeof address === 'string') {
      return address.toLowerCase().trim();
    }

    return {
      name: address.name.trim(),
      address: address.address.toLowerCase().trim(),
    };
  }

  formatAddresses(addresses: EmailUserAddress[]): EmailUserAddress[] {
    const formatted = addresses.map((address) => this.formatAddress(address));
    return formatted.filter((address, index) => {
      const key = this.addressKey(address);
      return formatted.findIndex((candidate) => this.addressKey(candidate) === key) === index;
    });
  }

  formatContent(body: EmailBodyProps, defaultSenderEmail: string): FormattedEmail {
    const from = body.from
      ? this.formatAddress(body.from)
      : defaultSenderEmail.trim().toLowerCase();
    const fromAddress = typeof from === 'string' ? from : from.address;
    if (!fromAddress) {
      throw new InvalidEmailContentError('Set "from" or defaultSenderEmail.');
    }

    if (body.to.length === 0) {
      throw new InvalidEmailContentError('Add at least one recipient in "to".');
    }

    const subject = body.subject.trim();
    if (!subject) {
      throw new InvalidEmailContentError('Subject is required.');
    }

    if (!this.hasContent(body.text) && !this.hasContent(body.html)) {
      throw new InvalidEmailContentError('Set "text" or "html".');
    }

    return {
      from,
      to: this.formatAddresses(body.to),
      cc: body.cc ? this.formatAddresses(body.cc) : undefined,
      bcc: body.bcc ? this.formatAddresses(body.bcc) : undefined,
      subject,
      text: body.text,
      html: body.html,
      attachments: body.attachments,
      headers: body.headers,
    };
  }

  async toMime(body: EmailBodyProps, defaultSenderEmail: string): Promise<Buffer> {
    const formatted = this.formatContent(body, defaultSenderEmail);
    const mail = new MailComposer({
      from: formatted.from,
      to: formatted.to,
      cc: formatted.cc,
      bcc: formatted.bcc,
      subject: formatted.subject,
      text: formatted.text,
      html: formatted.html,
      attachments: formatted.attachments as SendMailOptions['attachments'],
      headers: formatted.headers,
    });

    return mail.compile().build();
  }

  messageIdFrom(raw: unknown): string | undefined {
    if (raw === null || typeof raw !== 'object') {
      return undefined;
    }

    const record = raw as Record<string, unknown>;
    if (typeof record.messageId === 'string') {
      return record.messageId;
    }

    if (typeof record.MessageId === 'string') {
      return record.MessageId;
    }

    const ids = record.message_ids;
    if (Array.isArray(ids) && typeof ids[0] === 'string') {
      return ids[0];
    }

    return undefined;
  }

  private addressKey(address: EmailUserAddress): string {
    return typeof address === 'string' ? address : address.address;
  }

  private hasContent(value: string | undefined): boolean {
    return typeof value === 'string' && value.length > 0;
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { EmailClientHandlerService } from './email-client-handler.service';
import type { EmailClientHandlerService as EmailClientHandler } from './email-client-handler.service';
import { SendEmailProps, SendEmailResult } from '../types/emails.types';

@Injectable()
export class EmailService {
  private readonly handler: EmailClientHandler;

  constructor(@Inject(EmailClientHandlerService) handler: EmailClientHandler) {
    this.handler = handler;
  }

  /**
   * Sends one email through a registered client, or through `client` when it is passed inline.
   */
  send(props: SendEmailProps): Promise<SendEmailResult> {
    return this.handler.send(props);
  }
}

import { ConfigurableModuleBuilder, Module } from '@nestjs/common';
import { MailtrapClientService } from './clients/mailtrap-client.service';
import { SESClientService } from './clients/ses-client.service';
import { EMAIL_OPTIONS } from './constants/email.constants';
import { EmailClientHandlerService } from './services/email-client-handler.service';
import { EmailUtilsService } from './services/email-utils.service';
import { EmailService } from './services/email.service';
import { EmailModuleOptions } from './types/emails.types';

const moduleProviders = [
  EmailClientHandlerService,
  EmailUtilsService,
  EmailService,
  SESClientService,
  MailtrapClientService,
];

const { ConfigurableModuleClass } = new ConfigurableModuleBuilder<EmailModuleOptions>({
  optionsInjectionToken: EMAIL_OPTIONS,
})
  .setClassMethodName('forRoot')
  .setExtras({ isGlobal: true }, (definition, extras) => ({
    ...definition,
    global: extras.isGlobal ?? true,
    providers: [
      ...(definition.providers as NonNullable<typeof definition.providers>),
      ...moduleProviders,
    ],
    exports: [EmailService],
  }))
  .build();

/**
 * Registers {@link EmailService}.
 * Call `forRoot` or `forRootAsync`. The module is global unless `isGlobal` is false.
 * Importing this class without `forRoot` does not register the mail services.
 */
@Module({})
export class EmailsModule extends ConfigurableModuleClass {}

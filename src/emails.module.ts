import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { SESClientService } from './clients/ses-client.service';
import { EMAIL_OPTIONS } from './constants/email.constants';
import { EmailContentGeneratorService } from './services/email-content-generator.service';
import { EmailUtilsService } from './services/email-utils.service';
import { EmailService } from './services/email.service';
import { EmailModuleAsyncOptions, EmailModuleOptions } from './types/emails.types';

const clients: Provider[] = [SESClientService];

@Global()
@Module({
  providers: [EmailUtilsService, EmailContentGeneratorService, EmailService, ...clients],
  exports: [EmailService],
})
export class EmailsModule {
  static forRoot(options: EmailModuleOptions): DynamicModule {
    return {
      module: EmailsModule,
      providers: [
        {
          provide: EMAIL_OPTIONS,
          useValue: options,
        },
        EmailUtilsService,
        EmailContentGeneratorService,
        EmailService,
        ...clients,
      ],
      exports: [EmailService],
      global: true,
    };
  }

  static forRootAsync(options: EmailModuleAsyncOptions): DynamicModule {
    return {
      module: EmailsModule,
      imports: options.imports,
      providers: [
        {
          provide: EMAIL_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        EmailUtilsService,
        EmailContentGeneratorService,
        EmailService,
        ...clients,
      ],
      exports: [EmailService],
      global: true,
    };
  }
}

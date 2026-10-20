jest.mock('@aws-sdk/client-ses', () => {
  const error = new Error("Cannot find module '@aws-sdk/client-ses'");
  Object.assign(error, { code: 'MODULE_NOT_FOUND' });
  throw error;
});

jest.mock('mailtrap', () => {
  const error = new Error("Cannot find module 'mailtrap'");
  Object.assign(error, { code: 'MODULE_NOT_FOUND' });
  throw error;
});

import { Test } from '@nestjs/testing';
import {
  EmailClientTypes,
  EmailProviderNotInstalledError,
  EmailService,
  EmailsModule,
} from '../index';

describe('missing provider packages', () => {
  it('reports a missing SES package when the client is first used', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EmailsModule.forRoot({
          clients: [
            {
              type: EmailClientTypes.SES,
              key: 'ses',
              default: true,
              SES: { defaultSenderEmail: 'from@example.com' },
            },
          ],
        }),
      ],
    }).compile();
    await moduleRef.init();

    await expect(
      moduleRef.get(EmailService).send({
        emailData: { to: ['person@example.com'], subject: 'Hello', text: 'Plain' },
      }),
    ).rejects.toThrow(new EmailProviderNotInstalledError('@aws-sdk/client-ses'));
    await moduleRef.close();
  });

  it('reports a missing Mailtrap package when the client is first used', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EmailsModule.forRoot({
          clients: [
            {
              type: EmailClientTypes.MAILTRAP,
              key: 'mailtrap',
              default: true,
              MAILTRAP: {
                defaultSenderEmail: 'from@example.com',
                config: { token: 'token' },
              },
            },
          ],
        }),
      ],
    }).compile();
    await moduleRef.init();

    await expect(
      moduleRef.get(EmailService).send({
        emailData: { to: ['person@example.com'], subject: 'Hello', text: 'Plain' },
      }),
    ).rejects.toThrow(new EmailProviderNotInstalledError('mailtrap'));
    await moduleRef.close();
  });
});

import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { Test, type TestingModule } from '@nestjs/testing';
import { MailtrapTransport } from 'mailtrap';
import { createTransport } from 'nodemailer';
import {
  EmailClientTypeMismatchError,
  EmailClientTypes,
  EmailService,
  EmailsModule,
  InvalidEmailContentError,
  NoDefaultEmailClientError,
  UnknownEmailClientKeyError,
  type EmailBodyProps,
  type EmailClientOptions,
  type EmailModuleClientOptions,
} from '../index';
import { mailtrapClient, mailtrapSendOptions } from '../mailtrap';
import { sesClient, sesSendOptions } from '../ses';

const mockSesSend = jest.fn();
const mockSendMail = jest.fn();

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn(),
  SendRawEmailCommand: jest.fn((input: unknown) => input),
}));

jest.mock('mailtrap', () => ({
  MailtrapTransport: jest.fn((config: unknown) => ({ name: 'mailtrap', config })),
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

const sesClientMock = SESClient as unknown as jest.Mock;
const sendRawEmailCommandMock = SendRawEmailCommand as unknown as jest.Mock;
const mailtrapTransportMock = MailtrapTransport as unknown as jest.Mock;
const createTransportMock = createTransport as unknown as jest.Mock;

function sesModuleClient(key: string, isDefault = false): EmailModuleClientOptions {
  return {
    type: EmailClientTypes.SES,
    key,
    default: isDefault,
    SES: {
      defaultSenderEmail: '  Default@Example.com  ',
      config: {
        region: 'us-east-1',
        credentials: { accessKeyId: 'id', secretAccessKey: 'secret' },
      },
    },
  };
}

function mailtrapModuleClient(key: string): EmailModuleClientOptions {
  return {
    type: EmailClientTypes.MAILTRAP,
    key,
    MAILTRAP: {
      defaultSenderEmail: 'mailtrap@example.com',
      config: { token: 'token', sandbox: true, testInboxId: 1 },
    },
  };
}

const message: EmailBodyProps = {
  to: ['person@example.com'],
  subject: 'Hello',
  text: 'Plain',
};

describe('EmailService', () => {
  let moduleRef: TestingModule;
  let emails: EmailService;

  beforeAll(() => {
    sesClientMock.mockImplementation(() => ({ send: mockSesSend }));
    createTransportMock.mockImplementation(() => ({ sendMail: mockSendMail }));
  });

  beforeEach(async () => {
    mockSesSend.mockReset();
    mockSesSend.mockResolvedValue({ MessageId: 'ses-1' });
    mockSendMail.mockReset();
    mockSendMail.mockResolvedValue({ messageId: 'mt-1' });
    sesClientMock.mockClear();
    sendRawEmailCommandMock.mockClear();
    mailtrapTransportMock.mockClear();
    createTransportMock.mockClear();

    moduleRef = await Test.createTestingModule({
      imports: [
        EmailsModule.forRoot({
          clients: [sesModuleClient('ses', true), mailtrapModuleClient('mailtrap')],
        }),
      ],
    }).compile();
    await moduleRef.init();
    emails = moduleRef.get(EmailService);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('sends through the default SES client and reuses the cached client', async () => {
    const first = await emails.send({ emailData: message });
    const second = await emails.send({
      emailData: { ...message, html: '<b>Hi</b>' },
      options: {
        type: EmailClientTypes.SES,
        ConfigurationSetName: 'news',
        Source: 'from@example.com',
        Destinations: ['person@example.com'],
        FromArn: 'arn:from',
        SourceArn: 'arn:source',
        ReturnPathArn: 'arn:return',
        Tags: [{ Name: 'kind', Value: 'news' }],
      },
    });

    expect(first).toEqual({
      messageId: 'ses-1',
      provider: EmailClientTypes.SES,
      raw: { MessageId: 'ses-1' },
    });
    expect(second.messageId).toBe('ses-1');
    expect(sesClientMock).toHaveBeenCalledTimes(1);
    expect(sendRawEmailCommandMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ConfigurationSetName: 'news',
        Source: 'from@example.com',
        Destinations: ['person@example.com'],
        FromArn: 'arn:from',
        SourceArn: 'arn:source',
        ReturnPathArn: 'arn:return',
        Tags: [{ Name: 'kind', Value: 'news' }],
        RawMessage: { Data: expect.any(Buffer) },
      }),
    );
    const command = sendRawEmailCommandMock.mock.calls[1][0] as {
      type?: string;
      RawMessage: { Data: Buffer };
    };
    expect(command.type).toBeUndefined();
    expect(command.RawMessage.Data.toString('utf8')).toContain('Subject: Hello');
  });

  it('reuses an SES client when credential keys are ordered differently', async () => {
    const bare = await Test.createTestingModule({
      imports: [EmailsModule.forRoot({ clients: [] })],
    }).compile();
    await bare.init();
    const inline = bare.get(EmailService);
    const emailData = message;

    await inline.send({
      emailData,
      client: {
        type: EmailClientTypes.SES,
        SES: { defaultSenderEmail: 'from@example.com' },
      },
    });
    await inline.send({
      emailData,
      client: {
        type: EmailClientTypes.SES,
        SES: {
          defaultSenderEmail: 'from@example.com',
          config: {
            credentials: { secretAccessKey: 'secret', accessKeyId: 'id' },
            region: 'us-east-1',
          },
        },
      },
    });
    await inline.send({
      emailData,
      client: {
        type: EmailClientTypes.SES,
        SES: {
          defaultSenderEmail: 'from@example.com',
          config: {
            region: 'us-east-1',
            credentials: { accessKeyId: 'id', secretAccessKey: 'secret' },
          },
        },
      },
    });
    await inline.send({
      emailData,
      client: {
        type: EmailClientTypes.SES,
        SES: {
          defaultSenderEmail: 'from@example.com',
          config: { region: 'eu-west-1' },
        },
      },
    });

    expect(sesClientMock).toHaveBeenCalledTimes(3);
    expect(sesClientMock).toHaveBeenNthCalledWith(1, {});
    await bare.close();
  });

  it('formats a Mailtrap message without changing the input', async () => {
    const from = { name: ' Ada ', address: ' Ada@Example.com ' };
    const to = [' A@B.com ', 'a@b.com'];
    const cc = [{ name: ' Ce ', address: ' C@D.com ' }];
    const bcc = [' Bee@Example.com '];
    const emailData: EmailBodyProps = {
      from,
      to,
      cc,
      bcc,
      subject: '  Hello  ',
      text: 'Plain',
      html: '<b>Hi</b>',
      attachments: [{ filename: 'note.txt', content: 'note' }],
      headers: { 'X-Test': 'yes' },
    };

    const result = await emails.send({
      client: 'mailtrap',
      emailData,
      options: {
        type: EmailClientTypes.MAILTRAP,
        category: 'news',
        custom_variables: { id: '1' },
        sandbox: true,
      },
    });

    expect(from).toEqual({ name: ' Ada ', address: ' Ada@Example.com ' });
    expect(to).toEqual([' A@B.com ', 'a@b.com']);
    expect(emailData.subject).toBe('  Hello  ');
    expect(result).toEqual({
      messageId: 'mt-1',
      provider: EmailClientTypes.MAILTRAP,
      raw: { messageId: 'mt-1' },
    });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { name: 'Ada', address: 'ada@example.com' },
        to: ['a@b.com'],
        cc: [{ name: 'Ce', address: 'c@d.com' }],
        bcc: ['bee@example.com'],
        subject: 'Hello',
        text: 'Plain',
        html: '<b>Hi</b>',
        attachments: [{ filename: 'note.txt', content: 'note' }],
        headers: { 'X-Test': 'yes' },
        category: 'news',
        custom_variables: { id: '1' },
        sandbox: true,
      }),
    );
    await emails.send({ client: 'mailtrap', emailData: message });
    expect(mailtrapTransportMock).toHaveBeenCalledTimes(1);
    expect(createTransportMock).toHaveBeenCalledTimes(1);
  });

  it('reads Mailtrap message ids from provider payloads', async () => {
    mockSendMail
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('raw')
      .mockResolvedValueOnce({ message_ids: ['batch-1'] })
      .mockResolvedValueOnce({ message_ids: [1] })
      .mockResolvedValueOnce({ message_ids: 'nope' })
      .mockResolvedValueOnce({ other: true });

    await expect(emails.send({ client: 'mailtrap', emailData: message })).resolves.toMatchObject({
      messageId: undefined,
    });
    await expect(emails.send({ client: 'mailtrap', emailData: message })).resolves.toMatchObject({
      messageId: undefined,
    });
    await expect(emails.send({ client: 'mailtrap', emailData: message })).resolves.toMatchObject({
      messageId: 'batch-1',
    });
    await expect(emails.send({ client: 'mailtrap', emailData: message })).resolves.toMatchObject({
      messageId: undefined,
    });
    await expect(emails.send({ client: 'mailtrap', emailData: message })).resolves.toMatchObject({
      messageId: undefined,
    });
    await expect(emails.send({ client: 'mailtrap', emailData: message })).resolves.toMatchObject({
      messageId: undefined,
    });
  });

  it('sends text or html and uses the default sender', async () => {
    await emails.send({
      client: 'mailtrap',
      emailData: { to: ['person@example.com'], subject: 'Hello', html: '<p>Hi</p>' },
    });
    await emails.send({
      client: 'mailtrap',
      emailData: { to: ['person@example.com'], subject: 'Hello', text: '', html: '<p>Hi</p>' },
    });

    expect(mockSendMail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ from: 'mailtrap@example.com', html: '<p>Hi</p>' }),
    );
    expect(mockSendMail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ text: '', html: '<p>Hi</p>' }),
    );

    const bare = await Test.createTestingModule({
      imports: [EmailsModule.forRoot({ clients: [] })],
    }).compile();
    await bare.init();
    await bare.get(EmailService).send({
      emailData: { to: ['person@example.com'], subject: 'Hello', text: 'Plain' },
      client: {
        type: EmailClientTypes.MAILTRAP,
        MAILTRAP: {
          defaultSenderEmail: '  Default@Example.com  ',
          config: { token: 'other-token' },
        },
      },
    });
    expect(mockSendMail).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: 'default@example.com', text: 'Plain' }),
    );
    await bare.close();
  });

  it('rejects an empty recipient list, a blank subject, a missing body, and a missing sender', async () => {
    await expect(emails.send({ emailData: { ...message, to: [] } })).rejects.toThrow(
      'Add at least one recipient in "to".',
    );
    await expect(emails.send({ emailData: { ...message, subject: '   ' } })).rejects.toThrow(
      new InvalidEmailContentError('Subject is required.'),
    );
    await expect(
      emails.send({ emailData: { to: message.to, subject: 'Hello' } }),
    ).rejects.toBeInstanceOf(InvalidEmailContentError);
    await expect(
      emails.send({
        emailData: message,
        client: {
          type: EmailClientTypes.SES,
          SES: { defaultSenderEmail: '   ' },
        },
      }),
    ).rejects.toThrow('Set "from" or defaultSenderEmail.');
  });

  it('rejects options for a different provider', async () => {
    await expect(
      emails.send({
        emailData: message,
        options: { type: EmailClientTypes.MAILTRAP, sandbox: true },
      }),
    ).rejects.toThrow(EmailClientTypeMismatchError);
    await expect(
      emails.send({
        client: 'mailtrap',
        emailData: message,
        options: { type: EmailClientTypes.SES, Source: 'from@example.com' },
      }),
    ).rejects.toThrow('Email options for "SES" cannot be used with the "MAILTRAP" client.');
  });

  it('passes SDK client config and send options through to the providers', async () => {
    const sesModule = await Test.createTestingModule({
      imports: [
        EmailsModule.forRoot({
          clients: [
            sesClient({
              key: 'sdk-ses',
              default: true,
              defaultSenderEmail: 'from@example.com',
              config: { region: 'us-east-1', maxAttempts: 2 },
            }),
          ],
        }),
      ],
    }).compile();
    await sesModule.init();
    await sesModule.get(EmailService).send({
      emailData: message,
      options: sesSendOptions({ ConfigurationSetName: 'sdk', Source: 'from@example.com' }),
    });
    expect(sesClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ region: 'us-east-1', maxAttempts: 2 }),
    );
    expect(sendRawEmailCommandMock).toHaveBeenCalledWith(
      expect.objectContaining({ ConfigurationSetName: 'sdk', Source: 'from@example.com' }),
    );
    await sesModule.close();

    const mailtrapModule = await Test.createTestingModule({
      imports: [
        EmailsModule.forRoot({
          clients: [
            mailtrapClient({
              key: 'sdk-mailtrap',
              default: true,
              defaultSenderEmail: 'from@example.com',
              config: { token: 'sdk-token', userAgent: 'app' },
            }),
          ],
        }),
      ],
    }).compile();
    await mailtrapModule.init();
    await mailtrapModule.get(EmailService).send({
      emailData: message,
      options: mailtrapSendOptions({ category: 'sdk', templateUuid: 'template-1' }),
    });
    expect(mailtrapTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'sdk-token', userAgent: 'app' }),
    );
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'sdk', templateUuid: 'template-1' }),
    );
    expect(mockSendMail.mock.calls.at(-1)?.[0]).not.toHaveProperty('type');
    await mailtrapModule.close();
  });

  it('rejects an unknown key, a missing default, and an unknown client type', async () => {
    await expect(emails.send({ client: 'missing', emailData: message })).rejects.toThrow(
      new UnknownEmailClientKeyError('missing'),
    );

    const bare = await Test.createTestingModule({
      imports: [EmailsModule.forRoot({ clients: [] })],
    }).compile();
    await bare.init();
    await expect(bare.get(EmailService).send({ emailData: message })).rejects.toBeInstanceOf(
      NoDefaultEmailClientError,
    );
    await expect(
      bare.get(EmailService).send({
        emailData: message,
        client: { type: 'OTHER' } as unknown as EmailClientOptions,
      }),
    ).rejects.toThrow('Email client type "OTHER" is not supported.');
    await bare.close();
  });
});

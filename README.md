<h1 align="center">NestJS Mailer</h1>

<div align="center">
  <a href="https://www.npmjs.com/package/@saiuttej/nestjs-mailer">
    <img src="https://img.shields.io/npm/v/@saiuttej/nestjs-mailer" alt="npm version">
  </a>
  <a href="https://github.com/saiuttej-b/nestjs-mailer/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/@saiuttej/nestjs-mailer" alt="license">
  </a>
  <a href="https://github.com/saiuttej-b/nestjs-mailer/actions/workflows/ci.yml">
    <img src="https://github.com/saiuttej-b/nestjs-mailer/actions/workflows/ci.yml/badge.svg" alt="CI">
  </a>
  <a href="https://nestjs.com" target="_blank">
    <img src="https://img.shields.io/badge/built%20with-NestJs-red.svg" alt="Built with NestJS">
  </a>
</div>

Send email from a NestJS app through Amazon SES or Mailtrap. Register one or more clients, mark one as the default, and call `EmailService.send()`.

Requires Node.js 20 or newer and NestJS 10, 11, or 12.

Upgrading from 0.2.x? See [Migrating from 0.2.1 to 1.0.0](./docs/migrations/1.0.0.md).

## Installation

`nodemailer` is required. Install only the provider you send through. Each provider package is loaded on the first send that uses it.

Install via NPM:

```bash
npm install @saiuttej/nestjs-mailer nodemailer
npm install @aws-sdk/client-ses
npm install mailtrap
```

Install via Yarn:

```bash
yarn add @saiuttej/nestjs-mailer nodemailer
yarn add @aws-sdk/client-ses
yarn add mailtrap
```

Install via PNPM:

```bash
pnpm add @saiuttej/nestjs-mailer nodemailer
pnpm add @aws-sdk/client-ses
pnpm add mailtrap
```

## Register clients

`forRoot` is global unless you set `isGlobal: false`. One client may set `default: true`. `send()` uses that client when you omit `client`.

```ts
import { Module } from '@nestjs/common';
import { EmailClientTypes, EmailsModule } from '@saiuttej/nestjs-mailer';

@Module({
  imports: [
    EmailsModule.forRoot({
      clients: [
        {
          type: EmailClientTypes.SES,
          key: 'ses',
          default: true,
          SES: {
            defaultSenderEmail: 'news@example.com',
            config: {
              region: 'us-east-1',
              credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
              },
            },
          },
        },
        {
          type: EmailClientTypes.MAILTRAP,
          key: 'mailtrap',
          MAILTRAP: {
            defaultSenderEmail: 'sandbox@example.com',
            config: {
              token: process.env.MAILTRAP_TOKEN ?? '',
              sandbox: true,
              testInboxId: 1,
            },
          },
        },
      ],
    }),
  ],
})
export class AppModule {}
```

### Async registration

`useFactory`, `useClass`, and `useExisting` all work. A class factory implements `create()`.

```ts
import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailClientTypes, EmailModuleOptions, EmailsModule } from '@saiuttej/nestjs-mailer';

@Injectable()
class EmailOptionsFactory {
  constructor(private readonly config: ConfigService) {}

  create(): EmailModuleOptions {
    return {
      clients: [
        {
          type: EmailClientTypes.SES,
          key: 'ses',
          default: true,
          SES: {
            defaultSenderEmail: this.config.getOrThrow('MAIL_FROM'),
            config: { region: this.config.getOrThrow('AWS_REGION') },
          },
        },
      ],
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot(),
    EmailsModule.forRootAsync({
      imports: [ConfigModule],
      useClass: EmailOptionsFactory,
    }),
  ],
})
export class AppModule {}
```

`useFactory` receives the injected dependencies:

```ts
EmailsModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    clients: [
      {
        type: EmailClientTypes.SES,
        key: 'ses',
        default: true,
        SES: {
          defaultSenderEmail: config.getOrThrow('MAIL_FROM'),
          config: { region: config.getOrThrow('AWS_REGION') },
        },
      },
    ],
  }),
});
```

## Send

`from` is optional. When it is omitted, the client's `defaultSenderEmail` is used. Set `text`, `html`, or both. Addresses are trimmed, lowercased, and de-duplicated. The object you pass in is left unchanged.

```ts
import { Injectable } from '@nestjs/common';
import { EmailClientTypes, EmailService } from '@saiuttej/nestjs-mailer';

@Injectable()
export class AppService {
  constructor(private readonly emails: EmailService) {}

  async sendNewsletter(): Promise<void> {
    const result = await this.emails.send({
      emailData: {
        to: ['reader@example.com'],
        subject: 'Hello',
        text: 'Plain text body',
        html: '<p>Hello</p>',
        attachments: [{ filename: 'note.txt', content: 'Hello' }],
        headers: { 'X-Campaign': 'launch' },
      },
    });

    console.log(result.messageId, result.provider);
  }

  async sendThroughMailtrap(): Promise<void> {
    await this.emails.send({
      client: 'mailtrap',
      emailData: {
        to: ['reader@example.com'],
        subject: 'Hello',
        text: 'Plain text body',
      },
      options: {
        type: EmailClientTypes.MAILTRAP,
        category: 'news',
        custom_variables: { userId: '1' },
        sandbox: true,
      },
    });
  }
}
```

`client` may also be an inline client config, with the same shape as a registered client without `key`.

### SDK configuration

`@saiuttej/nestjs-mailer/ses` and `@saiuttej/nestjs-mailer/mailtrap` use the provider SDK's own types. Install that provider, then pass its client config and send options through. Fields this package does not list, such as SES `maxAttempts` or a Mailtrap template, are forwarded to the SDK.

```ts
import { Module } from '@nestjs/common';
import { EmailsModule } from '@saiuttej/nestjs-mailer';
import { sesClient } from '@saiuttej/nestjs-mailer/ses';
import { mailtrapClient } from '@saiuttej/nestjs-mailer/mailtrap';

@Module({
  imports: [
    EmailsModule.forRoot({
      clients: [
        sesClient({
          key: 'ses',
          default: true,
          defaultSenderEmail: 'news@example.com',
          config: {
            region: 'us-east-1',
            maxAttempts: 3,
          },
        }),
        mailtrapClient({
          key: 'mailtrap',
          defaultSenderEmail: 'sandbox@example.com',
          config: {
            token: process.env.MAILTRAP_TOKEN ?? '',
            sandbox: true,
            testInboxId: 1,
          },
        }),
      ],
    }),
  ],
})
export class AppModule {}
```

```ts
import { sesSendOptions } from '@saiuttej/nestjs-mailer/ses';
import { mailtrapSendOptions } from '@saiuttej/nestjs-mailer/mailtrap';

await this.emails.send({
  emailData: {
    to: ['reader@example.com'],
    subject: 'Hello',
    html: '<p>Hello</p>',
  },
  options: sesSendOptions({ ConfigurationSetName: 'news' }),
});

await this.emails.send({
  client: 'mailtrap',
  emailData: {
    to: ['reader@example.com'],
    subject: 'Hello',
    text: 'Plain text body',
  },
  options: mailtrapSendOptions({
    category: 'news',
    templateUuid: 'template-id',
  }),
});
```

### SES options

Set `type` to `EmailClientTypes.SES`. These fields are copied onto `SendRawEmail` except `RawMessage`, which this package builds from `emailData`:

- `Source`
- `Destinations`
- `FromArn`
- `SourceArn`
- `ReturnPathArn`
- `Tags` (`{ Name, Value }`)
- `ConfigurationSetName`

```ts
await this.emails.send({
  emailData: {
    to: ['reader@example.com'],
    subject: 'Hello',
    html: '<p>Hello</p>',
  },
  options: {
    type: EmailClientTypes.SES,
    ConfigurationSetName: 'news',
    Tags: [{ Name: 'kind', Value: 'news' }],
  },
});
```

## Errors

| Error                              | When                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `DuplicateEmailClientKeyError`     | Two clients use the same `key`                                          |
| `MultipleDefaultEmailClientsError` | More than one client sets `default: true`                               |
| `NoDefaultEmailClientError`        | `send()` omits `client` and no default is registered                    |
| `UnknownEmailClientKeyError`       | `client` is a key that was not registered                               |
| `InvalidEmailContentError`         | Missing sender, recipient, subject, or both `text` and `html`           |
| `EmailClientTypeMismatchError`     | Options `type` does not match the client, or the client type is unknown |
| `EmailProviderNotInstalledError`   | `@aws-sdk/client-ses` or `mailtrap` is not installed                    |

## Contributing

Contributions are welcome. See [Contributing](https://github.com/saiuttej-b/nestjs-mailer/blob/main/CONTRIBUTING.md).

## Author

**B Sai Uttej**

## License

Licensed under the MIT License. See [LICENSE](LICENSE).

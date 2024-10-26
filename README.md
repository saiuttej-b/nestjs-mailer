<div align="center" style="margin-top: 1rem">
  <a href="http://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo_text.svg" width="150" alt="Nest Logo" />
  </a>
</div>

<h3 align="center">NestJS Mailer</h3>

<div align="center">
  <a href="https://nestjs.com" target="_blank">
    <img src="https://img.shields.io/badge/built%20with-NestJs-red.svg" alt="Built with NestJS">
  </a>
</div>

## Installation

Install via NPM:

```bash
npm install @saiuttej/nestjs-mailer
```

Install via Yarn:

```bash
yarn add @saiuttej/nestjs-mailer
```

Install via PNPM:

```bash
pnpm add @saiuttej/nestjs-mailer
```

## Quick Start

### Register Module

```ts
@Module({
  imports: [
    EmailsModule.forRoot({
      clients: [],
    }),
  ],
})
class AppModule {}
```

Quite often you might want to asynchronously pass module options instead of passing them beforehand. In such case, use forRootAsync() method like many other Nest.js libraries.

```ts
@Module({
  imports: [
    EmailsModule.forRootAsync({
      useFactory: (...deps) => {
        return {
          clients: [],
        };
      },
      inject: [...dependencies],
    }),
  ],
})
class AppModule {}
```

### Clients Type

#### 1. SES

Configuring SES

```ts
EmailsModule.forRoot({
  clients: [
    {
      type: EmailClientTypes.SES,
      key: 'unique-client-key',
      SES: {
        config: {
          credentials: {
            accessKeyId: 'aws-access-key',
            secretAccessKey: 'aws-secret-access-key',
          },
        },
        defaultSenderEmail: 'default-sender-email@gmail.com',
      },
    },
  ],
});
```

#### 2. Mailtrap

```ts
EmailsModule.forRoot({
  clients: [
    {
      type: EmailClientTypes.MAILTRAP,
      key: 'unique-client-key',
      MAILTRAP: {
        config: {
          token: 'mailtrap-token',
        },
        defaultSenderEmail: 'default-sender-email@gmail.com',
      },
    },
  ],
});
```

EmailClientTypes is an enum that contains all the supported email clients.

### Sending Emails

```ts
import { Injectable } from '@nestjs/common';
import {
  AdditionalSendEmailProps,
  EmailBodyProps,
  EmailClientOptions,
  EmailService,
} from '@saiuttej/nestjs-mailer';

@Injectable()
export class AppService {
  constructor(private readonly emailsService: EmailService) {}

  async sendEmail() {
    /**
     * It is the configuration for send email
     * It can have two types of values:
     * 1. string - The client key which is registered in the EmailsModule.
     * 2. EmailClientConfig - The client configuration object.
     */
    const client: string | EmailClientOptions = 'unique-client-key';

    /**
     * It is the email data object which contains the email details.
     * it contains the properties like
     * from, to, cc, bcc, subject, body, attachments, headers
     */
    const emailData: EmailBodyProps = {
      from: 'sender-email-id@gmail.com' /* optional */,
      to: ['to-email-ids@gmail.com'] /* required */,
      cc: [] /* optional */,
      bcc: [] /* optional */,
      subject: 'Email Subject' /* required */,
      body: 'Hello, World!' /* required - supports html, text and buffer */,
      attachments: [] /* optional - supports attachments */,
      headers: {} /* optional */,
    };

    /**
     * It is the additional options for sending email,
     * it contains different email sending options for the client.
     */
    const options: AdditionalSendEmailProps = {};

    await this.emailsService.send({
      client,
      emailData,
      options,
    });
  }
}
```

## Contributing

Contributions welcome! See [Contributing](https://github.com/saiuttej-b/nestjs-mailer/blob/main/CONTRIBUTING.md).

## Author

**B Sai Uttej**

## License

Licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

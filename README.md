<div align="center" style="margin-top: 1rem">
  <a href="http://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo_text.svg" width="150" alt="Nest Logo" />
  </a>
</div>

<h3 align="center">NestJS npm Package Starter</h3>

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
EmailsModule.forRootAsync({
  useFactory: () => {
    return {
      clients: [],
    };
  },
});
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
            accessKeyId: 'your aws accessKeyId',
            secretAccessKey: 'your aws secretAccessKey',
          },
        },
        defaultSenderEmail: 'your default sender email id',
      },
    },
  ],
});
```

#### 2. Mailtrap

## Contributing

Contributions welcome! See [Contributing](https://github.com/saiuttej-b/nestjs-mailer/blob/main/CONTRIBUTING.md).

## Author

**B Sai Uttej**

## License

Licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

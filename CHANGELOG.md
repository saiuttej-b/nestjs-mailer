# Changelog

## 1.0.0

See [Migrating from 0.2.1 to 1.0.0](./docs/migrations/1.0.0.md).

### Breaking

- `emailData.body` is now `text` and `html`. Set at least one. `send()` returns `{ messageId, provider, raw }`.
- Send options include `type: EmailClientTypes.SES` or `type: EmailClientTypes.MAILTRAP`. SES fields are the raw-email command fields. Mailtrap fields are `category`, `custom_variables`, and `sandbox`.
- Address formatting no longer changes the object you pass to `send()`.
- Failures throw `DuplicateEmailClientKeyError`, `MultipleDefaultEmailClientsError`, `NoDefaultEmailClientError`, `UnknownEmailClientKeyError`, `InvalidEmailContentError`, `EmailProviderNotInstalledError`, or `EmailClientTypeMismatchError`.
- `nodemailer` is a required peer. `@aws-sdk/client-ses` and `mailtrap` are optional peers, loaded on the first send that needs them.
- The main entry keeps small SES and Mailtrap config types, so type-checking does not require both provider packages. `@saiuttej/nestjs-mailer/ses` and `@saiuttej/nestjs-mailer/mailtrap` accept the SDK's own client config and send options.

### Added

- `isGlobal` on `forRoot` and `forRootAsync`, default `true`.
- `forRootAsync` accepts `useFactory`, `useClass`, and `useExisting`. A class factory implements `create()`.
- One client can be `default: true`. `send()` uses it when `client` is omitted. Pass a registered key or an inline client config to choose another.
- `sesClient()` and `sesSendOptions()` from `@saiuttej/nestjs-mailer/ses`, typed with `@aws-sdk/client-ses`.
- `mailtrapClient()` and `mailtrapSendOptions()` from `@saiuttej/nestjs-mailer/mailtrap`, typed with `mailtrap`. Extra client config fields and Mailtrap template fields are passed through to the SDK.

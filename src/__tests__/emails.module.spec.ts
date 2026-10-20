import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  DuplicateEmailClientKeyError,
  EmailClientTypes,
  EmailService,
  EmailsModule,
  MultipleDefaultEmailClientsError,
  type EmailModuleOptions,
} from '../index';

function sesClient(key = 'ses', isDefault = false) {
  return {
    type: EmailClientTypes.SES as const,
    key,
    default: isDefault,
    SES: {
      defaultSenderEmail: 'ses@example.com',
      config: { region: 'us-east-1' },
    },
  };
}

@Injectable()
class EmailOptionsFactory {
  create(): EmailModuleOptions {
    return { clients: [sesClient('async', true)] };
  }
}

@Module({
  providers: [EmailOptionsFactory],
  exports: [EmailOptionsFactory],
})
class EmailOptionsModule {}

@Module({
  providers: [{ provide: 'REGION', useValue: 'eu-west-1' }],
  exports: ['REGION'],
})
class RegionModule {}

describe('EmailsModule', () => {
  it('is global by default and keeps isGlobal out of the injected options', () => {
    const clients = [sesClient()];
    const dynamicModule = EmailsModule.forRoot({ clients });
    expect(dynamicModule.global).toBe(true);
    expect(dynamicModule.exports).toEqual([EmailService]);

    const optionsProvider = dynamicModule.providers?.find(
      (provider) => typeof provider === 'object' && provider !== null && 'useValue' in provider,
    );
    expect(optionsProvider && 'useValue' in optionsProvider && optionsProvider.useValue).toEqual({
      clients,
    });
  });

  it('can be scoped to the importing module', () => {
    expect(EmailsModule.forRoot({ clients: [], isGlobal: false }).global).toBe(false);
    expect(EmailsModule.forRoot({ clients: [], isGlobal: true }).global).toBe(true);
    expect(EmailsModule.forRoot({ clients: [], isGlobal: undefined }).global).toBe(true);
  });

  it('does not register EmailService until forRoot is called', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EmailsModule],
    }).compile();
    await moduleRef.init();

    expect(() => moduleRef.get(EmailService)).toThrow();
    await moduleRef.close();
  });

  it('rejects more than one default client', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EmailsModule.forRoot({
          clients: [sesClient('one', true), sesClient('two', true)],
        }),
      ],
    }).compile();

    await expect(moduleRef.init()).rejects.toBeInstanceOf(MultipleDefaultEmailClientsError);
    await moduleRef.close();
  });

  it('rejects duplicate client keys', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EmailsModule.forRoot({
          clients: [sesClient('shared'), sesClient('shared')],
        }),
      ],
    }).compile();

    await expect(moduleRef.init()).rejects.toBeInstanceOf(DuplicateEmailClientKeyError);
    await moduleRef.close();
  });

  it('resolves async options from a factory, a class, and an existing provider', async () => {
    let region: string | undefined;
    const factoryModule = await Test.createTestingModule({
      imports: [
        EmailsModule.forRootAsync({
          imports: [RegionModule],
          inject: ['REGION'],
          useFactory: async (injected: string) => {
            region = injected;
            return { clients: [] };
          },
        }),
      ],
    }).compile();
    await factoryModule.init();
    expect(region).toBe('eu-west-1');
    expect(factoryModule.get(EmailService)).toBeInstanceOf(EmailService);
    await factoryModule.close();

    const classModule = await Test.createTestingModule({
      imports: [EmailsModule.forRootAsync({ useClass: EmailOptionsFactory })],
    }).compile();
    await classModule.init();
    expect(classModule.get(EmailService)).toBeInstanceOf(EmailService);
    await classModule.close();

    const existingModule = await Test.createTestingModule({
      imports: [
        EmailsModule.forRootAsync({
          imports: [EmailOptionsModule],
          useExisting: EmailOptionsFactory,
        }),
      ],
    }).compile();
    await existingModule.init();
    expect(existingModule.get(EmailService)).toBeInstanceOf(EmailService);
    await existingModule.close();
  });

  it('forwards async imports and can stay local', () => {
    const dynamicModule = EmailsModule.forRootAsync({
      imports: [RegionModule],
      isGlobal: false,
      useFactory: () => ({ clients: [] }),
      inject: ['REGION'],
    });

    expect(dynamicModule.global).toBe(false);
    expect(dynamicModule.imports).toEqual([RegionModule]);
    const factoryProvider = dynamicModule.providers?.find(
      (provider) => typeof provider === 'object' && provider !== null && 'useFactory' in provider,
    );
    expect(factoryProvider && 'inject' in factoryProvider && factoryProvider.inject).toEqual([
      'REGION',
    ]);
  });
});

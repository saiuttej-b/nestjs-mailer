import { loadOptionalPackage } from '../clients/load-optional-package';
import { stableStringify } from '../clients/stable-key';
import { EmailProviderNotInstalledError } from '../emails.errors';

describe('loadOptionalPackage', () => {
  it('loads an installed package', () => {
    expect(loadOptionalPackage('node:path')).toHaveProperty('join');
  });

  it('wraps a missing package from the default loader', () => {
    expect(() => loadOptionalPackage('@saiuttej/not-installed')).toThrow(
      EmailProviderNotInstalledError,
    );
    expect(() => loadOptionalPackage('@saiuttej/not-installed')).toThrow(
      'Install "@saiuttej/not-installed" to use this email client.',
    );
  });

  it('returns a custom loader result', () => {
    expect(loadOptionalPackage('mailtrap', () => ({ ready: true }))).toEqual({ ready: true });
  });

  it('rethrows errors that are not a missing package', () => {
    expect(() =>
      loadOptionalPackage('mailtrap', () => {
        throw 'bad';
      }),
    ).toThrow('bad');

    let thrown: unknown = 'unset';
    try {
      loadOptionalPackage('mailtrap', () => {
        throw null;
      });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeNull();

    expect(() =>
      loadOptionalPackage('mailtrap', () => {
        throw { code: 'MODULE_NOT_FOUND' };
      }),
    ).toThrow();

    expect(() =>
      loadOptionalPackage('mailtrap', () => {
        throw { message: 1, code: 'MODULE_NOT_FOUND' };
      }),
    ).toThrow();

    expect(() =>
      loadOptionalPackage('mailtrap', () => {
        throw { message: 'other', code: 'MODULE_NOT_FOUND' };
      }),
    ).toThrow();

    expect(() =>
      loadOptionalPackage('mailtrap', () => {
        throw { message: 'missing mailtrap', code: 'ENOTDIR' };
      }),
    ).toThrow();
  });

  it('wraps a loader error with the Node missing-module code', () => {
    const missing = new Error("Cannot find module 'mailtrap'");
    Object.assign(missing, { code: 'MODULE_NOT_FOUND' });
    expect(() =>
      loadOptionalPackage('mailtrap', () => {
        throw missing;
      }),
    ).toThrow(EmailProviderNotInstalledError);
  });
});

describe('stableStringify', () => {
  it('sorts nested keys and leaves scalars in place', () => {
    expect(stableStringify(null)).toBe('null');
    expect(stableStringify('plain')).toBe('"plain"');
    expect(stableStringify({ b: 1, a: { d: true, c: null } })).toBe(
      '{"a":{"c":null,"d":true},"b":1}',
    );
    expect(stableStringify({ b: 1, a: undefined })).toBe('{"b":1}');
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
  });
});

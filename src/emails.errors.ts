/**
 * Thrown when two registered clients share a key.
 */
export class DuplicateEmailClientKeyError extends Error {
  constructor(keys: string[]) {
    super(`Duplicate email client keys: ${keys.join(', ')}.`);
    this.name = 'DuplicateEmailClientKeyError';
  }
}

/**
 * Thrown when more than one client is marked as the default.
 */
export class MultipleDefaultEmailClientsError extends Error {
  constructor() {
    super('Only one email client can be the default.');
    this.name = 'MultipleDefaultEmailClientsError';
  }
}

/**
 * Thrown when a send omits the client and no default client is registered.
 */
export class NoDefaultEmailClientError extends Error {
  constructor() {
    super(
      'No default email client is registered. Pass a client key or set default: true on one client.',
    );
    this.name = 'NoDefaultEmailClientError';
  }
}

/**
 * Thrown when a send uses a key that was not registered.
 */
export class UnknownEmailClientKeyError extends Error {
  constructor(key: string) {
    super(`Unknown email client key "${key}".`);
    this.name = 'UnknownEmailClientKeyError';
  }
}

/**
 * Thrown when the message is missing a sender, recipient, subject, or body.
 */
export class InvalidEmailContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailContentError';
  }
}

/**
 * Thrown when a send needs an optional provider package that is not installed.
 */
export class EmailProviderNotInstalledError extends Error {
  constructor(packageName: string) {
    super(`Install "${packageName}" to use this email client.`);
    this.name = 'EmailProviderNotInstalledError';
  }
}

/**
 * Thrown when send options or a client type do not match the selected provider.
 */
export class EmailClientTypeMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailClientTypeMismatchError';
  }
}

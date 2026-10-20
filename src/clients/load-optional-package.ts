import { createRequire } from 'node:module';
import { EmailProviderNotInstalledError } from '../emails.errors';

const nodeRequire = createRequire(__filename);

/**
 * Loads an optional provider package the first time a send needs it.
 * The default loader is Node's require so a missing install fails here, not at startup.
 */
export function loadOptionalPackage(
  name: string,
  load: (packageName: string) => unknown = (packageName) => nodeRequire(packageName),
): unknown {
  try {
    return load(name);
  } catch (error: unknown) {
    if (isMissingPackage(error, name)) {
      throw new EmailProviderNotInstalledError(name);
    }
    throw error;
  }
}

function isMissingPackage(error: unknown, name: string): boolean {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return false;
  }

  const message = (error as { message?: unknown }).message;
  const code = (error as { code?: unknown }).code;
  return typeof message === 'string' && message.includes(name) && code === 'MODULE_NOT_FOUND';
}

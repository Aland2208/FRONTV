import {
  PASSWORD_MAX_BYTES,
  passwordDentroDelLimite,
  validarPassword
} from './password-validator';

describe('validarPassword', () => {
  it('accepts passwords matching the required policy', () => {
    expect(validarPassword('ClaveSegura1!').valida).toBeTrue();
  });

  it('enforces bcrypt’s 72-byte limit, including multibyte characters', () => {
    const atLimit = `ClaveSegura1!${'a'.repeat(59)}`;
    const overLimit = `ClaveSegura1!${'a'.repeat(60)}`;

    expect(new TextEncoder().encode(atLimit).length).toBe(PASSWORD_MAX_BYTES);
    expect(passwordDentroDelLimite(atLimit)).toBeTrue();
    expect(passwordDentroDelLimite(overLimit)).toBeFalse();
    expect(validarPassword(`ClaveSegura1!${'a'.repeat(60)}`).valida).toBeFalse();
    expect(validarPassword(`ClaveSegura1!${'ñ'.repeat(30)}`).valida).toBeFalse();
  });
});

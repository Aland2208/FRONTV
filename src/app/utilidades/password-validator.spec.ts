import { validarPassword } from './password-validator';

describe('validarPassword', () => {
  it('accepts passwords matching the required policy', () => {
    expect(validarPassword('ClaveSegura1!').valida).toBeTrue();
  });

  it('rejects passwords longer than bcrypt’s 72-byte limit', () => {
    expect(validarPassword(`ClaveSegura1!${'a'.repeat(60)}`).valida).toBeFalse();
    expect(validarPassword(`ClaveSegura1!${'ñ'.repeat(30)}`).valida).toBeFalse();
  });
});

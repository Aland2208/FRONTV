import { validarNombre } from './nombre-validator';

describe('validarNombre', () => {
  it('accepts plausible names with accents, spaces, hyphens, and apostrophes', () => {
    expect(validarNombre('María José')).toBeTrue();
    expect(validarNombre('De la Cruz')).toBeTrue();
    expect(validarNombre("O'Connor")).toBeTrue();
    expect(validarNombre('Ana-María')).toBeTrue();
  });

  it('rejects alternating random-looking text and malformed values', () => {
    expect(validarNombre('ADADA')).toBeFalse();
    expect(validarNombre('qwrty')).toBeFalse();
    expect(validarNombre('Ana123')).toBeFalse();
    expect(validarNombre('Admin')).toBeFalse();
  });

  it('allows names that cannot safely be classified as fake based on text alone', () => {
    expect(validarNombre('Asad')).toBeTrue();
    expect(validarNombre('Xochitl')).toBeTrue();
    expect(validarNombre('Ng')).toBeTrue();
    expect(validarNombre('Bjørn')).toBeTrue();
    expect(validarNombre('Иван')).toBeTrue();
  });

  it('rejects common placeholders and random-looking names', () => {
    expect(validarNombre('Waos')).toBeFalse();
    expect(validarNombre('Qwerty')).toBeFalse();
    expect(validarNombre('TestUser')).toBeFalse();
  });

  it('rejects keyboard walks and repeated artificial syllables', () => {
    expect(validarNombre('QwErTy')).toBeFalse();
    expect(validarNombre('Qazwsx')).toBeFalse();
    expect(validarNombre('Lalalala')).toBeFalse();
    expect(validarNombre('Aaaaa')).toBeFalse();
  });
});

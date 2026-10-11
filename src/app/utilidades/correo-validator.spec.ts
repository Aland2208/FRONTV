import { validarCorreoElectronico } from './correo-validator';

describe('validarCorreoElectronico', () => {
  it('acepta correo con formato válido en dominios públicos y propios', () => {
    expect(validarCorreoElectronico('usuario.apellido+vigia@gmail.com')).toBeTrue();
    expect(validarCorreoElectronico('usuario@upse.edu.ec')).toBeTrue();
    expect(validarCorreoElectronico(' Usuario@Outlook.com ')).toBeTrue();
    expect(validarCorreoElectronico('persona@empresa.example')).toBeTrue();
  });

  it('rechaza direcciones mal formadas y direcciones demasiado largas', () => {
    expect(validarCorreoElectronico('.usuario@gmail.com')).toBeFalse();
    expect(validarCorreoElectronico('usuario..apellido@gmail.com')).toBeFalse();
    expect(validarCorreoElectronico('usuario@-gmail.com')).toBeFalse();
    expect(validarCorreoElectronico('usuario@gmail-.com')).toBeFalse();
    expect(validarCorreoElectronico('usuario@localhost')).toBeFalse();
    expect(validarCorreoElectronico('usuario@-dominio.example')).toBeFalse();
    expect(validarCorreoElectronico(`persona${'a'.repeat(145)}@gmail.com`)).toBeFalse();
  });
});

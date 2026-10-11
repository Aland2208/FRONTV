export function validarCorreoElectronico(correo: string): boolean {
  const valor = (correo || '').trim().toLowerCase();
  const formatoValido = /^(?!.*\.\.)[a-z0-9_%+-]+(?:\.[a-z0-9_%+-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

  if (valor.length > 150 || !formatoValido.test(valor)) return false;

  const [usuario, dominio] = valor.split('@');
  return usuario.length <= 64 && dominio.length <= 253;
}

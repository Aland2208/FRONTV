const palabrasProhibidas = new Set([
  'mama', 'tanga', 'papa', 'culo', 'puta', 'puto', 'mierda', 'verga', 'pito',
  'pendejo', 'pendeja', 'idiota', 'maricon', 'perra', 'perro', 'chucha', 'hdp',
  'admin', 'administrador', 'root', 'test', 'prueba', 'usuario', 'null', 'undefined',
  'anonimo', 'nobody', 'fake', 'bot', 'observador', 'veedor', 'tonto', 'bobo', 'loco'
]);

const letrasNombre = /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u;

export function validarNombre(texto: string): boolean {
  const limpio = String(texto || '').trim().replace(/\s+/g, ' ');

  if (limpio.length < 2 || limpio.length > 30 || !letrasNombre.test(limpio)) {
    return false;
  }

  const palabras = limpio.split(/[ -]/);
  if (palabras.length > 3) {
    return false;
  }

  for (const palabra of palabras) {
    if (palabra.length < 2 || palabra.length > 14) {
      return false;
    }

    const normalizada = palabra
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const vocales = normalizada.match(/[aeiou]/g) || [];

    if (
      palabrasProhibidas.has(normalizada) ||
      /([a-z])\1\1/i.test(normalizada) ||
      vocales.length === 0 ||
      /[bcdfghjklmnpqrstvwxyz]{3,}/i.test(normalizada) ||
      /[aeiou]{3,}/i.test(normalizada) ||
      /^(.)(.)\1\2(?:\1)?$/i.test(normalizada) ||
      /(.)\1{2,}/i.test(normalizada)
    ) {
      return false;
    }

    const porcentajeVocales = vocales.length / normalizada.length;
    if (
      normalizada.length >= 6 &&
      (porcentajeVocales < 0.25 || porcentajeVocales > 0.7)
    ) {
      return false;
    }
  }

  return true;
}

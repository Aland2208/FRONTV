const ZONA_HORARIA_ECUADOR = 'America/Guayaquil';

export function obtenerFechaEcuador(ahora = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA_ECUADOR,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(ahora);
  const valores: Record<string, string> = {};
  partes.forEach(parte => {
    valores[parte.type] = parte.value;
  });
  return `${valores['year']}-${valores['month']}-${valores['day']}`;
}

export function desplazarFecha(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const desplazada = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return [
    desplazada.getUTCFullYear(),
    String(desplazada.getUTCMonth() + 1).padStart(2, '0'),
    String(desplazada.getUTCDate()).padStart(2, '0')
  ].join('-');
}

export function formatearFechaEcuador(fecha: string): string {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : '--/--/----';
}

export function formatearHoraEcuador(fechaHora: string | Date): string {
  if (!fechaHora) return '--:--';

  if (fechaHora instanceof Date) {
    return new Intl.DateTimeFormat('es-EC', {
      timeZone: ZONA_HORARIA_ECUADOR,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(fechaHora);
  }

  const texto = String(fechaHora);
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(texto) && !/[zZ]|[+-]\d{2}:\d{2}$/.test(texto)) {
    return texto.slice(11, 16);
  }

  const instante = new Date(texto);
  if (Number.isNaN(instante.getTime())) return '--:--';

  return new Intl.DateTimeFormat('es-EC', {
    timeZone: ZONA_HORARIA_ECUADOR,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(instante);
}

export function formatearFechaHoraEcuador(fechaHora: string | Date): string {
  const instante = fechaHora instanceof Date
    ? fechaHora
    : new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(fechaHora)
      ? fechaHora
      : `${fechaHora.replace(' ', 'T')}-05:00`);
  if (Number.isNaN(instante.getTime())) return '--/--/----, --:--';

  return new Intl.DateTimeFormat('es-EC', {
    timeZone: ZONA_HORARIA_ECUADOR,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(instante);
}

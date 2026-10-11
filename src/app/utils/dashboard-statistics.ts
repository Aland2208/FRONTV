export interface ActivityRecord {
  fecha?: string;
  hora?: number;
  total_capturas: number;
}

export interface ActivityComparisonSeries {
  labels: string[];
  actual: number[];
  anterior: number[];
}

export function pesoMedioPorCaptura(pesoTotal: number, capturas: number): number | null {
  return capturas > 0 ? pesoTotal / capturas : null;
}

export function formatearCambio(
  actual: number,
  anterior: number,
  decimales = 0,
  sufijo = ''
): string {
  const diferencia = actual - anterior;

  if (diferencia === 0) {
    return 'Sin variación';
  }

  const diferenciaTexto = `${diferencia > 0 ? '+' : ''}${diferencia.toFixed(decimales)}${sufijo}`;

  if (anterior === 0) {
    return `${diferenciaTexto} (sin base anterior)`;
  }

  const porcentaje = (diferencia / Math.abs(anterior)) * 100;
  return `${diferenciaTexto} (${porcentaje > 0 ? '+' : ''}${porcentaje.toFixed(1)}%)`;
}

export function crearSerieComparativa(
  actual: ActivityRecord[],
  anterior: ActivityRecord[],
  desde: string,
  hasta: string,
  desdeAnterior: string,
  porHora: boolean
): ActivityComparisonSeries {
  if (porHora) {
    const mapaActual = new Map(actual.map(item => [Number(item.hora), item.total_capturas]));
    const mapaAnterior = new Map(anterior.map(item => [Number(item.hora), item.total_capturas]));
    const horas = Array.from({ length: 24 }, (_, hora) => hora);

    return {
      labels: horas.map(hora => `${String(hora).padStart(2, '0')}:00`),
      actual: horas.map(hora => mapaActual.get(hora) || 0),
      anterior: horas.map(hora => mapaAnterior.get(hora) || 0)
    };
  }

  const cantidadDias = Math.max(
    Math.floor((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000) + 1,
    1
  );
  const mapaActual = new Map(actual.map(item => [normalizarFecha(item.fecha), item.total_capturas]));
  const mapaAnterior = new Map(anterior.map(item => [normalizarFecha(item.fecha), item.total_capturas]));
  const inicio = Date.parse(`${desde}T00:00:00Z`);
  const inicioAnterior = Date.parse(`${desdeAnterior}T00:00:00Z`);

  return {
    labels: Array.from({ length: cantidadDias }, (_, indice) => {
      const fecha = new Date(inicio + indice * 86_400_000);
      return `${String(fecha.getUTCDate()).padStart(2, '0')}/${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;
    }),
    actual: Array.from({ length: cantidadDias }, (_, indice) => {
      const fecha = new Date(inicio + indice * 86_400_000);
      return mapaActual.get(fecha.toISOString().slice(0, 10)) || 0;
    }),
    anterior: Array.from({ length: cantidadDias }, (_, indice) => {
      const fecha = new Date(inicioAnterior + indice * 86_400_000);
      return mapaAnterior.get(fecha.toISOString().slice(0, 10)) || 0;
    })
  };
}

function normalizarFecha(fecha?: string): string {
  return String(fecha || '').slice(0, 10);
}

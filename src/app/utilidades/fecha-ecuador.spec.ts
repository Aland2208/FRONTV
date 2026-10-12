import {
  desplazarFecha,
  formatearFechaHoraEcuador,
  formatearHoraEcuador,
  obtenerFechaEcuador
} from './fecha-ecuador';

describe('fecha-ecuador', () => {
  it('uses the Ecuador calendar date even when UTC is already on the next day', () => {
    expect(obtenerFechaEcuador(new Date('2026-01-01T03:00:00.000Z'))).toBe('2025-12-31');
  });

  it('shifts ISO calendar dates without depending on the browser timezone', () => {
    expect(desplazarFecha('2026-01-01', -1)).toBe('2025-12-31');
    expect(desplazarFecha('2026-03-01', -29)).toBe('2026-01-31');
  });

  it('formats UTC timestamps as Ecuador time', () => {
    expect(formatearHoraEcuador('2026-01-01T03:30:00.000Z')).toBe('22:30');
    expect(formatearFechaHoraEcuador('2026-01-01 03:30:00')).toBe('01/01/2026, 03:30');
    expect(formatearFechaHoraEcuador('2026-01-01T03:30:00.000Z')).toBe('31/12/2025, 22:30');
  });

  it('preserves date-only database timestamps already stored as Ecuador local time', () => {
    expect(formatearHoraEcuador('2026-01-01 03:30:00')).toBe('03:30');
  });
});

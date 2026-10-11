import {
  crearSerieComparativa,
  formatearCambio,
  pesoMedioPorCaptura
} from './dashboard-statistics';

describe('dashboard-statistics', () => {
  it('does not calculate an average without captures', () => {
    expect(pesoMedioPorCaptura(0, 0)).toBeNull();
    expect(pesoMedioPorCaptura(12, 4)).toBe(3);
  });

  it('formats changes safely when the previous period is empty', () => {
    expect(formatearCambio(3, 0)).toBe('+3 (sin base anterior)');
    expect(formatearCambio(0, 0)).toBe('Sin variación');
    expect(formatearCambio(15, 10)).toBe('+5 (+50.0%)');
    expect(formatearCambio(15, 10, 1, ' g')).toBe('+5.0 g (+50.0%)');
  });

  it('aligns missing dates and shifts the prior series to the same day positions', () => {
    const series = crearSerieComparativa(
      [
        { fecha: '2025-01-02', total_capturas: 4 },
        { fecha: '2025-01-04', total_capturas: 2 }
      ],
      [
        { fecha: '2024-12-30', total_capturas: 1 },
        { fecha: '2025-01-01', total_capturas: 3 }
      ],
      '2025-01-02',
      '2025-01-04',
      '2024-12-30',
      false
    );

    expect(series.labels).toEqual(['02/01', '03/01', '04/01']);
    expect(series.actual).toEqual([4, 0, 2]);
    expect(series.anterior).toEqual([1, 0, 3]);
  });
});

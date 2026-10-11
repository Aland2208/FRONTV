import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';

import { CrearReporteComponent } from './crear-reporte.component';
import { ReporteS } from '../../servicios/reporte-s';
import { Auth } from '../../servicios/auth';
import { BalanzaS } from '../../servicios/balanza-s';

describe('CrearReporteComponent', () => {
  let component: CrearReporteComponent;
  let fixture: ComponentFixture<CrearReporteComponent>;
  let reporteService: jasmine.SpyObj<ReporteS>;

  beforeEach(waitForAsync(() => {
    reporteService = jasmine.createSpyObj<ReporteS>('ReporteS', [
      'obtenerTiposReporte',
      'obtenerReportesPendientesHoy',
      'obtenerReportesPendientesAnteriores'
    ]);
    reporteService.obtenerTiposReporte.and.returnValue(of({ data: [] }));
    reporteService.obtenerReportesPendientesHoy.and.returnValue(of({
      usuario: { nombre: 'Ana', apellido: 'Prueba' },
      data: [],
      resumen: { total_registros: 0, peso_total: 0, confianza_promedio: 0 }
    }));
    reporteService.obtenerReportesPendientesAnteriores.and.returnValue(of({
      data: [
        { id_reporte: 1, id_especie: 7, especie: 'Especie A', fecha_reporte: '2026-10-01' },
        { id_reporte: 2, id_especie: 7, especie: 'Especie A', fecha_reporte: '2026-10-01' },
        { id_reporte: 3, id_especie: 7, especie: 'Especie A', fecha_reporte: '2026-10-02' }
      ]
    }));

    TestBed.configureTestingModule({
      imports: [CrearReporteComponent],
      providers: [
        { provide: ReporteS, useValue: reporteService },
        { provide: Auth, useValue: { obtenerIdUsuario: () => 42 } },
        { provide: BalanzaS, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CrearReporteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads older pending captures grouped by date and species', () => {
    expect(reporteService.obtenerReportesPendientesAnteriores).toHaveBeenCalledWith(
      42,
      component.rangoPendientesAnteriores.fecha_inicio,
      component.rangoPendientesAnteriores.fecha_fin
    );
    expect(component.gruposEspeciesAnteriores.length).toBe(2);
    expect(component.gruposEspeciesAnteriores[0].fecha_reporte).toBe('2026-10-02');
    expect(component.gruposEspeciesAnteriores[1].total_capturas).toBe(2);
  });
});

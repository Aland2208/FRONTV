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
      data: [
        { id_reporte: 10, id_captura: 20, id_especie: 9, especie: 'Especie del día', fecha_reporte: '2026-10-11' },
        { id_reporte: 11, id_captura: 21, id_especie: 9, especie: 'Especie del día', fecha_reporte: '2026-10-11' }
      ],
      resumen: { total_registros: 2, peso_total: 350, confianza_promedio: 90 }
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

  it('keeps today and older pending groups separate when both requests finish', () => {
    expect(component.gruposEspecies).toHaveSize(1);
    expect(component.gruposEspecies[0].especie).toBe('Especie del día');
    expect(component.gruposEspecies[0].total_capturas).toBe(2);

    expect(component.gruposEspeciesAnteriores).toHaveSize(2);
    expect(component.gruposEspeciesAnteriores.every(
      grupo => grupo.especie !== 'Especie del día'
    )).toBeTrue();
  });

  it('renders today before the separate older-pending section', () => {
    const sections = fixture.nativeElement.querySelectorAll('.encabezado-seccion-pendientes h2, .pendientes-anteriores h2');

    expect(sections[0].textContent.trim()).toBe('Pendientes de hoy');
    expect(sections[1].textContent.trim()).toBe('Pendientes de días anteriores');
  });
});

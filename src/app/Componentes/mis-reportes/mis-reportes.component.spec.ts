import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReporteS } from 'src/app/servicios/reporte-s';
import { Auth } from 'src/app/servicios/auth';

import { MisReportesComponent } from './mis-reportes.component';

describe('MisReportesComponent', () => {
  let component: MisReportesComponent;
  let fixture: ComponentFixture<MisReportesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MisReportesComponent],
      providers: [
        {
          provide: ReporteS,
          useValue: {
            obtenerTiposReporte: () => of({ data: [] }),
            obtenerEspeciesFiltro: () => of({ data: [] }),
            obtenerHistorialReportes: () => of({
              data: [],
              paginacion: {}
            })
          }
        },
        {
          provide: Auth,
          useValue: { obtenerIdUsuario: () => 1 }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MisReportesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders native date inputs for both range filters', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input[type="date"]');
    const calendarButtons = fixture.nativeElement.querySelectorAll('.btn-calendario');

    expect(inputs.length).toBe(2);
    expect(calendarButtons.length).toBe(0);
    expect(inputs[0].id).toBe('fechaInicioReportes');
    expect(inputs[1].id).toBe('fechaFinReportes');
  });

  it('keeps selected dates in the API date format', () => {
    component.filtros.fecha_inicio = '2026-10-01';
    component.filtros.fecha_fin = '2026-10-10';

    expect(component.filtros.fecha_inicio).toBe('2026-10-01');
    expect(component.filtros.fecha_fin).toBe('2026-10-10');
  });

  it('shows current-day reports first and groups earlier dates newest-first', () => {
    component.fechaHoy = '2026-10-10';
    component.reportes = [
      { fecha: '2026-10-08', titulo: 'Older' },
      { fecha: '2026-10-10', titulo: 'Today' },
      { fecha: '2026-10-09', titulo: 'Yesterday' },
      { fecha: '2026-10-08', titulo: 'Older same day' }
    ];

    expect(component.reportesDeHoy.map(reporte => reporte.titulo)).toEqual(['Today']);
    expect(component.reportesAnteriores.map(grupo => grupo.fecha)).toEqual([
      '2026-10-09',
      '2026-10-08'
    ]);
    expect(component.reportesAnteriores[1].reportes.length).toBe(2);

    fixture.detectChanges();
    const gruposFecha = fixture.nativeElement.querySelectorAll('details.grupo-fecha');
    expect(gruposFecha.length).toBe(2);
    expect(Array.from(gruposFecha).every((grupo: any) => !grupo.open)).toBeTrue();
  });
});

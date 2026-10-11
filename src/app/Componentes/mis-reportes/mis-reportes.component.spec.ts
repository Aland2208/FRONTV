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
});

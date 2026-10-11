import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { Auth } from 'src/app/servicios/auth';
import { ReportesAdminComponent } from './reportes-admin.component';

describe('ReportesAdminComponent', () => {
  let component: ReportesAdminComponent;
  let fixture: ComponentFixture<ReportesAdminComponent>;
  let authStub: jasmine.SpyObj<Auth>;

  beforeEach(async () => {
    authStub = jasmine.createSpyObj<Auth>('Auth', [
      'obtenerIdUsuario',
      'getReportesAdministradorHoy',
      'getTiposReporte',
      'aprobarLoteReporte',
      'rechazarLoteReporte'
    ]);
    authStub.obtenerIdUsuario.and.returnValue(1);
    authStub.getReportesAdministradorHoy.and.returnValue(of({ data: [], resumen: {} }));
    authStub.getTiposReporte.and.returnValue(of({ data: [] }));
    authStub.aprobarLoteReporte.and.returnValue(of({ estado: 1 }));
    authStub.rechazarLoteReporte.and.returnValue(of({ estado: 1 }));

    const toastStub = {
      create: () => Promise.resolve({ present: () => Promise.resolve() })
    };

    await TestBed.configureTestingModule({
      imports: [ReportesAdminComponent],
      providers: [
        { provide: Auth, useValue: authStub },
        { provide: ToastController, useValue: toastStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('groups pending review rows by batch and keeps them out of regular results', () => {
    const reporte = {
      id_reporte: 1,
      id_captura: 1,
      id_usuario: 2,
      id_tipo_reporte: 4,
      titulo: 'Reporte atrasado',
      archivo_pdf: 1,
      archivo_csv: 1,
      fecha_reporte: '2025-01-10',
      hora_reporte: '10:00:00',
      fecha_generacion: '2025-01-10 10:00:00',
      nombre: 'Ana',
      apellido: 'Observadora',
      correo: 'ana@example.test',
      nombre_completo: 'Ana Observadora',
      nombre_tipo: 'Diario',
      peso: 1,
      fecha_captura: '2025-01-09',
      hora_captura: '10:00:00',
      id_deteccion: 1,
      porcentaje: 95,
      imagen_url: null,
      id_especie: 1,
      especie: 'Especie',
      nombre_cientifico: 'Species example',
      estado_reporte: 'Completo' as const,
      id_lote_envio: 'lote-uuid',
      estado_revision: 'PENDIENTE' as const,
      fecha_envio: '2025-01-10 10:00:00',
      motivo_rechazo: null,
      es_atrasado: 1
    };
    component.reportes = [
      reporte,
      { ...reporte, id_reporte: 2 },
      {
        ...reporte,
        id_reporte: 3,
        id_lote_envio: null,
        estado_revision: null
      }
    ];

    expect(component.lotesPendientesRevision.length).toBe(1);
    expect(component.lotesPendientesRevision[0].total_capturas).toBe(2);
    expect(component.reportesFiltrados.map(item => item.id_reporte)).toEqual([3]);
  });

  it('submits a trimmed rejection reason for the selected batch', () => {
    component.reportes = [{
      id_reporte: 1,
      id_captura: 1,
      id_usuario: 2,
      id_tipo_reporte: 4,
      titulo: 'Reporte atrasado',
      archivo_pdf: 1,
      archivo_csv: 1,
      fecha_reporte: '2025-01-10',
      hora_reporte: '10:00:00',
      fecha_generacion: '2025-01-10 10:00:00',
      nombre: 'Ana',
      apellido: 'Observadora',
      correo: 'ana@example.test',
      nombre_completo: 'Ana Observadora',
      nombre_tipo: 'Diario',
      peso: 1,
      fecha_captura: '2025-01-09',
      hora_captura: '10:00:00',
      id_deteccion: 1,
      porcentaje: 95,
      imagen_url: null,
      id_especie: 1,
      especie: 'Especie',
      nombre_cientifico: 'Species example',
      estado_reporte: 'Completo',
      id_lote_envio: 'lote-uuid',
      estado_revision: 'PENDIENTE',
      fecha_envio: '2025-01-10 10:00:00',
      motivo_rechazo: null,
      es_atrasado: 1
    }];
    component.abrirRechazo(component.lotesPendientesRevision[0]);
    component.motivoRechazo = '  Falta corregir la fecha  ';

    component.rechazarReporte();

    expect(authStub.rechazarLoteReporte).toHaveBeenCalledOnceWith(
      1,
      'lote-uuid',
      'Falta corregir la fecha'
    );
  });
});

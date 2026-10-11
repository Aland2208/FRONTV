import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { Auth } from 'src/app/servicios/auth';
import { ReportesAdminComponent } from './reportes-admin.component';

describe('ReportesAdminComponent', () => {
  let component: ReportesAdminComponent;
  let fixture: ComponentFixture<ReportesAdminComponent>;

  beforeEach(async () => {
    const authStub = {
      obtenerIdUsuario: () => 1,
      getReportesAdministradorHoy: () => of({ data: [], resumen: {} }),
      getTiposReporte: () => of({ data: [] })
    };
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
});

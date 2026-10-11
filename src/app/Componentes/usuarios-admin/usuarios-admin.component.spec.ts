import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { Auth } from '../../servicios/auth';
import { UsuariosAdminComponent } from './usuarios-admin.component';

describe('UsuariosAdminComponent', () => {
  let component: UsuariosAdminComponent;
  let fixture: ComponentFixture<UsuariosAdminComponent>;

  beforeEach(async () => {
    const authStub = {
      getObservadores: () => of({ data: [] })
    };

    await TestBed.configureTestingModule({
      imports: [UsuariosAdminComponent],
      providers: [
        { provide: Auth, useValue: authStub },
        { provide: AlertController, useValue: {} },
        { provide: ToastController, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens the observer form outside the summary and shows validation errors in the modal', async () => {
    await component.nuevoObservador();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('.modal-observador-backdrop');
    const summary = fixture.nativeElement.querySelector('.resumen');

    expect(modal).toBeTruthy();
    expect(summary.contains(modal)).toBeFalse();

    component.formularioObservador = {
      nombre: 'Ana',
      apellido: 'Prueba',
      correo: 'correo-invalido',
      password: 'Test123!'
    };
    component.guardarFormularioObservador();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.error-formulario-observador').textContent
    ).toContain('Ingresa un correo electrónico válido.');
  });

  it('separates pending verification accounts from inactive verified accounts', () => {
    component.observadores = [
      {
        id_usuario: 1,
        nombre: 'Ana',
        apellido: 'Prueba',
        correo: 'ana@example.com',
        estado: 0,
        verificacion_pendiente: true
      },
      {
        id_usuario: 2,
        nombre: 'Luis',
        apellido: 'Prueba',
        correo: 'luis@example.com',
        estado: 0,
        verificacion_pendiente: false
      }
    ];

    expect(component.totalPendientesVerificacion).toBe(1);
    expect(component.totalInactivos).toBe(1);
  });
});

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
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { Auth } from '../../servicios/auth';
import { RegistroPage } from './registro.page';

describe('RegistroPage', () => {
  let component: RegistroPage;
  let fixture: ComponentFixture<RegistroPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: { registro: jasmine.createSpy('registro') } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        {
          provide: ToastController,
          useValue: {
            create: async () => ({ present: async () => {} })
          }
        }
      ]
    });
    fixture = TestBed.createComponent(RegistroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('marks invalid names and surnames with a red border', () => {
    component.usuario.nombre = 'Qwerty';
    component.usuario.apellido = 'Lalalala';
    fixture.detectChanges();

    const invalidFields = fixture.nativeElement.querySelectorAll('.field__box--error');
    expect(invalidFields.length).toBe(2);
    expect(invalidFields[0].getAttribute('aria-invalid')).toBe('true');
    expect(invalidFields[1].getAttribute('aria-invalid')).toBe('true');
  });

  it('does not show an invalid border before a name is entered', () => {
    const invalidFields = fixture.nativeElement.querySelectorAll('.field__box--error');
    expect(invalidFields.length).toBe(0);
  });
});

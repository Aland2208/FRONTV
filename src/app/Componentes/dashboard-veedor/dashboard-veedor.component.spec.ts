import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DashboardVeedorComponent } from './dashboard-veedor.component';
import { DashboardS } from 'src/app/servicios/dashboard-s';
import { Auth } from 'src/app/servicios/auth';

describe('DashboardVeedorComponent', () => {
  let component: DashboardVeedorComponent;
  let fixture: ComponentFixture<DashboardVeedorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DashboardVeedorComponent],
      providers: [
        { provide: DashboardS, useValue: {} },
        { provide: Auth, useValue: { obtenerIdUsuario: () => null } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardVeedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

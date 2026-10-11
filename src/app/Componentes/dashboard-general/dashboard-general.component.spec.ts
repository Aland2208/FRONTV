import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DashboardGeneralComponent } from './dashboard-general.component';
import { DashboardS } from 'src/app/servicios/dashboard-s';
import { Auth } from 'src/app/servicios/auth';

describe('DashboardGeneralComponent', () => {
  let component: DashboardGeneralComponent;
  let fixture: ComponentFixture<DashboardGeneralComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DashboardGeneralComponent],
      providers: [
        { provide: DashboardS, useValue: {} },
        { provide: Auth, useValue: { obtenerIdUsuario: () => null } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

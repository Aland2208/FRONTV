import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonSpinner } from '@ionic/angular/standalone';
import { Auth } from '../../servicios/auth';

@Component({
  selector: 'app-verificar-correo',
  standalone: true,
  imports: [CommonModule, IonButton, IonContent, IonSpinner],
  template: `
    <ion-content class="ion-padding">
      <main class="verificacion">
        <h1>Verificación de correo</h1>
        <p>{{ mensaje }}</p>
        <ion-spinner *ngIf="cargando" name="crescent"></ion-spinner>
        <ion-button
          *ngIf="token && !verificado && !cargando"
          (click)="confirmarCorreo()">
          Confirmar correo
        </ion-button>
        <ion-button *ngIf="!cargando" (click)="irLogin()">
          Ir a iniciar sesión
        </ion-button>
      </main>
    </ion-content>
  `,
  styles: [`
    .verificacion {
      display: grid;
      min-height: 80vh;
      place-content: center;
      justify-items: center;
      gap: 1rem;
      text-align: center;
    }
  `]
})
export class VerificarCorreoPage implements OnInit {
  cargando = true;
  mensaje = 'Verificando el enlace...';
  token: string | null = null;
  verificado = false;

  constructor(
    private route: ActivatedRoute,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.cargando = false;
      this.mensaje = 'El enlace de verificación no es válido o ya venció.';
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { token: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    this.cargando = false;
    this.mensaje = 'Confirma tu correo para activar tu cuenta.';
  }

  confirmarCorreo(): void {
    if (!this.token || this.cargando || this.verificado) return;

    this.cargando = true;
    this.auth.verificarCorreo(this.token).subscribe({
      next: (respuesta) => {
        this.mensaje = respuesta.mensaje;
        this.verificado = true;
        this.cargando = false;
      },
      error: (error) => {
        this.mensaje = error.error?.mensaje ||
          'No se pudo verificar el correo. Intenta nuevamente.';
        this.cargando = false;
      }
    });
  }

  irLogin(): void {
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}

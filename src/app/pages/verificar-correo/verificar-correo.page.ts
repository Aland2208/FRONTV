import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
  mailOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { Auth } from '../../servicios/auth';

@Component({
  selector: 'app-verificar-correo',
  standalone: true,
  imports: [CommonModule, IonButton, IonContent, IonIcon, IonSpinner],
  template: `
    <ion-content class="verify-content">
      <main class="verify-shell">
        <header class="verify-brand">
          <div class="brand-mark">
            <ion-icon name="shield-checkmark-outline"></ion-icon>
          </div>
          <span class="brand-name">VIGÍA</span>
          <span class="brand-caption">SISTEMA DE OBSERVACIÓN PESQUERA</span>
        </header>

        <section class="verify-card" role="status" aria-live="polite">
          <div
            class="status-mark"
            [class.status-mark--success]="verificado"
            [class.status-mark--invalid]="!token">
            <ion-spinner *ngIf="cargando" name="crescent"></ion-spinner>
            <ion-icon *ngIf="!cargando && verificado" name="checkmark-circle-outline"></ion-icon>
            <ion-icon *ngIf="!cargando && !verificado && token" name="mail-outline"></ion-icon>
            <ion-icon *ngIf="!cargando && !token" name="alert-circle-outline"></ion-icon>
          </div>

          <span class="verify-eyebrow">ACTIVACIÓN DE CUENTA</span>
          <h1>
            {{ verificado ? 'Correo confirmado' : token ? 'Confirma tu correo' : 'Enlace no disponible' }}
          </h1>
          <p class="verify-message">{{ mensaje }}</p>

          <div class="secure-note" *ngIf="token && !verificado">
            <ion-icon name="shield-checkmark-outline"></ion-icon>
            <span>Este paso confirma que tienes acceso a esta dirección de correo.</span>
          </div>

          <div class="verify-actions">
            <ion-button
              *ngIf="token && !verificado && !cargando"
              class="primary-action"
              expand="block"
              (click)="confirmarCorreo()">
              Confirmar correo
            </ion-button>
            <ion-button
              *ngIf="!cargando"
              class="secondary-action"
              expand="block"
              fill="clear"
              (click)="irLogin()">
              <ion-icon slot="start" name="arrow-back-outline"></ion-icon>
              Ir a iniciar sesión
            </ion-button>
          </div>
        </section>

        <footer class="verify-footer">
          <span>VIGÍA</span>
          <span>Verificación segura de cuenta</span>
        </footer>
      </main>
    </ion-content>
  `,
  styleUrls: ['./verificar-correo.page.scss']
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
  ) {
    addIcons({
      'alert-circle-outline': alertCircleOutline,
      'arrow-back-outline': arrowBackOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'mail-outline': mailOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline
    });
  }

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

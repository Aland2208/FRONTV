import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from './../../servicios/auth';
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonIcon,
  ToastController
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-restablecer-password',
  templateUrl: './restablecer-password.page.html',
  styleUrls: ['./restablecer-password.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
    IonIcon,
    CommonModule,
    FormsModule
  ]
})
export class RestablecerPasswordPage implements OnInit {
  token: string = '';
  nuevaPassword: string = '';
  confirmarPassword: string = '';
  cargando: boolean = false;
  validandoToken: boolean = true;
  tokenValido: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: Auth,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.regresarLogin();
      return;
    }

    this.validarToken();
  }

  validarToken() {
    this.validandoToken = true;

    this.authService.validarTokenRecuperacion(this.token).subscribe({
      next: () => {
        this.tokenValido = true;
        this.validandoToken = false;
      },

      error: () => {
        this.tokenValido = false;
        this.validandoToken = false;

        this.mostrarMensaje(
          'Este enlace expiró o ya fue utilizado.',
          'warning'
        );

        this.regresarLogin();
      }
    });
  }

  cambiarPassword() {
    if (this.cargando || !this.tokenValido) return;

    if (!this.nuevaPassword || !this.confirmarPassword) {
      this.mostrarMensaje('Completa ambos campos.', 'warning');
      return;
    }

    if (this.nuevaPassword.length < 8) {
      this.mostrarMensaje(
        'La contraseña debe tener al menos 8 caracteres.',
        'warning'
      );
      return;
    }

    if (this.nuevaPassword !== this.confirmarPassword) {
      this.mostrarMensaje(
        'Las contraseñas no coinciden.',
        'danger'
      );
      return;
    }

    this.cargando = true;

    this.authService.restablecerPassword(
      this.token,
      this.nuevaPassword
    ).subscribe({
      next: () => {
        this.cargando = false;

        this.nuevaPassword = '';
        this.confirmarPassword = '';

        sessionStorage.setItem('bloquear_retroceso_login', 'true');

        this.mostrarMensaje(
          '¡Contraseña actualizada con éxito!',
          'success'
        );

        this.router.navigate(['/login'], { replaceUrl: true });
      },

      error: (err) => {
        this.cargando = false;

        this.mostrarMensaje(
          err.error?.mensaje || 'El enlace caducó o es inválido.',
          'danger'
        );
      }
    });
  }

  regresarLogin() {
    this.router.navigate(['/login'], {
      replaceUrl: true
    });
  }

  async mostrarMensaje(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color,
      position: 'bottom'
    });

    await toast.present();
  }
}
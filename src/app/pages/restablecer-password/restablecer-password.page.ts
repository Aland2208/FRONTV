import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from './../../servicios/auth';
import { validarPassword } from '../../utilidades/password-validator';

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

  // ==========================================
  // VALIDACIÓN DE CONTRASEÑA
  // ==========================================

  get requisitosPassword() {
    return validarPassword(this.nuevaPassword);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: Auth,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() { }

  ionViewWillEnter() {

    console.log('ENTRANDO A RESTABLECER PASSWORD');

    this.token =
      this.route.snapshot.queryParamMap.get('token') || '';

    console.log('TOKEN:', this.token);

    if (!this.token) {
      this.regresarLogin();
      return;
    }

    this.validarToken();
  }

  validarToken() {

    console.log(
      'LLAMANDO VALIDAR TOKEN:',
      this.token
    );

    this.validandoToken = true;
    this.tokenValido = false;

    this.authService
      .validarTokenRecuperacion(this.token)
      .subscribe({

        next: (res) => {

          console.log(
            'TOKEN VÁLIDO:',
            res
          );

          this.tokenValido = true;
          this.validandoToken = false;
        },

        error: (err) => {

          console.log(
            'TOKEN INVÁLIDO:',
            err
          );

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

    if (
      this.cargando ||
      !this.tokenValido
    ) {
      return;
    }

    // ==========================================
    // CAMPOS OBLIGATORIOS
    // ==========================================

    if (
      !this.nuevaPassword ||
      !this.confirmarPassword
    ) {

      this.mostrarMensaje(
        'Completa ambos campos.',
        'warning'
      );

      return;
    }

    // ==========================================
    // VALIDACIÓN DE SEGURIDAD
    // ==========================================

    if (!this.requisitosPassword.valida) {

      this.mostrarMensaje(
        'La contraseña no cumple con los requisitos de seguridad.',
        'warning'
      );

      return;
    }

    // ==========================================
    // CONFIRMACIÓN
    // ==========================================

    if (
      this.nuevaPassword !==
      this.confirmarPassword
    ) {

      this.mostrarMensaje(
        'Las contraseñas no coinciden.',
        'danger'
      );

      return;
    }

    // ==========================================
    // ENVÍO
    // ==========================================

    this.cargando = true;

    this.authService
      .restablecerPassword(
        this.token,
        this.nuevaPassword
      )
      .subscribe({

        next: () => {

          this.cargando = false;

          this.nuevaPassword = '';
          this.confirmarPassword = '';

          sessionStorage.setItem(
            'bloquear_retroceso_login',
            'true'
          );

          this.mostrarMensaje(
            '¡Contraseña actualizada con éxito!',
            'success'
          );

          this.router.navigate(
            ['/login'],
            { replaceUrl: true }
          );
        },

        error: (err) => {

          this.cargando = false;

          this.mostrarMensaje(
            err.error?.mensaje ||
            'El enlace caducó o es inválido.',
            'danger'
          );
        }
      });
  }

  regresarLogin() {

    this.router.navigate(
      ['/login'],
      { replaceUrl: true }
    );
  }

  async mostrarMensaje(
    mensaje: string,
    color: string
  ) {

    const toast =
      await this.toastCtrl.create({

        message: mensaje,
        duration: 3000,
        color,
        position: 'bottom'

      });

    await toast.present();
  }
}


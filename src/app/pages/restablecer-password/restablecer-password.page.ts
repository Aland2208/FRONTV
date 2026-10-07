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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: Auth,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];

      if (!this.token) {
        this.mostrarMensaje(
          'Enlace inválido. Vuelve a solicitar el correo.',
          'danger'
        );
        this.router.navigate(['/login']);
      }
    });
  }

  cambiarPassword() {
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

        // Limpiar formulario
        this.nuevaPassword = '';
        this.confirmarPassword = '';

        this.mostrarMensaje(
          '¡Contraseña actualizada con éxito!',
          'success'
        );

        this.router.navigate(['/login']);
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
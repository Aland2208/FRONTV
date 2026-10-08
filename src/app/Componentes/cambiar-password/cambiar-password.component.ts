import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Auth } from '../../servicios/auth';

// Importamos la utilidad de validación
import { validarPassword } from '../../utilidades/password-validator';

@Component({
  selector: 'app-cambiar-password',
  templateUrl: './cambiar-password.component.html',
  styleUrls: ['./cambiar-password.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class CambiarPasswordComponent {

  passwordActual = '';
  nuevaPassword = '';
  confirmarPassword = '';

  mostrarActual = false;
  mostrarNueva = false;
  mostrarConfirmacion = false;

  guardando = false;

  // Evaluamos la nueva contraseña en tiempo real
  get requisitosPassword() {
    return validarPassword(this.nuevaPassword);
  }

  constructor(
    private authService: Auth,
    private toastCtrl: ToastController
  ) { }

  cambiarPassword() {
    const actual = this.passwordActual;
    const nueva = this.nuevaPassword;
    const confirmar = this.confirmarPassword;

    if (!actual || !nueva || !confirmar) {
      this.mostrarMensaje('Complete todos los campos.', 'warning');
      return;
    }

    // Validación completa con la utilidad
    if (!this.requisitosPassword.valida) {
      this.mostrarMensaje('La nueva contraseña no cumple con los requisitos de seguridad.', 'warning');
      return;
    }

    if (nueva !== confirmar) {
      this.mostrarMensaje('Las nuevas contraseñas no coinciden.', 'warning');
      return;
    }

    if (actual === nueva) {
      this.mostrarMensaje('La nueva contraseña debe ser diferente a la actual.', 'warning');
      return;
    }

    const idUsuario = this.authService.obtenerIdUsuario();

    if (!idUsuario) {
      this.mostrarMensaje('No se pudo identificar al usuario.', 'danger');
      return;
    }

    this.guardando = true;

    this.authService.cambiarPassword(
      idUsuario,
      actual,
      nueva
    ).subscribe({
      next: (respuesta) => {
        this.guardando = false;

        this.passwordActual = '';
        this.nuevaPassword = '';
        this.confirmarPassword = '';

        this.mostrarMensaje(
          respuesta.mensaje || 'Contraseña actualizada correctamente.',
          'success'
        );
      },
      error: (err) => {
        this.guardando = false;

        this.mostrarMensaje(
          err?.error?.mensaje || 'No se pudo cambiar la contraseña.',
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
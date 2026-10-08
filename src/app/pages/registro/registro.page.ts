import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from './../../servicios/auth';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonButtons,
  IonIcon,
  ToastController
} from '@ionic/angular/standalone';

import { validarPassword } from '../../utilidades/password-validator';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
    IonButtons,
    IonIcon,
    CommonModule,
    FormsModule
  ]
})
export class RegistroPage implements OnInit {

  usuario = {
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    id_rol: 0
  };

  cargando = false;

  // ==========================================
  // VALIDACIÓN DE CONTRASEÑA
  // ==========================================

  get requisitosPassword() {
    return validarPassword(this.usuario.password);
  }

  constructor(
    private authService: Auth,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {}

  seleccionarRol(idRol: number) {
    this.usuario.id_rol = idRol;
  }

  volverLogin() {
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  registrar() {

    if (
      !this.usuario.nombre ||
      !this.usuario.apellido ||
      !this.usuario.correo ||
      !this.usuario.password
    ) {
      this.mostrarMensaje(
        'Por favor completa todos los campos.',
        'warning'
      );
      return;
    }

    if (!this.requisitosPassword.valida) {
      this.mostrarMensaje(
        'La contraseña no cumple con los requisitos de seguridad.',
        'warning'
      );
      return;
    }

    if (this.usuario.id_rol !== 1 && this.usuario.id_rol !== 2) {
      this.mostrarMensaje(
        'Selecciona el tipo de cuenta: Administrador u Observador.',
        'warning'
      );
      return;
    }

    this.cargando = true;

    this.authService.registro(this.usuario).subscribe({
      next: () => {

        this.cargando = false;

        const rol =
          this.usuario.id_rol === 1
            ? 'Administrador'
            : 'Observador';

        this.mostrarMensaje(
          `Cuenta de ${rol} creada correctamente.`,
          'success'
        );

        this.usuario = {
          nombre: '',
          apellido: '',
          correo: '',
          password: '',
          id_rol: 0
        };

        this.router.navigate(['/login'], {
          replaceUrl: true
        });
      },

      error: (err) => {

        this.cargando = false;

        this.mostrarMensaje(
          err.error?.mensaje || 'Error al registrar usuario',
          'danger'
        );
      }
    });
  }

  async mostrarMensaje(
    mensaje: string,
    color: string
  ) {

    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color,
      position: 'bottom'
    });

    await toast.present();
  }
}
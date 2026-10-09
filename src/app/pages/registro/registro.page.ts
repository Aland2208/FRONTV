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

  // Expresión regular para nombres y apellidos reales en español:
  // Permite letras (a-z, A-Z), acentos (á, é, í, ó, ú, Á, É, Í, Ó, Ú), ü/Ü, ñ/Ñ y espacios simples.
  // Mínimo 2 caracteres, máximo 60.
  private regexTextoValido = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]{2,}(?: [a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]{2,})*$/;

  // Validación de nombre
  get nombreValido(): boolean {
    const val = this.usuario.nombre.trim();
    return val.length >= 2 && this.regexTextoValido.test(val);
  }

  // Validación de apellido
  get apellidoValido(): boolean {
    const val = this.usuario.apellido.trim();
    return val.length >= 2 && this.regexTextoValido.test(val);
  }

  // Validación de correo electrónico
  get correoValido(): boolean {
    const val = this.usuario.correo.trim().toLowerCase();
    const regexEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return regexEmail.test(val);
  }

  // Validación de requisitos de contraseña
  get requisitosPassword() {
    return validarPassword(this.usuario.password);
  }

  constructor(
    private authService: Auth,
    private router: Router,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() { }

  seleccionarRol(idRol: number) {
    this.usuario.id_rol = idRol;
  }

  volverLogin() {
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  registrar() {
    const nombreLimpio = this.usuario.nombre.trim();
    const apellidoLimpio = this.usuario.apellido.trim();
    const correoLimpio = this.usuario.correo.trim().toLowerCase();

    // 1. Validar campos vacíos
    if (!nombreLimpio || !apellidoLimpio || !correoLimpio || !this.usuario.password) {
      this.mostrarMensaje('Por favor completa todos los campos obligatorios.', 'warning');
      return;
    }

    // 2. Validar que el nombre sea auténtico
    if (!this.nombreValido) {
      this.mostrarMensaje('Nombre no válido. Debe contener solo letras y al menos 2 caracteres.', 'warning');
      return;
    }

    // 3. Validar que el apellido sea auténtico
    if (!this.apellidoValido) {
      this.mostrarMensaje('Apellido no válido. Debe contener solo letras y al menos 2 caracteres.', 'warning');
      return;
    }

    // 4. Validar formato de correo
    if (!this.correoValido) {
      this.mostrarMensaje('Por favor ingresa un correo electrónico válido.', 'warning');
      return;
    }

    // 5. Validar requisitos de contraseña
    if (!this.requisitosPassword.valida) {
      this.mostrarMensaje('La contraseña no cumple con los requisitos de seguridad.', 'warning');
      return;
    }

    // 6. Validar tipo de cuenta
    if (this.usuario.id_rol !== 1 && this.usuario.id_rol !== 2) {
      this.mostrarMensaje('Selecciona el tipo de cuenta: Administrador u Observador.', 'warning');
      return;
    }

    this.cargando = true;

    const datosEnviar = {
      nombre: nombreLimpio,
      apellido: apellidoLimpio,
      correo: correoLimpio,
      password: this.usuario.password,
      id_rol: this.usuario.id_rol
    };

    this.authService.registro(datosEnviar).subscribe({
      next: () => {
        this.cargando = false;
        const rol = this.usuario.id_rol === 1 ? 'Administrador' : 'Observador';
        this.mostrarMensaje(`Cuenta de ${rol} creada correctamente.`, 'success');

        this.usuario = {
          nombre: '',
          apellido: '',
          correo: '',
          password: '',
          id_rol: 0
        };

        this.router.navigate(['/login'], { replaceUrl: true });
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarMensaje(err.error?.mensaje || 'Error al registrar usuario', 'danger');
      }
    });
  }

  async mostrarMensaje(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
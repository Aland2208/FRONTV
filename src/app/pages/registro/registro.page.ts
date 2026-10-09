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

  private palabrasProhibidas = [
    'mama', 'tanga', 'papa', 'culo', 'puta', 'puto', 'mierda', 'verga', 'pito',
    'pendejo', 'pendeja', 'idiota', 'maricon', 'perra', 'perro', 'chucha', 'hdp',
    'admin', 'administrador', 'root', 'test', 'prueba', 'usuario', 'null', 'undefined',
    'anonimo', 'nobody', 'fake', 'bot', 'observador', 'veedor'
  ];

  // ========================================================
  // DETECTOR ESTRICTO DE NOMBRES REALES Y TECLAZOS
  // ========================================================
  private validarCadenaNombre(texto: string): boolean {
    const limpio = (texto || '').trim().replace(/\s+/g, ' ');

    // 1. Longitud básica razonable
    if (limpio.length < 2 || limpio.length > 30) return false;

    // 2. Solo letras del español y espacios simples
    const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+(?: [a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+)*$/;
    if (!regexLetras.test(limpio)) return false;

    // 3. Máximo 2 palabras por campo
    const palabras = limpio.split(' ');
    if (palabras.length > 2) return false;

    for (const palabra of palabras) {
      if (palabra.length < 2 || palabra.length > 15) return false;

      const pLower = palabra.toLowerCase();
      const pSinTildes = pLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      // 4. Lista negra
      if (this.palabrasProhibidas.includes(pSinTildes)) return false;

      // 5. Bloquear 3 letras iguales seguidas
      if (/([a-záéíóúñü])\1\1/i.test(pLower)) return false;

      // 6. Debe tener al menos una vocal
      if (!/[aeiouáéíóúü]/i.test(pLower)) return false;

      // 7. Bloquear 3 o más vocales consecutivas raras (ej: "uie", "iee")
      if (/[aeiouáéíóúü]{3,}/i.test(pLower)) return false;

      // 8. Bloquear 3 o más consonantes seguidas
      if (/[bcdfghjklmnñpqrstvwxyz]{3,}/i.test(pLower)) return false;

      // 9. Combinaciones imposibles en español (bloquea "bf", "fb", "ubf", "fub")
      if (/(bf|fb|ubf|fub|bbu|ffu|jd|dj|qj|xj|zx|jk|kj|wq|qw|fg|gf|vb|bv|bp|pb|fn|nf)/i.test(pLower)) return false;

      // 10. Repetición excesiva de la misma consonante en una palabra corta
      const conteoB = (pLower.match(/b/g) || []).length;
      const conteoF = (pLower.match(/f/g) || []).length;
      if (conteoB >= 3 || conteoF >= 3) return false;

      // 11. Bucles repetitivos de 2 a 4 caracteres
      if (/(.{2,4})\1\1/i.test(pLower)) return false;
    }

    return true;
  }

  get nombreValido(): boolean {
    return this.validarCadenaNombre(this.usuario.nombre);
  }

  get apellidoValido(): boolean {
    return this.validarCadenaNombre(this.usuario.apellido);
  }

  get correoValido(): boolean {
    const val = (this.usuario.correo || '').trim().toLowerCase();
    const regexEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return regexEmail.test(val);
  }

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

    if (!nombreLimpio || !apellidoLimpio || !correoLimpio || !this.usuario.password) {
      this.mostrarMensaje('Por favor completa todos los campos.', 'warning');
      return;
    }

    if (!this.nombreValido) {
      this.mostrarMensaje('Nombre no válido. Ingrese un nombre auténtico.', 'warning');
      return;
    }

    if (!this.apellidoValido) {
      this.mostrarMensaje('Apellido no válido. Ingrese un apellido auténtico.', 'warning');
      return;
    }

    if (!this.correoValido) {
      this.mostrarMensaje('Ingrese un correo electrónico válido.', 'warning');
      return;
    }

    if (!this.requisitosPassword.valida) {
      this.mostrarMensaje('La contraseña no cumple con los requisitos de seguridad.', 'warning');
      return;
    }

    if (this.usuario.id_rol !== 1 && this.usuario.id_rol !== 2) {
      this.mostrarMensaje('Selecciona el tipo de cuenta: Administrador u Observador.', 'warning');
      return;
    }

    this.cargando = true;

    // Formatear mayúscula inicial en cada palabra
    const formatearPalabra = (str: string) =>
      str.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');

    const datosEnviar = {
      nombre: formatearPalabra(nombreLimpio),
      apellido: formatearPalabra(apellidoLimpio),
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
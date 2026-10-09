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
    'anonimo', 'nobody', 'fake', 'bot', 'observador', 'veedor', 'tonto', 'bobo', 'loco'
  ];

  // ========================================================
  // LISTA BLANCA DE DOMINIOS DE CORREO RECONOCIDOS
  // ========================================================
  private dominiosValidos = [
    'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'yahoo.es',
    'icloud.com', 'live.com', 'msn.com', 'upse.edu.ec', 'ug.edu.ec',
    'espe.edu.ec', 'epn.edu.ec', 'outlook.es', 'protonmail.com', 'mail.com'
  ];

  // ========================================================
  // FILTRO ESTRUCTURAL DE NOMBRES REALES Y TECLAZOS
  // ========================================================
  private validarCadenaNombre(texto: string): boolean {
    const limpio = (texto || '').trim().replace(/\s+/g, ' ');

    if (limpio.length < 2 || limpio.length > 30) return false;

    const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+(?: [a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+)*$/;
    if (!regexLetras.test(limpio)) return false;

    const palabras = limpio.split(' ');
    if (palabras.length > 2) return false;

    for (const palabra of palabras) {
      if (palabra.length < 2 || palabra.length > 14) return false;

      const pLower = palabra.toLowerCase();
      const pSinTildes = pLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (this.palabrasProhibidas.includes(pSinTildes)) return false;
      if (/([a-záéíóúñü])\1\1/i.test(pLower)) return false;

      const vocales = pLower.match(/[aeiouáéíóúü]/g) || [];
      if (vocales.length === 0) return false;

      if (palabra.length >= 6) {
        const porcentajeVocales = vocales.length / palabra.length;
        if (porcentajeVocales < 0.25 || porcentajeVocales > 0.70) return false;
      }

      if (/[bcdfghjklmnñpqrstvwxyz]{3,}/i.test(pLower)) return false;
      if (/[aeiouáéíóúü]{3,}/i.test(pLower)) return false;
      if (/(jd|dj|jn|nj|dn|nd|ed|fn|nf|bf|fb|ubf|fub|bbu|ffu|qj|xj|zx|jk|kj|wq|qw|fg|gf|vb|bv|bp|pb)/i.test(pLower)) return false;

      const conteoLetras: { [char: string]: number } = {};
      for (const char of pLower) {
        if (!'aeiouáéíóúü'.includes(char)) {
          conteoLetras[char] = (conteoLetras[char] || 0) + 1;
          if (conteoLetras[char] >= 3) return false;
        }
      }

      if (/(.{2,4})\1/i.test(pLower) && palabra.length > 8) return false;
    }

    return true;
  }

  // ========================================================
  // VALIDACIÓN ESTRICTA DE CORREO ELECTRÓNICO (ANTIFRAUDE)
  // ========================================================
  private validarCorreoElectronico(correo: string): boolean {
    const limpio = (correo || '').trim().toLowerCase();

    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regexEmail.test(limpio)) return false;

    const partes = limpio.split('@');
    if (partes.length !== 2) return false;

    const usuario = partes[0];
    const dominio = partes[1];

    if (usuario.length < 3 || usuario.length > 40) return false;
    if (/(.)\1\1\1/.test(usuario)) return false;

    if (this.dominiosValidos.includes(dominio)) {
      return true;
    }

    const nombreDominio = dominio.split('.')[0];
    if (nombreDominio.length < 3 || nombreDominio.length > 20) return false;
    if (/[bcdfghjklmnpqrstvwxyz]{4,}/.test(nombreDominio)) return false;
    if (/[aeiou]{4,}/.test(nombreDominio)) return false;
    if (/(.)\1\1/.test(nombreDominio)) return false;
    if (/(fj|jf|hj|jh|eu|ue|uf|fu|eu|ui){3,}/.test(nombreDominio)) return false;

    return true;
  }

  get nombreValido(): boolean {
    return this.validarCadenaNombre(this.usuario.nombre);
  }

  get apellidoValido(): boolean {
    return this.validarCadenaNombre(this.usuario.apellido);
  }

  get correoValido(): boolean {
    return this.validarCorreoElectronico(this.usuario.correo);
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
      this.mostrarMensaje('Nombre no válido.', 'warning');
      return;
    }

    if (!this.apellidoValido) {
      this.mostrarMensaje('Apellido no válido.', 'warning');
      return;
    }

    if (!this.correoValido) {
      this.mostrarMensaje('Correo no válido (use un proveedor de correo auténtico).', 'warning');
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
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
  // FILTRO ESTRUCTURAL DE NOMBRES REALES Y TECLAZOS
  // ========================================================
  private validarCadenaNombre(texto: string): boolean {
    const limpio = (texto || '').trim().replace(/\s+/g, ' ');

    if (limpio.length < 2 || limpio.length > 30) return false;

    // Solo letras y espacios simples
    const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+(?: [a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+)*$/;
    if (!regexLetras.test(limpio)) return false;

    const palabras = limpio.split(' ');
    // Máximo 2 palabras por campo
    if (palabras.length > 2) return false;

    for (const palabra of palabras) {
      // Longitud por palabra realista (ej. "Constantinopla" = 14)
      if (palabra.length < 2 || palabra.length > 14) return false;

      const pLower = palabra.toLowerCase();
      const pSinTildes = pLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      // 1. Lista de términos no admitidos
      if (this.palabrasProhibidas.includes(pSinTildes)) return false;

      // 2. Bloquear repetición de 3 letras iguales seguidas
      if (/([a-záéíóúñü])\1\1/i.test(pLower)) return false;

      // 3. Debe tener al menos una vocal
      const vocales = pLower.match(/[aeiouáéíóúü]/g) || [];
      if (vocales.length === 0) return false;

      // 4. Proporción vocales vs longitud total
      // Si la palabra tiene más de 6 letras, las vocales deben representar al menos el 25% y no más del 70%
      if (palabra.length >= 6) {
        const porcentajeVocales = vocales.length / palabra.length;
        if (porcentajeVocales < 0.25 || porcentajeVocales > 0.70) return false;
      }

      // 5. Bloquear 3 consonantes o 3 vocales consecutivas no comunes
      if (/[bcdfghjklmnñpqrstvwxyz]{3,}/i.test(pLower)) return false;
      if (/[aeiouáéíóúü]{3,}/i.test(pLower)) return false;

      // 6. Combinaciones de teclado comunes en teclazos
      if (/(jd|dj|jn|nj|dn|nd|ed|fn|nf|bf|fb|ubf|fub|bbu|ffu|qj|xj|zx|jk|kj|wq|qw|fg|gf|vb|bv|bp|pb)/i.test(pLower)) return false;

      // 7. Repetición excesiva de cualquier consonante individual (máximo 2 veces la misma letra consonante)
      // En 'ijnidnindinoed', 'n' se repite 4 veces y 'd' 3 veces
      const conteoLetras: { [char: string]: number } = {};
      for (const char of pLower) {
        if (!'aeiouáéíóúü'.includes(char)) {
          conteoLetras[char] = (conteoLetras[char] || 0) + 1;
          if (conteoLetras[char] >= 3) return false; // Bloquea si la misma consonante se repite 3 o más veces
        }
      }

      // 8. Detección de bucles o sílabas repetitivas (ej: "idnindin", "dinoed")
      if (/(.{2,4})\1/i.test(pLower) && palabra.length > 8) return false;
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
      this.mostrarMensaje('Nombre no válido.', 'warning');
      return;
    }

    if (!this.apellidoValido) {
      this.mostrarMensaje('Apellido no válido.', 'warning');
      return;
    }

    if (!this.correoValido) {
      this.mostrarMensaje('Correo no válido.', 'warning');
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
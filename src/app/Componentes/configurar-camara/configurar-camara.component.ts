
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonIcon,
  IonToggle,
  ToastController
} from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { Auth } from '../../servicios/auth';

@Component({
  selector: 'app-configurar-camara',
  templateUrl: './configurar-camara.component.html',
  styleUrls: ['./configurar-camara.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonButton, IonIcon, IonToggle]
})
export class ConfigurarCamaraComponent implements OnInit {
  urlActual: string | null = null;
  fechaActualizacion: string | null = null;
  nuevaUrl = '';

  cargando = false;
  cargandoConfiguracion = false;
  cargandoPermiso = false;
  visualizacionHabilitada = false;

  idAdministrador: number | null = null;
  veedoresVinculados: any[] = [];
  totalVeedores = 0;

  constructor(
    private authService: Auth,
    private toastCtrl: ToastController
  ) { }

  ngOnInit(): void {
    this.idAdministrador = this.authService.obtenerIdUsuario();
    this.cargarConfiguracionActual();
  }

  // CONSULTAR CONFIGURACIÓN
  cargarConfiguracionActual(): void {
    if (!this.idAdministrador) return;

    this.cargandoConfiguracion = true;

    this.authService
      .obtenerUrlCamaraVinculada(this.idAdministrador)
      .pipe(finalize(() => this.cargandoConfiguracion = false))
      .subscribe({
        next: res => {
          if (res?.estado !== 1) {
            this.mostrarToast('No se pudo consultar la cámara.', 'danger');
            return;
          }

          this.urlActual = res.url_camara || null;
          this.fechaActualizacion = res.fecha_actualizacion || null;
          this.veedoresVinculados = Array.isArray(res.veedores)
            ? res.veedores : [];
          this.totalVeedores = Number(res.total_veedores || 0);
          this.visualizacionHabilitada =
            res.visualizacion_habilitada === true ||
            res.visualizacion_habilitada === 1;
        },
        error: err => this.mostrarToast(
          err?.error?.mensaje || 'Error al consultar la cámara.',
          'danger'
        )
      });
  }

  // GUARDAR ENLACE CLOUDFLARE
  guardarConfiguracion(): void {
    if (!this.idAdministrador || this.cargando) return;

    const url = this.nuevaUrl.trim().replace(/\/+$/, '');

    try {
      const direccion = new URL(url);

      if (
        direccion.protocol !== 'https:' ||
        direccion.pathname !== '/' ||
        direccion.search ||
        direccion.hash ||
        direccion.username ||
        direccion.password
      ) {
        throw new Error('URL inválida');
      }
    } catch {
      this.mostrarToast('Ingresa una dirección HTTPS válida.', 'warning');
      return;
    }

    this.cargando = true;

    this.authService
      .guardarUrlCamara(this.idAdministrador, url)
      .pipe(finalize(() => this.cargando = false))
      .subscribe({
        next: res => {
          if (res?.estado !== 1) {
            this.mostrarToast(res?.mensaje || 'Error al guardar.', 'danger');
            return;
          }

          this.nuevaUrl = '';
          this.cargarConfiguracionActual();
          this.mostrarToast('Enlace de cámara guardado.', 'success');
        },
        error: err => this.mostrarToast(
          err?.error?.mensaje || 'No se pudo guardar el enlace.',
          'danger'
        )
      });
  }

  // CONTROL DE VISUALIZACIÓN
  cambiarVisualizacion(habilitada: boolean): void {
    if (!this.idAdministrador || !this.urlActual || this.cargandoPermiso) {
      return;
    }

    this.cargandoPermiso = true;

    this.authService
      .cambiarVisualizacionCamara(this.idAdministrador, habilitada)
      .pipe(finalize(() => this.cargandoPermiso = false))
      .subscribe({
        next: res => {
          if (res?.estado !== 1) {
            this.mostrarToast(
              res?.mensaje || 'No se pudo cambiar el permiso.',
              'danger'
            );
            return;
          }

          this.visualizacionHabilitada = habilitada;

          this.mostrarToast(
            habilitada
              ? 'Visualización habilitada para los veedores.'
              : 'Visualización deshabilitada para los veedores.',
            'success'
          );
        },
        error: err => this.mostrarToast(
          err?.error?.mensaje || 'Error al actualizar el permiso.',
          'danger'
        )
      });
  }

  async mostrarToast(mensaje: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}

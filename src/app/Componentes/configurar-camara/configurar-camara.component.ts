import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonIcon, ToastController } from '@ionic/angular/standalone';
import { Auth } from '../../servicios/auth';

@Component({
  selector: 'app-configurar-camara',
  templateUrl: './configurar-camara.component.html',
  styleUrls: ['./configurar-camara.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon
  ]
})
export class ConfigurarCamaraComponent implements OnInit {

  urlActual: string | null = null;
  fechaActualizacion: string | null = null;
  nuevaUrl: string = '';
  cargando: boolean = false;
  idAdministrador: number | null = null;

  // Variables para la lista y recuento de veedores
  veedoresVinculados: any[] = [];
  totalVeedores: number = 0;

  constructor(
    private authService: Auth,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.idAdministrador = this.authService.obtenerIdUsuario();
    console.log('🔑 ID Administrador obtenido:', this.idAdministrador);

    if (this.idAdministrador) {
      this.cargarConfiguracionActual();
    }
  }

  cargarConfiguracionActual() {
    if (!this.idAdministrador) return;

    this.authService.obtenerUrlCamaraVinculada(this.idAdministrador)
      .subscribe({
        next: (res) => {
          if (res?.estado === 1) {
            this.urlActual = res.url_camara || null;
            this.fechaActualizacion = res.fecha_actualizacion || null;
            this.veedoresVinculados = res.veedores || [];
            this.totalVeedores = res.total_veedores || 0;
          }
        },
        error: (err) => console.error('Error al cargar configuración:', err)
      });
  }

  guardarConfiguracion() {
    if (!this.idAdministrador) {
      this.idAdministrador = this.authService.obtenerIdUsuario();
      if (!this.idAdministrador) {
        this.mostrarToast('No se identificó al administrador. Inicie sesión nuevamente.', 'danger');
        return;
      }
    }

    if (!this.nuevaUrl.trim()) {
      this.mostrarToast('Ingresa una URL válida.', 'warning');
      return;
    }

    const urlLimpia = this.nuevaUrl.trim().replace(/\/+$/, '');

    if (!urlLimpia.startsWith('https://')) {
      this.mostrarToast('La URL debe comenzar estrictamente con https://', 'warning');
      return;
    }

    this.cargando = true;

    this.authService.guardarUrlCamara(this.idAdministrador, urlLimpia)
      .subscribe({
        next: (res) => {
          this.cargando = false;
          if (res?.estado === 1) {
            this.urlActual = urlLimpia;
            this.fechaActualizacion = new Date().toLocaleString('es-EC');
            this.nuevaUrl = '';
            this.mostrarToast(`✅ Cámara habilitada para tus ${this.totalVeedores} veedores.`, 'success');
          } else {
            this.mostrarToast(res?.mensaje || 'Error al guardar.', 'danger');
          }
        },
        error: (err) => {
          this.cargando = false;
          console.error('Error al guardar:', err);
          const msg = err.error?.mensaje || 'Error de comunicación con el servidor.';
          this.mostrarToast(`❌ ${msg}`, 'danger');
        }
      });
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
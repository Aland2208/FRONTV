import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IonButton, IonIcon, IonToggle, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  videocamOutline, eyeOutline, informationCircleOutline, peopleOutline,
  personOutline, linkOutline, cloudUploadOutline, terminalOutline,
  copyOutline, checkmarkOutline
} from 'ionicons/icons';
import { finalize } from 'rxjs';
import { Auth } from '../../servicios/auth';

interface VeedorCamara {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  estado: number;
  visualizacion_habilitada: boolean;
}

@Component({
  selector: 'app-configurar-camara',
  templateUrl: './configurar-camara.component.html',
  styleUrls: ['./configurar-camara.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonButton, IonIcon, IonToggle]
})
export class ConfigurarCamaraComponent implements OnInit, OnDestroy {
  urlActual: string | null = null;
  fechaActualizacion: string | null = null;
  nuevaUrl = '';
  cargando = false;
  cargandoConfiguracion = false;
  idAdministrador: number | null = null;
  veedoresVinculados: VeedorCamara[] = [];
  totalVeedores = 0;
  cargandoPermisos: Record<number, boolean> = {};

  comandoCloudflare = 'cloudflared tunnel --url http://localhost:5000';
  comandoCopiado = false;

  estadoConexion: 'verificando' | 'conectada' | 'desconectada' = 'verificando';
  camaraOperativa = false;
  private intervaloConexion?: ReturnType<typeof setInterval>;
  private verificandoConexion = false;

  constructor(
    private authService: Auth,
    private toastCtrl: ToastController,
    private http: HttpClient
  ) {
    addIcons({
      videocamOutline, eyeOutline, informationCircleOutline, peopleOutline,
      personOutline, linkOutline, cloudUploadOutline, terminalOutline,
      copyOutline, checkmarkOutline
    });
  }

  ngOnInit(): void {
    this.idAdministrador = this.authService.obtenerIdUsuario();
    this.cargarConfiguracionActual();
  }

  cargarConfiguracionActual(): void {
    if (!this.idAdministrador) return;
    this.cargandoConfiguracion = true;

    this.authService.obtenerUrlCamaraVinculada(this.idAdministrador)
      .pipe(finalize(() => this.cargandoConfiguracion = false))
      .subscribe({
        next: (res: any) => {
          if (res?.estado !== 1) {
            this.estadoConexion = 'desconectada';
            return;
          }

          const urlAnterior = this.urlActual;
          this.urlActual = res.url_camara || null;
          this.fechaActualizacion = res.fecha_actualizacion || null;
          this.veedoresVinculados = Array.isArray(res.veedores) ? res.veedores.map((veedor: any) => ({
            ...veedor,
            id_usuario: Number(veedor.id_usuario),
            estado: Number(veedor.estado),
            visualizacion_habilitada: [true, 1, '1'].includes(veedor.visualizacion_habilitada)
          })) : [];
          this.totalVeedores = Number(res.total_veedores ?? this.veedoresVinculados.length);

          if (urlAnterior !== this.urlActual) this.estadoConexion = 'verificando';
          this.iniciarMonitoreoConexion();
        },
        error: () => {
          this.estadoConexion = 'desconectada';
          this.mostrarToast('No se pudo consultar la configuración.', 'danger');
        }
      });
  }

  iniciarMonitoreoConexion(): void {
    if (this.intervaloConexion) clearInterval(this.intervaloConexion);
    this.verificarConexion();
    this.intervaloConexion = setInterval(() => this.verificarConexion(), 5000);
  }

  verificarConexion(): void {
    if (!this.urlActual) {
      this.estadoConexion = 'desconectada';
      this.camaraOperativa = false;
      return;
    }

    if (this.verificandoConexion) return;
    this.verificandoConexion = true;

    const token = this.authService.obtenerToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});

    this.http.get<any>(`${this.urlActual}/api-local/estado`, {
      headers,
      timeout: 5000
    }).subscribe({
      next: (res) => {
        this.verificandoConexion = false;
        this.camaraOperativa = [true, 1, '1'].includes(res?.camara_operativa);
        this.estadoConexion = res?.estado === 1 && this.camaraOperativa ? 'conectada' : 'desconectada';
      },
      error: () => {
        this.verificandoConexion = false;
        this.camaraOperativa = false;
        this.estadoConexion = 'desconectada';
      }
    });
  }

  guardarConfiguracion(): void {
    if (!this.idAdministrador || this.cargando) return;
    const url = this.nuevaUrl.trim().replace(/\/+$/, '');

    try {
      const direccion = new URL(url);
      if (direccion.protocol !== 'https:' || direccion.pathname !== '/' ||
        direccion.search || direccion.hash || direccion.username || direccion.password) {
        throw new Error('URL inválida');
      }
    } catch {
      this.mostrarToast('Ingresa una dirección HTTPS válida.', 'warning');
      return;
    }

    this.cargando = true;
    this.authService.guardarUrlCamara(this.idAdministrador, url)
      .pipe(finalize(() => this.cargando = false))
      .subscribe({
        next: (res: any) => {
          if (res?.estado !== 1) {
            this.mostrarToast(res?.mensaje || 'No se pudo guardar el enlace.', 'danger');
            return;
          }

          this.nuevaUrl = '';
          this.cargarConfiguracionActual();
          this.mostrarToast('Enlace de cámara guardado.', 'success');
        },
        error: (err: any) => this.mostrarToast(err?.error?.mensaje || 'Error al guardar el enlace.', 'danger')
      });
  }

  cambiarVisualizacion(veedor: VeedorCamara, habilitada: boolean): void {
    if (!this.idAdministrador || !this.urlActual || this.cargandoPermisos[veedor.id_usuario]) return;
    if (veedor.visualizacion_habilitada === habilitada) return;

    const permisoAnterior = veedor.visualizacion_habilitada;
    this.cargandoPermisos[veedor.id_usuario] = true;

    this.authService.cambiarVisualizacionCamara(this.idAdministrador, veedor.id_usuario, habilitada)
      .pipe(finalize(() => this.cargandoPermisos[veedor.id_usuario] = false))
      .subscribe({
        next: (res: any) => {
          if (res?.estado !== 1) {
            veedor.visualizacion_habilitada = permisoAnterior;
            this.mostrarToast(res?.mensaje || 'No se pudo cambiar el permiso.', 'danger');
            return;
          }

          veedor.visualizacion_habilitada = habilitada;
          this.mostrarToast(habilitada
            ? `Visualización habilitada para ${veedor.nombre}.`
            : `Visualización deshabilitada para ${veedor.nombre}.`, 'success');
        },
        error: (err: any) => {
          veedor.visualizacion_habilitada = permisoAnterior;
          this.mostrarToast(err?.error?.mensaje || 'Error al actualizar el permiso.', 'danger');
        }
      });
  }

  async copiarComandoCloudflare(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.comandoCloudflare);
      this.comandoCopiado = true;
      this.mostrarToast('Comando copiado.', 'success');
      setTimeout(() => this.comandoCopiado = false, 2000);
    } catch {
      this.mostrarToast('No se pudo copiar el comando.', 'warning');
    }
  }

  async mostrarToast(mensaje: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 3000, color, position: 'bottom' });
    await toast.present();
  }

  ngOnDestroy(): void {
    if (this.intervaloConexion) clearInterval(this.intervaloConexion);
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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

  // URL del backend desplegado en Render (o localhost si pruebas en local)
  private readonly BACKEND_URL = 'https://veedores.onrender.com';

  urlActual: string | null = null;
  fechaActualizacion: string | null = null;
  nuevaUrl: string = '';
  cargando: boolean = false;
  idAdministrador: number | null = null;

  constructor(
    private http: HttpClient,
    private authService: Auth,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.idAdministrador = this.authService.obtenerIdUsuario();
    if (this.idAdministrador) {
      this.cargarConfiguracionActual();
    }
  }

  cargarConfiguracionActual() {
    if (!this.idAdministrador) return;

    this.http.get<any>(`${this.BACKEND_URL}/config/url-camara/${this.idAdministrador}`)
      .subscribe({
        next: (res) => {
          if (res?.estado === 1 && res.url_camara) {
            this.urlActual = res.url_camara;
            this.fechaActualizacion = res.fecha_actualizacion;
          }
        },
        error: (err) => console.error('Error al cargar configuración:', err)
      });
  }

  guardarConfiguracion() {
    if (!this.nuevaUrl.trim()) {
      this.mostrarToast('Ingresa una URL válida', 'warning');
      return;
    }

    let urlLimpia = this.nuevaUrl.trim().replace(/\/+$/, '');

    if (!urlLimpia.startsWith('https://')) {
      this.mostrarToast('La URL debe comenzar estrictamente con https://', 'warning');
      return;
    }

    this.cargando = true;

    const payload = {
      id_administrador: this.idAdministrador,
      url_camara: urlLimpia
    };

    this.http.post<any>(`${this.BACKEND_URL}/config/url-camara`, payload)
      .subscribe({
        next: (res) => {
          this.cargando = false;
          if (res?.estado === 1) {
            this.urlActual = urlLimpia;
            this.nuevaUrl = '';
            this.mostrarToast('✅ Cámara habilitada para todos los veedores.', 'success');
          } else {
            this.mostrarToast(res?.mensaje || 'Error al guardar.', 'danger');
          }
        },
        error: (err) => {
          this.cargando = false;
          console.error('Error al guardar:', err);
          this.mostrarToast('❌ Error de comunicación con el servidor.', 'danger');
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
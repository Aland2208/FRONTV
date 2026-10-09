import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import {
  IonButton,
  IonIcon,
  IonSpinner
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  cameraOutline,
  warningOutline,
  checkmarkCircleOutline,
  checkmarkDoneCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';

import { BalanzaS } from '../../servicios/balanza-s';
import { SocketS } from '../../servicios/socket-s';
import { Auth } from '../../servicios/auth';

@Component({
  selector: 'app-camara',
  templateUrl: './camara.component.html',
  styleUrls: ['./camara.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon,
    IonSpinner
  ]
})
export class CamaraComponent implements OnInit, OnDestroy {

  PYTHON_API: string = '';
  urlCamara: string = '';
  camaraConectada: boolean = false;
  mensajeEstadoCamara: string = 'Conectando con la cámara...';
  procesandoIA: boolean = false;

  // ==========================================
  // MODAL DE CONFIRMACIÓN
  // ==========================================
  mostrarModalVerificacion: boolean = false;
  datosPendientesVerificacion: {
    id_especie: number;
    especie: string;
    peso: number;
    imagen_url: string;
    porcentaje: number;
  } | null = null;

  // ==========================================
  // BALANZA Y PRUEBA
  // ==========================================
  modoPruebaSinBalanza = true;
  pesoPrueba = 250.00;
  peso: number = 0;
  fecha: string = '';
  conexion = false;
  mensaje = '';
  mostrarMensaje = false;
  realizandoTara = false;

  ultimoResultado: {
    especie: string;
    peso: number;
    porcentaje: number;
    hora: string;
    id: number;
    imagen_url?: string;
  } | null = null;

  private temporizadorConexion: any;
  private temporizadorMensaje: any;
  private intervaloMonitorCamara: any;

  constructor(
    private balanzaService: BalanzaS,
    private socketService: SocketS,
    private http: HttpClient,
    private authService: Auth
  ) {
    // Registrar explícitamente los iconos de Ionic para prevenir advertencias en la consola
    addIcons({
      cameraOutline,
      warningOutline,
      checkmarkCircleOutline,
      checkmarkDoneCircleOutline,
      closeCircleOutline
    });
  }

  ngOnInit() {
    this.cargarUrlCamaraAsignada();
    this.peso = 0;
    this.fecha = '';

    this.socketService.conectado(() => {
      console.log('🔌 Socket balanza conectado');
    });

    this.socketService.desconectado(() => {
      if (!this.modoPruebaSinBalanza) {
        this.conexion = false;
        this.peso = 0;
        this.fecha = '';
      }
    });

    this.socketService.escucharPeso((data) => {
      if (this.modoPruebaSinBalanza) return;
      this.peso = Number(data.peso);
      this.fecha = data.fecha_hora;
      this.conexion = true;

      clearTimeout(this.temporizadorConexion);
      this.temporizadorConexion = setTimeout(() => {
        if (!this.realizandoTara) {
          this.conexion = false;
          this.peso = 0;
          this.fecha = '';
        }
      }, 2000);
    });

    this.socketService.escucharGuardado(() => {
      if (!this.modoPruebaSinBalanza) {
        this.mostrarAlerta('✅ Peso guardado correctamente');
      }
    });

    this.socketService.escucharTara(() => {
      if (this.modoPruebaSinBalanza) return;
      this.realizandoTara = true;
      this.mostrarAlerta('⚖️ Tara realizada correctamente');
      setTimeout(() => {
        this.realizandoTara = false;
      }, 2500);
    });
  }

  cargarUrlCamaraAsignada() {
    const idUsuario = this.authService.obtenerIdUsuario();
    if (!idUsuario) {
      this.desconectarCamara('No se identificó la sesión del usuario.');
      return;
    }

    this.authService.obtenerUrlCamaraVinculada(idUsuario).subscribe({
      next: (res) => {
        if (res?.estado === 1 && res.url_camara) {
          this.PYTHON_API = res.url_camara;
          this.urlCamara = `${this.PYTHON_API}/video_feed`;
          this.camaraConectada = true;
          this.iniciarMonitoreoConexion();
        } else {
          this.desconectarCamara('El administrador aún no ha habilitado la cámara.');
        }
      },
      error: () => {
        this.desconectarCamara('Error al consultar el servidor.');
      }
    });
  }

  iniciarMonitoreoConexion() {
    clearInterval(this.intervaloMonitorCamara);

    this.intervaloMonitorCamara = setInterval(() => {
      if (!this.PYTHON_API) return;

      this.http.get<any>(`${this.PYTHON_API}/api-local/estado`).subscribe({
        next: (estado) => {
          if (estado?.estado === 1) {
            if (!this.camaraConectada) {
              this.camaraConectada = true;
              this.urlCamara = `${this.PYTHON_API}/video_feed?t=${Date.now()}`;
            }
          } else {
            this.desconectarCamara('Cámara detenida por el sistema.');
          }
        },
        error: () => {
          this.desconectarCamara('Transmisión finalizada o túnel desconectado.');
        }
      });
    }, 3000);
  }

  desconectarCamara(motivo: string) {
    this.camaraConectada = false;
    this.urlCamara = '';
    this.mensajeEstadoCamara = motivo;
  }

  alCargarCamara() {
    this.camaraConectada = true;
  }

  errorCamara() {
    this.desconectarCamara('Error al cargar la transmisión de video.');
  }

  // ==========================================
  // DISPARO DE INFERENCIA
  // ==========================================
  guardarCapturaWeb() {
    if (!this.camaraConectada || !this.PYTHON_API) {
      this.mostrarAlerta('⚠️ La cámara no está transmitiendo en vivo.');
      return;
    }

    const pesoRegistro = this.modoPruebaSinBalanza ? this.pesoPrueba : this.peso;

    if (!this.modoPruebaSinBalanza && pesoRegistro <= 0) {
      this.mostrarAlerta('⚠️ No hay peso válido en la balanza para registrar.');
      return;
    }

    this.procesandoIA = true;
    this.mostrarAlerta('⏳ Procesando captura con IA...');

    this.http.post<any>(`${this.PYTHON_API}/api-local/subir-cloudinary`, {}).subscribe({
      next: (resPython) => {
        this.procesandoIA = false;
        const idEspecie = Number(resPython.id_deteccion);
        const especie = resPython.especie;
        const imagenUrl = resPython.imagen_url;
        const porcentaje = Number(resPython.porcentaje);

        if (!idEspecie || !imagenUrl || Number.isNaN(porcentaje)) {
          this.mostrarAlerta('❌ Python no devolvió los datos requeridos.');
          return;
        }

        // Abrir el modal con diseño de VIGÍA
        this.datosPendientesVerificacion = {
          id_especie: idEspecie,
          especie: especie,
          peso: pesoRegistro,
          imagen_url: imagenUrl,
          porcentaje: porcentaje
        };
        this.mostrarModalVerificacion = true;
      },
      error: (err) => {
        this.procesandoIA = false;
        console.error(err);
        this.mostrarAlerta('❌ Error de comunicación con el motor de IA.');
      }
    });
  }

  descartarCapturaModal() {
    this.mostrarModalVerificacion = false;
    this.datosPendientesVerificacion = null;
    this.mostrarAlerta('↩️ Captura descartada. Puedes reintentar.');
  }

  confirmarCapturaModal() {
    if (!this.datosPendientesVerificacion) return;

    const idUsuario = this.authService.obtenerIdUsuario();
    if (!idUsuario) {
      this.mostrarAlerta('❌ No se pudo identificar al usuario.');
      return;
    }

    const datos = {
      id_especie: this.datosPendientesVerificacion.id_especie,
      id_usuario: idUsuario,
      peso: this.datosPendientesVerificacion.peso,
      imagen_url: this.datosPendientesVerificacion.imagen_url,
      porcentaje: this.datosPendientesVerificacion.porcentaje
    };

    const respaldoVisual = { ...this.datosPendientesVerificacion };
    this.mostrarModalVerificacion = false;
    this.datosPendientesVerificacion = null;

    this.balanzaService.registrarCaptura(datos).subscribe({
      next: () => {
        this.ultimoResultado = {
          especie: respaldoVisual.especie,
          peso: respaldoVisual.peso,
          porcentaje: respaldoVisual.porcentaje,
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          id: respaldoVisual.id_especie,
          imagen_url: respaldoVisual.imagen_url
        };
        this.mostrarAlerta(`✅ Captura registrada (${respaldoVisual.especie})`);
      },
      error: (err) => {
        this.mostrarAlerta(err.error?.mensaje || '❌ Error al guardar en base de datos.');
      }
    });
  }

  mostrarAlerta(texto: string) {
    this.mensaje = texto;
    this.mostrarMensaje = true;
    clearTimeout(this.temporizadorMensaje);
    this.temporizadorMensaje = setTimeout(() => {
      this.mostrarMensaje = false;
    }, 3000);
  }

  ngOnDestroy() {
    clearInterval(this.intervaloMonitorCamara);
    clearTimeout(this.temporizadorConexion);
    clearTimeout(this.temporizadorMensaje);
    this.socketService.desconectar();
  }
}
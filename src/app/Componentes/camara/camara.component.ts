import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import {
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

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
    IonIcon
  ]
})
export class CamaraComponent implements OnInit, OnDestroy {

  PYTHON_API: string = '';
  urlCamara: string = '';
  camaraConectada: boolean = false;
  mensajeEstadoCamara: string = 'Conectando con la cámara...';

  // ==========================================
  // MODO PRUEBA SIN BALANZA
  // ==========================================
  modoPruebaSinBalanza = true;
  pesoPrueba = 250.00;

  // ==========================================
  // VARIABLES BALANZA
  // ==========================================
  peso: number = 0;
  fecha: string = '';
  conexion = false;
  mensaje = '';
  mostrarMensaje = false;
  realizandoTara = false;

  // ==========================================
  // ÚLTIMO RESULTADO
  // ==========================================
  ultimoResultado: {
    especie: string;
    peso: number;
    porcentaje: number;
    hora: string;
    id: number;
    imagen_url?: string;
  } | null = null;

  // ==========================================
  // TEMPORIZADORES
  // ==========================================
  private temporizadorConexion: any;
  private temporizadorMensaje: any;
  private intervaloMonitorCamara: any;

  constructor(
    private balanzaService: BalanzaS,
    private socketService: SocketS,
    private http: HttpClient,
    private authService: Auth
  ) { }

  ngOnInit() {
    this.cargarUrlCamaraAsignada();

    this.peso = 0;
    this.fecha = '';

    if (this.modoPruebaSinBalanza) {
      console.warn('🧪 MODO PRUEBA SIN BALANZA ACTIVADO');
      console.warn(`⚖️ Peso simulado: ${this.pesoPrueba} g`);
    }

    // Sockets Balanza
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

  // ==========================================
  // CÁMARA: CARGAR Y VIGILAR ESTADO
  // ==========================================
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
  // GUARDAR CAPTURA CON VERIFICACIÓN PREVIA
  // ==========================================
  guardarCapturaWeb() {
    if (!this.camaraConectada || !this.PYTHON_API) {
      this.mostrarAlerta('⚠️ La cámara no está transmitiendo en vivo.');
      return;
    }

    const pesoRegistro = this.modoPruebaSinBalanza ? this.pesoPrueba : this.peso;

    if (!this.modoPruebaSinBalanza && pesoRegistro <= 0) {
      this.mostrarAlerta('⚠️ No hay peso válido en la balanza para guardar');
      return;
    }

    this.mostrarAlerta('⏳ Procesando captura con IA...');

    // 1. Obtener predicción de Python sin guardar todavía en BD
    this.http.post<any>(`${this.PYTHON_API}/api-local/subir-cloudinary`, {}).subscribe({
      next: (resPython) => {
        const idEspecieDetectada = Number(resPython.id_deteccion);
        const especieDetectada = resPython.especie;
        const imagenUrlCloudinary = resPython.imagen_url;
        const porcentajeDeteccion = Number(resPython.porcentaje);

        if (!idEspecieDetectada || !imagenUrlCloudinary || Number.isNaN(porcentajeDeteccion)) {
          this.mostrarAlerta('❌ Python no devolvió los datos necesarios');
          return;
        }

        // 2. VENTANA DE VERIFICACIÓN / CONFIRMACIÓN
        const confirmacion = confirm(
          `🔍 VERIFICACIÓN DE CAPTURA:\n\n` +
          `• Especie: ${especieDetectada} (${porcentajeDeteccion.toFixed(1)}%)\n` +
          `• Peso balanza: ${pesoRegistro.toFixed(2)} g\n\n` +
          `¿Los datos son correctos para registrarlos en la faena?`
        );

        if (!confirmacion) {
          this.mostrarAlerta('↩️ Captura descartada. Puedes reintentar.');
          return;
        }

        // 3. Si confirma, se inserta en MySQL
        const idUsuario = this.authService.obtenerIdUsuario();
        if (!idUsuario) {
          this.mostrarAlerta('❌ No se pudo identificar al usuario');
          return;
        }

        const datosCaptura = {
          id_especie: idEspecieDetectada,
          id_usuario: idUsuario,
          peso: pesoRegistro,
          imagen_url: imagenUrlCloudinary,
          porcentaje: porcentajeDeteccion
        };

        this.balanzaService.registrarCaptura(datosCaptura).subscribe({
          next: () => {
            this.ultimoResultado = {
              especie: especieDetectada,
              peso: pesoRegistro,
              porcentaje: porcentajeDeteccion,
              hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              id: idEspecieDetectada,
              imagen_url: imagenUrlCloudinary
            };
            this.mostrarAlerta(`✅ Captura confirmada y registrada (${especieDetectada})`);
          },
          error: (err) => {
            this.mostrarAlerta(err.error?.mensaje ? `❌ ${err.error.mensaje}` : '❌ Error al guardar en base de datos');
          }
        });
      },
      error: (err) => {
        this.mostrarAlerta(err.error?.mensaje ? `⚠️ ${err.error.mensaje}` : '❌ Error al comunicarse con Python');
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

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cameraOutline, warningOutline, checkmarkCircleOutline,
  checkmarkDoneCircleOutline, closeCircleOutline,
  lockClosedOutline, syncOutline
} from 'ionicons/icons';
import { BalanzaS } from '../../servicios/balanza-s';
import { SocketS } from '../../servicios/socket-s';
import { Auth } from '../../servicios/auth';

@Component({
  selector: 'app-camara',
  templateUrl: './camara.component.html',
  styleUrls: ['./camara.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, IonSpinner]
})
export class CamaraComponent implements OnInit, OnDestroy {
  PYTHON_API = '';
  urlCamara = '';
  camaraConectada = false;
  visualizacionPermitida = false;
  camaraOperativa = false;
  servidorCamaraResponde = false;

  procesandoIA = false;
  mostrarModalVerificacion = false;
  datosPendientesVerificacion: {
    id_especie: number;
    especie: string;
    peso: number;
    imagen_url: string;
    porcentaje: number;
  } | null = null;

  modoPruebaSinBalanza = true;
  pesoPrueba = 250;
  peso = 0;
  fecha = '';
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

  private comprobandoEstado = false;
  private destruido = false;
  private ultimoIntentoVideo = 0;
  private temporizadorConexion: any;
  private temporizadorMensaje: any;
  private intervaloMonitorCamara: any;
  private controladorVideo?: AbortController;
  private urlFrameActual?: string;

  constructor(
    private balanzaService: BalanzaS,
    private socketService: SocketS,
    private http: HttpClient,
    private authService: Auth
  ) {
    addIcons({
      cameraOutline, warningOutline, checkmarkCircleOutline,
      checkmarkDoneCircleOutline, closeCircleOutline,
      lockClosedOutline, syncOutline
    });
  }

  ngOnInit(): void {
    this.destruido = false;
    this.peso = 0;
    this.fecha = '';
    this.cargarUrlCamaraAsignada();

    this.socketService.conectado(() => { });
    this.socketService.desconectado(() => {
      if (!this.modoPruebaSinBalanza) {
        this.conexion = false;
        this.peso = 0;
        this.fecha = '';
      }
    });

    this.socketService.escucharPeso((data: any) => {
      if (this.modoPruebaSinBalanza) return;
      this.peso = Number(data.peso);
      this.fecha = data.fecha_hora;
      this.conexion = true;
      clearTimeout(this.temporizadorConexion);
      this.temporizadorConexion = setTimeout(() => {
        if (!this.realizandoTara && !this.destruido) {
          this.conexion = false;
          this.peso = 0;
          this.fecha = '';
        }
      }, 2000);
    });

    this.socketService.escucharGuardado(() => {
      if (!this.modoPruebaSinBalanza) this.mostrarAlerta('Peso guardado correctamente.');
    });

    this.socketService.escucharTara(() => {
      if (this.modoPruebaSinBalanza) return;
      this.realizandoTara = true;
      this.mostrarAlerta('Tara realizada correctamente.');
      setTimeout(() => {
        if (!this.destruido) this.realizandoTara = false;
      }, 2500);
    });
  }

  cargarUrlCamaraAsignada(): void {
    const idUsuario = this.authService.obtenerIdUsuario();
    if (!idUsuario) {
      this.desconectarCamara();
      return;
    }

    this.authService.obtenerUrlCamaraVinculada(idUsuario).subscribe({
      next: (res: any) => {
        if (this.destruido) return;
        if (res?.estado === 1 && res.url_camara) {
          const nuevaUrl = String(res.url_camara).trim().replace(/\/+$/, '');
          if (nuevaUrl !== this.PYTHON_API) this.detenerSoloVideo();
          this.PYTHON_API = nuevaUrl;
          this.iniciarMonitoreoConexion();
          this.consultarEstadoCamara();
        } else {
          this.desconectarCamara();
        }
      },
      error: () => {
        if (!this.destruido) this.desconectarCamara();
      }
    });
  }

  iniciarMonitoreoConexion(): void {
    clearInterval(this.intervaloMonitorCamara);
    this.intervaloMonitorCamara = setInterval(() => this.consultarEstadoCamara(), 3000);
  }

  private consultarEstadoCamara(): void {
    if (!this.PYTHON_API || this.comprobandoEstado || this.destruido) return;
    const token = this.authService.obtenerToken();

    if (!token) {
      this.desconectarCamara();
      return;
    }

    this.comprobandoEstado = true;
    this.http.get<any>(`${this.PYTHON_API}/api-local/estado`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      timeout: 8000
    }).subscribe({
      next: (estado) => {
        this.comprobandoEstado = false;
        if (this.destruido) return;

        if (estado?.estado !== 1) {
          this.desconectarCamara();
          return;
        }

        this.servidorCamaraResponde = true;
        this.camaraOperativa = [true, 1, '1'].includes(estado.camara_operativa);
        this.visualizacionPermitida = [true, 1, '1'].includes(estado.visualizacion_habilitada);

        if (!this.camaraOperativa || !this.visualizacionPermitida) {
          this.detenerSoloVideo();
        } else if (!this.camaraConectada && !this.controladorVideo &&
          Date.now() - this.ultimoIntentoVideo >= 5000) {
          this.iniciarTransmisionCamara();
        }
      },
      error: () => {
        this.comprobandoEstado = false;
        if (!this.destruido) this.desconectarCamara();
      }
    });
  }

  private detenerSoloVideo(): void {
    this.controladorVideo?.abort();
    this.controladorVideo = undefined;
    this.limpiarFrameActual();
    this.camaraConectada = false;
    this.urlCamara = '';
  }

  desconectarCamara(): void {
    this.detenerSoloVideo();
    this.camaraOperativa = false;
    this.visualizacionPermitida = false;
    this.servidorCamaraResponde = false;
  }

  private iniciarTransmisionCamara(): void {
    const token = this.authService.obtenerToken();
    if (!token || !this.PYTHON_API || !this.camaraOperativa || !this.visualizacionPermitida) return;

    this.controladorVideo?.abort();
    const controlador = new AbortController();
    this.controladorVideo = controlador;
    this.ultimoIntentoVideo = Date.now();

    this.httpVideoFeed(`${this.PYTHON_API}/video_feed`, token, controlador.signal)
      .catch((error) => {
        if (controlador.signal.aborted || this.destruido) return;
        console.error('Error en transmisión de cámara:', error);
        this.detenerSoloVideo();
      })
      .finally(() => {
        if (this.controladorVideo === controlador) this.controladorVideo = undefined;
      });
  }

  private async httpVideoFeed(url: string, token: string, signal: AbortSignal): Promise<void> {
    const respuesta = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
      cache: 'no-store'
    });

    if (!respuesta.ok || !respuesta.body) throw new Error(`HTTP ${respuesta.status}`);

    const lector = respuesta.body.getReader();
    const separadorCabecera = new Uint8Array([13, 10, 13, 10]);
    const separadorFrame = new Uint8Array([13, 10, 45, 45, 102, 114, 97, 109, 101, 13, 10]);
    let buffer = new Uint8Array(0);

    try {
      while (!signal.aborted) {
        const { done, value } = await lector.read();
        if (done) break;

        const siguiente = new Uint8Array(buffer.length + value.length);
        siguiente.set(buffer);
        siguiente.set(value, buffer.length);
        buffer = siguiente;

        while (true) {
          const finCabecera = this.buscarBytes(buffer, separadorCabecera);
          if (finCabecera < 0) break;

          const inicioFrame = finCabecera + separadorCabecera.length;
          const finFrame = this.buscarBytes(buffer, separadorFrame, inicioFrame);
          if (finFrame < 0) break;

          if (finFrame > inicioFrame && !signal.aborted) {
            this.mostrarFrame(buffer.slice(inicioFrame, finFrame));
          }
          buffer = buffer.slice(finFrame + 2);
        }

        if (buffer.length > 8 * 1024 * 1024) {
          throw new Error('Buffer de video demasiado grande.');
        }
      }
    } finally {
      await lector.cancel().catch(() => { });
    }

    if (!signal.aborted) throw new Error('La transmisión finalizó.');
  }

  private buscarBytes(fuente: Uint8Array, patron: Uint8Array, desde = 0): number {
    for (let inicio = desde; inicio <= fuente.length - patron.length; inicio++) {
      let coincide = true;
      for (let indice = 0; indice < patron.length; indice++) {
        if (fuente[inicio + indice] !== patron[indice]) {
          coincide = false;
          break;
        }
      }
      if (coincide) return inicio;
    }
    return -1;
  }

  private mostrarFrame(datos: Uint8Array): void {
    if (this.destruido || !this.visualizacionPermitida || !this.camaraOperativa) return;

    const bytes = new Uint8Array(new ArrayBuffer(datos.byteLength));
    bytes.set(datos);
    const nuevaUrl = URL.createObjectURL(new Blob([bytes.buffer], { type: 'image/jpeg' }));
    const anterior = this.urlFrameActual;

    this.urlFrameActual = nuevaUrl;
    this.urlCamara = nuevaUrl;
    this.camaraConectada = true;

    if (anterior) setTimeout(() => URL.revokeObjectURL(anterior), 1000);
  }

  private limpiarFrameActual(): void {
    if (this.urlFrameActual) {
      URL.revokeObjectURL(this.urlFrameActual);
      this.urlFrameActual = undefined;
    }
  }

  alCargarCamara(): void {
    if (this.visualizacionPermitida) this.camaraConectada = true;
  }

  errorCamara(): void {
    if (this.destruido) return;
    this.detenerSoloVideo();
  }

  guardarCapturaWeb(): void {
    if (!this.camaraOperativa || !this.PYTHON_API || this.procesandoIA) {
      if (!this.procesandoIA) this.mostrarAlerta('Cámara no disponible.');
      return;
    }

    const pesoRegistro = this.modoPruebaSinBalanza ? this.pesoPrueba : this.peso;
    if (!this.modoPruebaSinBalanza && pesoRegistro <= 0) {
      this.mostrarAlerta('No hay peso válido en la balanza.');
      return;
    }

    const token = this.authService.obtenerToken();
    if (!token) {
      this.mostrarAlerta('La sesión no está disponible.');
      return;
    }

    this.procesandoIA = true;
    this.mostrarAlerta('Procesando captura con IA...');

    this.http.post<any>(`${this.PYTHON_API}/api-local/subir-cloudinary`, {}, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    }).subscribe({
      next: (resPython) => {
        this.procesandoIA = false;
        if (this.destruido) return;

        const idEspecie = Number(resPython.id_deteccion);
        const especie = String(resPython.especie || '');
        const imagenUrl = String(resPython.imagen_url || '');
        const porcentaje = Number(resPython.porcentaje);

        if (!idEspecie || !imagenUrl || !Number.isFinite(porcentaje)) {
          this.mostrarAlerta('No se obtuvieron los datos de la captura.');
          return;
        }

        this.datosPendientesVerificacion = {
          id_especie: idEspecie,
          especie,
          peso: pesoRegistro,
          imagen_url: imagenUrl,
          porcentaje
        };
        this.mostrarModalVerificacion = true;
      },
      error: (err) => {
        this.procesandoIA = false;
        if (this.destruido) return;
        this.mostrarAlerta(err?.error?.mensaje || 'No se pudo procesar la captura.');
      }
    });
  }

  descartarCapturaModal(): void {
    this.mostrarModalVerificacion = false;
    this.datosPendientesVerificacion = null;
    this.mostrarAlerta('Captura descartada. Puedes reintentar.');
  }

  confirmarCapturaModal(): void {
    if (!this.datosPendientesVerificacion) return;
    const idUsuario = this.authService.obtenerIdUsuario();

    if (!idUsuario) {
      this.mostrarAlerta('No se pudo identificar al usuario.');
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
        if (this.destruido) return;
        this.ultimoResultado = {
          especie: respaldoVisual.especie,
          peso: respaldoVisual.peso,
          porcentaje: respaldoVisual.porcentaje,
          hora: new Date().toLocaleTimeString('es-EC', {
            timeZone: 'America/Guayaquil',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }),
          id: respaldoVisual.id_especie,
          imagen_url: respaldoVisual.imagen_url
        };
        this.mostrarAlerta(`Captura registrada (${respaldoVisual.especie})`);
      },
      error: (err) => {
        if (this.destruido) return;
        this.mostrarAlerta(err?.error?.mensaje || 'Error al guardar el registro.');
      }
    });
  }

  mostrarAlerta(texto: string): void {
    this.mensaje = texto;
    this.mostrarMensaje = true;
    clearTimeout(this.temporizadorMensaje);
    this.temporizadorMensaje = setTimeout(() => {
      if (!this.destruido) this.mostrarMensaje = false;
    }, 3000);
  }

  ngOnDestroy(): void {
    this.destruido = true;
    clearInterval(this.intervaloMonitorCamara);
    clearTimeout(this.temporizadorConexion);
    clearTimeout(this.temporizadorMensaje);
    this.detenerSoloVideo();
    this.socketService.desconectar();
  }
}

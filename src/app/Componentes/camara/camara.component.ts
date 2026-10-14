
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';

import {
  cameraOutline,
  warningOutline,
  checkmarkCircleOutline,
  checkmarkDoneCircleOutline,
  closeCircleOutline,
  lockClosedOutline,
  syncOutline
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

  // CAMARA
  PYTHON_API = '';
  urlCamara = '';

  camaraConectada = false;
  visualizacionPermitida = false;
  camaraOperativa = false;
  servidorCamaraResponde = false;

  // CAPTURAS
  procesandoIA = false;
  mostrarModalVerificacion = false;

  datosPendientesVerificacion: {
    id_especie: number;
    especie: string;
    peso: number;
    imagen_url: string;
    porcentaje: number;
  } | null = null;

  // BALANZA ESP32
  modoPruebaSinBalanza = false;
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

  // CONTROL DE CONEXIONES
  private comprobandoEstado = false;
  private buscandoCamara = false;
  private destruido = false;

  private ultimoIntentoVideo = 0;
  private ultimoFrameRecibido = 0;
  private idConsultaCamara = 0;

  private readonly tiempoMaximoSinFrames = 6000;
  private readonly intervaloReconexion = 3000;

  private temporizadorConexion: any;
  private temporizadorMensaje: any;
  private temporizadorTara: any;

  private intervaloMonitorCamara: any;
  private intervaloBuscarCamara: any;
  private intervaloVigilanciaVideo: any;

  private controladorVideo?: AbortController;
  private urlFrameActual?: string;

  constructor(
    private balanzaService: BalanzaS,
    private socketService: SocketS,
    private http: HttpClient,
    private authService: Auth
  ) {
    addIcons({
      cameraOutline,
      warningOutline,
      checkmarkCircleOutline,
      checkmarkDoneCircleOutline,
      closeCircleOutline,
      lockClosedOutline,
      syncOutline
    });
  }

  // ==========================================
  // INICIALIZACION
  // ==========================================

  ngOnInit(): void {
    this.destruido = false;

    this.peso = 0;
    this.fecha = '';
    this.conexion = false;

    // Detectar cuando el usuario sale o regresa a Chrome
    document.addEventListener(
      'visibilitychange',
      this.alCambiarVisibilidad
    );

    // Buscar automaticamente el tunel
    this.cargarUrlCamaraAsignada();

    this.intervaloBuscarCamara = setInterval(() => {
      if (!document.hidden) {
        this.cargarUrlCamaraAsignada();
      }
    }, 3000);

    // Comprobar estado y permisos de la camara
    this.iniciarMonitoreoConexion();

    // Detectar video congelado
    this.intervaloVigilanciaVideo = setInterval(() => {
      this.verificarVideoActivo();
    }, 2000);

    // BALANZA EN TIEMPO REAL
    this.socketService.conectado(this.alConectarSocket);
    this.socketService.desconectado(this.alDesconectarSocket);

    this.socketService.escucharPeso((data: any) => {
      if (this.modoPruebaSinBalanza || this.destruido) {
        return;
      }

      const pesoRecibido = Number(data?.peso);

      if (
        !Number.isFinite(pesoRecibido) ||
        pesoRecibido < 0
      ) {
        return;
      }

      this.peso = pesoRecibido;

      this.fecha = String(
        data?.fecha_hora ||
        new Date().toLocaleString('es-EC', {
          timeZone: 'America/Guayaquil',
          hour12: false
        })
      );

      this.conexion = true;

      clearTimeout(this.temporizadorConexion);

      this.temporizadorConexion = setTimeout(() => {
        if (!this.destruido) {
          this.conexion = false;
          this.peso = 0;
          this.fecha = '';
        }
      }, 5000);
    });

    this.socketService.escucharGuardado(() => {
      if (!this.modoPruebaSinBalanza && !this.destruido) {
        this.mostrarAlerta('Peso guardado correctamente.');
      }
    });

    this.socketService.escucharTara(() => {
      if (this.modoPruebaSinBalanza || this.destruido) {
        return;
      }

      this.realizandoTara = true;
      this.mostrarAlerta('Tara realizada correctamente.');

      clearTimeout(this.temporizadorTara);

      this.temporizadorTara = setTimeout(() => {
        if (!this.destruido) {
          this.realizandoTara = false;
        }
      }, 2500);
    });

    // SocketS se conecta desde su constructor.
  }

  private alConectarSocket = (): void => {
    if (this.destruido) return;
    console.log('Socket.IO conectado');
  };

  private alDesconectarSocket = (): void => {
    if (this.destruido) return;

    this.conexion = false;
    this.peso = 0;
    this.fecha = '';

    clearTimeout(this.temporizadorConexion);
  };

  // ==========================================
  // RECUPERACION AL REGRESAR A CHROME
  // ==========================================

  private alCambiarVisibilidad = (): void => {
    if (this.destruido) return;

    if (document.hidden) {
      console.log('VIGIA en segundo plano');

      // Liberar la transmision mientras Android
      // mantiene la pestaña suspendida.
      this.detenerSoloVideo();
      return;
    }

    console.log('Regresando a VIGIA');

    // Cerrar cualquier transmision anterior
    this.detenerSoloVideo();

    // Permitir un nuevo intento inmediato
    this.ultimoIntentoVideo = 0;
    this.ultimoFrameRecibido = 0;

    // Actualizar URL del tunel
    this.cargarUrlCamaraAsignada();

    // Consultar nuevamente estado y permisos
    this.consultarEstadoCamara();
  };

  // ==========================================
  // DETECCION DE VIDEO CONGELADO
  // ==========================================

  private verificarVideoActivo(): void {
    if (
      this.destruido ||
      document.hidden ||
      !this.PYTHON_API ||
      !this.camaraOperativa ||
      !this.visualizacionPermitida
    ) {
      return;
    }

    const referencia = this.ultimoFrameRecibido ||
      this.ultimoIntentoVideo;

    if (!referencia) {
      this.iniciarTransmisionCamara();
      return;
    }

    const tiempoSinFrames = Date.now() - referencia;

    if (tiempoSinFrames > this.tiempoMaximoSinFrames) {
      console.warn(
        'Video congelado. Intentando recuperar transmision...'
      );

      this.detenerSoloVideo();

      this.ultimoIntentoVideo = 0;
      this.ultimoFrameRecibido = 0;

      this.iniciarTransmisionCamara();
    }
  }

  // ==========================================
  // BUSQUEDA AUTOMATICA DEL TUNEL
  // ==========================================

  cargarUrlCamaraAsignada(): void {
    if (
      this.destruido ||
      document.hidden ||
      this.buscandoCamara
    ) {
      return;
    }

    const idUsuario = this.authService.obtenerIdUsuario();

    if (!idUsuario) {
      this.desconectarCamara();
      return;
    }

    this.buscandoCamara = true;

    const consultaActual = ++this.idConsultaCamara;

    this.authService.obtenerUrlCamaraVinculada(idUsuario)
      .subscribe({
        next: (res: any) => {
          this.buscandoCamara = false;

          if (
            this.destruido ||
            consultaActual !== this.idConsultaCamara
          ) {
            return;
          }

          const nuevaUrl =
            Number(res?.estado) === 1 && res?.url_camara
              ? String(res.url_camara)
                .trim()
                .replace(/\/+$/, '')
              : '';

          if (!nuevaUrl) {
            this.PYTHON_API = '';
            this.desconectarCamara();
            return;
          }

          // Detectar cambios en la URL del tunel
          if (nuevaUrl !== this.PYTHON_API) {
            console.log('Nueva URL de camara detectada');

            this.detenerSoloVideo();

            this.PYTHON_API = nuevaUrl;

            this.ultimoIntentoVideo = 0;
            this.ultimoFrameRecibido = 0;

            this.camaraOperativa = false;
            this.visualizacionPermitida = false;
          }

          this.consultarEstadoCamara();
        },
        error: (error) => {
          this.buscandoCamara = false;

          if (this.destruido) return;

          console.error(
            'Error al consultar camara asignada:',
            error
          );

          // Conservar la URL anterior ante un error temporal
          // del backend para permitir reconexion.
          if (!this.PYTHON_API) {
            this.desconectarCamara();
          }
        }
      });
  }

  // ==========================================
  // MONITOREO DEL ESTADO DE LA CAMARA
  // ==========================================

  iniciarMonitoreoConexion(): void {
    clearInterval(this.intervaloMonitorCamara);

    this.consultarEstadoCamara();

    this.intervaloMonitorCamara = setInterval(() => {
      if (!document.hidden) {
        this.consultarEstadoCamara();
      }
    }, 3000);
  }

  private consultarEstadoCamara(): void {
    if (
      !this.PYTHON_API ||
      this.comprobandoEstado ||
      this.destruido ||
      document.hidden
    ) {
      return;
    }

    const token = this.authService.obtenerToken();

    if (!token) {
      this.desconectarCamara();
      return;
    }

    const urlConsultada = this.PYTHON_API;

    this.comprobandoEstado = true;

    this.http.get<any>(
      `${urlConsultada}/api-local/estado`,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`
        }),
        timeout: 8000
      }
    ).subscribe({
      next: (estado) => {
        this.comprobandoEstado = false;

        if (
          this.destruido ||
          document.hidden ||
          urlConsultada !== this.PYTHON_API
        ) {
          return;
        }

        if (Number(estado?.estado) !== 1) {
          this.desconectarCamara();
          return;
        }

        this.servidorCamaraResponde = true;

        this.camaraOperativa = [
          true,
          1,
          '1'
        ].includes(estado.camara_operativa);

        this.visualizacionPermitida = [
          true,
          1,
          '1'
        ].includes(estado.visualizacion_habilitada);

        if (
          !this.camaraOperativa ||
          !this.visualizacionPermitida
        ) {
          this.detenerSoloVideo();
          return;
        }

        // Iniciar si no existe una transmision activa
        if (
          !this.camaraConectada &&
          !this.controladorVideo &&
          Date.now() - this.ultimoIntentoVideo >=
          this.intervaloReconexion
        ) {
          this.iniciarTransmisionCamara();
        }
      },
      error: (error) => {
        this.comprobandoEstado = false;

        if (
          this.destruido ||
          document.hidden ||
          urlConsultada !== this.PYTHON_API
        ) {
          return;
        }

        console.warn(
          'No se pudo consultar el estado de la camara:',
          error
        );

        // El estado no pudo verificarse.
        this.servidorCamaraResponde = false;
        this.camaraOperativa = false;
        this.visualizacionPermitida = false;

        this.detenerSoloVideo();
      }
    });
  }

  // ==========================================
  // CONTROL DE TRANSMISION
  // ==========================================

  private detenerSoloVideo(): void {
    if (this.controladorVideo) {
      this.controladorVideo.abort();
      this.controladorVideo = undefined;
    }

    this.camaraConectada = false;
    this.urlCamara = '';

    this.limpiarFrameActual();

    this.ultimoFrameRecibido = 0;
  }

  desconectarCamara(): void {
    this.detenerSoloVideo();

    this.camaraOperativa = false;
    this.visualizacionPermitida = false;
    this.servidorCamaraResponde = false;
  }

  private iniciarTransmisionCamara(): void {
    const token = this.authService.obtenerToken();

    if (
      this.destruido ||
      document.hidden ||
      !token ||
      !this.PYTHON_API ||
      !this.camaraOperativa ||
      !this.visualizacionPermitida ||
      this.controladorVideo
    ) {
      return;
    }

    const controlador = new AbortController();

    this.controladorVideo = controlador;
    this.ultimoIntentoVideo = Date.now();
    this.ultimoFrameRecibido = 0;

    console.log('Iniciando transmision de camara');

    this.httpVideoFeed(
      `${this.PYTHON_API}/video_feed`,
      token,
      controlador.signal
    )
      .catch((error) => {
        if (
          controlador.signal.aborted ||
          this.destruido
        ) {
          return;
        }

        console.error(
          'Error en transmision de camara:',
          error
        );

        if (this.controladorVideo === controlador) {
          this.detenerSoloVideo();
        }
      })
      .finally(() => {
        if (this.controladorVideo === controlador) {
          this.controladorVideo = undefined;
        }
      });
  }

  // ==========================================
  // RECEPCION DE VIDEO MJPEG
  // ==========================================

  private async httpVideoFeed(
    url: string,
    token: string,
    signal: AbortSignal
  ): Promise<void> {
    const respuesta = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal,
      cache: 'no-store'
    });

    if (!respuesta.ok || !respuesta.body) {
      throw new Error(
        `No se pudo iniciar video: HTTP ${respuesta.status}`
      );
    }

    const lector = respuesta.body.getReader();

    const separadorCabecera = new Uint8Array([
      13, 10, 13, 10
    ]);

    const separadorFrame = new Uint8Array([
      13, 10, 45, 45, 102, 114, 97,
      109, 101, 13, 10
    ]);

    let buffer = new Uint8Array(0);

    try {
      while (!signal.aborted) {
        const { done, value } = await lector.read();

        if (done) {
          break;
        }

        const siguiente = new Uint8Array(
          buffer.length + value.length
        );

        siguiente.set(buffer);
        siguiente.set(value, buffer.length);

        buffer = siguiente;

        while (!signal.aborted) {
          const finCabecera = this.buscarBytes(
            buffer,
            separadorCabecera
          );

          if (finCabecera < 0) {
            break;
          }

          const inicioFrame =
            finCabecera + separadorCabecera.length;

          const finFrame = this.buscarBytes(
            buffer,
            separadorFrame,
            inicioFrame
          );

          if (finFrame < 0) {
            break;
          }

          if (finFrame > inicioFrame) {
            const datosFrame = buffer.slice(
              inicioFrame,
              finFrame
            );

            this.mostrarFrame(datosFrame);
          }

          buffer = buffer.slice(finFrame + 2);
        }

        if (buffer.length > 8 * 1024 * 1024) {
          throw new Error(
            'El buffer de video supero el tamaño permitido.'
          );
        }
      }
    } finally {
      try {
        await lector.cancel();
      } catch {
        // El lector puede estar cerrado tras abortar.
      }
    }

    if (!signal.aborted) {
      throw new Error(
        'La transmision de video finalizo.'
      );
    }
  }

  private buscarBytes(
    fuente: Uint8Array,
    patron: Uint8Array,
    desde = 0
  ): number {
    for (
      let inicio = desde;
      inicio <= fuente.length - patron.length;
      inicio++
    ) {
      let coincide = true;

      for (
        let indice = 0;
        indice < patron.length;
        indice++
      ) {
        if (
          fuente[inicio + indice] !== patron[indice]
        ) {
          coincide = false;
          break;
        }
      }

      if (coincide) {
        return inicio;
      }
    }

    return -1;
  }

  // ==========================================
  // MOSTRAR FOTOGRAMAS
  // ==========================================

  private mostrarFrame(datos: Uint8Array): void {
    if (
      this.destruido ||
      document.hidden ||
      !this.visualizacionPermitida ||
      !this.camaraOperativa ||
      !this.controladorVideo ||
      this.controladorVideo.signal.aborted
    ) {
      return;
    }

    const bytes = new Uint8Array(
      new ArrayBuffer(datos.byteLength)
    );

    bytes.set(datos);

    const nuevaUrl = URL.createObjectURL(
      new Blob([bytes.buffer], {
        type: 'image/jpeg'
      })
    );

    const urlAnterior = this.urlFrameActual;

    this.urlFrameActual = nuevaUrl;
    this.urlCamara = nuevaUrl;

    this.camaraConectada = true;

    // Registrar llegada del ultimo fotograma
    this.ultimoFrameRecibido = Date.now();

    if (urlAnterior) {
      setTimeout(() => {
        URL.revokeObjectURL(urlAnterior);
      }, 1000);
    }
  }

  private limpiarFrameActual(): void {
    if (this.urlFrameActual) {
      URL.revokeObjectURL(this.urlFrameActual);
      this.urlFrameActual = undefined;
    }
  }

  alCargarCamara(): void {
    // La conexion se confirma al recibir fotogramas,
    // no solamente cuando el elemento IMG carga.
  }

  errorCamara(): void {
    if (this.destruido) return;

    console.warn(
      'Error al mostrar fotograma. Reconectando...'
    );

    this.detenerSoloVideo();
  }

  // ==========================================
  // CAPTURA CON IA Y PESO REAL
  // ==========================================

  guardarCapturaWeb(): void {
    if (
      !this.camaraOperativa ||
      !this.PYTHON_API ||
      this.procesandoIA
    ) {
      if (!this.procesandoIA) {
        this.mostrarAlerta(
          'Camara no disponible.'
        );
      }

      return;
    }

    const pesoRegistro = this.modoPruebaSinBalanza
      ? this.pesoPrueba
      : this.peso;

    if (
      !this.modoPruebaSinBalanza &&
      (!this.conexion || pesoRegistro <= 0)
    ) {
      this.mostrarAlerta(
        'No hay peso valido en la balanza.'
      );

      return;
    }

    const token = this.authService.obtenerToken();

    if (!token) {
      this.mostrarAlerta(
        'La sesion no esta disponible.'
      );

      return;
    }

    this.procesandoIA = true;

    this.mostrarAlerta(
      'Procesando captura con IA...'
    );

    this.http.post<any>(
      `${this.PYTHON_API}/api-local/subir-cloudinary`,
      {},
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      }
    ).subscribe({
      next: (resPython) => {
        this.procesandoIA = false;

        if (this.destruido) {
          return;
        }

        const idEspecie = Number(
          resPython?.id_deteccion
        );

        const especie = String(
          resPython?.especie || ''
        );

        const imagenUrl = String(
          resPython?.imagen_url || ''
        );

        const porcentaje = Number(
          resPython?.porcentaje
        );

        if (
          !idEspecie ||
          !imagenUrl ||
          !Number.isFinite(porcentaje)
        ) {
          this.mostrarAlerta(
            'No se obtuvieron los datos de la captura.'
          );

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
      error: (error) => {
        this.procesandoIA = false;

        if (this.destruido) {
          return;
        }

        console.error(
          'Error al procesar captura:',
          error
        );

        this.mostrarAlerta(
          error?.error?.mensaje ||
          'No se pudo procesar la captura.'
        );
      }
    });
  }

  // ==========================================
  // DESCARTAR CAPTURA
  // ==========================================

  descartarCapturaModal(): void {
    this.mostrarModalVerificacion = false;
    this.datosPendientesVerificacion = null;

    this.mostrarAlerta(
      'Captura descartada. Puedes reintentar.'
    );
  }

  // ==========================================
  // CONFIRMAR Y GUARDAR CAPTURA
  // ==========================================

  confirmarCapturaModal(): void {
    if (!this.datosPendientesVerificacion) {
      return;
    }

    const idUsuario =
      this.authService.obtenerIdUsuario();

    if (!idUsuario) {
      this.mostrarAlerta(
        'No se pudo identificar al usuario.'
      );

      return;
    }

    const datos = {
      id_especie:
        this.datosPendientesVerificacion.id_especie,

      id_usuario: idUsuario,

      peso:
        this.datosPendientesVerificacion.peso,

      imagen_url:
        this.datosPendientesVerificacion.imagen_url,

      porcentaje:
        this.datosPendientesVerificacion.porcentaje
    };

    const respaldoVisual = {
      ...this.datosPendientesVerificacion
    };

    this.mostrarModalVerificacion = false;
    this.datosPendientesVerificacion = null;

    this.balanzaService.registrarCaptura(datos)
      .subscribe({
        next: () => {
          if (this.destruido) {
            return;
          }

          this.ultimoResultado = {
            especie: respaldoVisual.especie,
            peso: respaldoVisual.peso,
            porcentaje: respaldoVisual.porcentaje,

            hora: new Date().toLocaleTimeString(
              'es-EC',
              {
                timeZone: 'America/Guayaquil',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }
            ),

            id: respaldoVisual.id_especie,
            imagen_url: respaldoVisual.imagen_url
          };

          this.mostrarAlerta(
            `Captura registrada (${respaldoVisual.especie})`
          );
        },
        error: (error) => {
          if (this.destruido) {
            return;
          }

          console.error(
            'Error al guardar captura:',
            error
          );

          this.mostrarAlerta(
            error?.error?.mensaje ||
            'Error al guardar el registro.'
          );
        }
      });
  }

  // ==========================================
  // MENSAJES
  // ==========================================

  mostrarAlerta(texto: string): void {
    this.mensaje = texto;
    this.mostrarMensaje = true;

    clearTimeout(this.temporizadorMensaje);

    this.temporizadorMensaje = setTimeout(() => {
      if (!this.destruido) {
        this.mostrarMensaje = false;
      }
    }, 3000);
  }

  // ==========================================
  // LIMPIEZA
  // ==========================================

  ngOnDestroy(): void {
    this.destruido = true;
    this.idConsultaCamara++;

    document.removeEventListener(
      'visibilitychange',
      this.alCambiarVisibilidad
    );

    clearInterval(this.intervaloBuscarCamara);
    clearInterval(this.intervaloMonitorCamara);
    clearInterval(this.intervaloVigilanciaVideo);

    clearTimeout(this.temporizadorConexion);
    clearTimeout(this.temporizadorMensaje);
    clearTimeout(this.temporizadorTara);

    this.detenerSoloVideo();

    // Quitar los listeners registrados por esta pantalla
    this.socketService.dejarDeEscucharBalanza();
  }
}

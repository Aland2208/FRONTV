import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
  private controladorVideo?: AbortController;
  private urlFrameActual?: string;

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
          this.iniciarTransmisionCamara();
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

      const token = this.authService.obtenerToken();
      if (!token) {
        this.desconectarCamara('La sesión no está disponible. Inicie sesión nuevamente.');
        return;
      }

      this.http.get<any>(`${this.PYTHON_API}/api-local/estado`, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
      }).subscribe({
        next: (estado) => {
          if (estado?.estado !== 1) {
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
    this.controladorVideo?.abort();
    this.controladorVideo=undefined;
    this.limpiarFrameActual();
    this.camaraConectada = false;
    this.urlCamara = '';
    this.mensajeEstadoCamara = motivo;
  }

  private iniciarTransmisionCamara(): void {
    const token = this.authService.obtenerToken();
    if (!token || !this.PYTHON_API) {
      this.desconectarCamara('La sesión no está disponible. Inicie sesión nuevamente.');
      return;
    }

    this.controladorVideo?.abort();
    this.controladorVideo=new AbortController();
    this.httpVideoFeed(
      `${this.PYTHON_API}/video_feed`,
      token,
      this.controladorVideo.signal
    ).catch(() => {
      if (!this.controladorVideo?.signal.aborted) {
        this.desconectarCamara('No se pudo autenticar la transmisión de video.');
      }
    });
  }

  private async httpVideoFeed(
    url: string,
    token: string,
    signal: AbortSignal
  ): Promise<void> {
    const respuesta = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal
    });
    if (!respuesta.ok || !respuesta.body) {
      throw new Error('No se pudo abrir la transmisión de video.');
    }

    const lector=respuesta.body.getReader();
    const separadorCabecera=new Uint8Array([13,10,13,10]);
    const separadorFrame=new Uint8Array([13,10,45,45,102,114,97,109,101,13,10]);
    let buffer=new Uint8Array(0);

    while (!signal.aborted) {
      const {done,value}=await lector.read();
      if (done) break;

      const siguiente=new Uint8Array(buffer.length+value.length);
      siguiente.set(buffer);
      siguiente.set(value,buffer.length);
      buffer=siguiente;

      while (true) {
        const finCabecera=this.buscarBytes(buffer,separadorCabecera);
        if (finCabecera<0) break;

        const inicioFrame=finCabecera+separadorCabecera.length;
        const finFrame=this.buscarBytes(buffer,separadorFrame,inicioFrame);
        if (finFrame<0) break;

        if (finFrame>inicioFrame) {
          const frame=buffer.slice(inicioFrame,finFrame);
          this.mostrarFrame(frame);
        }

        buffer=buffer.slice(finFrame+2);
      }

      if (buffer.length>8*1024*1024) {
        throw new Error('La transmisión de video es inválida.');
      }
    }

    if (!signal.aborted) {
      throw new Error('La transmisión de video finalizó.');
    }
  }

  private buscarBytes(
    fuente:Uint8Array,
    patron:Uint8Array,
    desde=0
  ):number{
    for(let inicio=desde;inicio<=fuente.length-patron.length;inicio++){
      let coincide=true;
      for(let indice=0;indice<patron.length;indice++){
        if(fuente[inicio+indice]!==patron[indice]){
          coincide=false;
          break;
        }
      }
      if(coincide)return inicio;
    }
    return -1;
  }

  private mostrarFrame(datos:Uint8Array):void{
    const copia=new Uint8Array(datos.length);
    copia.set(datos);
    const nuevaUrl=URL.createObjectURL(new Blob([copia],{type:'image/jpeg'}));
    const urlAnterior=this.urlFrameActual;
    this.urlFrameActual=nuevaUrl;
    this.urlCamara=nuevaUrl;
    this.camaraConectada=true;
    if(urlAnterior){
      setTimeout(()=>URL.revokeObjectURL(urlAnterior),1000);
    }
  }

  private limpiarFrameActual():void{
    if(this.urlFrameActual){
      URL.revokeObjectURL(this.urlFrameActual);
      this.urlFrameActual=undefined;
    }
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

    const token=this.authService.obtenerToken();
    if(!token){
      this.procesandoIA=false;
      this.mostrarAlerta('La sesión no está disponible. Inicie sesión nuevamente.');
      return;
    }

    this.http.post<any>(
      `${this.PYTHON_API}/api-local/subir-cloudinary`,
      {},
      {headers:new HttpHeaders({Authorization:`Bearer ${token}`})}
    ).subscribe({
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
    this.controladorVideo?.abort();
    this.limpiarFrameActual();
    this.socketService.desconectar();
  }
}
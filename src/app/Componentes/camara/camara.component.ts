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

  // ==========================================
  // CONFIGURACIÓN DE URL CENTRALIZADA
  // ==========================================
  // Reemplaza con la URL base de tu backend Node.js en Render
  private readonly BACKEND_URL = 'https://veedores.onrender.com';

  PYTHON_API: string = '';
  urlCamara: string = '';

  // ==========================================
  // MODO PRUEBA SIN BALANZA
  // ==========================================

  modoPruebaSinBalanza = true;

  pesoPrueba = 250.00;


  // ==========================================
  // VARIABLES
  // ==========================================

  camaraConectada = false;

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


  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor(

    private balanzaService: BalanzaS,

    private socketService: SocketS,

    private http: HttpClient,

    private authService: Auth

  ) { }


  // ==========================================
  // INICIAR
  // ==========================================

  ngOnInit() {

    this.cargarUrlCamaraAsignada();

    this.peso = 0;

    this.fecha = '';


    if (this.modoPruebaSinBalanza) {

      console.warn(
        '🧪 MODO PRUEBA SIN BALANZA ACTIVADO'
      );

      console.warn(
        `⚖️ Peso simulado: ${this.pesoPrueba} g`
      );

    }


    // ==========================================
    // SOCKET CONECTADO
    // ==========================================

    this.socketService.conectado(() => {

      console.log(
        '🔌 Socket conectado'
      );

    });


    // ==========================================
    // SOCKET DESCONECTADO
    // ==========================================

    this.socketService.desconectado(() => {

      if (!this.modoPruebaSinBalanza) {

        this.conexion = false;

        this.peso = 0;

        this.fecha = '';

      }

    });


    // ==========================================
    // ESCUCHAR PESO
    // ==========================================

    this.socketService.escucharPeso((data) => {

      console.log(
        '⚖️ LLEGÓ PESO:',
        data
      );


      if (this.modoPruebaSinBalanza) {

        return;

      }


      this.peso =
        Number(data.peso);


      this.fecha =
        data.fecha_hora;


      this.conexion = true;


      clearTimeout(
        this.temporizadorConexion
      );


      this.temporizadorConexion =
        setTimeout(() => {

          if (!this.realizandoTara) {

            console.log(
              '⚠️ No llegaron pesos en 2 segundos'
            );


            this.conexion = false;

            this.peso = 0;

            this.fecha = '';

          }

        }, 2000);

    });


    // ==========================================
    // PESO GUARDADO
    // ==========================================

    this.socketService.escucharGuardado(
      (data) => {

        console.log(
          'Peso guardado:',
          data
        );


        if (!this.modoPruebaSinBalanza) {

          this.mostrarAlerta(
            '✅ Peso guardado correctamente'
          );

        }

      }
    );


    // ==========================================
    // TARA
    // ==========================================

    this.socketService.escucharTara(
      (data) => {

        console.log(
          'Tara:',
          data
        );


        if (this.modoPruebaSinBalanza) {

          return;

        }


        this.realizandoTara = true;


        this.mostrarAlerta(
          '⚖️ Tara realizada correctamente'
        );


        setTimeout(() => {

          this.realizandoTara = false;

        }, 2500);

      }
    );

  }


  // ==========================================
  // CARGAR CÁMARA DEL ADMINISTRADOR ASIGNADO
  // ==========================================

  cargarUrlCamaraAsignada() {
    const idUsuario = this.authService.obtenerIdUsuario();
    if (!idUsuario) {
      this.camaraConectada = false;
      return;
    }

    this.http.get<any>(`${this.BACKEND_URL}/config/url-camara/${idUsuario}`)
      .subscribe({
        next: (res) => {
          if (res?.estado === 1 && res.url_camara) {
            this.PYTHON_API = res.url_camara;
            this.urlCamara = `${this.PYTHON_API}/video_feed`;
            this.camaraConectada = true;
          } else {
            this.camaraConectada = false;
            this.mostrarAlerta('⚠️ El administrador aún no ha habilitado la cámara.');
          }
        },
        error: (err) => {
          console.error('Error al obtener URL de la cámara:', err);
          this.camaraConectada = false;
          this.mostrarAlerta('❌ Error al consultar la cámara del equipo.');
        }
      });
  }


  // ==========================================
  // GUARDAR CAPTURA
  // ==========================================

  guardarCapturaWeb() {

    if (!this.PYTHON_API) {
      this.mostrarAlerta('⚠️ No hay cámara conectada para procesar la captura.');
      return;
    }

    const pesoRegistro =
      this.modoPruebaSinBalanza
        ? this.pesoPrueba
        : this.peso;


    if (
      !this.modoPruebaSinBalanza &&
      pesoRegistro <= 0
    ) {

      this.mostrarAlerta(
        '⚠️ No hay peso válido en la balanza para guardar'
      );

      return;

    }


    this.mostrarAlerta(
      this.modoPruebaSinBalanza
        ? '🧪 Modo prueba: procesando captura...'
        : '⏳ Procesando captura...'
    );


    // PETICIÓN AL ENDPOINT PYTHON A TRAVÉS DE LA URL ASIGNADA
    this.http.post<any>(

      `${this.PYTHON_API}/api-local/subir-cloudinary`,

      {}

    ).subscribe({

      next: (resPython) => {

        const idEspecieDetectada =
          Number(
            resPython.id_deteccion
          );


        const especieDetectada =
          resPython.especie;


        const imagenUrlCloudinary =
          resPython.imagen_url;


        const porcentajeDeteccion =
          Number(
            resPython.porcentaje
          );


        if (
          !idEspecieDetectada ||
          !imagenUrlCloudinary
        ) {

          this.mostrarAlerta(
            '❌ Python no devolvió los datos necesarios'
          );

          return;

        }


        if (
          Number.isNaN(
            porcentajeDeteccion
          )
        ) {

          this.mostrarAlerta(
            '❌ Python no devolvió un porcentaje válido'
          );

          return;

        }


        const idUsuario =
          this.authService
            .obtenerIdUsuario();


        if (!idUsuario) {

          this.mostrarAlerta(
            '❌ No se pudo identificar al usuario'
          );

          return;

        }


        const datosCaptura = {

          id_especie:
            idEspecieDetectada,

          id_usuario:
            idUsuario,

          peso:
            pesoRegistro,

          imagen_url:
            imagenUrlCloudinary,

          porcentaje:
            porcentajeDeteccion

        };


        this.balanzaService
          .registrarCaptura(datosCaptura).subscribe({
            next: (resBD) => {
              this.ultimoResultado = {
                especie: especieDetectada,
                peso: pesoRegistro,
                porcentaje: porcentajeDeteccion,
                hora: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }),
                id: idEspecieDetectada,
                imagen_url: imagenUrlCloudinary
              };
              this.mostrarAlerta(
                `✅ Captura registrada (${especieDetectada} - ${porcentajeDeteccion.toFixed(2)}%)`
              );
            },

            error: (err) => {
              console.error(
                '❌ ERROR NODE / MYSQL:',
                err
              );

              if (err.error?.mensaje) {
                this.mostrarAlerta(
                  `❌ ${err.error.mensaje}`
                );
              } else {
                this.mostrarAlerta(
                  '❌ Error al guardar en la base de datos'
                );
              }
            }
          });
      },

      error: (err) => {
        console.error(
          '❌ ERROR PYTHON / CLOUDINARY:',
          err
        );

        if (err.error?.mensaje) {
          this.mostrarAlerta(
            `⚠️ ${err.error.mensaje}`
          );
        } else {
          this.mostrarAlerta(
            '❌ Error al comunicarse con Python'
          );
        }
      }
    });
  }


  // ==========================================
  // OBTENER ÚLTIMO PESO
  // ==========================================

  obtenerUltimoPeso() {
    if (this.modoPruebaSinBalanza) {
      this.peso =
        this.pesoPrueba;

      this.fecha =
        new Date()
          .toLocaleString();
      return;
    }

    this.balanzaService
      .obtenerUltimoPeso().subscribe({
        next: (respuesta) => {
          if (respuesta.estado == 1) {
            this.peso =
              Number(
                respuesta.data.peso
              );
            this.fecha =
              respuesta.data.fecha_hora;
          }
        },
        error: (error) => {
          console.error(
            error
          );
        }
      });
  }


  // ==========================================
  // MENSAJES
  // ==========================================

  mostrarAlerta(
    texto: string
  ) {
    this.mensaje =
      texto;

    this.mostrarMensaje =
      true;

    clearTimeout(
      this.temporizadorMensaje
    );

    this.temporizadorMensaje =
      setTimeout(() => {
        this.mostrarMensaje =
          false;
      }, 3000);
  }


  // ==========================================
  // CÁMARA
  // ==========================================

  alCargarCamara() {
    this.camaraConectada =
      true;
  }

  errorCamara() {
    this.camaraConectada =
      false;
  }


  // ==========================================
  // DESTRUIR
  // ==========================================

  ngOnDestroy() {
    clearTimeout(
      this.temporizadorConexion
    );

    clearTimeout(
      this.temporizadorMensaje
    );

    this.socketService
      .desconectar();
  }
}
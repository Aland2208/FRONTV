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
  // API PYTHON
  // ==========================================

  /*local
  private readonly PYTHON_API = 'http://192.168.18.10:5000';*/

  //tunel cloudflared
  private readonly PYTHON_API = 'https://condo-thumbzilla-row-pack.trycloudflare.com';

  urlCamara =
    `${this.PYTHON_API}/video_feed`;


  // ==========================================
  // MODO PRUEBA SIN BALANZA
  // ==========================================

  modoPruebaSinBalanza = true;

  pesoPrueba = 250.00;


  // ==========================================
  // VARIABLES
  // ==========================================

  camaraConectada = true;

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
  // GUARDAR CAPTURA
  // ==========================================

  guardarCapturaWeb() {

    // ==========================================
    // PESO
    // ==========================================

    const pesoRegistro =
      this.modoPruebaSinBalanza
        ? this.pesoPrueba
        : this.peso;



    // ==========================================
    // VALIDAR PESO REAL
    // ==========================================

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


    // ==========================================
    // PYTHON
    // ==========================================

    this.http.post<any>(

      `${this.PYTHON_API}/api-local/subir-cloudinary`,

      {}

    ).subscribe({

      next: (resPython) => {

        // ======================================
        // DATOS DE PYTHON
        // ======================================

        /*
          Tu Python todavía llama a este campo
          "id_deteccion", pero realmente contiene
          el ID de la especie.
        */

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


        // ======================================
        // VALIDACIONES
        // ======================================

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


        // ======================================
        // USUARIO AUTENTICADO
        // ======================================

        const idUsuario =
          this.authService
            .obtenerIdUsuario();


        if (!idUsuario) {

          this.mostrarAlerta(
            '❌ No se pudo identificar al usuario'
          );

          return;

        }


        // ======================================
        // DATOS PARA NODE
        // ======================================

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

        // ======================================
        // GUARDAR EN MYSQL
        // ======================================
        this.balanzaService
          .registrarCaptura(datosCaptura).subscribe({
            next: (resBD) => {
              // ==================================
              // RESULTADO
              // ==================================
              this.ultimoResultado = {
                especie: especieDetectada,
                peso: pesoRegistro,
                porcentaje: porcentajeDeteccion,
                hora: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }
                ),
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
              }
              else {
                this.mostrarAlerta(
                  '❌ Error al guardar en la base de datos'
                );
              }
            }
          });
      },

      // ========================================
      // ERROR PYTHON
      // ========================================
      error: (err) => {
        console.error(
          '❌ ERROR PYTHON / CLOUDINARY:',
          err
        );

        if (err.error?.mensaje) {

          this.mostrarAlerta(
            `⚠️ ${err.error.mensaje}`
          );

        }
        else {
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
          if (
            respuesta.estado == 1) {
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
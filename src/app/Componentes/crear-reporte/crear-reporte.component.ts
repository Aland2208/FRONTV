import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  IonIcon,
  IonSpinner
} from '@ionic/angular/standalone';

import {
  ReporteS
} from '../../servicios/reporte-s';

import {
  Auth
} from '../../servicios/auth';


@Component({
  selector: 'app-crear-reporte',

  templateUrl:
    './crear-reporte.component.html',

  styleUrls: [
    './crear-reporte.component.scss'
  ],

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    IonIcon,
    IonSpinner
  ]
})
export class CrearReporteComponent
  implements OnInit {


  // ==========================================
  // REPORTES ORIGINALES
  // ==========================================

  reportes: any[] = [];


  // ==========================================
  // REPORTES AGRUPADOS POR ESPECIE
  // ==========================================

  gruposEspecies: any[] = [];


  // ==========================================
  // TIPOS DE REPORTE
  // ==========================================

  tiposReporte: any[] = [];


  // ==========================================
  // RESUMEN GENERAL
  // ==========================================

  resumen = {

    total_registros: 0,

    peso_total: 0,

    confianza_promedio: 0

  };


  // ==========================================
  // USUARIO
  // ==========================================

  usuario: any = null;


  // ==========================================
  // ESTADOS
  // ==========================================

  cargando = false;

  mensaje = '';

  error = false;


  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor(

    private reporteService:
      ReporteS,

    private authService:
      Auth

  ) { }


  // ==========================================
  // INICIAR COMPONENTE
  // ==========================================

  ngOnInit() {

    this.cargarTiposReporte();

    this.cargarReportes();

  }


  // ==========================================
  // CARGAR TIPOS DE REPORTE
  // ==========================================

  cargarTiposReporte() {

    this.reporteService
      .obtenerTiposReporte()
      .subscribe({

        next: (respuesta) => {

          console.log(
            '📋 TIPOS DE REPORTE:',
            respuesta
          );


          this.tiposReporte =
            respuesta.data || [];

        },


        error: (err) => {

          console.error(
            '❌ ERROR CARGANDO TIPOS:',
            err
          );

        }

      });

  }


  // ==========================================
  // CARGAR REPORTES PENDIENTES
  // ==========================================

  cargarReportes() {

    const idUsuario =
      this.authService
        .obtenerIdUsuario();


    console.log(
      '👤 ID USUARIO LOGUEADO:',
      idUsuario
    );


    // ========================================
    // VALIDAR USUARIO
    // ========================================

    if (!idUsuario) {

      this.error = true;

      this.mensaje =
        'No se pudo identificar al usuario.';

      this.reportes = [];

      this.gruposEspecies = [];

      return;

    }


    // ========================================
    // INICIAR CARGA
    // ========================================

    this.cargando = true;

    this.error = false;

    this.mensaje = '';


    // ========================================
    // CONSULTAR BACKEND
    // ========================================

    this.reporteService
      .obtenerReportesPendientesHoy(
        idUsuario
      )
      .subscribe({

        next: (respuesta) => {

          console.log(
            '📄 REPORTES PENDIENTES:',
            respuesta
          );


          // ==================================
          // USUARIO
          // ==================================

          this.usuario =
            respuesta.usuario || null;


          // ==================================
          // REPORTES ORIGINALES
          // ==================================

          this.reportes =
            respuesta.data || [];


          // ==================================
          // RESUMEN GENERAL
          // ==================================

          this.resumen =
            respuesta.resumen || {

              total_registros: 0,

              peso_total: 0,

              confianza_promedio: 0

            };


          // ==================================
          // AGRUPAR POR ESPECIE
          // ==================================

          this.agruparReportesPorEspecie();


          // ==================================
          // FINALIZAR CARGA
          // ==================================

          this.cargando = false;


          console.log(
            '🐟 GRUPOS POR ESPECIE:',
            this.gruposEspecies
          );

        },


        error: (err) => {

          console.error(
            '❌ ERROR AL CARGAR REPORTES:',
            err
          );


          this.cargando = false;

          this.error = true;

          this.reportes = [];

          this.gruposEspecies = [];


          this.mensaje =
            err.error?.mensaje ||
            'No se pudieron cargar los reportes del día.';

        }

      });

  }


  // ==========================================
  // AGRUPAR REPORTES POR ESPECIE
  // ==========================================

  agruparReportesPorEspecie() {

    const mapa =
      new Map<number, any>();


    // ========================================
    // RECORRER REPORTES
    // ========================================

    for (
      const reporte
      of this.reportes
    ) {

      const idEspecie =
        Number(
          reporte.id_especie
        );


      // ======================================
      // CREAR GRUPO SI NO EXISTE
      // ======================================

      if (
        !mapa.has(idEspecie)
      ) {

        mapa.set(
          idEspecie,
          {

            // ================================
            // ESPECIE
            // ================================

            id_especie:
              idEspecie,

            especie:
              reporte.especie,

            nombre_cientifico:
              reporte.nombre_cientifico,


            // ================================
            // IMAGEN DE REFERENCIA
            // ================================

            imagen_url:
              reporte.imagen_url || null,


            // ================================
            // CAPTURAS
            // ================================

            capturas: [],


            // ================================
            // IDENTIFICADORES DE REPORTES
            // ================================

            ids_reportes: [],


            // ================================
            // RESUMEN
            // ================================

            total_capturas: 0,

            peso_total: 0,

            confianza_promedio: 0,


            // ================================
            // FORMULARIO
            // ================================

            tipoSeleccionado: null,

            tituloReporte: '',


            // ================================
            // ESTADO DE ARCHIVOS
            // ================================

            pdfGenerado: false,

            csvGenerado: false,


            // ================================
            // ESTADOS DE PROCESO
            // ================================

            generandoPDF: false,

            generandoCSV: false,

            enviando: false

          }
        );

      }


      // ======================================
      // OBTENER GRUPO
      // ======================================

      const grupo =
        mapa.get(idEspecie);


      // ======================================
      // AGREGAR CAPTURA
      // ======================================

      grupo.capturas.push(
        reporte
      );


      // ======================================
      // AGREGAR ID REPORTE
      // ======================================

      grupo.ids_reportes.push(
        reporte.id_reporte
      );


      // ======================================
      // IMAGEN DE REFERENCIA
      // ======================================

      if (
        !grupo.imagen_url &&
        reporte.imagen_url
      ) {

        grupo.imagen_url =
          reporte.imagen_url;

      }

    }


    // ========================================
    // CONVERTIR MAP EN ARRAY
    // ========================================

    this.gruposEspecies =
      Array.from(
        mapa.values()
      );


    // ========================================
    // CALCULAR RESUMEN POR ESPECIE
    // ========================================

    this.gruposEspecies =
      this.gruposEspecies.map(
        (grupo: any) => {


          // ==================================
          // TOTAL CAPTURAS
          // ==================================

          grupo.total_capturas =
            grupo.capturas.length;


          // ==================================
          // PESO TOTAL
          // ==================================

          grupo.peso_total =
            grupo.capturas.reduce(

              (
                total: number,
                captura: any
              ) => {

                return (
                  total +
                  Number(
                    captura.peso || 0
                  )
                );

              },

              0

            );


          // ==================================
          // SUMA DE CONFIANZA
          // ==================================

          const sumaConfianza =
            grupo.capturas.reduce(

              (
                total: number,
                captura: any
              ) => {

                return (
                  total +
                  Number(
                    captura.porcentaje || 0
                  )
                );

              },

              0

            );


          // ==================================
          // CONFIANZA PROMEDIO
          // ==================================

          grupo.confianza_promedio =
            grupo.total_capturas > 0

              ? (
                sumaConfianza /
                grupo.total_capturas
              )

              : 0;


          // ==================================
          // VERIFICAR PDF
          // ==================================
          //
          // Solo se considera generado si
          // TODOS los registros del grupo
          // tienen archivo_pdf = 1.
          // ==================================

          grupo.pdfGenerado =
            grupo.capturas.length > 0 &&
            grupo.capturas.every(
              (captura: any) =>
                Number(
                  captura.archivo_pdf
                ) === 1
            );


          // ==================================
          // VERIFICAR CSV
          // ==================================

          grupo.csvGenerado =
            grupo.capturas.length > 0 &&
            grupo.capturas.every(
              (captura: any) =>
                Number(
                  captura.archivo_csv
                ) === 1
            );


          // ==================================
          // TÍTULO SUGERIDO
          // ==================================

          grupo.tituloReporte =
            `Reporte de capturas - ${grupo.especie}`;


          return grupo;

        }
      );


    // ========================================
    // ORDENAR POR NOMBRE DE ESPECIE
    // ========================================

    this.gruposEspecies.sort(
      (
        a: any,
        b: any
      ) => {

        return String(
          a.especie || ''
        ).localeCompare(
          String(
            b.especie || ''
          )
        );

      }
    );


    console.log(
      '======================================'
    );

    console.log(
      '🐟 REPORTES AGRUPADOS POR ESPECIE'
    );


    for (
      const grupo
      of this.gruposEspecies
    ) {

      console.log(
        grupo.especie,
        '| Capturas:',
        grupo.total_capturas,
        '| Reportes:',
        grupo.ids_reportes,
        '| Peso:',
        grupo.peso_total,
        '| Confianza:',
        grupo.confianza_promedio
      );

    }


    console.log(
      '======================================'
    );

  }


  // ==========================================
  // GENERAR PDF DEL GRUPO
  // ==========================================

  // ==========================================
  // GENERAR PDF DEL GRUPO
  // ==========================================

  generarPDF(
    grupo: any
  ) {

    // ========================================
    // VALIDAR TIPO DE REPORTE
    // ========================================

    if (!grupo.tipoSeleccionado) {

      alert(
        'Seleccione un tipo de reporte antes de generar el PDF.'
      );

      return;

    }


    // ========================================
    // VALIDAR TÍTULO
    // ========================================

    if (
      !grupo.tituloReporte ||
      !grupo.tituloReporte.trim()
    ) {

      alert(
        'Ingrese un título para el reporte antes de generar el PDF.'
      );

      return;

    }


    // ========================================
    // OBTENER USUARIO
    // ========================================

    const idUsuario =
      this.authService
        .obtenerIdUsuario();


    if (!idUsuario) {

      alert(
        'No se pudo identificar al usuario.'
      );

      return;

    }


    // ========================================
    // VALIDAR REPORTES
    // ========================================

    if (
      !grupo.ids_reportes ||
      grupo.ids_reportes.length === 0
    ) {

      alert(
        'No existen registros para generar el PDF.'
      );

      return;

    }


    // ========================================
    // ACTIVAR ESTADO DE CARGA
    // ========================================

    grupo.generandoPDF = true;


    console.log(
      '======================================'
    );

    console.log(
      '📄 GENERANDO PDF'
    );

    console.log(
      '🐟 Especie:',
      grupo.especie
    );

    console.log(
      '📋 Reportes:',
      grupo.ids_reportes
    );


    // ========================================
    // PREPARAR DATOS
    // ========================================

    const datos = {

      id_usuario:
        idUsuario,

      id_especie:
        Number(
          grupo.id_especie
        ),

      ids_reportes:
        grupo.ids_reportes.map(
          (id: any) =>
            Number(id)
        ),

      id_tipo_reporte:
        Number(
          grupo.tipoSeleccionado
        ),

      titulo:
        grupo.tituloReporte.trim()

    };


    // ========================================
    // SOLICITAR PDF AL BACKEND
    // ========================================

    this.reporteService
      .generarPDFEspecie(
        datos
      )
      .subscribe({

        next: (blob: Blob) => {

          console.log(
            '📦 PDF recibido:',
            blob
          );


          // ==================================
          // VALIDAR ARCHIVO
          // ==================================

          if (
            !blob ||
            blob.size === 0
          ) {

            grupo.generandoPDF = false;

            alert(
              'El archivo PDF recibido está vacío.'
            );

            return;

          }


          // ==================================
          // CREAR URL TEMPORAL
          // ==================================

          const url =
            window.URL
              .createObjectURL(
                blob
              );


          // ==================================
          // CREAR ENLACE DE DESCARGA
          // ==================================

          const enlace =
            document.createElement(
              'a'
            );


          enlace.href = url;


          // ==================================
          // NOMBRE SEGURO DE ESPECIE
          // ==================================

          const especie =
            String(
              grupo.especie ||
              'especie'
            )
              .trim()
              .replace(
                /\s+/g,
                '_'
              )
              .replace(
                /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g,
                ''
              );


          // ==================================
          // FECHA
          // ==================================

          const fecha =
            this.obtenerFechaActual();


          // ==================================
          // NOMBRE DEL ARCHIVO
          // ==================================

          enlace.download =
            `reporte_${especie}_${fecha}.pdf`;


          // ==================================
          // DESCARGAR
          // ==================================

          document.body
            .appendChild(
              enlace
            );


          enlace.click();


          document.body
            .removeChild(
              enlace
            );


          // ==================================
          // LIBERAR URL
          // ==================================

          window.URL
            .revokeObjectURL(
              url
            );


          // ==================================
          // ACTUALIZAR ESTADO LOCAL
          // ==================================

          grupo.pdfGenerado = true;

          grupo.generandoPDF = false;


          // ==================================
          // ACTUALIZAR CAPTURAS LOCALMENTE
          // ==================================

          for (
            const captura
            of grupo.capturas
          ) {

            captura.archivo_pdf = 1;

          }


          console.log(
            '✅ PDF generado correctamente'
          );

          console.log(
            '======================================'
          );

        },


        error: (err) => {

          console.error(
            '❌ ERROR GENERANDO PDF:',
            err
          );


          grupo.generandoPDF = false;


          this.mostrarErrorBlob(
            err,
            'No se pudo generar el archivo PDF.'
          );

        }

      });

  }

  // ==========================================
  // GENERAR CSV DEL GRUPO
  // ==========================================

  // ==========================================
  // GENERAR CSV DEL GRUPO
  // ==========================================

  generarCSV(
    grupo: any
  ) {

    // ========================================
    // VALIDAR TIPO
    // ========================================

    if (!grupo.tipoSeleccionado) {

      alert(
        'Seleccione un tipo de reporte antes de generar el CSV.'
      );

      return;

    }


    // ========================================
    // VALIDAR TÍTULO
    // ========================================

    if (
      !grupo.tituloReporte ||
      !grupo.tituloReporte.trim()
    ) {

      alert(
        'Ingrese un título para el reporte antes de generar el CSV.'
      );

      return;

    }


    // ========================================
    // OBTENER USUARIO
    // ========================================

    const idUsuario =
      this.authService
        .obtenerIdUsuario();


    if (!idUsuario) {

      alert(
        'No se pudo identificar al usuario.'
      );

      return;

    }


    // ========================================
    // VALIDAR REPORTES
    // ========================================

    if (
      !grupo.ids_reportes ||
      grupo.ids_reportes.length === 0
    ) {

      alert(
        'No existen registros para generar el CSV.'
      );

      return;

    }


    // ========================================
    // ACTIVAR CARGA
    // ========================================

    grupo.generandoCSV = true;


    console.log(
      '======================================'
    );

    console.log(
      '📊 GENERANDO CSV'
    );

    console.log(
      '🐟 Especie:',
      grupo.especie
    );

    console.log(
      '📋 Reportes:',
      grupo.ids_reportes
    );


    // ========================================
    // DATOS
    // ========================================

    const datos = {

      id_usuario:
        idUsuario,

      id_especie:
        Number(
          grupo.id_especie
        ),

      ids_reportes:
        grupo.ids_reportes.map(
          (id: any) =>
            Number(id)
        ),

      id_tipo_reporte:
        Number(
          grupo.tipoSeleccionado
        ),

      titulo:
        grupo.tituloReporte.trim()

    };


    // ========================================
    // SOLICITAR CSV
    // ========================================

    this.reporteService
      .generarCSVEspecie(
        datos
      )
      .subscribe({

        next: (blob: Blob) => {

          console.log(
            '📦 CSV recibido:',
            blob
          );


          // ==================================
          // VALIDAR
          // ==================================

          if (
            !blob ||
            blob.size === 0
          ) {

            grupo.generandoCSV = false;

            alert(
              'El archivo CSV recibido está vacío.'
            );

            return;

          }


          // ==================================
          // URL TEMPORAL
          // ==================================

          const url =
            window.URL
              .createObjectURL(
                blob
              );


          // ==================================
          // ENLACE
          // ==================================

          const enlace =
            document.createElement(
              'a'
            );


          enlace.href = url;


          // ==================================
          // ESPECIE
          // ==================================

          const especie =
            String(
              grupo.especie ||
              'especie'
            )
              .trim()
              .replace(
                /\s+/g,
                '_'
              )
              .replace(
                /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g,
                ''
              );


          // ==================================
          // FECHA
          // ==================================

          const fecha =
            this.obtenerFechaActual();


          // ==================================
          // NOMBRE
          // ==================================

          enlace.download =
            `reporte_${especie}_${fecha}.csv`;


          // ==================================
          // DESCARGAR
          // ==================================

          document.body
            .appendChild(
              enlace
            );


          enlace.click();


          document.body
            .removeChild(
              enlace
            );


          // ==================================
          // LIBERAR URL
          // ==================================

          window.URL
            .revokeObjectURL(
              url
            );


          // ==================================
          // ACTUALIZAR ESTADO
          // ==================================

          grupo.csvGenerado = true;

          grupo.generandoCSV = false;


          // ==================================
          // ACTUALIZAR CAPTURAS
          // ==================================

          for (
            const captura
            of grupo.capturas
          ) {

            captura.archivo_csv = 1;

          }


          console.log(
            '✅ CSV generado correctamente'
          );

          console.log(
            '======================================'
          );

        },


        error: (err) => {

          console.error(
            '❌ ERROR GENERANDO CSV:',
            err
          );


          grupo.generandoCSV = false;


          this.mostrarErrorBlob(
            err,
            'No se pudo generar el archivo CSV.'
          );

        }

      });

  }
  // ==========================================
  // OBTENER FECHA ACTUAL
  // ==========================================

  private obtenerFechaActual(): string {

    const fecha =
      new Date();


    const anio =
      fecha.getFullYear();


    const mes =
      String(
        fecha.getMonth() + 1
      ).padStart(
        2,
        '0'
      );


    const dia =
      String(
        fecha.getDate()
      ).padStart(
        2,
        '0'
      );


    return `${anio}-${mes}-${dia}`;

  }


  // ==========================================
  // MOSTRAR ERROR DEVUELTO COMO BLOB
  // ==========================================

  private mostrarErrorBlob(
    err: any,
    mensajeDefecto: string
  ) {

    // ========================================
    // CUANDO HTTPCLIENT ESPERA BLOB,
    // LOS ERRORES JSON TAMBIÉN PUEDEN
    // LLEGAR COMO BLOB
    // ========================================

    if (
      err?.error instanceof Blob
    ) {

      const lector =
        new FileReader();


      lector.onload = () => {

        try {

          const contenido =
            String(
              lector.result || ''
            );


          const respuesta =
            JSON.parse(
              contenido
            );


          alert(
            respuesta.mensaje ||
            mensajeDefecto
          );

        }

        catch {

          alert(
            mensajeDefecto
          );

        }

      };


      lector.onerror = () => {

        alert(
          mensajeDefecto
        );

      };


      lector.readAsText(
        err.error
      );


      return;

    }


    // ========================================
    // ERROR JSON NORMAL
    // ========================================

    alert(
      err?.error?.mensaje ||
      mensajeDefecto
    );

  }

  // ==========================================
  // ENVIAR REPORTE DEL GRUPO
  // ==========================================

  enviarReporte(grupo: any) {
    if (!grupo.tipoSeleccionado) {
      alert('Seleccione un tipo de reporte.');
      return;
    }

    if (!grupo.tituloReporte?.trim()) {
      alert('Ingrese un título para el reporte.');
      return;
    }

    if (!grupo.pdfGenerado) {
      alert('Debe generar el PDF antes de enviar el reporte.');
      return;
    }

    if (!grupo.csvGenerado) {
      alert('Debe generar el CSV antes de enviar el reporte.');
      return;
    }

    const idUsuario = this.authService.obtenerIdUsuario();

    if (!idUsuario) {
      alert('No se pudo identificar al usuario.');
      return;
    }

    if (!grupo.ids_reportes?.length) {
      alert('No existen registros para enviar.');
      return;
    }

    const datos = {
      id_usuario: idUsuario,
      id_especie: Number(grupo.id_especie),
      ids_reportes: grupo.ids_reportes.map((id: any) => Number(id)),
      id_tipo_reporte: Number(grupo.tipoSeleccionado),
      titulo: grupo.tituloReporte.trim()
    };

    console.log('📤 ENVIANDO REPORTE:', datos);

    grupo.enviando = true;

    this.reporteService.enviarReporteEspecie(datos).subscribe({
      next: (respuesta) => {
        grupo.enviando = false;

        console.log('✅ REPORTE ENVIADO:', respuesta);

        alert(
          respuesta.mensaje ||
          'Reporte enviado correctamente.'
        );

        // Recargamos los pendientes.
        // Como estos registros ya tienen id_tipo_reporte,
        // ya no deberían volver a aparecer.
        this.cargarReportes();
      },

      error: (err) => {
        grupo.enviando = false;

        console.error('❌ ERROR ENVIANDO REPORTE:', err);

        alert(
          err?.error?.mensaje ||
          'No se pudo enviar el reporte.'
        );
      }
    });
  }

}
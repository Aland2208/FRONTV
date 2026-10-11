import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  warningOutline,
  documentTextOutline,
  imageOutline,
  trashOutline,
  checkmarkCircleOutline,
  documentOutline,
  gridOutline,
  sendOutline,
  closeCircleOutline,
  informationCircleOutline,
  calendarOutline
} from 'ionicons/icons';

import { ReporteS } from '../../servicios/reporte-s';
import { Auth } from '../../servicios/auth';
import { BalanzaS } from '../../servicios/balanza-s';

@Component({
  selector: 'app-crear-reporte',
  templateUrl: './crear-reporte.component.html',
  styleUrls: ['./crear-reporte.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonIcon,
    IonSpinner
  ]
})
export class CrearReporteComponent implements OnInit {

  reportes: any[] = [];
  gruposEspecies: any[] = [];
  gruposEspeciesAnteriores: any[] = [];
  tiposReporte: any[] = [];
  rangoPendientesAnteriores = {
    fecha_inicio: '',
    fecha_fin: ''
  };
  fechaMaximaAnterior = '';
  cargandoAnteriores = false;
  errorAnteriores = '';

  resumen = {
    total_registros: 0,
    peso_total: 0,
    confianza_promedio: 0
  };

  usuario: any = null;
  cargando = false;
  mensaje = '';
  error = false;

  // Control del modal de anulación
  mostrarModalAnular = false;
  capturaSeleccionadaAnular: any = null;
  anulandoProceso = false;

  // Control del modal de mensajes y avisos
  modalMensaje = {
    abierto: false,
    titulo: '',
    descripcion: '',
    tipo: 'info' as 'info' | 'exito' | 'error'
  };

  constructor(
    private reporteService: ReporteS,
    private authService: Auth,
    private balanzaService: BalanzaS
  ) {
    // Registrar explícitamente los iconos de Ionicons para eliminar los errores de consola
    addIcons({
      personOutline,
      warningOutline,
      documentTextOutline,
      imageOutline,
      trashOutline,
      checkmarkCircleOutline,
      documentOutline,
      gridOutline,
      sendOutline,
      closeCircleOutline,
      informationCircleOutline,
      calendarOutline
    });
  }

  ngOnInit() {
    this.configurarRangoAnterior();
    this.cargarTiposReporte();
    this.cargarReportes();
    this.cargarPendientesAnteriores();
  }

  private configurarRangoAnterior(): void {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const haceTreintaDias = new Date(ayer);
    haceTreintaDias.setDate(haceTreintaDias.getDate() - 29);

    this.fechaMaximaAnterior = this.formatearFechaLocal(ayer);
    this.rangoPendientesAnteriores = {
      fecha_inicio: this.formatearFechaLocal(haceTreintaDias),
      fecha_fin: this.fechaMaximaAnterior
    };
  }

  private formatearFechaLocal(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  cargarTiposReporte() {
    this.reporteService.obtenerTiposReporte().subscribe({
      next: (respuesta) => {
        this.tiposReporte = respuesta.data || [];
      },
      error: () => {
        this.tiposReporte = [];
        this.modalMensaje = {
          abierto: true,
          titulo: 'No se pudo cargar la información',
          descripcion: 'Intenta nuevamente más tarde.',
          tipo: 'error'
        };
      }
    });
  }

  cargarReportes() {
    const idUsuario = this.authService.obtenerIdUsuario();
    if (!idUsuario) {
      this.error = true;
      this.mensaje = 'No se pudo identificar al usuario.';
      this.reportes = [];
      this.gruposEspecies = [];
      return;
    }

    this.cargando = true;
    this.error = false;
    this.mensaje = '';

    this.reporteService.obtenerReportesPendientesHoy(idUsuario).subscribe({
      next: (respuesta) => {
        this.usuario = respuesta.usuario || null;
        this.reportes = respuesta.data || [];
        this.resumen = respuesta.resumen || {
          total_registros: 0,
          peso_total: 0,
          confianza_promedio: 0
        };

        this.agruparReportesPorEspecie();
        this.cargando = false;
      },
      error: (err) => {
        
        this.cargando = false;
        this.error = true;
        this.reportes = [];
        this.gruposEspecies = [];
        this.mensaje = err.error?.mensaje || 'No se pudieron cargar los reportes del día.';
      }
    });
  }

  cargarPendientesAnteriores(): void {
    const idUsuario = this.authService.obtenerIdUsuario();
    const { fecha_inicio, fecha_fin } = this.rangoPendientesAnteriores;

    if (!idUsuario) {
      this.errorAnteriores = 'No se pudo identificar al usuario.';
      this.gruposEspeciesAnteriores = [];
      return;
    }

    if (!fecha_inicio || !fecha_fin || fecha_inicio > fecha_fin || fecha_fin > this.fechaMaximaAnterior) {
      this.errorAnteriores = 'Selecciona un rango anterior válido.';
      this.gruposEspeciesAnteriores = [];
      return;
    }

    this.cargandoAnteriores = true;
    this.errorAnteriores = '';
    this.reporteService.obtenerReportesPendientesAnteriores(
      idUsuario,
      fecha_inicio,
      fecha_fin
    ).subscribe({
      next: respuesta => {
        const pendientes = respuesta.data || [];
        pendientes.forEach((reporte: any) => reporte.esPendienteAnterior = true);
        this.gruposEspeciesAnteriores = this.agruparListaReportes(pendientes, true);
        this.cargandoAnteriores = false;
      },
      error: err => {
        this.gruposEspeciesAnteriores = [];
        this.cargandoAnteriores = false;
        this.errorAnteriores =
          err?.error?.mensaje || 'No se pudieron cargar los pendientes anteriores.';
      }
    });
  }

  private agruparListaReportes(reportes: any[], incluirFecha: boolean): any[] {
    const mapa = new Map<string, any>();

    for (const reporte of reportes) {
      const idEspecie = Number(reporte.id_especie);
      const fechaReporte = String(reporte.fecha_reporte || '');
      const clave = incluirFecha ? `${fechaReporte}-${idEspecie}` : String(idEspecie);

      if (!mapa.has(clave)) {
        mapa.set(clave, {
          id_especie: idEspecie,
          fecha_reporte: fechaReporte,
          fechaReporteVisible: fechaReporte.split('-').reverse().join('/'),
          estado_revision: reporte.estado_revision || null,
          motivo_rechazo: reporte.motivo_rechazo || null,
          especie: reporte.especie,
          nombre_cientifico: reporte.nombre_cientifico,
          imagen_url: reporte.imagen_url || null,
          capturas: [],
          ids_reportes: [],
          total_capturas: 0,
          peso_total: 0,
          confianza_promedio: 0,
          tipoSeleccionado: null,
          tituloReporte: '',
          pdfGenerado: false,
          csvGenerado: false,
          generandoPDF: false,
          generandoCSV: false,
          enviando: false
        });
      }

      const grupo = mapa.get(clave);
      grupo.capturas.push(reporte);
      grupo.ids_reportes.push(reporte.id_reporte);

      if (!grupo.imagen_url && reporte.imagen_url) {
        grupo.imagen_url = reporte.imagen_url;
      }
    }

    const grupos = Array.from(mapa.values()).map((grupo: any) => {
      grupo.total_capturas = grupo.capturas.length;
      grupo.peso_total = grupo.capturas.reduce((total: number, c: any) => total + Number(c.peso || 0), 0);
      const sumaConfianza = grupo.capturas.reduce((total: number, c: any) => total + Number(c.porcentaje || 0), 0);
      grupo.confianza_promedio = grupo.total_capturas > 0 ? (sumaConfianza / grupo.total_capturas) : 0;

      grupo.pdfGenerado = grupo.capturas.length > 0 && grupo.capturas.every((c: any) => Number(c.archivo_pdf) === 1);
      grupo.csvGenerado = grupo.capturas.length > 0 && grupo.capturas.every((c: any) => Number(c.archivo_csv) === 1);
      grupo.tituloReporte = `Reporte de capturas - ${grupo.especie}${incluirFecha ? ` - ${grupo.fecha_reporte}` : ''}`;

      return grupo;
    });

    return grupos.sort((a: any, b: any) => {
      const fechaOrden = String(b.fecha_reporte || '').localeCompare(String(a.fecha_reporte || ''));
      return fechaOrden || String(a.especie || '').localeCompare(String(b.especie || ''));
    });
  }

  agruparReportesPorEspecie() {
    this.gruposEspecies = this.agruparListaReportes(this.reportes, false);
  }

  // ==========================================
  // MODAL DE ANULACIÓN DE CAPTURA
  // ==========================================
  abrirModalAnular(captura: any) {
    this.capturaSeleccionadaAnular = captura;
    this.mostrarModalAnular = true;
  }

  cerrarModalAnular() {
    this.mostrarModalAnular = false;
    this.capturaSeleccionadaAnular = null;
    this.anulandoProceso = false;
  }

  confirmarAnularCaptura() {
    if (!this.capturaSeleccionadaAnular) return;

    const idUsuario = this.authService.obtenerIdUsuario();
    if (!idUsuario) return;

    this.anulandoProceso = true;

    this.balanzaService.anularCaptura(this.capturaSeleccionadaAnular.id_captura, idUsuario).subscribe({
      next: (res) => {
        this.anulandoProceso = false;
        const esPendienteAnterior = this.capturaSeleccionadaAnular?.esPendienteAnterior;
        this.cerrarModalAnular();
        if (res.estado === 1) {
          this.mostrarNotificacion('Captura Anulada', 'El registro se ha retirado exitosamente de la faena.', 'exito');
          if (esPendienteAnterior) {
            this.cargarPendientesAnteriores();
          } else {
            this.cargarReportes();
          }
        } else {
          this.mostrarNotificacion('No se pudo anular', res.mensaje || 'Error al procesar la anulación.', 'error');
        }
      },
      error: (err) => {
        this.anulandoProceso = false;
        this.cerrarModalAnular();
        
        this.mostrarNotificacion('Error del servidor', err.error?.mensaje || 'No se pudo comunicar con el backend.', 'error');
      }
    });
  }

  // ==========================================
  // GENERAR PDF
  // ==========================================
  generarPDF(grupo: any) {
    if (!grupo.tipoSeleccionado) {
      this.mostrarNotificacion('Tipo Requerido', 'Selecciona un tipo de reporte antes de generar el archivo PDF.', 'info');
      return;
    }

    if (!grupo.tituloReporte?.trim()) {
      this.mostrarNotificacion('Título Requerido', 'Ingresa un título para el reporte antes de generar el archivo PDF.', 'info');
      return;
    }

    const idUsuario = this.authService.obtenerIdUsuario();
    if (!idUsuario) {
      this.mostrarNotificacion('Sesión no válida', 'No se pudo identificar la sesión del usuario.', 'error');
      return;
    }

    grupo.generandoPDF = true;

    const datos = {
      id_usuario: idUsuario,
      id_especie: Number(grupo.id_especie),
      ids_reportes: grupo.ids_reportes.map((id: any) => Number(id)),
      id_tipo_reporte: Number(grupo.tipoSeleccionado),
      titulo: grupo.tituloReporte.trim()
    };

    this.reporteService.generarPDFEspecie(datos).subscribe({
      next: (blob: Blob) => {
        if (!blob || blob.size === 0) {
          grupo.generandoPDF = false;
          this.mostrarNotificacion('Archivo Vacío', 'El archivo PDF recibido no contiene datos.', 'error');
          return;
        }

        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        const especie = String(grupo.especie || 'especie').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '');
        enlace.download = `reporte_${especie}_${grupo.fecha_reporte || this.obtenerFechaActual()}.pdf`;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        window.URL.revokeObjectURL(url);

        grupo.pdfGenerado = true;
        grupo.generandoPDF = false;
        grupo.capturas.forEach((c: any) => c.archivo_pdf = 1);
      },
      error: (err) => {
        grupo.generandoPDF = false;
        this.mostrarErrorBlob(err, 'No se pudo generar el archivo PDF.');
      }
    });
  }

  // ==========================================
  // GENERAR CSV
  // ==========================================
  generarCSV(grupo: any) {
    if (!grupo.tipoSeleccionado) {
      this.mostrarNotificacion('Tipo Requerido', 'Selecciona un tipo de reporte antes de generar el archivo CSV.', 'info');
      return;
    }

    if (!grupo.tituloReporte?.trim()) {
      this.mostrarNotificacion('Título Requerido', 'Ingresa un título para el reporte antes de generar el archivo CSV.', 'info');
      return;
    }

    const idUsuario = this.authService.obtenerIdUsuario();
    if (!idUsuario) {
      this.mostrarNotificacion('Sesión no válida', 'No se pudo identificar la sesión del usuario.', 'error');
      return;
    }

    grupo.generandoCSV = true;

    const datos = {
      id_usuario: idUsuario,
      id_especie: Number(grupo.id_especie),
      ids_reportes: grupo.ids_reportes.map((id: any) => Number(id)),
      id_tipo_reporte: Number(grupo.tipoSeleccionado),
      titulo: grupo.tituloReporte.trim()
    };

    this.reporteService.generarCSVEspecie(datos).subscribe({
      next: (blob: Blob) => {
        if (!blob || blob.size === 0) {
          grupo.generandoCSV = false;
          this.mostrarNotificacion('Archivo Vacío', 'El archivo CSV recibido no contiene datos.', 'error');
          return;
        }

        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        const especie = String(grupo.especie || 'especie').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '');
        enlace.download = `reporte_${especie}_${grupo.fecha_reporte || this.obtenerFechaActual()}.csv`;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        window.URL.revokeObjectURL(url);

        grupo.csvGenerado = true;
        grupo.generandoCSV = false;
        grupo.capturas.forEach((c: any) => c.archivo_csv = 1);
      },
      error: (err) => {
        grupo.generandoCSV = false;
        this.mostrarErrorBlob(err, 'No se pudo generar el archivo CSV.');
      }
    });
  }

  // ==========================================
  // ENVIAR REPORTE
  // ==========================================
  enviarReporte(grupo: any) {
    if (!grupo.tipoSeleccionado) {
      this.mostrarNotificacion('Tipo Requerido', 'Selecciona un tipo de reporte.', 'info');
      return;
    }

    if (!grupo.tituloReporte?.trim()) {
      this.mostrarNotificacion('Título Requerido', 'Ingresa un título para el reporte.', 'info');
      return;
    }

    if (!grupo.pdfGenerado || !grupo.csvGenerado) {
      this.mostrarNotificacion('Archivos Incompletos', 'Debes generar el PDF y CSV antes de enviar el reporte.', 'info');
      return;
    }

    const idUsuario = this.authService.obtenerIdUsuario();
    if (!idUsuario) return;

    const datos = {
      id_usuario: idUsuario,
      id_especie: Number(grupo.id_especie),
      ids_reportes: grupo.ids_reportes.map((id: any) => Number(id)),
      id_tipo_reporte: Number(grupo.tipoSeleccionado),
      titulo: grupo.tituloReporte.trim()
    };

    grupo.enviando = true;

    this.reporteService.enviarReporteEspecie(datos).subscribe({
      next: (respuesta) => {
        grupo.enviando = false;
        this.mostrarNotificacion('Reporte Consolidado', respuesta.mensaje || 'Reporte enviado correctamente.', 'exito');
        this.cargarReportes();
        this.cargarPendientesAnteriores();
      },
      error: (err) => {
        grupo.enviando = false;
        this.mostrarNotificacion('Error de Envío', err?.error?.mensaje || 'No se pudo enviar el reporte.', 'error');
      }
    });
  }

  // ==========================================
  // AVISOS Y NOTIFICACIONES NATIVAS
  // ==========================================
  mostrarNotificacion(titulo: string, descripcion: string, tipo: 'info' | 'exito' | 'error') {
    this.modalMensaje = {
      abierto: true,
      titulo,
      descripcion,
      tipo
    };
  }

  cerrarModalMensaje() {
    this.modalMensaje.abierto = false;
  }

  private obtenerFechaActual(): string {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private mostrarErrorBlob(err: any, mensajeDefecto: string) {
    if (err?.error instanceof Blob) {
      const lector = new FileReader();
      lector.onload = () => {
        try {
          const respuesta = JSON.parse(String(lector.result || ''));
          this.mostrarNotificacion('Atención', respuesta.mensaje || mensajeDefecto, 'error');
        } catch {
          this.mostrarNotificacion('Atención', mensajeDefecto, 'error');
        }
      };
      lector.readAsText(err.error);
      return;
    }
    this.mostrarNotificacion('Atención', err?.error?.mensaje || mensajeDefecto, 'error');
  }
}
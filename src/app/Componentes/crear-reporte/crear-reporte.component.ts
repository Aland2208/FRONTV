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
  informationCircleOutline
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
  tiposReporte: any[] = [];

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
      informationCircleOutline
    });
  }

  ngOnInit() {
    this.cargarTiposReporte();
    this.cargarReportes();
  }

  cargarTiposReporte() {
    this.reporteService.obtenerTiposReporte().subscribe({
      next: (respuesta) => {
        this.tiposReporte = respuesta.data || [];
      },
      error: (err) => console.error('Error al cargar tipos de reporte:', err)
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
        console.error('Error al cargar reportes:', err);
        this.cargando = false;
        this.error = true;
        this.reportes = [];
        this.gruposEspecies = [];
        this.mensaje = err.error?.mensaje || 'No se pudieron cargar los reportes del día.';
      }
    });
  }

  agruparReportesPorEspecie() {
    const mapa = new Map<number, any>();

    for (const reporte of this.reportes) {
      const idEspecie = Number(reporte.id_especie);

      if (!mapa.has(idEspecie)) {
        mapa.set(idEspecie, {
          id_especie: idEspecie,
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

      const grupo = mapa.get(idEspecie);
      grupo.capturas.push(reporte);
      grupo.ids_reportes.push(reporte.id_reporte);

      if (!grupo.imagen_url && reporte.imagen_url) {
        grupo.imagen_url = reporte.imagen_url;
      }
    }

    this.gruposEspecies = Array.from(mapa.values()).map((grupo: any) => {
      grupo.total_capturas = grupo.capturas.length;
      grupo.peso_total = grupo.capturas.reduce((total: number, c: any) => total + Number(c.peso || 0), 0);
      const sumaConfianza = grupo.capturas.reduce((total: number, c: any) => total + Number(c.porcentaje || 0), 0);
      grupo.confianza_promedio = grupo.total_capturas > 0 ? (sumaConfianza / grupo.total_capturas) : 0;

      grupo.pdfGenerado = grupo.capturas.length > 0 && grupo.capturas.every((c: any) => Number(c.archivo_pdf) === 1);
      grupo.csvGenerado = grupo.capturas.length > 0 && grupo.capturas.every((c: any) => Number(c.archivo_csv) === 1);
      grupo.tituloReporte = `Reporte de capturas - ${grupo.especie}`;

      return grupo;
    });

    this.gruposEspecies.sort((a: any, b: any) => String(a.especie || '').localeCompare(String(b.especie || '')));
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
        this.cerrarModalAnular();
        if (res.estado === 1) {
          this.mostrarNotificacion('Captura Anulada', 'El registro se ha retirado exitosamente de la faena.', 'exito');
          this.cargarReportes();
        } else {
          this.mostrarNotificacion('No se pudo anular', res.mensaje || 'Error al procesar la anulación.', 'error');
        }
      },
      error: (err) => {
        this.anulandoProceso = false;
        this.cerrarModalAnular();
        console.error('Error al anular captura:', err);
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
        enlace.download = `reporte_${especie}_${this.obtenerFechaActual()}.pdf`;
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
        enlace.download = `reporte_${especie}_${this.obtenerFechaActual()}.csv`;
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
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon, ToastController } from '@ionic/angular/standalone';
import { Auth } from 'src/app/servicios/auth';
import { formatearFechaHoraEcuador } from 'src/app/utilidades/fecha-ecuador';

interface ReporteAdmin {
  id_reporte: number;
  id_captura: number | null;
  id_usuario: number;
  id_tipo_reporte: number | null;
  titulo: string | null;
  archivo_pdf: number | null;
  archivo_csv: number | null;
  fecha_reporte: string;
  hora_reporte: string;
  fecha_generacion: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombre_completo: string;
  nombre_tipo: string | null;
  peso: number | null;
  fecha_captura: string | null;
  hora_captura: string | null;
  id_deteccion: number | null;
  porcentaje: number | null;
  imagen_url: string | null;
  id_especie: number | null;
  especie: string | null;
  nombre_cientifico: string | null;
  estado_reporte: 'Completo' | 'Incompleto';
  id_lote_envio: string | null;
  estado_revision: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | null;
  fecha_envio: string | null;
  motivo_rechazo: string | null;
  es_atrasado: number | boolean;
}

interface LotePendienteRevision extends ReporteAdmin {
  id_lote_envio: string;
  total_capturas: number;
}

interface TipoReporte {
  id_tipo_reporte: number;
  nombre_tipo: string;
}

@Component({
  selector: 'app-reportes-admin',
  templateUrl: './reportes-admin.component.html',
  styleUrls: ['./reportes-admin.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon]
})
export class ReportesAdminComponent implements OnInit {

  formatearFechaHora(fecha: string | null): string {
    return fecha ? formatearFechaHoraEcuador(fecha) : '—';
  }

  // ==========================================
  // REPORTES
  // ==========================================
  reportes: ReporteAdmin[] = [];
  reporteSeleccionado: ReporteAdmin | null = null;
  loteSeleccionadoRechazo: LotePendienteRevision | null = null;
  motivoRechazo = '';
  loteEnRevision: string | null = null;

  // ==========================================
  // TIPOS DE REPORTE
  // ==========================================
  tiposReporte: TipoReporte[] = [];

  // ==========================================
  // FILTROS
  // ==========================================
  busqueda = '';
  filtroEstado = 'Todos';

  // ==========================================
  // CARGA
  // ==========================================
  cargando = true;
  fechaEcuador = '';

  // ==========================================
  // RESUMEN
  // ==========================================
  total = 0;
  completos = 0;
  incompletos = 0;

  // ==========================================
  // EDICIÓN
  // ==========================================
  editando = false;
  guardando = false;
  generandoPDF = false;
  generandoCSV = false;
  tituloEditado = '';
  tipoEditado: number | null = null;

  constructor(
    private authService: Auth,
    private cdr: ChangeDetectorRef,
    private toastController: ToastController
  ) { }

  ngOnInit(): void {
    this.cargarTiposReporte();
    this.cargarReportes();
  }

  // ==========================================
  // REPORTES FILTRADOS
  // ==========================================
  get reportesFiltrados(): ReporteAdmin[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.reportes.filter(reporte => {
      if (reporte.estado_revision === 'PENDIENTE') {
        return false;
      }

      const coincideEstado =
        this.filtroEstado === 'Todos' ||
        reporte.estado_reporte === this.filtroEstado;

      const coincideBusqueda =
        !texto ||
        reporte.nombre_completo?.toLowerCase().includes(texto) ||
        reporte.correo?.toLowerCase().includes(texto) ||
        reporte.titulo?.toLowerCase().includes(texto) ||
        reporte.especie?.toLowerCase().includes(texto) ||
        reporte.nombre_tipo?.toLowerCase().includes(texto) ||
        String(reporte.id_reporte).includes(texto);

      return coincideEstado && coincideBusqueda;
    });
  }

  get lotesPendientesRevision(): LotePendienteRevision[] {
    const lotes = new Map<string, LotePendienteRevision>();
    const texto = this.busqueda.trim().toLowerCase();

    for (const reporte of this.reportes) {
      const idLoteEnvio = reporte.id_lote_envio;
      if (reporte.estado_revision !== 'PENDIENTE' || !idLoteEnvio) {
        continue;
      }

      const lote = lotes.get(idLoteEnvio);
      if (lote) {
        lote.total_capturas += 1;
      } else {
        lotes.set(idLoteEnvio, {
          ...reporte,
          id_lote_envio: idLoteEnvio,
          total_capturas: 1
        });
      }
    }

    return Array.from(lotes.values()).filter(reporte =>
      !texto ||
      reporte.nombre_completo?.toLowerCase().includes(texto) ||
      reporte.correo?.toLowerCase().includes(texto) ||
      reporte.titulo?.toLowerCase().includes(texto) ||
      reporte.especie?.toLowerCase().includes(texto) ||
      String(reporte.id_reporte).includes(texto)
    );
  }

  // ==========================================
  // CARGAR REPORTES DEL ADMINISTRADOR
  // ==========================================
  cargarReportes(): void {
    const idAdministrador = this.authService.obtenerIdUsuario();

    if (!idAdministrador) {
      this.cargando = false;
      this.mostrarToast(
        'No se pudo identificar al administrador.',
        'danger'
      );
      return;
    }

    this.cargando = true;

    this.authService
      .getReportesAdministradorHoy(idAdministrador)
      .subscribe({
        next: (respuesta: any) => {
          this.reportes = respuesta.data || [];
          this.fechaEcuador = respuesta.fecha_ecuador || '';

          this.total = respuesta.resumen?.total || 0;
          this.completos = respuesta.resumen?.completos || 0;
          this.incompletos = respuesta.resumen?.incompletos || 0;

          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          

          this.reportes = [];
          this.total = 0;
          this.completos = 0;
          this.incompletos = 0;
          this.cargando = false;

          this.mostrarToast(
            error.error?.mensaje ||
            'No se pudieron cargar los reportes.',
            'danger'
          );

          this.cdr.detectChanges();
        }
      });
  }

  // ==========================================
  // CARGAR TIPOS DE REPORTE
  // ==========================================
  cargarTiposReporte(): void {
    this.authService.getTiposReporte().subscribe({
      next: (respuesta: any) => {
        this.tiposReporte = respuesta.data || [];
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        

        this.tiposReporte = [];

        this.mostrarToast(
          'No se pudieron cargar los tipos de reporte.',
          'danger'
        );
      }
    });
  }

  // ==========================================
  // FILTRO
  // ==========================================
  seleccionarFiltro(filtro: string): void {
    this.filtroEstado = filtro;
  }

  // ==========================================
  // VER REPORTE
  // ==========================================
  verReporte(reporte: ReporteAdmin): void {
    this.reporteSeleccionado = reporte;
    this.editando = false;
    this.guardando = false;
    this.tituloEditado = '';
    this.tipoEditado = null;
  }

  // ==========================================
  // CERRAR DETALLE
  // ==========================================
  cerrarDetalle(): void {
    this.reporteSeleccionado = null;
    this.editando = false;
    this.guardando = false;
    this.generandoPDF = false;
    this.generandoCSV = false;
    this.tituloEditado = '';
    this.tipoEditado = null;
  }

  aprobarReporte(lote: LotePendienteRevision): void {
    const idAdministrador = this.authService.obtenerIdUsuario();
    if (!idAdministrador || this.loteEnRevision) {
      return;
    }

    this.loteEnRevision = lote.id_lote_envio;
    this.authService.aprobarLoteReporte(
      idAdministrador,
      lote.id_lote_envio
    ).subscribe({
      next: (respuesta: any) => {
        this.loteEnRevision = null;
        this.mostrarToast(
          respuesta.mensaje || 'Reporte aprobado correctamente.',
          'success'
        );
        this.cargarReportes();
      },
      error: (error: any) => {
        this.loteEnRevision = null;
        this.mostrarToast(
          error.error?.mensaje || 'No se pudo aprobar el reporte.',
          'danger'
        );
      }
    });
  }

  abrirRechazo(lote: LotePendienteRevision): void {
    if (this.loteEnRevision) {
      return;
    }

    this.loteSeleccionadoRechazo = lote;
    this.motivoRechazo = '';
  }

  cerrarRechazo(): void {
    if (this.loteEnRevision) {
      return;
    }

    this.loteSeleccionadoRechazo = null;
    this.motivoRechazo = '';
  }

  rechazarReporte(): void {
    const lote = this.loteSeleccionadoRechazo;
    const motivo = this.motivoRechazo.trim();
    const idAdministrador = this.authService.obtenerIdUsuario();

    if (!lote || !idAdministrador || this.loteEnRevision) {
      return;
    }
    if (motivo.length < 5 || motivo.length > 500) {
      this.mostrarToast(
        'Escribe un motivo de rechazo válido.',
        'danger'
      );
      return;
    }

    this.loteEnRevision = lote.id_lote_envio;
    this.authService.rechazarLoteReporte(
      idAdministrador,
      lote.id_lote_envio,
      motivo
    ).subscribe({
      next: (respuesta: any) => {
        this.loteEnRevision = null;
        this.cerrarRechazo();
        this.mostrarToast(
          respuesta.mensaje || 'Reporte devuelto para corrección.',
          'success'
        );
        this.cargarReportes();
      },
      error: (error: any) => {
        this.loteEnRevision = null;
        this.mostrarToast(
          error.error?.mensaje || 'No se pudo rechazar el reporte.',
          'danger'
        );
      }
    });
  }

  // ==========================================
  // INICIAR EDICIÓN
  // ==========================================
  iniciarEdicion(): void {
    if (!this.reporteSeleccionado) {
      return;
    }

    this.tituloEditado =
      this.reporteSeleccionado.titulo || '';

    this.tipoEditado =
      this.reporteSeleccionado.id_tipo_reporte
        ? Number(
          this.reporteSeleccionado.id_tipo_reporte
        )
        : null;

    this.editando = true;
  }

  // ==========================================
  // CANCELAR EDICIÓN
  // ==========================================
  cancelarEdicion(): void {
    this.editando = false;
    this.guardando = false;
    this.tituloEditado = '';
    this.tipoEditado = null;
  }

  // ==========================================
  // GUARDAR EDICIÓN
  // ==========================================
  guardarEdicion(): void {
    if (!this.reporteSeleccionado) {
      return;
    }

    const titulo = this.tituloEditado.trim();

    // VALIDAR TÍTULO
    if (!titulo) {
      this.mostrarToast(
        'El título del reporte es obligatorio.',
        'danger'
      );
      return;
    }

    // VALIDAR TIPO
    if (
      this.tipoEditado === null ||
      this.tipoEditado === undefined
    ) {
      this.mostrarToast(
        'Debe seleccionar un tipo de reporte.',
        'danger'
      );
      return;
    }

    // OBTENER ADMINISTRADOR
    const idAdministrador =
      this.authService.obtenerIdUsuario();

    if (!idAdministrador) {
      this.mostrarToast(
        'No se pudo identificar al administrador.',
        'danger'
      );
      return;
    }

    const idReporte =
      this.reporteSeleccionado.id_reporte;

    this.guardando = true;

    // ==========================================
    // ACTUALIZAR REPORTE
    // ==========================================
    this.authService
      .editarReporteAdmin(
        idAdministrador,
        idReporte,
        titulo,
        this.tipoEditado
      )
      .subscribe({
        next: (respuesta: any) => {
          this.guardando = false;
          this.editando = false;

          this.mostrarToast(
            respuesta.mensaje ||
            'Reporte actualizado correctamente.',
            'success'
          );

          // CERRAR DETALLE
          this.reporteSeleccionado = null;

          // LIMPIAR FORMULARIO
          this.tituloEditado = '';
          this.tipoEditado = null;

          // VOLVER A CONSULTAR LOS REPORTES
          // PARA ACTUALIZAR COMPLETOS / INCOMPLETOS
          this.cargarReportes();
        },
        error: (error: any) => {
          

          this.guardando = false;

          this.mostrarToast(
            error.error?.mensaje ||
            'No se pudo actualizar el reporte.',
            'danger'
          );
        }
      });
  }

  // ==========================================
  // FORMATEAR FECHA
  // ==========================================
  formatearFecha(fecha: string): string {
    if (!fecha) {
      return '—';
    }

    const partes = fecha.split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  // ==========================================
  // FORMATEAR PESO
  // ==========================================
  formatearPeso(
    peso: number | null
  ): string {
    if (
      peso === null ||
      peso === undefined
    ) {
      return '—';
    }

    return `${Number(peso).toFixed(2)} g`;
  }

  // ==========================================
  // FORMATEAR CONFIANZA
  // ==========================================
  formatearConfianza(
    porcentaje: number | null
  ): string {
    if (
      porcentaje === null ||
      porcentaje === undefined
    ) {
      return '—';
    }

    return `${Number(porcentaje).toFixed(2)} %`;
  }

  // ==========================================
  // TOAST
  // ==========================================
  private async mostrarToast(
    mensaje: string,
    color: string
  ): Promise<void> {
    const toast =
      await this.toastController.create({
        message: mensaje,
        duration: 2500,
        color,
        position: 'bottom'
      });

    await toast.present();
  }
  generarPDF(): void {
    if (!this.reporteSeleccionado) return;

    if (
      !this.reporteSeleccionado.titulo ||
      !this.reporteSeleccionado.id_tipo_reporte
    ) {
      this.mostrarToast(
        'Complete el título y el tipo de reporte antes de generar el PDF.',
        'danger'
      );
      return;
    }

    const idAdministrador = this.authService.obtenerIdUsuario();

    if (!idAdministrador) {
      this.mostrarToast(
        'No se pudo identificar al administrador.',
        'danger'
      );
      return;
    }

    const idReporte = this.reporteSeleccionado.id_reporte;

    this.generandoPDF = true;

    this.authService
      .generarPDFReporteAdmin(idAdministrador, idReporte)
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const enlace = document.createElement('a');

          enlace.href = url;
          enlace.download = `Reporte_${idReporte}.pdf`;

          document.body.appendChild(enlace);
          enlace.click();
          document.body.removeChild(enlace);

          window.URL.revokeObjectURL(url);

          if (this.reporteSeleccionado) {
            this.reporteSeleccionado.archivo_pdf = 1;
          }

          const reporte = this.reportes.find(
            r => r.id_reporte === idReporte
          );

          if (reporte) {
            reporte.archivo_pdf = 1;
          }

          this.generandoPDF = false;

          this.mostrarToast(
            'PDF generado correctamente.',
            'success'
          );

          this.cdr.detectChanges();
        },
        error: (error: any) => {
          

          this.generandoPDF = false;

          this.mostrarToast(
            'No se pudo generar el PDF.',
            'danger'
          );

          this.cdr.detectChanges();
        }
      });
  }
  generarCSV(): void {
    if (!this.reporteSeleccionado) return;

    if (
      !this.reporteSeleccionado.titulo ||
      !this.reporteSeleccionado.id_tipo_reporte
    ) {
      this.mostrarToast(
        'Complete el título y el tipo de reporte antes de generar el CSV.',
        'danger'
      );
      return;
    }

    const idAdministrador = this.authService.obtenerIdUsuario();

    if (!idAdministrador) {
      this.mostrarToast(
        'No se pudo identificar al administrador.',
        'danger'
      );
      return;
    }

    const idReporte = this.reporteSeleccionado.id_reporte;

    this.generandoCSV = true;

    this.authService
      .generarCSVReporteAdmin(idAdministrador, idReporte)
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const enlace = document.createElement('a');

          enlace.href = url;
          enlace.download = `Reporte_${idReporte}.csv`;

          document.body.appendChild(enlace);
          enlace.click();
          document.body.removeChild(enlace);

          window.URL.revokeObjectURL(url);

          if (this.reporteSeleccionado) {
            this.reporteSeleccionado.archivo_csv = 1;
          }

          const reporte = this.reportes.find(
            r => r.id_reporte === idReporte
          );

          if (reporte) {
            reporte.archivo_csv = 1;
          }

          this.generandoCSV = false;

          this.mostrarToast(
            'CSV generado correctamente.',
            'success'
          );

          this.cdr.detectChanges();
        },
        error: (error: any) => {
          

          this.generandoCSV = false;

          this.mostrarToast(
            'No se pudo generar el CSV.',
            'danger'
          );

          this.cdr.detectChanges();
        }
      });
  }
}
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Subject, takeUntil, timeout, finalize } from 'rxjs';
import { ReporteS } from 'src/app/servicios/reporte-s';
import { Auth } from 'src/app/servicios/auth';
import {
  formatearFechaEcuador,
  formatearHoraEcuador,
  obtenerFechaEcuador
} from 'src/app/utilidades/fecha-ecuador';

interface GrupoReportes {
  fecha: string;
  reportes: any[];
}

@Component({
  selector: 'app-mis-reportes',
  templateUrl: './mis-reportes.component.html',
  styleUrls: ['./mis-reportes.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class MisReportesComponent implements OnInit, OnDestroy {
  reportes: any[] = [];
  reportesDeHoy: any[] = [];
  reportesAnteriores: GrupoReportes[] = [];
  especies: any[] = [];
  tiposReporte: any[] = [];
  cargando = false;
  error = '';

  filtros = {
    fecha_inicio: '',
    fecha_fin: '',
    id_especie: '',
    id_tipo_reporte: '',
    busqueda: ''
  };

  paginaActual = 1;
  limite = 10;
  totalReportes = 0;
  totalPaginas = 0;
  tieneAnterior = false;
  tieneSiguiente = false;

  reporteDetalle: any = null;
  mostrarDetalle = false;
  cargandoDetalle = false;
  errorDetalle = '';
  fechaHoy = obtenerFechaEcuador();

  private destruir$ = new Subject<void>();
  private cancelarHistorial$ = new Subject<void>();
  private cancelarDetalle$ = new Subject<void>();
  private solicitudHistorial = 0;

  constructor(
    private reporteService: ReporteS,
    private authService: Auth
  ) { }

  ngOnInit(): void {
    this.cargarTiposReporte();
    this.cargarEspecies();
    this.cargarReportes();
  }

  ngOnDestroy(): void {
    this.cancelarHistorial$.next();
    this.cancelarHistorial$.complete();
    this.cancelarDetalle$.next();
    this.cancelarDetalle$.complete();
    this.destruir$.next();
    this.destruir$.complete();
  }

  private obtenerFechaReporte(reporte: any): string {
    const fecha = String(reporte?.fecha || '');
    const coincidencia = fecha.match(/^\d{4}-\d{2}-\d{2}/);
    return coincidencia ? coincidencia[0] : '';
  }

  private organizarReportes(): void {
    const grupos = new Map<string, any[]>();
    this.reportesDeHoy = [];

    for (const reporte of this.reportes) {
      const fecha = this.obtenerFechaReporte(reporte);
      if (fecha === this.fechaHoy) {
        this.reportesDeHoy.push(reporte);
      } else if (fecha) {
        if (!grupos.has(fecha)) grupos.set(fecha, []);
        grupos.get(fecha)!.push(reporte);
      }
    }

    this.reportesAnteriores = Array.from(
      grupos,
      ([fecha, reportes]) => ({ fecha, reportes })
    ).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  private limpiarResultados(): void {
    this.reportes = [];
    this.reportesDeHoy = [];
    this.reportesAnteriores = [];
    this.totalReportes = 0;
    this.totalPaginas = 0;
    this.tieneAnterior = false;
    this.tieneSiguiente = false;
  }

  cargarReportes(): void {
    this.fechaHoy = obtenerFechaEcuador();
    const idUsuario = this.authService.obtenerIdUsuario();
    this.cancelarHistorial$.next();
    const solicitud = ++this.solicitudHistorial;

    if (!idUsuario) {
      this.cargando = false;
      this.error = 'No se pudo identificar al usuario.';
      return;
    }

    if (this.filtros.fecha_inicio && this.filtros.fecha_fin &&
      this.filtros.fecha_inicio > this.filtros.fecha_fin) {
      this.cargando = false;
      this.error = 'La fecha inicial no puede ser mayor que la fecha final.';
      return;
    }

    this.cargando = true;
    this.error = '';

    this.reporteService.obtenerHistorialReportes({
      ...this.filtros,
      id_usuario: idUsuario,
      pagina: this.paginaActual,
      limite: this.limite
    }).pipe(
      timeout(15000),
      takeUntil(this.cancelarHistorial$),
      takeUntil(this.destruir$),
      finalize(() => {
        if (solicitud === this.solicitudHistorial) this.cargando = false;
      })
    ).subscribe({
      next: respuesta => {
        if (solicitud !== this.solicitudHistorial) return;

        if (!Array.isArray(respuesta?.data)) {
          this.limpiarResultados();
          this.error = 'El servidor devolvió un formato inesperado.';
          return;
        }

        this.reportes = respuesta.data;
        this.organizarReportes();
        const p = respuesta.paginacion || {};
        this.paginaActual = Number(p.pagina_actual ?? 1);
        this.totalReportes = Number(p.total_reportes ?? 0);
        this.totalPaginas = Number(p.total_paginas ?? 0);
        this.tieneAnterior = Boolean(p.tiene_anterior);
        this.tieneSiguiente = Boolean(p.tiene_siguiente);
      },
      error: err => {
        if (solicitud !== this.solicitudHistorial) return;
        console.error('[MIS REPORTES] Error en historial:', err);
        this.limpiarResultados();
        this.error = err?.name === 'TimeoutError'
          ? 'El servidor no respondió en 15 segundos. Revisa la solicitud de historial en Network.'
          : err?.error?.mensaje || 'No se pudo cargar el historial.';
      }
    });
  }

  cargarEspecies(): void {
    this.reporteService.obtenerEspeciesFiltro().pipe(
      timeout(15000),
      takeUntil(this.destruir$)
    ).subscribe({
      next: r => this.especies = Array.isArray(r?.data) ? r.data : [],
      error: err => {
        console.error('[MIS REPORTES] Error en especies:', err);
        this.especies = [];
      }
    });
  }

  cargarTiposReporte(): void {
    this.reporteService.obtenerTiposReporte().pipe(
      timeout(15000),
      takeUntil(this.destruir$)
    ).subscribe({
      next: r => this.tiposReporte = Array.isArray(r?.data) ? r.data : [],
      error: err => {
        console.error('[MIS REPORTES] Error en tipos:', err);
        this.tiposReporte = [];
      }
    });
  }

  buscar(): void {
    this.paginaActual = 1;
    this.cargarReportes();
  }

  limpiarFiltros(): void {
    this.filtros = {
      fecha_inicio: '',
      fecha_fin: '',
      id_especie: '',
      id_tipo_reporte: '',
      busqueda: ''
    };
    this.buscar();
  }

  paginaAnterior(): void {
    if (!this.tieneAnterior || this.cargando) return;
    this.paginaActual--;
    this.cargarReportes();
  }

  paginaSiguiente(): void {
    if (!this.tieneSiguiente || this.cargando) return;
    this.paginaActual++;
    this.cargarReportes();
  }

  cambiarLimite(): void {
    this.buscar();
  }

  verDetalle(reporte: any): void {
    const idUsuario = this.authService.obtenerIdUsuario();
    this.cancelarDetalle$.next();
    this.mostrarDetalle = true;
    this.cargandoDetalle = false;
    this.errorDetalle = '';
    this.reporteDetalle = null;

    if (!idUsuario) {
      this.errorDetalle = 'No se pudo identificar al usuario.';
      return;
    }

    this.cargandoDetalle = true;
    this.reporteService.obtenerDetalleReporte({
      id_usuario: idUsuario,
      id_especie: Number(reporte.id_especie),
      id_tipo_reporte: Number(reporte.id_tipo_reporte),
      titulo: String(reporte.titulo || ''),
      fecha: this.obtenerFechaReporte(reporte)
    }).pipe(
      timeout(15000),
      takeUntil(this.cancelarDetalle$),
      takeUntil(this.destruir$)
    ).subscribe({
      next: respuesta => {
        this.cargandoDetalle = false;
        if (!respuesta?.data) {
          this.errorDetalle = 'No se encontró el detalle del reporte.';
          return;
        }
        this.reporteDetalle = respuesta.data;
      },
      error: err => {
        console.error('[MIS REPORTES] Error en detalle:', err);
        this.cargandoDetalle = false;
        this.errorDetalle = err?.name === 'TimeoutError'
          ? 'La consulta tardó demasiado.'
          : err?.error?.mensaje || 'No se pudo cargar el detalle.';
      }
    });
  }

  cerrarDetalle(): void {
    this.cancelarDetalle$.next();
    this.mostrarDetalle = false;
    this.cargandoDetalle = false;
    this.reporteDetalle = null;
    this.errorDetalle = '';
  }

  formatearHora(fecha: string): string {
    return formatearHoraEcuador(fecha);
  }

  formatearFecha(fecha: string): string {
    return formatearFechaEcuador(fecha);
  }
}

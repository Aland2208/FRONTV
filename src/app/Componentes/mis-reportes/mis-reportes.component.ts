import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ReporteS } from 'src/app/servicios/reporte-s';
import { Auth } from 'src/app/servicios/auth';

@Component({
  selector: 'app-mis-reportes',
  templateUrl: './mis-reportes.component.html',
  styleUrls: ['./mis-reportes.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class MisReportesComponent implements OnInit {

  reportes: any[] = [];
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
  constructor(
    private reporteService: ReporteS,
    private authService: Auth
  ) { }

  ngOnInit() {
    this.cargarTiposReporte();
    this.cargarEspecies();
    this.cargarReportes();
  }

  // ==========================================
  // CARGAR HISTORIAL
  // ==========================================

  cargarReportes() {
    const idUsuario = this.authService.obtenerIdUsuario();

    if (!idUsuario) {
      this.error = 'No se pudo identificar al usuario.';
      return;
    }

    if (
      this.filtros.fecha_inicio &&
      this.filtros.fecha_fin &&
      this.filtros.fecha_inicio > this.filtros.fecha_fin
    ) {
      this.error = 'La fecha inicial no puede ser mayor que la fecha final.';
      return;
    }

    const filtros = {
      id_usuario: idUsuario,
      fecha_inicio: this.filtros.fecha_inicio,
      fecha_fin: this.filtros.fecha_fin,
      id_especie: this.filtros.id_especie,
      id_tipo_reporte: this.filtros.id_tipo_reporte,
      busqueda: this.filtros.busqueda,
      pagina: this.paginaActual,
      limite: this.limite
    };

    this.cargando = true;
    this.error = '';

    this.reporteService.obtenerHistorialReportes(filtros).subscribe({
      next: (respuesta) => {
        this.reportes = respuesta.data || [];

        const paginacion = respuesta.paginacion || {};

        this.paginaActual = Number(paginacion.pagina_actual || 1);
        this.totalReportes = Number(paginacion.total_reportes || 0);
        this.totalPaginas = Number(paginacion.total_paginas || 0);
        this.tieneAnterior = !!paginacion.tiene_anterior;
        this.tieneSiguiente = !!paginacion.tiene_siguiente;

        this.cargando = false;

        console.log('📚 Historial:', this.reportes);
      },

      error: (err) => {
        console.error('❌ Error cargando historial:', err);

        this.reportes = [];
        this.totalReportes = 0;
        this.totalPaginas = 0;
        this.tieneAnterior = false;
        this.tieneSiguiente = false;
        this.cargando = false;

        this.error =
          err?.error?.mensaje ||
          'No se pudo cargar el historial de reportes.';
      }
    });
  }

  // ==========================================
  // CARGAR ESPECIES
  // ==========================================

  cargarEspecies() {
    this.reporteService.obtenerEspeciesFiltro().subscribe({
      next: (respuesta) => {
        this.especies = respuesta.data || [];

        console.log('🐟 Especies:', this.especies);
      },

      error: (err) => {
        console.error('❌ Error cargando especies:', err);
        this.especies = [];
      }
    });
  }

  // ==========================================
  // CARGAR TIPOS DE REPORTE
  // ==========================================

  cargarTiposReporte() {
    this.reporteService.obtenerTiposReporte().subscribe({
      next: (respuesta) => {
        this.tiposReporte = respuesta.data || [];

        console.log('📄 Tipos de reporte:', this.tiposReporte);
      },

      error: (err) => {
        console.error('❌ Error cargando tipos:', err);
        this.tiposReporte = [];
      }
    });
  }

  // ==========================================
  // BUSCAR
  // ==========================================

  buscar() {
    this.paginaActual = 1;
    this.cargarReportes();
  }

  // ==========================================
  // LIMPIAR FILTROS
  // ==========================================

  limpiarFiltros() {
    this.filtros = {
      fecha_inicio: '',
      fecha_fin: '',
      id_especie: '',
      id_tipo_reporte: '',
      busqueda: ''
    };

    this.paginaActual = 1;
    this.cargarReportes();
  }

  // ==========================================
  // PÁGINA ANTERIOR
  // ==========================================

  paginaAnterior() {
    if (!this.tieneAnterior || this.cargando) return;

    this.paginaActual--;
    this.cargarReportes();
  }

  // ==========================================
  // PÁGINA SIGUIENTE
  // ==========================================

  paginaSiguiente() {
    if (!this.tieneSiguiente || this.cargando) return;

    this.paginaActual++;
    this.cargarReportes();
  }

  // ==========================================
  // CAMBIAR CANTIDAD POR PÁGINA
  // ==========================================

  cambiarLimite() {
    this.paginaActual = 1;
    this.cargarReportes();
  }
  verDetalle(reporte: any) {
    const idUsuario = this.authService.obtenerIdUsuario();

    if (!idUsuario) {
      this.errorDetalle = 'No se pudo identificar al usuario.';
      return;
    }

    this.mostrarDetalle = true;
    this.cargandoDetalle = true;
    this.errorDetalle = '';
    this.reporteDetalle = null;

    const datos = {
      id_usuario: idUsuario,
      id_especie: Number(reporte.id_especie),
      id_tipo_reporte: Number(reporte.id_tipo_reporte),
      titulo: reporte.titulo,
      fecha: reporte.fecha?.substring(0, 10)
    };

    this.reporteService.obtenerDetalleReporte(datos).subscribe({
      next: (respuesta) => {
        this.reporteDetalle = respuesta.data;
        this.cargandoDetalle = false;
        console.log('📋 Detalle reporte:', this.reporteDetalle);
      },
      error: (err) => {
        console.error('❌ Error obteniendo detalle:', err);
        this.cargandoDetalle = false;
        this.errorDetalle = err?.error?.mensaje || 'No se pudo cargar el detalle del reporte.';
      }
    });
  }

  cerrarDetalle() {
    this.mostrarDetalle = false;
    this.reporteDetalle = null;
    this.errorDetalle = '';
  }
  // ==========================================
  // FORMATEAR HORA
  // ==========================================

  formatearHora(fechaHora: string): string {
    if (!fechaHora) return '--:--';

    const texto = String(fechaHora);

    // Ejemplo: 2026-10-06T14:35:20.000Z
    if (texto.includes('T')) {
      return texto.substring(11, 16);
    }

    // Ejemplo: 2026-10-06 14:35:20
    if (texto.includes(' ')) {
      return texto.split(' ')[1]?.substring(0, 5) || '--:--';
    }

    return '--:--';
  }
}
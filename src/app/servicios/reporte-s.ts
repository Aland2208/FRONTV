import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class ReporteS {

  private api =
    environment.apiUrl + 'reporte';


  constructor(
    private http: HttpClient
  ) { }


  // ==========================================
  // OBTENER REPORTES PENDIENTES DE HOY
  // ==========================================

  obtenerReportesPendientesHoy(
    idUsuario: number
  ): Observable<any> {

    return this.http.get(
      `${this.api}/pendientes/hoy/${idUsuario}`
    );

  }


  // ==========================================
  // OBTENER TODAS LAS CAPTURAS DEL USUARIO
  // ==========================================

  obtenerReporteCapturas(
    idUsuario: number
  ): Observable<any> {

    return this.http.get(
      `${this.api}/capturas/${idUsuario}`
    );

  }


  // ==========================================
  // OBTENER CAPTURAS POR RANGO DE FECHAS
  // ==========================================

  obtenerReportePorFechas(
    idUsuario: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<any> {

    return this.http.get(
      `${this.api}/capturas/${idUsuario}/fecha`,
      {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        }
      }
    );

  }


  // ==========================================
  // OBTENER RESUMEN POR ESPECIES
  // ==========================================

  obtenerResumenEspecies(
    idUsuario: number
  ): Observable<any> {

    return this.http.get(
      `${this.api}/especies/${idUsuario}`
    );

  }

  // ==========================================
  // GENERAR PDF POR ESPECIE
  // ==========================================

  generarPDFEspecie(
    datos: {
      id_usuario: number;
      id_especie: number;
      ids_reportes: number[];
      id_tipo_reporte: number;
      titulo: string;
    }
  ): Observable<Blob> {

    return this.http.post(
      `${this.api}/generar-pdf-especie`,
      datos,
      {
        responseType: 'blob'
      }
    );

  }


  // ==========================================
  // GENERAR CSV POR ESPECIE
  // ==========================================

  generarCSVEspecie(
    datos: {
      id_usuario: number;
      id_especie: number;
      ids_reportes: number[];
      id_tipo_reporte: number;
      titulo: string;
    }
  ): Observable<Blob> {

    return this.http.post(
      `${this.api}/generar-csv-especie`,
      datos,
      {
        responseType: 'blob'
      }
    );

  }
  // ==========================================
  // ENVIAR REPORTE
  // ==========================================

  enviarReporteEspecie(datos: {
    id_usuario: number;
    id_especie: number;
    ids_reportes: number[];
    id_tipo_reporte: number;
    titulo: string;
  }): Observable<any> {
    return this.http.patch(`${this.api}/enviar-especie`, datos);
  }
  // ==========================================
  // HISTORIAL CON FILTROS Y PAGINACIÓN
  // ==========================================

  obtenerTiposReporte(): Observable<any> {
    return this.http.get(`${this.api}/tipos`);
  }

  obtenerHistorialReportes(filtros: any): Observable<any> {
    const params: any = {
      id_usuario: filtros.id_usuario,
      pagina: filtros.pagina || 1,
      limite: filtros.limite || 10
    };

    if (filtros.fecha_inicio) params.fecha_inicio = filtros.fecha_inicio;
    if (filtros.fecha_fin) params.fecha_fin = filtros.fecha_fin;
    if (filtros.id_especie) params.id_especie = filtros.id_especie;
    if (filtros.id_observador) params.id_observador = filtros.id_observador;
    if (filtros.id_tipo_reporte) params.id_tipo_reporte = filtros.id_tipo_reporte;
    if (filtros.busqueda?.trim()) params.busqueda = filtros.busqueda.trim();

    return this.http.get(`${this.api}/historial`, { params });
  }

  obtenerEspeciesFiltro(): Observable<any> {
    return this.http.get(`${this.api}/filtros/especies`);
  }
  obtenerDetalleReporte(datos: {
    id_usuario: number;
    id_especie: number;
    id_tipo_reporte: number;
    titulo: string;
    fecha: string;
  }): Observable<any> {
    return this.http.get(`${this.api}/historial/detalle`, {
      params: {
        id_usuario: datos.id_usuario,
        id_especie: datos.id_especie,
        id_tipo_reporte: datos.id_tipo_reporte,
        titulo: datos.titulo,
        fecha: datos.fecha
      }
    });
  }
}
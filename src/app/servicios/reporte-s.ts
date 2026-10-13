
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReporteS {
  private api = `${environment.apiUrl.replace(/\/+$/, '')}/reporte`;

  constructor(private http: HttpClient) { }

  obtenerReportesPendientesHoy(idUsuario: number): Observable<any> {
    return this.http.get(`${this.api}/pendientes/hoy/${idUsuario}`);
  }

  obtenerReportesPendientesAnteriores(
    idUsuario: number, fechaInicio: string, fechaFin: string
  ): Observable<any> {
    return this.http.get(`${this.api}/pendientes/anteriores/${idUsuario}`, {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
    });
  }

  obtenerReporteCapturas(idUsuario: number): Observable<any> {
    return this.http.get(`${this.api}/capturas/${idUsuario}`);
  }

  obtenerReportePorFechas(
    idUsuario: number, fechaInicio: string, fechaFin: string
  ): Observable<any> {
    return this.http.get(`${this.api}/capturas/${idUsuario}/fecha`, {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
    });
  }

  obtenerResumenEspecies(idUsuario: number): Observable<any> {
    return this.http.get(`${this.api}/especies/${idUsuario}`);
  }

  generarPDFEspecie(datos: {
    id_usuario: number;
    id_especie: number;
    ids_reportes: number[];
    id_tipo_reporte: number;
    titulo: string;
  }): Observable<Blob> {
    return this.http.post(`${this.api}/generar-pdf-especie`, datos, {
      responseType: 'blob'
    });
  }

  generarCSVEspecie(datos: {
    id_usuario: number;
    id_especie: number;
    ids_reportes: number[];
    id_tipo_reporte: number;
    titulo: string;
  }): Observable<Blob> {
    return this.http.post(`${this.api}/generar-csv-especie`, datos, {
      responseType: 'blob'
    });
  }

  enviarReporteEspecie(datos: {
    id_usuario: number;
    id_especie: number;
    ids_reportes: number[];
    id_tipo_reporte: number;
    titulo: string;
  }): Observable<any> {
    return this.http.patch(`${this.api}/enviar-especie`, datos);
  }

  obtenerTiposReporte(): Observable<any> {
    return this.http.get(`${this.api}/tipos`);
  }

  obtenerEspeciesFiltro(): Observable<any> {
    return this.http.get(`${this.api}/filtros/especies`);
  }

  obtenerHistorialReportes(filtros: any): Observable<any> {
    let params = new HttpParams()
      .set('id_usuario', String(filtros.id_usuario))
      .set('pagina', String(filtros.pagina || 1))
      .set('limite', String(filtros.limite || 10));

    const opcionales = [
      'fecha_inicio', 'fecha_fin', 'id_especie',
      'id_observador', 'id_tipo_reporte', 'busqueda'
    ];

    for (const campo of opcionales) {
      const valor = filtros[campo];
      if (valor !== undefined && valor !== null && String(valor).trim()) {
        params = params.set(campo, String(valor).trim());
      }
    }

    return this.http.get(`${this.api}/historial`, { params });
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

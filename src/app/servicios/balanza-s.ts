import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BalanzaS {
  private api = environment.apiUrl + 'captura';

  constructor(private http: HttpClient) { }

  obtenerUltimoPeso(): Observable<any> {
    return this.http.get(`${this.api}/ultimo`);
  }

  obtenerPesos(): Observable<any> {
    return this.http.get(this.api);
  }

  desactivarPeso(id: number): Observable<any> {
    return this.http.patch(`${this.api}/desactivar/${id}`, {});
  }

  activarPeso(id: number): Observable<any> {
    return this.http.patch(`${this.api}/activar/${id}`, {});
  }

  registrarCaptura(datos: { peso: number, id_especie: number, id_usuario?: number, imagen_url?: string, porcentaje?: number }): Observable<any> {
    return this.http.post(`${this.api}/guardar`, datos);
  }

  anularCaptura(idCaptura: number, idUsuario: number): Observable<any> {
    return this.http.patch(`${this.api}/anular/${idCaptura}`, {
      id_usuario: idUsuario
    });
  }
}
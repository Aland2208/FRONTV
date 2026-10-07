import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BalanzaS {
  private api = environment.apiUrl + 'captura'; // Asegúrate que apunte a tu ruta de capturas

  constructor(
    private http: HttpClient
  ) { }

  // Obtener último peso registrado
  obtenerUltimoPeso(): Observable<any> {
    return this.http.get(`${this.api}/ultimo`);
  }

  // Obtener todos los pesos registrados
  obtenerPesos(): Observable<any> {
    return this.http.get(this.api);
  }

  // Desactivar registro
  desactivarPeso(id: number): Observable<any> {
    return this.http.patch(`${this.api}/desactivar/${id}`, {});
  }

  // Activar registro
  activarPeso(id: number): Observable<any> {
    return this.http.patch(`${this.api}/activar/${id}`, {});
  }

  // CORREGIDO: Cambiamos "id_deteccion" por "id_especie" para coincidir con Node.js
  registrarCaptura(datos: { peso: number, id_especie: number, id_usuario?: number, imagen_url?: string }): Observable<any> {
    return this.http.post(
      `${this.api}/guardar`,
      datos
    );
  }
}
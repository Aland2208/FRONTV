import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class Auth {
    private apiUrl = `${environment.apiUrl}auth`;

    constructor(private http: HttpClient) { }

    // ==========================================
    // AUTENTICACIÓN
    // ==========================================

    // 1. INICIAR SESIÓN
    login(datos: { correo: string; password: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, datos);
    }

    // 2. REGISTRAR USUARIO
    registro(datos: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/registro`, datos);
    }

    // 3. SOLICITAR RECUPERACIÓN
    solicitarRecuperacion(correo: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/recuperar`, { correo });
    }

    // 4. RESTABLECER CONTRASEÑA
    restablecerPassword(token: string, nuevaPassword: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/restablecer`, {
            token,
            nuevaPassword
        });
    }

    // ==========================================
    // PERFIL
    // ==========================================

    // 5. OBTENER PERFIL
    obtenerPerfil(idUsuario: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/perfil/${idUsuario}`);
    }

    // 6. ACTUALIZAR PERFIL
    actualizarPerfil(
        idUsuario: number,
        datos: {
            nombre: string;
            apellido: string;
            correo: string;
        }
    ): Observable<any> {
        return this.http.patch(
            `${this.apiUrl}/perfil/${idUsuario}`,
            datos
        );
    }

    // 7. CAMBIAR CONTRASEÑA
    cambiarPassword(
        idUsuario: number,
        passwordActual: string,
        nuevaPassword: string
    ): Observable<any> {
        return this.http.patch(
            `${this.apiUrl}/cambiar-password/${idUsuario}`,
            {
                passwordActual,
                nuevaPassword
            }
        );
    }

    // ==========================================
    // MANEJO DEL TOKEN Y SESIÓN
    // ==========================================

    guardarSesion(
        token: string,
        idUsuario: number,
        nombre: string,
        idRol: number
    ): void {
        sessionStorage.setItem('veedor_token', token);
        sessionStorage.setItem('veedor_id', idUsuario.toString());
        sessionStorage.setItem('veedor_nombre', nombre);
        sessionStorage.setItem('veedor_rol', idRol.toString());
    }

    obtenerToken(): string | null {
        return sessionStorage.getItem('veedor_token');
    }

    obtenerIdUsuario(): number | null {
        const id = sessionStorage.getItem('veedor_id');
        return id ? Number(id) : null;
    }

    obtenerNombre(): string | null {
        return sessionStorage.getItem('veedor_nombre');
    }

    obtenerRol(): number | null {
        const rol = sessionStorage.getItem('veedor_rol');
        return rol ? Number(rol) : null;
    }

    actualizarNombre(nombre: string): void {
        sessionStorage.setItem('veedor_nombre', nombre);
    }

    cerrarSesion(): void {
        // Sesión actual
        sessionStorage.removeItem('veedor_token');
        sessionStorage.removeItem('veedor_id');
        sessionStorage.removeItem('veedor_nombre');
        sessionStorage.removeItem('veedor_rol');

        // Limpia sesiones antiguas que quedaron en localStorage
        localStorage.removeItem('veedor_token');
        localStorage.removeItem('veedor_id');
        localStorage.removeItem('veedor_nombre');
        localStorage.removeItem('veedor_rol');
    }

    estaAutenticado(): boolean {
        return !!this.obtenerToken();
    }

    // ==========================================
    // ADMINISTRADOR DEL VEEDOR
    // ==========================================

    buscarAdministradorPorCorreo(correo: string): Observable<any> {
        return this.http.get(
            `${environment.apiUrl}administrador/buscar`,
            {
                params: { correo }
            }
        );
    }

    asignarAdministrador(
        idAdministrador: number,
        idUsuario: number
    ): Observable<any> {
        return this.http.post(
            `${environment.apiUrl}administrador/asignar/${idAdministrador}`,
            {
                id_usuario: idUsuario
            }
        );
    }

    reasignarAdministrador(
        idUsuario: number,
        idAdministrador: number
    ): Observable<any> {
        return this.http.patch(
            `${environment.apiUrl}administrador/reasignar/${idUsuario}`,
            {
                id_administrador: idAdministrador
            }
        );
    }

    obtenerAdministradorActual(idUsuario: number): Observable<any> {
        return this.http.get(
            `${environment.apiUrl}administrador/actual/${idUsuario}`
        );
    }

    // ==========================================
    // GESTIÓN DE OBSERVADORES
    // ==========================================

    getObservadores(): Observable<any> {
        return this.http.get(
            `${environment.apiUrl}usuarios/observadores`
        );
    }

    crearObservador(datos: {
        nombre: string;
        apellido: string;
        correo: string;
        password: string;
    }): Observable<any> {
        return this.http.post(
            `${environment.apiUrl}usuarios/observadores`,
            datos
        );
    }

    editarObservador(
        idUsuario: number,
        datos: {
            nombre: string;
            apellido: string;
            correo: string;
        }
    ): Observable<any> {
        return this.http.patch(
            `${environment.apiUrl}usuarios/observadores/${idUsuario}`,
            datos
        );
    }

    cambiarEstadoObservador(
        idUsuario: number,
        estado: number
    ): Observable<any> {
        return this.http.patch(
            `${environment.apiUrl}usuarios/observadores/${idUsuario}/estado`,
            {
                estado
            }
        );
    }

    // ==========================================
    // REPORTES DEL ADMINISTRADOR
    // ==========================================

    getReportesAdministradorHoy(
        idAdministrador: number
    ): Observable<any> {
        return this.http.get(
            `${environment.apiUrl}reporte/admin/hoy/${idAdministrador}`
        );
    }

    editarReporteAdmin(
        idAdministrador: number,
        idReporte: number,
        titulo: string,
        idTipoReporte: number
    ): Observable<any> {
        return this.http.patch(
            `${environment.apiUrl}reporte/admin/${idAdministrador}/reporte/${idReporte}`,
            {
                titulo,
                id_tipo_reporte: idTipoReporte
            }
        );
    }

    getTiposReporte(): Observable<any> {
        return this.http.get(
            `${environment.apiUrl}reporte/tipos`
        );
    }

    generarPDFReporteAdmin(
        idAdministrador: number,
        idReporte: number
    ): Observable<Blob> {
        return this.http.get(
            `${environment.apiUrl}reporte/admin/${idAdministrador}/reporte/${idReporte}/pdf`,
            {
                responseType: 'blob'
            }
        );
    }

    generarCSVReporteAdmin(
        idAdministrador: number,
        idReporte: number
    ): Observable<Blob> {
        return this.http.get(
            `${environment.apiUrl}reporte/admin/${idAdministrador}/reporte/${idReporte}/csv`,
            {
                responseType: 'blob'
            }
        );
    }

    // ==========================================
    // HISTORIAL DE VEEDORES
    // ==========================================

    getVeedoresHistorial(
        idAdministrador: number
    ): Observable<any> {
        return this.http.get(
            `${environment.apiUrl}administrador/${idAdministrador}/veedores/historial`
        );
    }

    getReportesHistorialVeedor(
        idAdministrador: number,
        idUsuario: number
    ): Observable<any> {
        return this.http.get(
            `${environment.apiUrl}administrador/${idAdministrador}/veedores/${idUsuario}/reportes`
        );
    }
    validarTokenRecuperacion(token: string) {
        return this.http.get<any>(
            `${environment.apiUrl}auth/validar-reset/${encodeURIComponent(token)}`
        );
    }

    // ==========================================
    // CONFIGURACIÓN DE CÁMARA
    // ==========================================

    guardarUrlCamara(idAdministrador: number, urlCamara: string): Observable<any> {
        return this.http.post(
            `${environment.apiUrl}administrador/config/url-camara`,
            {
                id_administrador: idAdministrador,
                url_camara: urlCamara
            }
        );
    }

    obtenerUrlCamaraVinculada(idUsuario: number): Observable<any> {
        return this.http.get(
            `${environment.apiUrl}administrador/config/url-camara/${idUsuario}`
        );
    }
}
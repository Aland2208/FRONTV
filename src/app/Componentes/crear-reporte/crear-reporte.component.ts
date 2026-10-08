import { Component, OnInit } from '@angular/core';
import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  IonIcon,
  IonSpinner
} from '@ionic/angular/standalone';

import {
  ReporteS
} from '../../servicios/reporte-s';

import {
  Auth
} from '../../servicios/auth';

import {
  BalanzaS
} from '../../servicios/balanza-s';

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

  constructor(
    private reporteService: ReporteS,
    private authService: Auth,
    private balanzaService: BalanzaS
  ) { }

  ngOnInit() {
    this.cargarTiposReporte();
    this.cargarReportes();
  }

  cargarTiposReporte() {
    this.reporteService.obtenerTiposReporte().subscribe({
      next: (respuesta) => {
        this.tiposReporte = respuesta.data || [];
      },
      error: (err) => console.error('❌ ERROR CARGANDO TIPOS:', err)
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
        console.error('❌ ERROR AL CARGAR REPORTES:', err);
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
  // ANULAR CAPTURA PENDIENTE
  // ==========================================
  anularCaptura(captura: any) {
    const confirmacion = confirm(`¿Estás seguro de anular la captura #${captura.id_captura} (${captura.especie})? Esta acción removerá el registro de la faena.`);
    if (!confirmacion) return;

    const idUsuario = this.authService.obtenerIdUsuario();
    if (!idUsuario) return;

    this.balanzaService.anularCaptura(captura.id_captura, idUsuario).subscribe({
      next: (res) => {
        if (res.estado === 1) {
          alert('✅ Captura anulada correctamente.');
          this.cargarReportes();
        } else {
          alert(res.mensaje || 'No se pudo anular la captura.');
        }
      },
      error: (err) => {
        console.error('Error al anular captura:', err);
        alert(err.error?.mensaje || 'Error al comunicarse con el servidor.');
      }
    });
  }

  generarPDF(grupo: any) {
    if (!grupo.tipoSeleccionado) {
      alert('Seleccione un tipo de reporte antes de generar el PDF.');
      return;
    }

    if (!grupo.tituloReporte?.trim()) {
      alert('Ingrese un título para el reporte antes de generar el PDF.');
      return;
    }

    const idUsuario = this.authService.obtenerIdUsuario();
    if (!idUsuario) {
      alert('No se pudo identificar al usuario.');
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
          alert('El archivo PDF recibido está vacío.');
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

  generarCSV(grupo: any) {
    if (!grupo.tipoSeleccionado) {
      alert('Seleccione un tipo de reporte antes de generar el CSV.');
      return;
    }

    if (!grupo.tituloReporte?.trim()) {
      alert('Ingrese un título para el reporte antes de generar el CSV.');
      return;
    }

    const idUsuario = this.authService.obtenerIdUsuario();
    if (!idUsuario) {
      alert('No se pudo identificar al usuario.');
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
          alert('El archivo CSV recibido está vacío.');
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
          alert(respuesta.mensaje || mensajeDefecto);
        } catch {
          alert(mensajeDefecto);
        }
      };
      lector.readAsText(err.error);
      return;
    }
    alert(err?.error?.mensaje || mensajeDefecto);
  }

  enviarReporte(grupo: any) {
    if (!grupo.tipoSeleccionado) {
      alert('Seleccione un tipo de reporte.');
      return;
    }

    if (!grupo.tituloReporte?.trim()) {
      alert('Ingrese un título para el reporte.');
      return;
    }

    if (!grupo.pdfGenerado || !grupo.csvGenerado) {
      alert('Debe generar el PDF y CSV antes de enviar el reporte.');
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
        alert(respuesta.mensaje || 'Reporte enviado correctamente.');
        this.cargarReportes();
      },
      error: (err) => {
        grupo.enviando = false;
        alert(err?.error?.mensaje || 'No se pudo enviar el reporte.');
      }
    });
  }
}
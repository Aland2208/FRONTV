import {CommonModule} from '@angular/common';
import {ChangeDetectorRef,Component,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonIcon,ToastController} from '@ionic/angular/standalone';
import {Auth} from '../../servicios/auth';

interface VeedorHistorial{
 id_usuario:number;
 nombre:string;
 apellido:string;
 correo:string;
 estado:number;
 total_reportes:number;
 reportes_completos:number;
 reportes_incompletos:number;
 relacion_actual:number;
 primera_asignacion:string|null;
 ultima_fecha_fin:string|null;
}

interface ReporteHistorial{
 id_reporte:number;
 id_captura:number|null;
 id_usuario:number;
 id_tipo_reporte:number|null;
 titulo:string|null;
 archivo_pdf:number|null;
 archivo_csv:number|null;
 fecha_reporte:string;
 hora_reporte:string;
 fecha_generacion:string;
 nombre_tipo:string|null;
 peso:number|null;
 fecha_captura:string|null;
 hora_captura:string|null;
 id_deteccion:number|null;
 porcentaje:number|null;
 imagen_url:string|null;
 id_especie:number|null;
 especie:string|null;
 nombre_cientifico:string|null;
 estado_reporte:'Completo'|'Incompleto';
}

@Component({
 selector:'app-historial-veedores',
 templateUrl:'./historial-veedores.component.html',
 styleUrls:['./historial-veedores.component.scss'],
 standalone:true,
 imports:[CommonModule,FormsModule,IonIcon]
})
export class HistorialVeedoresComponent implements OnInit{
 veedores:VeedorHistorial[]=[];
 reportes:ReporteHistorial[]=[];
 veedorSeleccionado:VeedorHistorial|null=null;
 reporteSeleccionado:ReporteHistorial|null=null;

 cargando=true;
 cargandoReportes=false;

 busquedaVeedor='';
 busquedaReporte='';
 filtroEstado='Todos';

 totalReportes=0;
 reportesCompletos=0;
 reportesIncompletos=0;

 constructor(
  private authService:Auth,
  private toastController:ToastController,
  private cdr:ChangeDetectorRef
 ){}

 ngOnInit():void{
  this.cargarVeedores();
 }

 // =====================================================
 // CARGAR VEEDORES
 // =====================================================
 cargarVeedores():void{
  const idAdministrador=this.authService.obtenerIdUsuario();

  if(!idAdministrador){
   this.cargando=false;
   this.mostrarToast('No se pudo identificar al administrador.','danger');
   return;
  }

  this.cargando=true;

  this.authService.getVeedoresHistorial(idAdministrador).subscribe({
   next:(resp:any)=>{
    this.veedores=(resp.data||[]).map((veedor:any)=>({
     ...veedor,
     total_reportes:Number(veedor.total_reportes||0),
     reportes_completos:Number(veedor.reportes_completos||0),
     reportes_incompletos:Number(veedor.reportes_incompletos||0),
     relacion_actual:Number(veedor.relacion_actual||0)
    }));

    this.cargando=false;
    this.cdr.detectChanges();
   },
   error:async(error:any)=>{
    console.error('Error cargando veedores:',error);
    this.veedores=[];
    this.cargando=false;
    await this.mostrarToast(
     'No se pudo cargar el historial de veedores.',
     'danger'
    );
    this.cdr.detectChanges();
   }
  });
 }

 // =====================================================
 // VEEDORES FILTRADOS
 // =====================================================
 get veedoresFiltrados():VeedorHistorial[]{
  const texto=this.busquedaVeedor.trim().toLowerCase();

  if(!texto)return this.veedores;

  return this.veedores.filter(veedor=>{
   const nombre=`${veedor.nombre} ${veedor.apellido}`.toLowerCase();
   const correo=(veedor.correo||'').toLowerCase();

   return nombre.includes(texto)||correo.includes(texto);
  });
 }

 // =====================================================
 // ABRIR HISTORIAL DE VEEDOR
 // =====================================================
 verHistorial(veedor:VeedorHistorial):void{
  this.veedorSeleccionado=veedor;
  this.reportes=[];
  this.busquedaReporte='';
  this.filtroEstado='Todos';
  this.totalReportes=0;
  this.reportesCompletos=0;
  this.reportesIncompletos=0;

  this.cargarReportesVeedor();
 }

 // =====================================================
 // CARGAR REPORTES DEL VEEDOR
 // =====================================================
 cargarReportesVeedor():void{
  if(!this.veedorSeleccionado)return;

  const idAdministrador=this.authService.obtenerIdUsuario();

  if(!idAdministrador){
   this.mostrarToast('No se pudo identificar al administrador.','danger');
   return;
  }

  this.cargandoReportes=true;

  this.authService.getReportesHistorialVeedor(
   idAdministrador,
   this.veedorSeleccionado.id_usuario
  ).subscribe({
   next:(resp:any)=>{
    this.reportes=(resp.data||[]).map((reporte:any)=>({
     ...reporte,
     id_reporte:Number(reporte.id_reporte),
     id_usuario:Number(reporte.id_usuario),
     id_captura:reporte.id_captura!==null
      ? Number(reporte.id_captura)
      : null,
     id_tipo_reporte:reporte.id_tipo_reporte!==null
      ? Number(reporte.id_tipo_reporte)
      : null,
     id_deteccion:reporte.id_deteccion!==null
      ? Number(reporte.id_deteccion)
      : null,
     id_especie:reporte.id_especie!==null
      ? Number(reporte.id_especie)
      : null,
     peso:reporte.peso!==null
      ? Number(reporte.peso)
      : null,
     porcentaje:reporte.porcentaje!==null
      ? Number(reporte.porcentaje)
      : null,
     archivo_pdf:Number(reporte.archivo_pdf||0),
     archivo_csv:Number(reporte.archivo_csv||0)
    }));

    this.totalReportes=Number(
     resp.resumen?.total??this.reportes.length
    );

    this.reportesCompletos=Number(
     resp.resumen?.completos??0
    );

    this.reportesIncompletos=Number(
     resp.resumen?.incompletos??0
    );

    this.cargandoReportes=false;
    this.cdr.detectChanges();
   },
   error:async(error:any)=>{
    console.error('Error cargando reportes:',error);

    this.reportes=[];
    this.totalReportes=0;
    this.reportesCompletos=0;
    this.reportesIncompletos=0;
    this.cargandoReportes=false;

    await this.mostrarToast(
     'No se pudo cargar el historial del veedor.',
     'danger'
    );

    this.cdr.detectChanges();
   }
  });
 }

 // =====================================================
 // REPORTES FILTRADOS
 // =====================================================
 get reportesFiltrados():ReporteHistorial[]{
  const texto=this.busquedaReporte.trim().toLowerCase();

  return this.reportes.filter(reporte=>{
   const coincideEstado=
    this.filtroEstado==='Todos' ||
    reporte.estado_reporte===this.filtroEstado;

   const contenido=[
    reporte.id_reporte,
    reporte.titulo,
    reporte.nombre_tipo,
    reporte.especie,
    reporte.nombre_cientifico,
    reporte.fecha_reporte
   ]
    .map(valor=>String(valor??'').toLowerCase())
    .join(' ');

   const coincideBusqueda=
    !texto||contenido.includes(texto);

   return coincideEstado&&coincideBusqueda;
  });
 }

 // =====================================================
 // FILTROS
 // =====================================================
 seleccionarFiltro(estado:string):void{
  this.filtroEstado=estado;
 }

 // =====================================================
 // VOLVER A LAS TARJETAS
 // =====================================================
 volverAVeedores():void{
  this.veedorSeleccionado=null;
  this.reporteSeleccionado=null;
  this.reportes=[];
  this.busquedaReporte='';
  this.filtroEstado='Todos';
  this.totalReportes=0;
  this.reportesCompletos=0;
  this.reportesIncompletos=0;
 }

 // =====================================================
 // DETALLE DEL REPORTE
 // =====================================================
 verReporte(reporte:ReporteHistorial):void{
  this.reporteSeleccionado=reporte;
 }

 cerrarDetalle():void{
  this.reporteSeleccionado=null;
 }

 // =====================================================
 // FORMATO
 // =====================================================
 formatearFecha(fecha:string|null):string{
  if(!fecha)return '—';

  const partes=fecha.substring(0,10).split('-');

  if(partes.length!==3)return fecha;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
 }

 formatearPeso(peso:number|null):string{
  if(peso===null||peso===undefined)return '—';

  return `${Number(peso).toFixed(2)} kg`;
 }

 formatearConfianza(porcentaje:number|null):string{
  if(porcentaje===null||porcentaje===undefined)return '—';

  return `${Number(porcentaje).toFixed(2)} %`;
 }

 obtenerIniciales(veedor:VeedorHistorial):string{
  const nombre=veedor.nombre?.trim().charAt(0)||'';
  const apellido=veedor.apellido?.trim().charAt(0)||'';

  return `${nombre}${apellido}`.toUpperCase();
 }

 // =====================================================
 // TOAST
 // =====================================================
 async mostrarToast(
  mensaje:string,
  color:'success'|'danger'|'warning'='success'
 ):Promise<void>{
  const toast=await this.toastController.create({
   message:mensaje,
   duration:2500,
   color,
   position:'top'
  });

  await toast.present();
 }
}
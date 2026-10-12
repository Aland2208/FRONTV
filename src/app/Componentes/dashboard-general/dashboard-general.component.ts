import {
 Component,
 OnInit,
 AfterViewInit,
 OnDestroy,
 ViewChild,
 ElementRef
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {Chart,registerables} from 'chart.js';
import {DashboardS} from 'src/app/servicios/dashboard-s';
import {Auth} from 'src/app/servicios/auth';
import {
 formatearCambio,
 pesoMedioPorCaptura
} from 'src/app/utils/dashboard-statistics';

Chart.register(...registerables);

interface VeedorDashboard{
 id_usuario:number;
 nombre:string;
 apellido:string;
 correo:string;
 total_capturas:number;
 total_reportes:number;
 reportes_completos:number;
 reportes_incompletos:number;
 peso_total:number;
 confianza_promedio:number;
}

@Component({
 selector:'app-dashboard-general',
 templateUrl:'./dashboard-general.component.html',
 styleUrls:['./dashboard-general.component.scss'],
 standalone:true,
 imports:[CommonModule,FormsModule,IonicModule]
})
export class DashboardGeneralComponent implements OnInit,AfterViewInit,OnDestroy{

 @ViewChild('graficoEspecies') graficoEspecies!:ElementRef<HTMLCanvasElement>;
 @ViewChild('graficoPeso') graficoPeso!:ElementRef<HTMLCanvasElement>;
 @ViewChild('graficoVeedores') graficoVeedores!:ElementRef<HTMLCanvasElement>;
 @ViewChild('graficoReportes') graficoReportes!:ElementRef<HTMLCanvasElement>;

 resumen={
  total_capturas:0,
  peso_total:0,
  confianza_promedio:0,
  total_especies:0,
   total_reportes:0,
   reportes_completos:0,
   reportes_incompletos:0
  };

  comparacion={
   total_capturas:0,
   peso_total:0,
   confianza_promedio:0,
   total_especies:0,
   total_reportes:0,
   reportes_completos:0,
   reportes_incompletos:0
  };

  especies:any[]=[];
 veedores:VeedorDashboard[]=[];
 listaVeedores:VeedorDashboard[]=[];

 periodo='hoy';
 idVeedorSeleccionado:number|null=null;
 desde='';
 hasta='';

 cargando=false;
 error='';
 filtrosAplicados:any=null;
 periodoAnterior={desde:'',hasta:''};

 private vistaLista=false;

 get alturaGraficoVeedores():number{
  return Math.max(260,this.veedores.length*54);
 }

 private chartEspecies?:Chart;
 private chartPeso?:Chart;
 private chartVeedores?:Chart;
 private chartReportes?:Chart;

 constructor(
  private dashboardService:DashboardS,
  private authService:Auth
 ){}

 ngOnInit():void{
  this.cargarDashboard();
 }

 ngAfterViewInit():void{
  this.vistaLista=true;
 }

 ngOnDestroy():void{
  this.destruirGraficos();
 }

 // ==========================================
 // CARGAR DASHBOARD
 // ==========================================
 cargarDashboard():void{
  const idAdministrador=this.authService.obtenerIdUsuario();

  if(!idAdministrador){
   this.error='No se pudo identificar al administrador.';
   this.cargando=false;
   return;
  }

  if(this.periodo==='personalizado'){
   if(!this.desde||!this.hasta){
    this.error='Seleccione la fecha inicial y final.';
    this.cargando=false;
    return;
   }

   if(this.desde>this.hasta){
    this.error='La fecha inicial no puede ser mayor a la fecha final.';
    this.cargando=false;
    return;
   }
  }

  this.cargando=true;
  this.error='';
  this.destruirGraficos();

  this.dashboardService.obtenerDashboardAdministrador(
   idAdministrador,
   this.periodo,
   this.idVeedorSeleccionado,
   this.desde||null,
   this.hasta||null
  ).subscribe({
   next:(respuesta:any)=>{
    const data=respuesta?.data||{};
    const resumenApi=data.resumen||{};

    this.resumen={
     total_capturas:Number(resumenApi.total_capturas||0),
     peso_total:Number(resumenApi.peso_total||0),
     confianza_promedio:Number(resumenApi.confianza_promedio||0),
     total_especies:Number(resumenApi.total_especies||0),
     total_reportes:Number(resumenApi.total_reportes||0),
     reportes_completos:Number(resumenApi.reportes_completos||0),
     reportes_incompletos:Number(resumenApi.reportes_incompletos||0)
    };

    const comparacionApi=data.comparacion?.resumen||{};
    this.comparacion={
     total_capturas:Number(comparacionApi.total_capturas||0),
     peso_total:Number(comparacionApi.peso_total||0),
     confianza_promedio:Number(comparacionApi.confianza_promedio||0),
     total_especies:Number(comparacionApi.total_especies||0),
     total_reportes:Number(comparacionApi.total_reportes||0),
     reportes_completos:Number(comparacionApi.reportes_completos||0),
     reportes_incompletos:Number(comparacionApi.reportes_incompletos||0)
    };
    this.periodoAnterior=data.comparacion?.periodo_anterior||{desde:'',hasta:''};

    this.especies=(data.especies||[]).map((item:any)=>({
     ...item,
     id_especie:Number(item.id_especie),
     total_capturas:Number(item.total_capturas||0),
     peso_total:Number(item.peso_total||0),
     confianza_promedio:Number(item.confianza_promedio||0)
    }));

    this.veedores=(data.veedores||[]).map((item:any)=>({
     ...item,
     id_usuario:Number(item.id_usuario),
     total_capturas:Number(item.total_capturas||0),
     total_reportes:Number(item.total_reportes||0),
     reportes_completos:Number(item.reportes_completos||0),
     reportes_incompletos:Number(item.reportes_incompletos||0),
     peso_total:Number(item.peso_total||0),
     confianza_promedio:Number(item.confianza_promedio||0)
    }));

    // Guardamos todos los veedores para mantenerlos en el selector.
    if(this.idVeedorSeleccionado===null){
     this.listaVeedores=[...this.veedores];
    }

    this.filtrosAplicados=data.filtros||null;
    this.cargando=false;

    setTimeout(()=>{
     this.crearGraficos();
    },100);
   },
   error:(err:any)=>{
    

    this.cargando=false;

    this.error=
     err?.error?.mensaje||
     `No se pudo cargar el dashboard${err?.status?` (Error ${err.status})`:''}.`;
   }
  });
 }

 // ==========================================
 // CAMBIAR PERÍODO
 // ==========================================
 cambiarPeriodo(periodo:string):void{
  if(this.periodo===periodo)return;

  this.periodo=periodo;
  this.error='';

  if(periodo!=='personalizado'){
   this.desde='';
   this.hasta='';
   this.cargarDashboard();
  }
 }

 aplicarFechas():void{
  this.cargarDashboard();
 }

 // ==========================================
 // CAMBIAR VEEDOR
 // ==========================================
 cambiarVeedor():void{
  if(this.idVeedorSeleccionado!==null){
   this.idVeedorSeleccionado=Number(this.idVeedorSeleccionado);
  }

  this.cargarDashboard();
 }

 // ==========================================
 // CREAR GRÁFICOS
 // ==========================================
 private crearGraficos():void{
  if(!this.vistaLista){
   setTimeout(()=>{
    this.crearGraficos();
   },50);
   return;
  }

  this.destruirGraficos();

  setTimeout(()=>{
   if(this.especies.length){
    this.crearGraficoEspecies();
    this.crearGraficoPeso();
   }

   if(this.veedores.length){
    this.crearGraficoVeedores();
   }

   if(this.resumen.total_reportes>0){
    this.crearGraficoReportes();
   }
  },50);
 }

 // ==========================================
 // GRÁFICO DONA - ESPECIES
 // ==========================================
 private crearGraficoEspecies():void{
  if(!this.graficoEspecies?.nativeElement)return;

  const labels=this.especies.map(
   especie=>especie.nombre_comun
  );

  const datos=this.especies.map(
   especie=>Number(especie.total_capturas||0)
  );

  this.chartEspecies=new Chart(
   this.graficoEspecies.nativeElement,
   {
    type:'doughnut',
    data:{
     labels,
     datasets:[{
      data:datos,
      backgroundColor:[
       '#12969e',
       '#0a1f33',
       '#ff6b4a',
       '#4fd1c5',
       '#5a6b7a',
       '#1fae7c'
      ],
      borderWidth:2,
      borderColor:'#ffffff'
     }]
    },
    options:{
     responsive:true,
     maintainAspectRatio:false,
     cutout:'68%',
     plugins:{
      legend:{
       display:false
      },
      tooltip:{
       callbacks:{
        label:(context)=>{
         const valor=Number(context.raw||0);

         const porcentaje=
          this.resumen.total_capturas>0
           ?(valor/this.resumen.total_capturas)*100
           :0;

         return ` ${context.label}: ${valor} (${porcentaje.toFixed(1)}%)`;
        }
       }
      }
     }
    }
   }
  );
 }

 // ==========================================
 // GRÁFICO BARRAS - PESO POR ESPECIE
 // ==========================================
 private crearGraficoPeso():void{
  if(!this.graficoPeso?.nativeElement)return;

  const labels=this.especies.map(
   especie=>especie.nombre_comun
  );

  const datos=this.especies.map(
   especie=>Number(especie.peso_total||0)
  );

  this.chartPeso=new Chart(
   this.graficoPeso.nativeElement,
   {
    type:'bar',
    data:{
     labels,
     datasets:[{
      label:'Peso acumulado (g)',
      data:datos,
      backgroundColor:'#12969e',
      borderRadius:6,
      borderSkipped:false
     }]
    },
    options:{
     responsive:true,
     maintainAspectRatio:false,
     plugins:{
      legend:{
       display:false
      },
      tooltip:{
       callbacks:{
        label:(context)=>{
         const peso=Number(context.raw||0);
         return ` ${this.formatearPeso(peso)}`;
        }
       }
      }
     },
     scales:{
      x:{
       grid:{
        display:false
       }
      },
      y:{
       beginAtZero:true,
       ticks:{
        callback:(value)=>{
         return `${value} g`;
        }
       }
      }
     }
    }
   }
  );
 }

 // ==========================================
 // GRÁFICO BARRAS - RENDIMIENTO POR VEEDOR
 // ==========================================
 private crearGraficoVeedores():void{
  if(!this.graficoVeedores?.nativeElement)return;

  const labels=this.veedores.map(
   veedor=>`${veedor.nombre} ${veedor.apellido}`
  );

  this.chartVeedores=new Chart(
   this.graficoVeedores.nativeElement,
   {
    type:'bar',
    data:{
     labels,
     datasets:[
      {
       label:'Capturas',
       data:this.veedores.map(
        veedor=>veedor.total_capturas
       ),
       backgroundColor:'#12969e',
       borderRadius:5,
       borderSkipped:false
      },
      {
       label:'Reportes',
       data:this.veedores.map(
        veedor=>veedor.total_reportes
       ),
       backgroundColor:'#0a1f33',
       borderRadius:5,
       borderSkipped:false
      }
     ]
    },
    options:{
     indexAxis:'y',
     responsive:true,
     maintainAspectRatio:false,
     plugins:{
      legend:{
       display:true,
       position:'bottom'
      }
     },
     scales:{
      x:{
       beginAtZero:true,
       ticks:{
        precision:0,
        stepSize:1
       }
      },
      y:{
       grid:{
        display:false
       },
       ticks:{
        autoSkip:false,
        callback:(value)=>{
         const etiqueta=String(labels[Number(value)]||'');
         return etiqueta.split(' ');
        }
       }
      }
     }
    }
   }
  );
 }

 // ==========================================
 // GRÁFICO DONA - REPORTES
 // ==========================================
 private crearGraficoReportes():void{
  if(!this.graficoReportes?.nativeElement)return;

  this.chartReportes=new Chart(
   this.graficoReportes.nativeElement,
   {
    type:'doughnut',
    data:{
     labels:[
      'Completos',
      'Incompletos'
     ],
     datasets:[{
      data:[
       this.resumen.reportes_completos,
       this.resumen.reportes_incompletos
      ],
      backgroundColor:[
       '#1fae7c',
       '#ff6b4a'
      ],
      borderColor:'#ffffff',
      borderWidth:2
     }]
    },
    options:{
     responsive:true,
     maintainAspectRatio:false,
     cutout:'68%',
     plugins:{
      legend:{
       display:false,
       position:'bottom'
      },
      tooltip:{
       callbacks:{
        label:(context)=>{
         const valor=Number(context.raw||0);

         const porcentaje=
          this.resumen.total_reportes>0
           ?(valor/this.resumen.total_reportes)*100
           :0;

         return ` ${context.label}: ${valor} (${porcentaje.toFixed(1)}%)`;
        }
       }
      }
     }
    }
   }
  );
 }

 // ==========================================
 // DESTRUIR GRÁFICOS
 // ==========================================
 private destruirGraficos():void{
  if(this.chartEspecies){
   this.chartEspecies.destroy();
   this.chartEspecies=undefined;
  }

  if(this.chartPeso){
   this.chartPeso.destroy();
   this.chartPeso=undefined;
  }

  if(this.chartVeedores){
   this.chartVeedores.destroy();
   this.chartVeedores=undefined;
  }

  if(this.chartReportes){
   this.chartReportes.destroy();
   this.chartReportes=undefined;
  }
 }

 // ==========================================
 // FORMATEAR PESO
 // ==========================================
 formatearPeso(peso:number):string{
  const valor=Number(peso||0);

  if(valor>=1000){
   return `${(valor/1000).toFixed(2)} kg`;
  }

  return `${valor.toFixed(2)} g`;
 }

 get pesoMedio():number|null{
  return pesoMedioPorCaptura(this.resumen.peso_total,this.resumen.total_capturas);
 }

 get tieneBaseAnterior():boolean{
  return this.comparacion.total_capturas>0||this.comparacion.total_reportes>0;
 }

 cambio(actual:number,anterior:number,decimales=0,sufijo=''):string{
  return this.tieneBaseAnterior
   ?formatearCambio(actual,anterior,decimales,sufijo)
   :'Sin registros previos';
 }

 cambioConfianza():string{
  if(this.comparacion.total_capturas===0)return 'Sin registros previos';
  const diferencia=this.resumen.confianza_promedio-this.comparacion.confianza_promedio;
  return `${diferencia>0?'+':''}${diferencia.toFixed(1)} pp`;
 }

 // ==========================================
 // PORCENTAJE DE ESPECIES
 // ==========================================
 obtenerPorcentaje(total:number):number{
  const totalCapturas=Number(
   this.resumen.total_capturas||0
  );

  if(totalCapturas===0){
   return 0;
  }

  return(
   Number(total||0)/
   totalCapturas
  )*100;
 }

 // ==========================================
 // PORCENTAJE DE REPORTES
 // ==========================================
 obtenerPorcentajeReportes(valor:number):number{
  const totalReportes=Number(
   this.resumen.total_reportes||0
  );

  if(totalReportes===0){
   return 0;
  }

  return(
   Number(valor||0)/
   totalReportes
  )*100;
 }

 // ==========================================
 // FORMATEAR FECHA
 // ==========================================
 formatearFechaCorta(fecha:string):string{
  if(!fecha)return '';

  const partes=fecha.substring(0,10).split('-');

  if(partes.length!==3){
   return fecha;
  }

  return `${partes[2]}/${partes[1]}`;
 }

 // ==========================================
 // NOMBRE DEL VEEDOR SELECCIONADO
 // ==========================================
 get nombreVeedorSeleccionado():string{
  if(this.idVeedorSeleccionado===null){
   return 'Todos los veedores';
  }

  const veedor=this.listaVeedores.find(
   item=>item.id_usuario===Number(
    this.idVeedorSeleccionado
   )
  );

  if(!veedor){
   return 'Veedor seleccionado';
  }

  return `${veedor.nombre} ${veedor.apellido}`;
 }

 // ==========================================
 // DESCRIPCIÓN DEL PERÍODO
 // ==========================================
 get descripcionPeriodo():string{
  if(this.periodo==='hoy'){
   return 'Hoy';
  }

  if(this.periodo==='7dias'){
   return 'Últimos 7 días';
  }

  if(this.periodo==='30dias'){
   return 'Últimos 30 días';
  }

  if(
   this.periodo==='personalizado'&&
   this.desde&&
   this.hasta
  ){
   return `${this.desde} - ${this.hasta}`;
  }

  return 'Período personalizado';
 }
}
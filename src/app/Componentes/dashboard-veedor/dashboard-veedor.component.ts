import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import {
  Chart,
  registerables
} from 'chart.js';

import { DashboardS } from 'src/app/servicios/dashboard-s';
import { Auth } from 'src/app/servicios/auth';
import {
  ActivityRecord,
  crearSerieComparativa,
  formatearCambio,
  pesoMedioPorCaptura
} from 'src/app/utils/dashboard-statistics';

Chart.register(...registerables);

@Component({
  selector:'app-dashboard-veedor',
  templateUrl:'./dashboard-veedor.component.html',
  styleUrls:['./dashboard-veedor.component.scss'],
  standalone:true,
  imports:[
    CommonModule,
    IonicModule
  ]
})
export class DashboardVeedorComponent implements OnInit,AfterViewInit,OnDestroy {

  @ViewChild('graficoEspecies')
  graficoEspecies!:ElementRef<HTMLCanvasElement>;

  @ViewChild('graficoPeso')
  graficoPeso!:ElementRef<HTMLCanvasElement>;

  @ViewChild('graficoActividad')
  graficoActividad!:ElementRef<HTMLCanvasElement>;

  resumen={
    total_capturas:0,
    peso_total:0,
    confianza_promedio:0,
    total_especies:0
  };

  comparacion={
    total_capturas:0,
    peso_total:0,
    confianza_promedio:0,
    total_especies:0
  };

  especies:any[]=[];
  actividad:ActivityRecord[]=[];
  actividadAnterior:ActivityRecord[]=[];

  cargando=false;
  error='';

  private vistaLista=false;

  private chartEspecies?:Chart;
  private chartPeso?:Chart;
  private chartActividad?:Chart;

  constructor(
    private dashboardService:DashboardS,
    private authService:Auth
  ) {}

  ngOnInit(){
    this.cargarDashboard();
  }

  ngAfterViewInit(){
    this.vistaLista=true;
  }

  ngOnDestroy(){
    this.destruirGraficos();
  }

  // ==========================================
  // CARGAR DASHBOARD
  // ==========================================

  cargarDashboard(){
    const idUsuario=this.authService.obtenerIdUsuario();

    
    
    
    

    if(!idUsuario){
      this.error='No se pudo identificar al usuario.';
      this.cargando=false;
      return;
    }

    this.cargando=true;
    this.error='';

    this.dashboardService.obtenerDashboardVeedor(idUsuario).subscribe({
      next:(respuesta)=>{
        
        
        
        
        

        const resumenApi=respuesta?.data?.resumen;

        this.resumen={
          total_capturas:Number(resumenApi?.total_capturas || 0),
          peso_total:Number(resumenApi?.peso_total || 0),
          confianza_promedio:Number(resumenApi?.confianza_promedio || 0),
          total_especies:Number(resumenApi?.total_especies || 0)
        };
        const resumenAnterior=respuesta?.data?.comparacion?.resumen;
        this.comparacion={
          total_capturas:Number(resumenAnterior?.total_capturas || 0),
          peso_total:Number(resumenAnterior?.peso_total || 0),
          confianza_promedio:Number(resumenAnterior?.confianza_promedio || 0),
          total_especies:Number(resumenAnterior?.total_especies || 0)
        };

        this.especies=(respuesta?.data?.especies || []).map((especie:any)=>({
          ...especie,
          total_capturas:Number(especie.total_capturas || 0),
          peso_total:Number(especie.peso_total || 0),
          confianza_promedio:Number(especie.confianza_promedio || 0)
        }));

        this.actividad=(respuesta?.data?.actividad || []).map((item:any)=>({
          ...item,
          hora:Number(item.hora || 0),
          total_capturas:Number(item.total_capturas || 0),
          peso_total:Number(item.peso_total || 0)
        }));
        this.actividadAnterior=(respuesta?.data?.actividad_anterior || []).map((item:any)=>({
          ...item,
          hora:Number(item.hora || 0),
          total_capturas:Number(item.total_capturas || 0),
          peso_total:Number(item.peso_total || 0)
        }));

        
        
        

        this.cargando=false;

        setTimeout(()=>{
          this.crearGraficos();
        },100);
      },

      error:(err)=>{
        
        
        
        
        
        
        

        this.cargando=false;

        this.error=
          err?.error?.mensaje ||
          `No se pudo cargar el dashboard${err?.status ? ` (Error ${err.status})` : ''}.`;
      }
    });
  }

  // ==========================================
  // CREAR GRÁFICOS
  // ==========================================

  private crearGraficos(){
    if(!this.vistaLista){
      setTimeout(()=>{
        this.crearGraficos();
      },50);
      return;
    }

    this.destruirGraficos();

    if(!this.especies.length&&!this.actividad.length&&!this.actividadAnterior.length){
      return;
    }

    setTimeout(()=>{
      if(this.especies.length){
        this.crearGraficoEspecies();
        this.crearGraficoPeso();
      }

      if(this.actividad.length || this.actividadAnterior.length){
        this.crearGraficoActividad();
      }
    },50);
  }

  // ==========================================
  // GRÁFICO DONA - ESPECIES
  // ==========================================

  private crearGraficoEspecies(){
    if(!this.graficoEspecies?.nativeElement){
      
      return;
    }

    const labels=this.especies.map(
      especie=>especie.nombre_comun
    );

    const datos=this.especies.map(
      especie=>Number(especie.total_capturas || 0)
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
                  const valor=Number(context.raw || 0);

                  const porcentaje=
                    this.resumen.total_capturas>0
                      ? (valor/this.resumen.total_capturas)*100
                      : 0;

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

  private crearGraficoPeso(){
    if(!this.graficoPeso?.nativeElement){
      
      return;
    }

    const labels=this.especies.map(
      especie=>especie.nombre_comun
    );

    const datos=this.especies.map(
      especie=>Number(especie.peso_total || 0)
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
                  const peso=Number(context.raw || 0);
                  return ` ${this.formatearPeso(peso)}`;
                }
              }
            }
          },

          scales:{
            x:{
              grid:{
                display:false
              },

              ticks:{
                font:{
                  size:10
                }
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
  // GRÁFICO LÍNEA - ACTIVIDAD POR HORA
  // ==========================================

  private crearGraficoActividad(){
    if(!this.graficoActividad?.nativeElement){
      
      return;
    }

    const serie=crearSerieComparativa(
      this.actividad,
      this.actividadAnterior,
      '',
      '',
      '',
      true
    );

    this.chartActividad=new Chart(
      this.graficoActividad.nativeElement,
      {
        type:'line',

        data:{
          labels:serie.labels,

          datasets:[
            {
              label:'Hoy',
              data:serie.actual,
              borderColor:'#12969e',
              backgroundColor:'rgba(18,150,158,0.12)',
              fill:true,
              tension:0.35,
              pointRadius:3,
              pointHoverRadius:6,
              pointBackgroundColor:'#0a1f33',
              pointBorderColor:'#ffffff',
              pointBorderWidth:2
            },
            {
              label:'Ayer',
              data:serie.anterior,
              borderColor:'#8a9aab',
              backgroundColor:'rgba(138,154,171,0.06)',
              fill:false,
              tension:0.35,
              borderDash:[5,5],
              pointRadius:2,
              pointHoverRadius:5
            }
          ]
        },

        options:{
          responsive:true,
          maintainAspectRatio:false,

          interaction:{
            intersect:false,
            mode:'index'
          },

          plugins:{
            legend:{
              display:true,
              position:'bottom'
            },

            tooltip:{
              callbacks:{
                label:(context)=>{
                  const total=Number(context.raw || 0);

                  return ` ${total} captura${total===1 ? '' : 's'}`;
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
                precision:0,
                stepSize:1
              }
            }
          }
        }
      }
    );
  }

  get pesoMedio():number|null{
    return pesoMedioPorCaptura(this.resumen.peso_total,this.resumen.total_capturas);
  }

  get tieneBaseAnterior():boolean{
    return this.comparacion.total_capturas>0;
  }

  cambio(actual:number,anterior:number,decimales=0,sufijo=''):string{
    return this.tieneBaseAnterior
      ?formatearCambio(actual,anterior,decimales,sufijo)
      :'Sin registros previos';
  }

  cambioConfianza():string{
    if(!this.tieneBaseAnterior)return 'Sin registros previos';
    const diferencia=this.resumen.confianza_promedio-this.comparacion.confianza_promedio;
    return `${diferencia>0?'+':''}${diferencia.toFixed(1)} pp`;
  }

  // ==========================================
  // DESTRUIR GRÁFICOS
  // ==========================================

  private destruirGraficos(){
    if(this.chartEspecies){
      this.chartEspecies.destroy();
      this.chartEspecies=undefined;
    }

    if(this.chartPeso){
      this.chartPeso.destroy();
      this.chartPeso=undefined;
    }

    if(this.chartActividad){
      this.chartActividad.destroy();
      this.chartActividad=undefined;
    }
  }

  // ==========================================
  // FORMATEAR PESO
  // ==========================================

  formatearPeso(peso:number):string{
    const valor=Number(peso || 0);

    if(valor>=1000){
      return `${(valor/1000).toFixed(2)} kg`;
    }

    return `${valor.toFixed(2)} g`;
  }

  // ==========================================
  // PORCENTAJE DE ESPECIE
  // ==========================================

  obtenerPorcentaje(total:number):number{
    const totalCapturas=Number(this.resumen.total_capturas || 0);

    if(totalCapturas===0){
      return 0;
    }

    return (Number(total || 0)/totalCapturas)*100;
  }
}
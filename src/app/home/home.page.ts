import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButtons,
  IonMenuButton
} from '@ionic/angular/standalone';

import { Auth } from './../servicios/auth';

import { MenuComponent } from './../Componentes/menu/menu.component';
import { MenuUsuarioComponent } from './../Componentes/menu-usuario/menu-usuario.component';

import { InicioComponent } from './../Componentes/inicio/inicio.component';
import { CamaraComponent } from './../Componentes/camara/camara.component';
import { CrearReporteComponent } from './../Componentes/crear-reporte/crear-reporte.component';
import { MisReportesComponent } from './../Componentes/mis-reportes/mis-reportes.component';
import { DashboardVeedorComponent } from './../Componentes/dashboard-veedor/dashboard-veedor.component';
import { EditarPerfilComponent } from './../Componentes/editar-perfil/editar-perfil.component';
import { CambiarPasswordComponent } from './../Componentes/cambiar-password/cambiar-password.component';
import { VincularAdministradorComponent } from './../Componentes/vincular-administrador/vincular-administrador.component';
import { UsuariosAdminComponent } from './../Componentes/usuarios-admin/usuarios-admin.component';
import { ReportesAdminComponent } from '../Componentes/reportes-admin/reportes-admin.component';
import { HistorialVeedoresComponent } from '../Componentes/historial-veedores/historial-veedores.component';
import { DashboardGeneralComponent } from '../Componentes/dashboard-general/dashboard-general.component';
import { ConfigurarCamaraComponent } from '../Componentes/configurar-camara/configurar-camara.component';

@Component({
  selector:'app-home',
  templateUrl:'home.page.html',
  styleUrls:['home.page.scss'],
  standalone:true,
  imports:[
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonButtons,
    IonMenuButton,
    MenuComponent,
    MenuUsuarioComponent,
    InicioComponent,
    CamaraComponent,
    CrearReporteComponent,
    MisReportesComponent,
    DashboardVeedorComponent,
    EditarPerfilComponent,
    CambiarPasswordComponent,
    VincularAdministradorComponent,
    UsuariosAdminComponent,
    ReportesAdminComponent,
    HistorialVeedoresComponent,
    DashboardGeneralComponent,
    ConfigurarCamaraComponent
  ]
})
export class HomePage implements OnInit {

  vistaActual:string='inicio';
  idRol:number|null=null;

  constructor(
    private authService:Auth
  ) {}

  ngOnInit(){
    this.idRol=this.authService.obtenerRol();

    console.log('Rol del usuario:',this.idRol);

    this.vistaActual='inicio';
  }

  cambiarVista(vista:string){
    console.log('Vista seleccionada:',vista);
    this.vistaActual=vista;
  }
}
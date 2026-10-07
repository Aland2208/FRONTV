import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  MenuController
} from '@ionic/angular/standalone';

import { Auth } from '../../servicios/auth';

@Component({
  selector:'app-menu-usuario',
  templateUrl:'./menu-usuario.component.html',
  styleUrls:['./menu-usuario.component.scss'],
  standalone:true,
  imports:[
    CommonModule,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel
  ]
})
export class MenuUsuarioComponent implements OnInit {

  @Output() cambiarVista=new EventEmitter<string>();

  nombre='';
  idRol:number|null=null;
  nombreRol='';

  constructor(
    private authService:Auth,
    private router:Router,
    private menuController:MenuController
  ) {}

  ngOnInit(){
    this.idRol=this.authService.obtenerRol();
    this.nombre=this.authService.obtenerNombre() ?? '';
    this.cargarNombreRol();
  }

  cargarNombreRol(){
    if(this.idRol===1) this.nombreRol='Administrador';
    else if(this.idRol===2) this.nombreRol='Veedor';
    else this.nombreRol='';
  }

  async cerrarMenu(){
    await this.menuController.close('menuUsuario');
  }

  async abrirVista(vista:string){
    await this.menuController.close('menuUsuario');
    this.cambiarVista.emit(vista);
  }

  async cerrarSesion(){
    await this.menuController.close('menuUsuario');
    this.authService.cerrarSesion();
    await this.router.navigate(['/login'],{replaceUrl:true});
  }
}
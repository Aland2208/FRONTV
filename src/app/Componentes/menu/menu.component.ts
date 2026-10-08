import {
  Component,
  OnInit,
  Output,
  EventEmitter
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle
} from '@ionic/angular/standalone';

import { Auth } from '../../servicios/auth';


interface OpcionMenu {
  nombre: string;
  vista: string;
  icono: string;
}


@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,

  imports: [
    CommonModule,

    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle
  ]
})
export class MenuComponent implements OnInit {

  @Output()
  cambiarVista = new EventEmitter<string>();


  idRol: number | null = null;

  opcionesMenu: OpcionMenu[] = [];


  constructor(
    private authService: Auth
  ) {}


  ngOnInit() {

    this.idRol = this.authService.obtenerRol();

    console.log('Rol desde menú:', this.idRol);

    this.cargarMenu();
  }


  cargarMenu() {

    // ==========================================
    // ADMINISTRADOR
    // ==========================================

    if (this.idRol === 1) {

      this.opcionesMenu = [

        {
          nombre: 'Inicio',
          vista: 'inicio',
          icono: 'home-outline'
        },

        {
          nombre: 'Usuarios',
          vista: 'usuarios',
          icono: 'people-outline'
        },

        {
          nombre: 'Reportes',
          vista: 'reportes-admin',
          icono: 'document-text-outline'
        },

        {
          nombre: 'Historial de veedores',
          vista: 'historial-veedores',
          icono: 'time-outline'
        },

        {
          nombre: 'Dashboard general',
          vista: 'dashboard-general',
          icono: 'bar-chart-outline'
        }

      ];

    }


    // ==========================================
    // VEEDOR
    // ==========================================

    else if (this.idRol === 2) {

      this.opcionesMenu = [

        {
          nombre: 'Inicio',
          vista: 'inicio',
          icono: 'home-outline'
        },

        {
          nombre: 'Vista de cámara',
          vista: 'camara',
          icono: 'camera-outline'
        },

        {
          nombre: 'Generar reporte',
          vista: 'crear-reporte',
          icono: 'create-outline'
        },

        {
          nombre: 'Mis reportes',
          vista: 'mis-reportes',
          icono: 'document-text-outline'
        },

        {
          nombre: 'Dashboard del día',
          vista: 'dashboard',
          icono: 'bar-chart-outline'
        }

      ];

    }


    // ==========================================
    // ROL DESCONOCIDO
    // ==========================================

    else {

      this.opcionesMenu = [

        {
          nombre: 'Inicio',
          vista: 'inicio',
          icono: 'home-outline'
        }

      ];

    }

  }


  seleccionarVista(vista: string) {

    console.log('Menú seleccionó:', vista);

    this.cambiarVista.emit(vista);
  }

}
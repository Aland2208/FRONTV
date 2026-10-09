import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

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
  selector: 'app-menu-usuario',
  templateUrl: './menu-usuario.component.html',
  styleUrls: ['./menu-usuario.component.scss'],
  standalone: true,
  imports: [
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
export class MenuUsuarioComponent implements OnInit, OnDestroy {

  @Output() cambiarVista = new EventEmitter<string>();

  nombre = '';
  idRol: number | null = null;
  nombreRol = '';

  // Suscripción reactiva para liberar memoria
  private subNombre!: Subscription;

  constructor(
    private authService: Auth,
    private router: Router,
    private menuController: MenuController
  ) { }

  ngOnInit() {
    this.idRol = this.authService.obtenerRol();
    this.cargarNombreRol();

    // ==========================================
    // ESCUCHA REACTIVA DEL NOMBRE
    // Actualiza el nombre en el menú al instante al editar el perfil
    // ==========================================
    this.subNombre = this.authService.obtenerNombreObservable().subscribe({
      next: (nombreActualizado) => {
        this.nombre = nombreActualizado || (this.authService.obtenerNombre() ?? '');
      }
    });
  }

  // ==========================================
  // ASIGNAR ETIQUETA SEGÚN ROL
  // ==========================================
  cargarNombreRol() {
    if (this.idRol === 1) this.nombreRol = 'Administrador';
    else if (this.idRol === 2) this.nombreRol = 'Veedor';
    else this.nombreRol = '';
  }

  // ==========================================
  // GESTIÓN DE ACCIONES Y NAVEGACIÓN
  // ==========================================
  async cerrarMenu() {
    await this.menuController.close('menuUsuario');
  }

  async abrirVista(vista: string) {
    await this.menuController.close('menuUsuario');
    this.cambiarVista.emit(vista);
  }

  async cerrarSesion() {
    await this.menuController.close('menuUsuario');
    this.authService.cerrarSesion();
    await this.router.navigate(['/login'], { replaceUrl: true });
  }

  // ==========================================
  // DESTRUCCIÓN DEL COMPONENTE
  // ==========================================
  ngOnDestroy() {
    if (this.subNombre) {
      this.subNombre.unsubscribe();
    }
  }
}
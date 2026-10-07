import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Auth } from '../../servicios/auth';

@Component({
  selector:'app-editar-perfil',
  templateUrl:'./editar-perfil.component.html',
  styleUrls:['./editar-perfil.component.scss'],
  standalone:true,
  imports:[CommonModule,FormsModule,IonicModule]
})
export class EditarPerfilComponent implements OnInit {

  idUsuario:number|null=null;

  nombre='';
  apellido='';
  correo='';

  cargando=true;
  guardando=false;
  error='';
  mensajeExito='';

  constructor(private authService:Auth) {}

  ngOnInit(){
    this.idUsuario=this.authService.obtenerIdUsuario();

    if(!this.idUsuario){
      this.error='No se pudo identificar al usuario.';
      this.cargando=false;
      return;
    }

    this.cargarPerfil();
  }

  cargarPerfil(){
    if(!this.idUsuario) return;

    this.cargando=true;
    this.error='';

    this.authService.obtenerPerfil(this.idUsuario).subscribe({
      next:(respuesta)=>{
        this.nombre=respuesta.data.nombre || '';
        this.apellido=respuesta.data.apellido || '';
        this.correo=respuesta.data.correo || '';
        this.cargando=false;
      },
      error:(err)=>{
        console.error('❌ Error cargando perfil:',err);
        this.error=err?.error?.mensaje || 'No se pudo cargar la información del perfil.';
        this.cargando=false;
      }
    });
  }

  guardarCambios(){
    this.error='';
    this.mensajeExito='';

    const nombre=this.nombre.trim();
    const apellido=this.apellido.trim();
    const correo=this.correo.trim().toLowerCase();

    if(!nombre || !apellido || !correo){
      this.error='Todos los campos son obligatorios.';
      return;
    }

    if(nombre.length>100 || apellido.length>100){
      this.error='El nombre y apellido no pueden superar los 100 caracteres.';
      return;
    }

    if(correo.length>150){
      this.error='El correo no puede superar los 150 caracteres.';
      return;
    }

    const correoValido=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!correoValido.test(correo)){
      this.error='Ingrese un correo electrónico válido.';
      return;
    }

    if(!this.idUsuario){
      this.error='No se pudo identificar al usuario.';
      return;
    }

    this.guardando=true;

    this.authService.actualizarPerfil(this.idUsuario,{
      nombre,
      apellido,
      correo
    }).subscribe({
      next:(respuesta)=>{
        this.nombre=respuesta.data.nombre;
        this.apellido=respuesta.data.apellido;
        this.correo=respuesta.data.correo;

        this.authService.actualizarNombre(this.nombre);

        this.mensajeExito=respuesta.mensaje || 'Información actualizada correctamente.';
        this.guardando=false;
      },
      error:(err)=>{
        console.error('❌ Error actualizando perfil:',err);
        this.error=err?.error?.mensaje || 'No se pudo actualizar la información.';
        this.guardando=false;
      }
    });
  }
}
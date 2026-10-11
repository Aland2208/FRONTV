import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonIcon,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { Auth } from '../../servicios/auth';
import { validarCorreoElectronico } from '../../utilidades/correo-validator';
import { validarPassword } from '../../utilidades/password-validator';

interface Observador{
  id_usuario:number;
  nombre:string;
  apellido:string;
  correo:string;
  estado:number;
  fecha_creacion?:string;
}

@Component({
  selector:'app-usuarios-admin',
  templateUrl:'./usuarios-admin.component.html',
  styleUrls:['./usuarios-admin.component.scss'],
  standalone:true,
  imports:[CommonModule,FormsModule,IonIcon]
})
export class UsuariosAdminComponent implements OnInit{
  observadores:Observador[]=[];
  busqueda='';
  cargando=true;

  constructor(
    private authService:Auth,
    private alertController:AlertController,
    private toastController:ToastController,
    private cdr:ChangeDetectorRef
  ){}

  ngOnInit(){
    this.cargarObservadores();
  }

  get observadoresFiltrados():Observador[]{
    const texto=this.busqueda.trim().toLowerCase();

    if(!texto) return this.observadores;

    return this.observadores.filter(usuario=>
      usuario.nombre.toLowerCase().includes(texto)||
      usuario.apellido.toLowerCase().includes(texto)||
      usuario.correo.toLowerCase().includes(texto)
    );
  }

  get totalActivos():number{
    return this.observadores.filter(u=>Number(u.estado)===1).length;
  }

  get totalInactivos():number{
    return this.observadores.filter(u=>Number(u.estado)===0).length;
  }

  cargarObservadores(){
    this.cargando=true;

    this.authService.getObservadores().subscribe({
      next:(respuesta:any)=>{
        this.observadores=respuesta.data||[];
        this.cargando=false;
        this.cdr.detectChanges();
      },
      error:async(error)=>{
        
        this.cargando=false;
        this.cdr.detectChanges();

        await this.mostrarToast(
          error.error?.mensaje||'No se pudieron cargar los observadores.',
          'danger'
        );
      }
    });
  }

  async nuevoObservador(){
    const alerta=await this.alertController.create({
      header:'Nuevo observador',
      inputs:[
        {
          name:'nombre',
          type:'text',
          attributes:{maxlength:'100'},
          placeholder:'Nombre'
        },
        {
          name:'apellido',
          type:'text',
          attributes:{maxlength:'100'},
          placeholder:'Apellido'
        },
        {
          name:'correo',
          type:'email',
          attributes:{maxlength:'150'},
          placeholder:'Correo electrónico'
        },
        {
          name:'password',
          type:'password',
          attributes:{maxlength:'72'},
          placeholder:'Contraseña'
        }
      ],
      buttons:[
        {
          text:'Cancelar',
          role:'cancel'
        },
        {
          text:'Crear',
          handler:(datos)=>{
            this.crearObservador(datos);
            return true;
          }
        }
      ]
    });

    await alerta.present();
  }

  private crearObservador(datos:any){
    const nombre=String(datos.nombre||'').trim();
    const apellido=String(datos.apellido||'').trim();
    const correo=String(datos.correo||'').trim().toLowerCase();
    const password=String(datos.password||'');

    if(!nombre||!apellido||!correo||!password){
      this.mostrarToast(
        'Todos los campos son obligatorios.',
        'danger'
      );
      return;
    }

    if(!this.correoValido(correo)){
      this.mostrarToast(
        'Ingresa un correo electrónico válido.',
        'danger'
      );
      return;
    }

    if(!validarPassword(password).valida){
      this.mostrarToast(
        'La contraseña debe tener entre 8 y 72 bytes e incluir mayúscula, minúscula, número y carácter especial.',
        'danger'
      );
      return;
    }

    this.authService.crearObservador({
      nombre,
      apellido,
      correo,
      password
    }).subscribe({
      next:async(respuesta:any)=>{
        await this.mostrarToast(
          respuesta.mensaje||'Observador creado correctamente.',
          'success'
        );

        this.cargarObservadores();
      },
      error:async(error)=>{
        

        await this.mostrarToast(
          error.error?.mensaje||'No se pudo crear el observador.',
          'danger'
        );
      }
    });
  }

  async editarObservador(usuario:Observador){
    const alerta=await this.alertController.create({
      header:'Editar observador',
      inputs:[
        {
          name:'nombre',
          type:'text',
          value:usuario.nombre,
          attributes:{maxlength:'100'},
          placeholder:'Nombre'
        },
        {
          name:'apellido',
          type:'text',
          value:usuario.apellido,
          attributes:{maxlength:'100'},
          placeholder:'Apellido'
        },
        {
          name:'correo',
          type:'email',
          value:usuario.correo,
          attributes:{maxlength:'150'},
          placeholder:'Correo electrónico'
        }
      ],
      buttons:[
        {
          text:'Cancelar',
          role:'cancel'
        },
        {
          text:'Guardar',
          handler:(datos)=>{
            this.guardarEdicion(usuario,datos);
            return true;
          }
        }
      ]
    });

    await alerta.present();
  }

  private guardarEdicion(usuario:Observador,datos:any){
    const nombre=String(datos.nombre||'').trim();
    const apellido=String(datos.apellido||'').trim();
    const correo=String(datos.correo||'').trim().toLowerCase();

    if(!nombre||!apellido||!correo){
      this.mostrarToast(
        'Nombre, apellido y correo son obligatorios.',
        'danger'
      );
      return;
    }

    if(nombre.length>100||apellido.length>100){
      this.mostrarToast('El nombre y el apellido no pueden superar 100 caracteres.','danger');
      return;
    }

    if(!this.correoValido(correo)){
      this.mostrarToast(
        'Ingresa un correo electrónico válido.',
        'danger'
      );
      return;
    }

    this.authService.editarObservador(
      usuario.id_usuario,
      {nombre,apellido,correo}
    ).subscribe({
      next:async(respuesta:any)=>{
        usuario.nombre=nombre;
        usuario.apellido=apellido;
        usuario.correo=correo;

        this.cdr.detectChanges();

        await this.mostrarToast(
          respuesta.mensaje||'Observador actualizado correctamente.',
          'success'
        );
      },
      error:async(error)=>{
        

        await this.mostrarToast(
          error.error?.mensaje||'No se pudo actualizar el observador.',
          'danger'
        );
      }
    });
  }

  async cambiarEstado(usuario:Observador){
    const nuevoEstado=Number(usuario.estado)===1 ? 0 : 1;
    const accion=nuevoEstado===1 ? 'activar' : 'desactivar';

    const alerta=await this.alertController.create({
      header:nuevoEstado===1
        ? 'Activar observador'
        : 'Desactivar observador',
      message:`¿Deseas ${accion} la cuenta de ${usuario.nombre} ${usuario.apellido}?`,
      buttons:[
        {
          text:'Cancelar',
          role:'cancel'
        },
        {
          text:nuevoEstado===1 ? 'Activar' : 'Desactivar',
          handler:()=>{
            this.actualizarEstado(usuario,nuevoEstado);
          }
        }
      ]
    });

    await alerta.present();
  }

  private actualizarEstado(usuario:Observador,estado:number){
    this.authService.cambiarEstadoObservador(
      usuario.id_usuario,
      estado
    ).subscribe({
      next:async(respuesta:any)=>{
        usuario.estado=estado;

        this.cdr.detectChanges();

        await this.mostrarToast(
          respuesta.mensaje||
          (estado===1
            ? 'Observador activado correctamente.'
            : 'Observador desactivado correctamente.'),
          'success'
        );
      },
      error:async(error)=>{
        

        await this.mostrarToast(
          error.error?.mensaje||'No se pudo cambiar el estado.',
          'danger'
        );
      }
    });
  }

  private correoValido(correo:string):boolean{
    return validarCorreoElectronico(correo);
  }

  private async mostrarToast(
    mensaje:string,
    color:'success'|'danger'
  ){
    const toast=await this.toastController.create({
      message:mensaje,
      duration:2500,
      color,
      position:'top'
    });

    await toast.present();
  }
}
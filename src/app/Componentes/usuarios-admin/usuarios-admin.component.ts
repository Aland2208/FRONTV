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
  verificacion_pendiente:boolean;
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
  modalObservadorAbierto=false;
  modoFormulario:'crear'|'editar'='crear';
  guardandoObservador=false;
  errorFormulario='';
  usuarioEnEdicion:Observador|null=null;
  formularioObservador={
    nombre:'',
    apellido:'',
    correo:'',
    password:''
  };

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
      (usuario.nombre||'').toLowerCase().includes(texto)||
      (usuario.apellido||'').toLowerCase().includes(texto)||
      (usuario.correo||'').toLowerCase().includes(texto)
    );
  }

  get totalActivos():number{
    return this.observadores.filter(u=>Number(u.estado)===1).length;
  }

  get totalInactivos():number{
    return this.observadores.filter(
      u=>!u.verificacion_pendiente&&Number(u.estado)===0
    ).length;
  }

  get totalPendientesVerificacion():number{
    return this.observadores.filter(u=>u.verificacion_pendiente).length;
  }

  cargarObservadores(){
    this.cargando=true;

    this.authService.getObservadores().subscribe({
      next:(respuesta:any)=>{
        this.observadores=(respuesta.data||[]).map((usuario:Observador)=>({
          ...usuario,
          verificacion_pendiente:Number(usuario.verificacion_pendiente)===1
        }));
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
    this.modoFormulario='crear';
    this.usuarioEnEdicion=null;
    this.formularioObservador={nombre:'',apellido:'',correo:'',password:''};
    this.errorFormulario='';
    this.modalObservadorAbierto=true;
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

    if(!this.nombreValido(nombre)||!this.nombreValido(apellido)){
      this.mostrarToast(
        'El nombre y el apellido no son válidos.',
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
        'La contraseña no cumple los requisitos de seguridad.',
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
        this.guardandoObservador=false;
        this.modalObservadorAbierto=false;
        await this.mostrarToast(
          respuesta.mensaje||'Observador creado correctamente.',
          'success'
        );

        this.cargarObservadores();
      },
      error:async(error)=>{
        this.guardandoObservador=false;
        this.errorFormulario=error.error?.mensaje||'No se pudo crear el observador.';
        await this.mostrarToast(
          this.errorFormulario,
          'danger'
        );
      }
    });
  }

  async editarObservador(usuario:Observador){
    this.modoFormulario='editar';
    this.usuarioEnEdicion=usuario;
    this.formularioObservador={
      nombre:usuario.nombre,
      apellido:usuario.apellido,
      correo:usuario.correo,
      password:''
    };
    this.errorFormulario='';
    this.modalObservadorAbierto=true;
  }

  private guardarEdicion(usuario:Observador,datos:any){
    const nombre=String(datos.nombre||'').trim();
    const apellido=String(datos.apellido||'').trim();

    if(!nombre||!apellido){
      this.mostrarToast(
        'El nombre y el apellido son obligatorios.',
        'danger'
      );
      return;
    }

    if(!this.nombreValido(nombre)||!this.nombreValido(apellido)){
      this.mostrarToast(
        'El nombre y el apellido no son válidos.',
        'danger'
      );
      return;
    }

    this.authService.editarObservador(
      usuario.id_usuario,
      {nombre,apellido}
    ).subscribe({
      next:async(respuesta:any)=>{
        usuario.nombre=nombre;
        usuario.apellido=apellido;
        this.guardandoObservador=false;
        this.modalObservadorAbierto=false;
        this.cdr.detectChanges();

        await this.mostrarToast(
          respuesta.mensaje||'Observador actualizado correctamente.',
          'success'
        );
      },
      error:async(error)=>{
        this.guardandoObservador=false;
        this.errorFormulario=error.error?.mensaje||'No se pudo actualizar el observador.';
        await this.mostrarToast(
          this.errorFormulario,
          'danger'
        );
      }
    });
  }

  cerrarFormularioObservador():void{
    if(this.guardandoObservador) return;
    this.modalObservadorAbierto=false;
    this.usuarioEnEdicion=null;
    this.errorFormulario='';
  }

  guardarFormularioObservador():void{
    if(this.guardandoObservador) return;

    const datos={
      nombre:this.formularioObservador.nombre.trim(),
      apellido:this.formularioObservador.apellido.trim(),
      correo:this.formularioObservador.correo.trim().toLowerCase(),
      password:this.formularioObservador.password
    };
    const error=this.modoFormulario==='crear'
      ? this.validarDatosNuevoObservador(datos)
      : this.validarDatosEdicion(datos);

    if(error){
      this.errorFormulario=error;
      return;
    }

    this.errorFormulario='';
    this.guardandoObservador=true;
    if(this.modoFormulario==='crear'){
      this.crearObservador(datos);
    }else if(this.usuarioEnEdicion){
      this.guardarEdicion(this.usuarioEnEdicion,datos);
    }
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

  private validarDatosNuevoObservador(datos:any):string|null{
    const nombre=String(datos?.nombre||'').trim();
    const apellido=String(datos?.apellido||'').trim();
    const correo=String(datos?.correo||'').trim().toLowerCase();
    const password=String(datos?.password||'');

    let mensaje='';
    if(!nombre||!apellido||!correo||!password){
      mensaje='Todos los campos son obligatorios.';
    }else if(!this.nombreValido(nombre)||!this.nombreValido(apellido)){
      mensaje='El nombre y el apellido no son válidos.';
    }else if(!this.correoValido(correo)){
      mensaje='Ingresa un correo electrónico válido.';
    }else if(!validarPassword(password).valida){
      mensaje='La contraseña no cumple los requisitos de seguridad.';
    }

    return mensaje||null;
  }

  private validarDatosEdicion(datos:any):string|null{
    const nombre=String(datos?.nombre||'').trim();
    const apellido=String(datos?.apellido||'').trim();

    if(nombre&&apellido&&this.nombreValido(nombre)&&this.nombreValido(apellido)){
      return null;
    }

    return !nombre||!apellido
      ? 'El nombre y el apellido son obligatorios.'
      : 'El nombre y el apellido no son válidos.';
  }

  private nombreValido(nombre:string):boolean{
    return nombre.length>=2&&nombre.length<=30&&
      /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u.test(nombre);
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
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, AlertController, ToastController } from '@ionic/angular/standalone';
import { Auth } from '../../servicios/auth';

interface Administrador{
  id_usuario?:number;
  id_administrador?:number;
  nombre:string;
  apellido:string;
  correo:string;
  fecha_inicio?:string;
}

@Component({
  selector:'app-vincular-administrador',
  templateUrl:'./vincular-administrador.component.html',
  styleUrls:['./vincular-administrador.component.scss'],
  standalone:true,
  imports:[CommonModule,FormsModule,IonIcon]
})
export class VincularAdministradorComponent implements OnInit{
  correo='';
  buscando=false;
  vinculando=false;
  cargandoActual=true;
  mensaje='';
  administrador:Administrador|null=null;
  administradorActual:Administrador|null=null;

  constructor(
    private authService:Auth,
    private alertController:AlertController,
    private toastController:ToastController,
    private cdr:ChangeDetectorRef
  ){}

  ngOnInit(){
    this.cargarAdministradorActual();
  }

  cargarAdministradorActual(){
    const idUsuario=this.authService.obtenerIdUsuario();

    if(!idUsuario){
      this.cargandoActual=false;
      this.cdr.detectChanges();
      return;
    }

    this.cargandoActual=true;

    this.authService.obtenerAdministradorActual(idUsuario).subscribe({
      next:(respuesta:any)=>{
        console.log('Administrador actual:',respuesta);

        this.administradorActual=respuesta.vinculado ? respuesta.data : null;
        this.cargandoActual=false;
        this.cdr.detectChanges();
      },
      error:(error)=>{
        console.error('Error obteniendo administrador actual:',error);

        this.administradorActual=null;
        this.cargandoActual=false;
        this.cdr.detectChanges();
      }
    });
  }

  buscarAdministrador(){
    if(this.buscando||this.vinculando) return;

    this.mensaje='';
    this.administrador=null;

    const correo=this.correo.trim().toLowerCase();

    if(!correo){
      this.mensaje='Ingresa el correo electrónico del administrador.';
      return;
    }

    if(!this.correoValido(correo)){
      this.mensaje='Ingresa un correo electrónico válido.';
      return;
    }

    this.buscando=true;

    this.authService.buscarAdministradorPorCorreo(correo).subscribe({
      next:(respuesta:any)=>{
        this.buscando=false;

        if(respuesta.estado===1){
          this.administrador=respuesta.data;

          if(
            this.administradorActual &&
            Number(this.administradorActual.id_administrador)===
            Number(this.administrador?.id_usuario)
          ){
            this.mensaje='Este administrador ya está vinculado actualmente a tu cuenta.';
          }
        }else{
          this.mensaje=respuesta.mensaje||'No se encontró el administrador.';
        }

        this.cdr.detectChanges();
      },
      error:(error)=>{
        this.buscando=false;
        this.administrador=null;

        if(error.status===404){
          this.mensaje='No se encontró un administrador con este correo.';
        }else{
          this.mensaje=error.error?.mensaje||'No se pudo buscar el administrador.';
        }

        console.error('Error buscando administrador:',error);
        this.cdr.detectChanges();
      }
    });
  }

  async vincularAdministrador(){
    if(!this.administrador||this.vinculando) return;

    const idUsuario=this.authService.obtenerIdUsuario();
    const idAdministrador=this.administrador.id_usuario;

    if(!idUsuario){
      await this.mostrarToast('No se pudo identificar al usuario.','danger');
      return;
    }

    if(!idAdministrador){
      await this.mostrarToast('No se pudo identificar al administrador.','danger');
      return;
    }

    if(
      this.administradorActual &&
      Number(this.administradorActual.id_administrador)===Number(idAdministrador)
    ){
      await this.mostrarToast(
        'Ya estás vinculado actualmente a este administrador.',
        'success'
      );
      return;
    }

    if(this.administradorActual){
      await this.confirmarReasignacion(idUsuario,idAdministrador);
      return;
    }

    const alerta=await this.alertController.create({
      header:'Vincular administrador',
      message:`¿Deseas vincular tu cuenta con ${this.administrador.nombre} ${this.administrador.apellido}?`,
      buttons:[
        {text:'Cancelar',role:'cancel'},
        {
          text:'Vincular',
          handler:()=>{
            this.realizarVinculacion(idUsuario,idAdministrador);
          }
        }
      ]
    });

    await alerta.present();
  }

  private realizarVinculacion(idUsuario:number,idAdministrador:number){
    this.vinculando=true;
    this.cdr.detectChanges();

    this.authService.asignarAdministrador(idAdministrador,idUsuario).subscribe({
      next:async(respuesta:any)=>{
        console.log('Vinculación realizada:',respuesta);

        this.vinculando=false;
        this.administrador=null;
        this.correo='';
        this.mensaje='';

        this.cdr.detectChanges();

        await this.mostrarToast(
          respuesta.mensaje||'Administrador vinculado correctamente.',
          'success'
        );

        // Volvemos a consultar la BD
        this.cargarAdministradorActual();
      },
      error:async(error)=>{
        console.error('Error vinculando administrador:',error);

        this.vinculando=false;
        this.cdr.detectChanges();

        if(error.status===409){
          await this.confirmarReasignacion(idUsuario,idAdministrador);
          return;
        }

        await this.mostrarToast(
          error.error?.mensaje||'No se pudo realizar la vinculación.',
          'danger'
        );
      }
    });
  }

  private async confirmarReasignacion(idUsuario:number,idAdministrador:number){
    if(!this.administrador) return;

    const nombre=`${this.administrador.nombre} ${this.administrador.apellido}`;

    const alerta=await this.alertController.create({
      header:'Cambiar administrador',
      message:`Actualmente ya tienes un administrador vinculado. ¿Deseas cambiarlo por ${nombre}?`,
      buttons:[
        {text:'Cancelar',role:'cancel'},
        {
          text:'Cambiar',
          handler:()=>{
            this.realizarReasignacion(idUsuario,idAdministrador);
          }
        }
      ]
    });

    await alerta.present();
  }

  private realizarReasignacion(idUsuario:number,idAdministrador:number){
    this.vinculando=true;
    this.cdr.detectChanges();

    this.authService.reasignarAdministrador(
      idUsuario,
      idAdministrador
    ).subscribe({
      next:async(respuesta:any)=>{
        console.log('Reasignación realizada:',respuesta);

        this.vinculando=false;
        this.administrador=null;
        this.correo='';
        this.mensaje='';

        this.cdr.detectChanges();

        await this.mostrarToast(
          respuesta.mensaje||'Administrador actualizado correctamente.',
          'success'
        );

        // Consultamos nuevamente la BD
        this.cargarAdministradorActual();
      },
      error:async(error)=>{
        console.error('Error reasignando administrador:',error);

        this.vinculando=false;
        this.cdr.detectChanges();

        await this.mostrarToast(
          error.error?.mensaje||'No se pudo cambiar el administrador.',
          'danger'
        );
      }
    });
  }

  private correoValido(correo:string):boolean{
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
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
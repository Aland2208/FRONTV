import {Component,OnInit,OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {Auth} from './../../servicios/auth';
import {
 IonContent,IonItem,IonInput,IonButton,IonSpinner,
 ToastController,IonIcon
} from '@ionic/angular/standalone';

@Component({
 selector:'app-login',
 templateUrl:'./login.page.html',
 styleUrls:['./login.page.scss'],
 standalone:true,
 imports:[
  IonContent,IonItem,IonInput,IonButton,IonSpinner,
  IonIcon,CommonModule,FormsModule
 ]
})
export class LoginPage implements OnInit,OnDestroy{
 correo:string='';
 password:string='';
 cargando:boolean=false;
 private bloquearRetroceso=false;

 private onPopState=()=>{
  if(!this.bloquearRetroceso) return;

  history.pushState(
   {vigiaLogin:true},
   '',
   '/login'
  );
 };

 constructor(
  private Auth:Auth,
  private router:Router,
  private toastCtrl:ToastController
 ){}

 ngOnInit(){
  if(sessionStorage.getItem('bloquear_retroceso_login')==='true'){
   this.bloquearRetroceso=true;

   sessionStorage.removeItem('bloquear_retroceso_login');

   history.pushState(
    {vigiaLogin:true},
    '',
    '/login'
   );

   window.addEventListener('popstate',this.onPopState);
  }
 }

 ngOnDestroy(){
  window.removeEventListener('popstate',this.onPopState);
 }

 irRegistro(){
  this.desactivarBloqueo();
  this.router.navigate(['/registro']);
 }

 irRecuperar(){
  this.desactivarBloqueo();
  this.router.navigate(['/recuperar']);
 }

 private desactivarBloqueo(){
  this.bloquearRetroceso=false;
  window.removeEventListener('popstate',this.onPopState);
 }

 iniciarSesion(){
  if(this.cargando) return;

  if(!this.correo.trim()||!this.password){
   this.mostrarMensaje(
    'Ingresa tu correo y contraseña.',
    'warning'
   );
   return;
  }

  this.cargando=true;

  this.Auth.login({
   correo:this.correo.trim(),
   password:this.password
  }).subscribe({
   next:(res)=>{
    this.cargando=false;

    this.Auth.guardarSesion(
     res.token,
     res.data.id_usuario,
     res.data.nombre,
     res.data.id_rol
    );

    const nombre=res.data.nombre;

    this.correo='';
    this.password='';

    this.desactivarBloqueo();

    this.mostrarMensaje(
     `¡Bienvenido ${nombre}!`,
     'success'
    );

    this.router.navigate(['/home'],{replaceUrl:true});
   },

   error:(err)=>{
    this.cargando=false;

    this.mostrarMensaje(
     err.error?.mensaje||'Error al conectar con el servidor',
     'danger'
    );
   }
  });
 }

 async mostrarMensaje(mensaje:string,color:string){
  const toast=await this.toastCtrl.create({
   message:mensaje,
   duration:3000,
   color,
   position:'bottom'
  });

  await toast.present();
 }
}
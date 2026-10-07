import {Component,OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router,RouterLink} from '@angular/router';
import {Auth} from './../../servicios/auth';
import {
 IonContent,
 IonItem,
 IonInput,
 IonButton,
 IonSpinner,
 ToastController,
 IonIcon
} from '@ionic/angular/standalone';

@Component({
 selector:'app-login',
 templateUrl:'./login.page.html',
 styleUrls:['./login.page.scss'],
 standalone:true,
 imports:[
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonIcon,
  CommonModule,
  FormsModule,
  RouterLink
 ]
})
export class LoginPage implements OnInit{
 correo:string='';
 password:string='';
 cargando:boolean=false;

 constructor(
  private Auth:Auth,
  private router:Router,
  private toastCtrl:ToastController
 ){}

 ngOnInit(){}

 iniciarSesion(){
  if(this.cargando) return;

  if(!this.correo.trim()||!this.password){
   this.mostrarMensaje('Ingresa tu correo y contraseña.','warning');
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

    this.mostrarMensaje(`¡Bienvenido ${nombre}!`,'success');

    // Reemplaza Login por Home en el historial
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
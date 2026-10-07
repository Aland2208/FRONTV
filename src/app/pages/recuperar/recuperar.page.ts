import {Component,OnInit,OnDestroy} from '@angular/core';
import {CommonModule,Location} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {Auth} from './../../servicios/auth';
import {
 IonContent,IonHeader,IonToolbar,IonItem,IonInput,IonButton,
 IonSpinner,IonButtons,ToastController,IonIcon
} from '@ionic/angular/standalone';

@Component({
 selector:'app-recuperar',
 templateUrl:'./recuperar.page.html',
 styleUrls:['./recuperar.page.scss'],
 standalone:true,
 imports:[
  IonContent,IonHeader,IonToolbar,IonItem,IonInput,IonButton,
  IonSpinner,IonButtons,CommonModule,FormsModule,IonIcon
 ]
})
export class RecuperarPage implements OnInit,OnDestroy{
 correo:string='';
 correoDestino:string='';
 cargando:boolean=false;
 correoEnviado:boolean=false;

 private bloquearHistorial=false;

 private manejarPopState=()=>{
  if(this.bloquearHistorial){
   history.pushState({recuperacion:true},'',this.router.url);
  }
 };

 constructor(
  private authService:Auth,
  private toastCtrl:ToastController,
  private router:Router,
  private location:Location
 ){}

 ngOnInit(){
  window.addEventListener('popstate',this.manejarPopState);
 }

 ngOnDestroy(){
  window.removeEventListener('popstate',this.manejarPopState);
 }

 volverLogin(){
  if(this.correoEnviado) return;

  window.location.replace('/login');
 }

 enviarCorreo(){
  if(!this.correo.trim()){
   this.mostrarMensaje(
    'Ingresa el correo asociado a tu cuenta.',
    'warning'
   );
   return;
  }

  if(this.cargando) return;

  this.cargando=true;

  this.authService.solicitarRecuperacion(this.correo.trim()).subscribe({
   next:()=>{
    this.cargando=false;

    this.correoDestino=this.correo.trim();
    this.correo='';
    this.correoEnviado=true;

    this.activarBloqueoHistorial();

    this.mostrarMensaje(
     'Te hemos enviado un correo con instrucciones.',
     'success'
    );
   },

   error:(err)=>{
    this.cargando=false;

    this.mostrarMensaje(
     err.error?.mensaje||'Error al solicitar recuperación',
     'danger'
    );
   }
  });
 }

 private activarBloqueoHistorial(){
  this.bloquearHistorial=true;

  history.replaceState(
   {recuperacion:true},
   '',
   this.router.url
  );

  history.pushState(
   {recuperacion:true},
   '',
   this.router.url
  );
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
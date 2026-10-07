import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from './../../servicios/auth';

// Importaciones Standalone
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonCard, IonCardContent, IonItem, IonLabel, 
  IonInput, IonButton, IonSpinner, IonButtons, 
  IonBackButton, ToastController,IonIcon
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-recuperar',
  templateUrl: './recuperar.page.html',
  styleUrls: ['./recuperar.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonCard, IonCardContent, IonItem, IonLabel, 
    IonInput, IonButton, IonSpinner, IonButtons, 
    IonBackButton, CommonModule, FormsModule,IonIcon
  ]
})
export class RecuperarPage implements OnInit {
  correo: string = '';
  cargando: boolean = false;
  correoEnviado: boolean = false;

  constructor(
    private authService: Auth,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() { }

  enviarCorreo() {
    if (!this.correo) {
      this.mostrarMensaje('Ingresa el correo asociado a tu cuenta.', 'warning');
      return;
    }

    this.cargando = true;
    this.authService.solicitarRecuperacion(this.correo).subscribe({
      next: (res) => {
        this.cargando = false;
        this.correoEnviado = true; 
        this.mostrarMensaje('Te hemos enviado un correo con instrucciones.', 'success');
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarMensaje(err.error?.mensaje || 'Error al solicitar recuperación', 'danger');
      }
    });
  }

  async mostrarMensaje(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje, duration: 3000, color: color, position: 'bottom'
    });
    toast.present();
  }
}
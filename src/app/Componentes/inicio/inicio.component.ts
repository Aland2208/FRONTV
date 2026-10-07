import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonIcon
} from '@ionic/angular/standalone';


@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss'],
  standalone: true,

  imports: [
    CommonModule,
    IonIcon
  ]
})
export class InicioComponent {

}
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketS {
  private socket: Socket;


  constructor() {

    this.socket = io(environment.socketUrl, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000
    });

  }

  escucharPeso(callback: (data: any) => void) {

    this.socket.off('pesoActual');
    this.socket.on('pesoActual', callback);
  }

  escucharGuardado(callback: (data: any) => void) {

    this.socket.off('nuevoPeso');
    this.socket.on('nuevoPeso', callback);
  }


  conectado(callback: () => void) {

    this.socket.on('connect', callback);

  }

  desconectado(callback: () => void) {

    this.socket.on('disconnect', callback);
  }

  desconectar() {

    if (this.socket) {

      this.socket.disconnect();
    }
  }

  escucharTara(callback: (data: any) => void) {

    this.socket.off('taraRealizada');
    this.socket.on('taraRealizada', callback);
  }
}

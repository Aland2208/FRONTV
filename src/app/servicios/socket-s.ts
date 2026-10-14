
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketS {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.socketUrl, {
      autoConnect: false,
      auth: (callback) => callback({
        token: sessionStorage.getItem('veedor_token')
      }),
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000
    });
  }

  conectar(): void {
    if (!this.socket.connected) this.socket.connect();
  }

  escucharPeso(callback: (data: any) => void): void {
    this.socket.off('pesoActual');
    this.socket.on('pesoActual', callback);
  }

  escucharGuardado(callback: (data: any) => void): void {
    this.socket.off('nuevoPeso');
    this.socket.on('nuevoPeso', callback);
  }

  escucharTara(callback: (data: any) => void): void {
    this.socket.off('taraRealizada');
    this.socket.on('taraRealizada', callback);
  }

  conectado(callback: () => void): void {
    this.socket.off('connect');
    this.socket.on('connect', callback);
  }

  desconectado(callback: () => void): void {
    this.socket.off('disconnect');
    this.socket.on('disconnect', callback);
  }

  dejarDeEscucharBalanza(): void {
    this.socket.off('pesoActual');
    this.socket.off('nuevoPeso');
    this.socket.off('taraRealizada');
    this.socket.off('connect');
    this.socket.off('disconnect');
  }

  desconectar(): void {
    this.socket.disconnect();
  }
}

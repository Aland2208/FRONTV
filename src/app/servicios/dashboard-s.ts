import {Injectable} from '@angular/core';
import {HttpClient,HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({
 providedIn:'root'
})
export class DashboardS{
 private api=`${environment.apiUrl}dashboard`;

 constructor(private http:HttpClient){}

 // Dashboard del veedor
 obtenerDashboardVeedor(idUsuario:number):Observable<any>{
  return this.http.get(`${this.api}/veedor/${idUsuario}`);
 }

 // Dashboard general del administrador
 obtenerDashboardAdministrador(
  idAdministrador:number,
  periodo:string='hoy',
  idUsuario:number|null=null,
  desde:string|null=null,
  hasta:string|null=null
 ):Observable<any>{
  let params=new HttpParams().set('periodo',periodo);

  if(idUsuario!==null){
   params=params.set('id_usuario',idUsuario.toString());
  }

  if(periodo==='personalizado'){
   if(desde)params=params.set('desde',desde);
   if(hasta)params=params.set('hasta',hasta);
  }

  return this.http.get(
   `${this.api}/admin/${idAdministrador}`,
   {params}
  );
 }
}
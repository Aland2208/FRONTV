export interface RequisitosPassword {
  longitud: boolean;
  minuscula: boolean;
  mayuscula: boolean;
  numero: boolean;
  especial: boolean;
  valida: boolean;
}

export function validarPassword(password: string): RequisitosPassword {
  const valor = password || '';

  const requisitos: RequisitosPassword = {
    longitud: valor.length >= 8,
    minuscula: /[a-z]/.test(valor),
    mayuscula: /[A-Z]/.test(valor),
    numero: /[0-9]/.test(valor),
    especial: /[^A-Za-z0-9\s]/.test(valor),
    valida: false
  };

  requisitos.valida =
    requisitos.longitud &&
    requisitos.minuscula &&
    requisitos.mayuscula &&
    requisitos.numero &&
    requisitos.especial;

  return requisitos;
}
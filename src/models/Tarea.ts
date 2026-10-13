
 // Prioridades posibles de una tarea.
export type Prioridad = 'alta' | 'media' | 'baja';

 // Encapsula datos y validaciones de negocio.
export class Tarea {
  readonly id: string;
  titulo: string;
  prioridad: Prioridad;
  completada: boolean;
  readonly fecha: Date;

  constructor(
    titulo: string,
    prioridad: Prioridad,
    id?: string,
    completada: boolean = false,
    fecha?: Date
  ) {
    const tituloLimpio = titulo.trim();
    if (!tituloLimpio) {
      throw new Error('El título no puede estar vacío');
    }
    if (tituloLimpio.length > 120) {
      throw new Error('El título no puede superar 120 caracteres');
    }
    if (!['alta', 'media', 'baja'].includes(prioridad)) {
      throw new Error('Prioridad inválida. Use: alta, media o baja');
    }

    this.id = id ?? crypto.randomUUID();
    this.titulo = tituloLimpio;
    this.prioridad = prioridad;
    this.completada = completada;
    this.fecha = fecha ?? new Date();
  }

  //Marca la tarea como completada o pendiente.
  toggleCompletada(): void {
    this.completada = !this.completada;
  }

  // Actualiza título y/o prioridad con validación.
  actualizar(titulo?: string, prioridad?: Prioridad): void {
    if (titulo !== undefined) {
      const tituloLimpio = titulo.trim();
      if (!tituloLimpio) {
        throw new Error('El título no puede estar vacío');
      }
      if (tituloLimpio.length > 120) {
        throw new Error('El título no puede superar 120 caracteres');
      }
      this.titulo = tituloLimpio;
    }
    if (prioridad !== undefined) {
      if (!['alta', 'media', 'baja'].includes(prioridad)) {
        throw new Error('Prioridad inválida. Use: alta, media o baja');
      }
      this.prioridad = prioridad;
    }
  }

  //Serializa a objeto plano para persistencia.
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      titulo: this.titulo,
      prioridad: this.prioridad,
      completada: this.completada,
      fecha: this.fecha.toISOString(),
    };
  }

  //Reconstruye una Tarea desde datos serializados.
  static fromJSON(data: Record<string, unknown>): Tarea {
    if (
      typeof data.id !== 'string' ||
      typeof data.titulo !== 'string' ||
      typeof data.prioridad !== 'string' ||
      typeof data.completada !== 'boolean' ||
      typeof data.fecha !== 'string'
    ) {
      throw new Error('Datos de tarea inválidos en almacenamiento');
    }
    return new Tarea(
      data.titulo,
      data.prioridad as Prioridad,
      data.id,
      data.completada,
      new Date(data.fecha)
    );
  }
}

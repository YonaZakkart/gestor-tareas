/**
 * Prioridades posibles de una tarea.
 */
export type Prioridad = 'alta' | 'media' | 'baja';

/**
 * Categorías fijas (validación por lista cerrada).
 */
export type Categoria = 'trabajo' | 'personal' | 'estudio' | 'otro';

export const CATEGORIAS: Categoria[] = ['trabajo', 'personal', 'estudio', 'otro'];

/**
 * Modelo de dominio: Tarea.
 * Encapsula datos y validaciones de negocio.
 */
export class Tarea {
  readonly id: string;
  titulo: string;
  prioridad: Prioridad;
  categoria: Categoria;
  completada: boolean;
  readonly fecha: Date;
  /** null = sin fecha límite */
  fechaLimite: Date | null;

  constructor(
    titulo: string,
    prioridad: Prioridad,
    categoria: Categoria = 'otro',
    fechaLimite: Date | null = null,
    id?: string,
    completada: boolean = false,
    fecha?: Date
  ) {
    const tituloLimpio = titulo.trim();
    if (!tituloLimpio) {
      throw new Error('El título no puede estar vacío.');
    }
    if (tituloLimpio.length > 120) {
      throw new Error('El título no puede superar 120 caracteres.');
    }
    if (!['alta', 'media', 'baja'].includes(prioridad)) {
      throw new Error('Prioridad inválida. Use: alta, media o baja.');
    }
    if (!CATEGORIAS.includes(categoria)) {
      throw new Error('Categoría inválida.');
    }
    if (fechaLimite !== null && Number.isNaN(fechaLimite.getTime())) {
      throw new Error('Fecha límite inválida.');
    }

    this.id = id ?? crypto.randomUUID();
    this.titulo = tituloLimpio;
    this.prioridad = prioridad;
    this.categoria = categoria;
    this.fechaLimite = fechaLimite;
    this.completada = completada;
    this.fecha = fecha ?? new Date();
  }

  /**
   * Pendiente y con fecha límite anterior a hoy (inicio del día local).
   */
  estaVencida(): boolean {
    if (this.completada || !this.fechaLimite) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(this.fechaLimite);
    limite.setHours(0, 0, 0, 0);
    return limite.getTime() < hoy.getTime();
  }

  toggleCompletada(): void {
    this.completada = !this.completada;
  }

  /**
   * Actualiza campos con validación.
   */
  actualizar(datos: {
    titulo?: string;
    prioridad?: Prioridad;
    categoria?: Categoria;
    fechaLimite?: Date | null;
  }): void {
    if (datos.titulo !== undefined) {
      const t = datos.titulo.trim();
      if (!t) throw new Error('El título no puede estar vacío.');
      if (t.length > 120) throw new Error('El título no puede superar 120 caracteres.');
      this.titulo = t;
    }
    if (datos.prioridad !== undefined) {
      if (!['alta', 'media', 'baja'].includes(datos.prioridad)) {
        throw new Error('Prioridad inválida.');
      }
      this.prioridad = datos.prioridad;
    }
    if (datos.categoria !== undefined) {
      if (!CATEGORIAS.includes(datos.categoria)) {
        throw new Error('Categoría inválida.');
      }
      this.categoria = datos.categoria;
    }
    if (datos.fechaLimite !== undefined) {
      if (datos.fechaLimite !== null && Number.isNaN(datos.fechaLimite.getTime())) {
        throw new Error('Fecha límite inválida.');
      }
      this.fechaLimite = datos.fechaLimite;
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      titulo: this.titulo,
      prioridad: this.prioridad,
      categoria: this.categoria,
      completada: this.completada,
      fecha: this.fecha.toISOString(),
      fechaLimite: this.fechaLimite
        ? this.fechaLimite.toISOString().slice(0, 10)
        : null,
    };
  }

  static fromJSON(data: Record<string, unknown>): Tarea {
    if (
      typeof data.id !== 'string' ||
      typeof data.titulo !== 'string' ||
      typeof data.prioridad !== 'string' ||
      typeof data.completada !== 'boolean' ||
      typeof data.fecha !== 'string'
    ) {
      throw new Error('Datos de tarea inválidos en almacenamiento.');
    }

    const cat =
      typeof data.categoria === 'string' &&
      CATEGORIAS.includes(data.categoria as Categoria)
        ? (data.categoria as Categoria)
        : 'otro';

    let limite: Date | null = null;
    if (typeof data.fechaLimite === 'string' && data.fechaLimite) {
      limite = new Date(
        data.fechaLimite.length === 10
          ? data.fechaLimite + 'T12:00:00'
          : data.fechaLimite
      );
      if (Number.isNaN(limite.getTime())) limite = null;
    }

    return new Tarea(
      data.titulo,
      data.prioridad as Prioridad,
      cat,
      limite,
      data.id,
      data.completada,
      new Date(data.fecha)
    );
  }
}

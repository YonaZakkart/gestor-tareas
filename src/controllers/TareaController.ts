import { Tarea, Prioridad, Categoria } from '../models/Tarea.js';
import { TareaView } from '../views/TareaView.js';
import { StorageService } from '../services/StorageService.js';

/**
 * Controlador: CRUD, filtros, orden, import/export y deshacer.
 */
export class TareaController {
  private tareas: Tarea[] = [];
  private vista: TareaView;
  private ultimaEliminada: { tarea: Tarea; indice: number } | null = null;
  private temporizadorDeshacer: ReturnType<typeof setTimeout> | null = null;

  constructor(vista: TareaView) {
    this.vista = vista;
    this.tareas = StorageService.cargar();
    this.registrarCallbacks();
    this.actualizarVista();
  }

  private registrarCallbacks(): void {
    this.vista.onAgregar = (titulo, prioridad, categoria, fechaLimite) =>
      this.agregar(titulo, prioridad, categoria, fechaLimite);
    this.vista.onToggle = (id) => this.toggle(id);
    this.vista.onEliminar = (id) => this.eliminar(id);
    this.vista.onEditar = (id, titulo, prioridad, categoria, fechaLimite) =>
      this.editar(id, titulo, prioridad, categoria, fechaLimite);
    this.vista.onFiltrarOrdenar = () => this.actualizarVista();
    this.vista.onDeshacerEliminar = () => this.deshacerEliminar();
    this.vista.onExportar = () => this.exportar();
    this.vista.onImportar = (archivo) => this.importar(archivo);
  }

  private persistir(): void {
    StorageService.guardar(this.tareas);
  }

  private getContadorPorPrioridad(): { alta: number; media: number; baja: number } {
    const c = { alta: 0, media: 0, baja: 0 };
    for (const t of this.tareas) {
      c[t.prioridad]++;
    }
    return c;
  }

  private getTareasVencidas(): Tarea[] {
    return this.tareas.filter((t) => t.estaVencida());
  }

  private parseFechaLimite(valor: string): Date | null {
    if (!valor.trim()) return null;
    const d = new Date(valor.length === 10 ? valor + 'T12:00:00' : valor);
    if (Number.isNaN(d.getTime())) {
      throw new Error('Fecha límite inválida.');
    }
    return d;
  }

  private actualizarVista(): void {
    const criterios = this.vista.obtenerCriterios();
    let lista = [...this.tareas];

    if (criterios.busqueda) {
      lista = lista.filter((t) => t.titulo.toLowerCase().includes(criterios.busqueda));
    }

    if (criterios.prioridad !== 'todas') {
      lista = lista.filter((t) => t.prioridad === criterios.prioridad);
    }

    if (criterios.categoria !== 'todas') {
      lista = lista.filter((t) => t.categoria === criterios.categoria);
    }

    if (criterios.estado === 'pendientes') {
      lista = lista.filter((t) => !t.completada);
    } else if (criterios.estado === 'completadas') {
      lista = lista.filter((t) => t.completada);
    } else if (criterios.estado === 'vencidas') {
      lista = lista.filter((t) => t.estaVencida());
    }

    lista = this.ordenar(lista, criterios.orden);

    const contadorPrioridad = this.getContadorPorPrioridad();
    const vencidas = this.getTareasVencidas().length;
    const pendientesTotales = this.tareas.filter((t) => !t.completada).length;
    const completadas = this.tareas.filter((t) => t.completada).length;

    this.vista.renderizar(
      lista,
      this.tareas.length,
      pendientesTotales,
      contadorPrioridad,
      vencidas
    );
    this.vista.renderResumen(
      contadorPrioridad,
      this.tareas.length,
      vencidas,
      completadas
    );
  }

  private ordenar(lista: Tarea[], criterio: string): Tarea[] {
    const pesoPrioridad: Record<Prioridad, number> = {
      alta: 0,
      media: 1,
      baja: 2,
    };
    const copia = [...lista];

    switch (criterio) {
      case 'prioridad-asc':
        copia.sort(
          (a, b) => pesoPrioridad[a.prioridad] - pesoPrioridad[b.prioridad]
        );
        break;
      case 'prioridad-desc':
        copia.sort(
          (a, b) => pesoPrioridad[b.prioridad] - pesoPrioridad[a.prioridad]
        );
        break;
      case 'fecha-asc':
        copia.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
        break;
      case 'titulo-asc':
        copia.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' }));
        break;
      case 'titulo-desc':
        copia.sort((a, b) => b.titulo.localeCompare(a.titulo, 'es', { sensitivity: 'base' }));
        break;
      case 'limite-asc':
        copia.sort((a, b) => {
          if (!a.fechaLimite && !b.fechaLimite) return 0;
          if (!a.fechaLimite) return 1;
          if (!b.fechaLimite) return -1;
          return a.fechaLimite.getTime() - b.fechaLimite.getTime();
        });
        break;
      case 'fecha-desc':
      default:
        copia.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
        break;
    }
    return copia;
  }

  agregar(
    titulo: string,
    prioridad: Prioridad,
    categoria: Categoria,
    fechaLimiteStr: string
  ): void {
    try {
      const limite = this.parseFechaLimite(fechaLimiteStr);
      const nueva = new Tarea(titulo, prioridad, categoria, limite);

      const duplicada = this.tareas.some(
        (t) =>
          !t.completada &&
          t.titulo.toLowerCase() === nueva.titulo.toLowerCase()
      );
      if (duplicada) {
        throw new Error('Ya existe una tarea pendiente con ese título.');
      }

      this.tareas.unshift(nueva);
      this.persistir();
      this.vista.limpiarFormulario();
      this.vista.ocultarError();
      this.actualizarVista();
      this.vista.mostrarMensaje('Tarea agregada.', 'exito');
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'Error al crear la tarea.';
      this.vista.mostrarError(mensaje);
    }
  }

  toggle(id: string): void {
    const tarea = this.tareas.find((t) => t.id === id);
    if (!tarea) return;
    tarea.toggleCompletada();
    this.persistir();
    this.actualizarVista();
    const estado = tarea.completada ? 'completada' : 'pendiente';
    this.vista.mostrarMensaje(`Tarea marcada como ${estado}.`, 'exito');
  }

  eliminar(id: string): void {
    const indice = this.tareas.findIndex((t) => t.id === id);
    if (indice === -1) return;

    const [eliminada] = this.tareas.splice(indice, 1);
    this.ultimaEliminada = { tarea: eliminada, indice };
    this.persistir();
    this.actualizarVista();

    if (this.temporizadorDeshacer !== null) {
      clearTimeout(this.temporizadorDeshacer);
    }

    this.vista.mostrarMensajeConDeshacer(
      `«${eliminada.titulo}» eliminada.`,
      () => this.deshacerEliminar()
    );

    this.temporizadorDeshacer = setTimeout(() => {
      this.ultimaEliminada = null;
      this.temporizadorDeshacer = null;
      this.vista.ocultarError();
    }, 5000);
  }

  deshacerEliminar(): void {
    if (!this.ultimaEliminada) return;

    if (this.temporizadorDeshacer !== null) {
      clearTimeout(this.temporizadorDeshacer);
      this.temporizadorDeshacer = null;
    }

    const { tarea, indice } = this.ultimaEliminada;
    const pos = Math.min(indice, this.tareas.length);
    this.tareas.splice(pos, 0, tarea);
    this.ultimaEliminada = null;
    this.persistir();
    this.actualizarVista();
    this.vista.mostrarMensaje('Eliminación deshecha.', 'exito');
  }

  editar(
    id: string,
    titulo: string,
    prioridad: Prioridad,
    categoria: Categoria,
    fechaLimiteStr: string
  ): void {
    const tarea = this.tareas.find((t) => t.id === id);
    if (!tarea) return;
    try {
      const limite = this.parseFechaLimite(fechaLimiteStr);
      tarea.actualizar({
        titulo,
        prioridad,
        categoria,
        fechaLimite: limite,
      });
      this.persistir();
      this.vista.ocultarError();
      this.actualizarVista();
      this.vista.mostrarMensaje('Tarea actualizada.', 'exito');
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'Error al editar la tarea.';
      this.vista.mostrarError(mensaje);
      this.actualizarVista();
    }
  }

  exportar(): void {
    try {
      const datos = this.tareas.map((t) => t.toJSON());
      const blob = new Blob([JSON.stringify(datos, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      const fecha = new Date().toISOString().slice(0, 10);
      enlace.href = url;
      enlace.download = `tareas-${fecha}.json`;
      enlace.click();
      URL.revokeObjectURL(url);
      this.vista.mostrarMensaje(
        `Exportadas ${this.tareas.length} tarea(s).`,
        'exito'
      );
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'Error al exportar.';
      this.vista.mostrarError(mensaje);
    }
  }

  importar(archivo: File): void {
    if (this.tareas.length > 0) {
      const ok = confirm(
        `Se reemplazarán las ${this.tareas.length} tarea(s) actuales por el contenido del archivo. ¿Continuar?`
      );
      if (!ok) return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      try {
        const texto = lector.result;
        if (typeof texto !== 'string') {
          throw new Error('No se pudo leer el archivo.');
        }
        const parsed: unknown = JSON.parse(texto);
        if (!Array.isArray(parsed)) {
          throw new Error('El archivo debe contener un array de tareas.');
        }
        if (parsed.length === 0) {
          throw new Error('El archivo no contiene tareas.');
        }

        const importadas: Tarea[] = [];
        for (let i = 0; i < parsed.length; i++) {
          try {
            importadas.push(Tarea.fromJSON(parsed[i] as Record<string, unknown>));
          } catch (e) {
            const detalle = e instanceof Error ? e.message : 'datos inválidos';
            throw new Error(`Tarea en posición ${i + 1}: ${detalle}`);
          }
        }

        this.tareas = importadas;
        this.persistir();
        this.vista.ocultarError();
        this.actualizarVista();
        this.vista.mostrarMensaje(
          `Importadas ${importadas.length} tarea(s).`,
          'exito'
        );
      } catch (error) {
        const mensaje =
          error instanceof Error ? error.message : 'Error al importar.';
        this.vista.mostrarError(mensaje);
      }
    };
    lector.onerror = () => {
      this.vista.mostrarError('No se pudo leer el archivo.');
    };
    lector.readAsText(archivo);
  }
}

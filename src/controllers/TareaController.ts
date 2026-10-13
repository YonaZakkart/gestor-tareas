import { Tarea, Prioridad } from '../models/Tarea.js';
import { TareaView } from '../views/TareaView.js';
import { StorageService } from '../services/StorageService.js';

// Contiene la lógica de filtrado, ordenamiento y CRUD.

export class TareaController {
  private tareas: Tarea[] = [];
  private vista: TareaView;

  constructor(vista: TareaView) {
    this.vista = vista;
    this.tareas = StorageService.cargar();
    this.registrarCallbacks();
    this.actualizarVista();
  }

  private registrarCallbacks(): void {
    this.vista.onAgregar = (titulo, prioridad) => this.agregar(titulo, prioridad);
    this.vista.onToggle = (id) => this.toggle(id);
    this.vista.onEliminar = (id) => this.eliminar(id);
    this.vista.onEditar = (id, titulo, prioridad) => this.editar(id, titulo, prioridad);
    this.vista.onFiltrarOrdenar = () => this.actualizarVista();
  }

  private persistir(): void {
    StorageService.guardar(this.tareas);
  }

  private actualizarVista(): void {
    const criterios = this.vista.obtenerCriterios();
    let lista = [...this.tareas];

    // Filtro por búsqueda (título)
    if (criterios.busqueda) {
      lista = lista.filter((t) =>
        t.titulo.toLowerCase().includes(criterios.busqueda)
      );
    }

    // Filtro por prioridad
    if (criterios.prioridad !== 'todas') {
      lista = lista.filter((t) => t.prioridad === criterios.prioridad);
    }

    // Filtro por estado
    if (criterios.estado === 'pendientes') {
      lista = lista.filter((t) => !t.completada);
    } else if (criterios.estado === 'completadas') {
      lista = lista.filter((t) => t.completada);
    }

    // Ordenamiento
    lista = this.ordenar(lista, criterios.orden);

    this.vista.renderizar(lista, this.tareas.length);
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
        // Alta primero
        copia.sort((a, b) => pesoPrioridad[a.prioridad] - pesoPrioridad[b.prioridad]);
        break;
      case 'prioridad-desc':
        // Baja primero
        copia.sort((a, b) => pesoPrioridad[b.prioridad] - pesoPrioridad[a.prioridad]);
        break;
      case 'fecha-asc':
        // Más antiguas primero
        copia.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
        break;
      case 'fecha-desc':
      default:
        // Más recientes primero
        copia.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
        break;
    }
    return copia;
  }

  agregar(titulo: string, prioridad: Prioridad): void {
    try {
      const nueva = new Tarea(titulo, prioridad);
      this.tareas.unshift(nueva);
      this.persistir();
      this.vista.limpiarFormulario();
      this.vista.ocultarError();
      this.actualizarVista();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al crear la tarea.';
      this.vista.mostrarError(mensaje);
    }
  }

  toggle(id: string): void {
    const tarea = this.tareas.find((t) => t.id === id);
    if (!tarea) return;
    tarea.toggleCompletada();
    this.persistir();
    this.actualizarVista();
  }

  eliminar(id: string): void {
    const indice = this.tareas.findIndex((t) => t.id === id);
    if (indice === -1) return;
    this.tareas.splice(indice, 1);
    this.persistir();
    this.actualizarVista();
  }

  editar(id: string, titulo: string, prioridad: Prioridad): void {
    const tarea = this.tareas.find((t) => t.id === id);
    if (!tarea) return;
    try {
      tarea.actualizar(titulo, prioridad);
      this.persistir();
      this.vista.ocultarError();
      this.actualizarVista();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al editar la tarea.';
      this.vista.mostrarError(mensaje);
      this.actualizarVista();
    }
  }
}

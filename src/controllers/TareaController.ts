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
    //callbacks de import/export
    this.vista.onExportar = () => this.exportar();
    this.vista.onImportar = (archivo) => this.importar(archivo);
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

    const pendientesTotales = this.tareas.filter((t) => !t.completada).length;
    this.vista.renderizar(lista, this.tareas.length, pendientesTotales);
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
      this.vista.mostrarMensaje('Tarea agregada', 'exito');
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
    const estado = tarea.completada ? 'completada' : 'pendiente';
    this.vista.mostrarMensaje(`Tarea marcada como ${estado}`, 'exito');
  }

  eliminar(id: string): void {
    const indice = this.tareas.findIndex((t) => t.id === id);
    if (indice === -1) return;
    this.tareas.splice(indice, 1);
    this.persistir();
    this.actualizarVista();
    this.vista.mostrarMensaje('Tarea eliminada.', 'exito');
  }

  editar(id: string, titulo: string, prioridad: Prioridad): void {
    const tarea = this.tareas.find((t) => t.id === id);
    if (!tarea) return;
    try {
      tarea.actualizar(titulo, prioridad);
      this.persistir();
      this.vista.ocultarError();
      this.actualizarVista();
      this.vista.mostrarMensaje('Tarea actualizada', 'exito');
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al editar la tarea.';
      this.vista.mostrarError(mensaje);
      this.actualizarVista();
    }
  }

  /**
 * Descarga un archivo JSON con todas las tareas actuales.
 */
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
      this.vista.mostrarMensaje(`Exportadas ${this.tareas.length} tarea(s).`, 'exito');
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error al exportar.';
      this.vista.mostrarMensaje(mensaje, 'error');
    }
  }

  /**
   * Lee un archivo JSON, valida cada tarea y reemplaza el listado actual.
   * Pide confirmación si ya hay tareas.
   */
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
          throw new Error('No se pudo leer el archivo');
        }
        const parsed: unknown = JSON.parse(texto);
        if (!Array.isArray(parsed)) {
          throw new Error('El archivo debe contener un array de tareas');
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
        this.vista.mostrarMensaje(`Importadas ${importadas.length} tarea(s).`, 'exito');
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : 'Error al importar';
        this.vista.mostrarMensaje(mensaje, 'error');
      }
    };
    lector.onerror = () => {
      this.vista.mostrarMensaje('No se pudo leer el archivo', 'error');
    };
    lector.readAsText(archivo);
  }
}

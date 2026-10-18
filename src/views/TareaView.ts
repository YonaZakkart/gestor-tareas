import { Tarea, Prioridad } from '../models/Tarea.js';

// Vista responsable de renderizar la interfaz y de notificar
// acciones del usuario mediante callbacks
export class TareaView {
  private contenedorLista: HTMLElement;
  private formulario: HTMLFormElement;
  private inputTitulo: HTMLInputElement;
  private selectPrioridad: HTMLSelectElement;
  private inputBuscar: HTMLInputElement;
  private selectFiltroPrioridad: HTMLSelectElement;
  private selectFiltroEstado: HTMLSelectElement;
  private selectOrden: HTMLSelectElement;
  private mensajeError: HTMLElement;
  private contador: HTMLElement;
  // Agregados para exportar e importar
  private btnExportar: HTMLButtonElement;
  private btnImportar: HTMLButtonElement;
  private inputImportar: HTMLInputElement;

  // Callbacks que el controlador registra
  onAgregar: ((titulo: string, prioridad: Prioridad) => void) | null = null;
  onToggle: ((id: string) => void) | null = null;
  onEliminar: ((id: string) => void) | null = null;
  onEditar: ((id: string, titulo: string, prioridad: Prioridad) => void) | null = null;
  onFiltrarOrdenar: (() => void) | null = null;
  // Callbacks para exportar e importar
  onExportar: (() => void) | null = null;
  onImportar: ((archivo: File) => void) | null = null;

  constructor() {
    this.contenedorLista = this.requerirElemento('#lista-tareas');
    this.formulario = this.requerirElemento('#form-tarea') as HTMLFormElement;
    this.inputTitulo = this.requerirElemento('#titulo') as HTMLInputElement;
    this.selectPrioridad = this.requerirElemento('#prioridad') as HTMLSelectElement;
    this.inputBuscar = this.requerirElemento('#buscar') as HTMLInputElement;
    this.selectFiltroPrioridad = this.requerirElemento('#filtro-prioridad') as HTMLSelectElement;
    this.selectFiltroEstado = this.requerirElemento('#filtro-estado') as HTMLSelectElement;
    this.selectOrden = this.requerirElemento('#orden') as HTMLSelectElement;
    this.mensajeError = this.requerirElemento('#mensaje-error');
    this.contador = this.requerirElemento('#contador');
    // Inicializar elementos para exportar e importar
    this.btnExportar = this.requerirElemento('#btn-exportar') as HTMLButtonElement;
    this.btnImportar = this.requerirElemento('#btn-importar') as HTMLButtonElement;
    this.inputImportar = this.requerirElemento('#input-importar') as HTMLInputElement;

    this.vincularEventos();
  }

  private requerirElemento<T extends HTMLElement = HTMLElement>(selector: string): T {
    const el = document.querySelector(selector);
    if (!el) {
      throw new Error(`Elemento no encontrado: ${selector}`);
    }
    return el as T;
  }

  private vincularEventos(): void {
    this.formulario.addEventListener('submit', (e) => {
      e.preventDefault();
      this.ocultarError();
      const titulo = this.inputTitulo.value;
      const prioridad = this.selectPrioridad.value as Prioridad;
      if (this.onAgregar) {
        this.onAgregar(titulo, prioridad);
      }
    });

    this.inputBuscar.addEventListener('input', () => {
      if (this.onFiltrarOrdenar) this.onFiltrarOrdenar();
    });

    this.selectFiltroPrioridad.addEventListener('change', () => {
      if (this.onFiltrarOrdenar) this.onFiltrarOrdenar();
    });

    this.selectFiltroEstado.addEventListener('change', () => {
      if (this.onFiltrarOrdenar) this.onFiltrarOrdenar();
    });

    this.selectOrden.addEventListener('change', () => {
      if (this.onFiltrarOrdenar) this.onFiltrarOrdenar();
    });

    this.btnExportar.addEventListener('click', () => {
      if (this.onExportar) this.onExportar();
    });

    this.btnImportar.addEventListener('click', () => {
      this.inputImportar.value = ''; // permite reimportar el mismo archivo
      this.inputImportar.click();
    });

    this.inputImportar.addEventListener('change', () => {
      const archivo = this.inputImportar.files?.[0];
      if (archivo && this.onImportar) {
        this.onImportar(archivo);
      }
    });
  }

  /**
   * Limpia el formulario de alta y enfoca el campo título.
   */
  limpiarFormulario(): void {
    this.formulario.reset();
    this.inputTitulo.focus();
  }

  /**
   * Muestra un mensaje (error o éxito).
   */
  mostrarMensaje(mensaje: string, tipo: 'error' | 'exito' = 'error'): void {
    this.mensajeError.textContent = mensaje;
    this.mensajeError.hidden = false;
    this.mensajeError.classList.toggle('es-exito', tipo === 'exito');
  }

  /** @deprecated Usar mostrarMensaje */
  mostrarError(mensaje: string): void {
    this.mostrarMensaje(mensaje, 'error');
  }

  ocultarError(): void {
    this.mensajeError.hidden = true;
    this.mensajeError.textContent = '';
    this.mensajeError.classList.remove('es-exito');
  }

  //Obtiene los criterios actuales de filtro y orden
  obtenerCriterios(): {
    busqueda: string;
    prioridad: string;
    estado: string;
    orden: string;
  } {
    return {
      busqueda: this.inputBuscar.value.trim().toLowerCase(),
      prioridad: this.selectFiltroPrioridad.value,
      estado: this.selectFiltroEstado.value,
      orden: this.selectOrden.value,
    };
  }

  //Renderiza la lista de tareas con colores según prioridad
  renderizar(tareas: Tarea[], totalOriginal: number): void {
    this.contenedorLista.innerHTML = '';

    if (tareas.length === 0) {
      this.contenedorLista.innerHTML = `
        <p class="vacio">No hay tareas que coincidan con los criterios.</p>
      `;
    } else {
      const fragment = document.createDocumentFragment();
      for (const tarea of tareas) {
        fragment.appendChild(this.crearTarjeta(tarea));
      }
      this.contenedorLista.appendChild(fragment);
    }

    const pendientes = tareas.filter((t) => !t.completada).length;
    this.contador.textContent = `${tareas.length} mostradas · ${pendientes} pendientes · ${totalOriginal} totales`;
  }

  private crearTarjeta(tarea: Tarea): HTMLElement {
    const card = document.createElement('article');
    card.className = `tarjeta prioridad-${tarea.prioridad}${tarea.completada ? ' completada' : ''}`;
    card.dataset.id = tarea.id;

    const fechaFormateada = tarea.fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    card.innerHTML = `
      <div class="tarjeta-cuerpo">
        <label class="checkbox-wrap">
          <input type="checkbox" class="chk-completar" ${tarea.completada ? 'checked' : ''} aria-label="Marcar como completada">
          <span class="titulo">${this.escaparHtml(tarea.titulo)}</span>
        </label>
        <div class="meta">
          <span class="badge badge-${tarea.prioridad}">${tarea.prioridad}</span>
          <time datetime="${tarea.fecha.toISOString()}">${fechaFormateada}</time>
        </div>
      </div>
      <div class="tarjeta-acciones">
        <button type="button" class="btn-editar" title="Editar" aria-label="Editar tarea">✎</button>
        <button type="button" class="btn-eliminar" title="Eliminar" aria-label="Eliminar tarea">✕</button>
      </div>
    `;

    const checkbox = card.querySelector('.chk-completar') as HTMLInputElement;
    checkbox.addEventListener('change', () => {
      if (this.onToggle) this.onToggle(tarea.id);
    });

    const btnEditar = card.querySelector('.btn-editar') as HTMLButtonElement;
    btnEditar.addEventListener('click', () => this.iniciarEdicion(card, tarea));

    const btnEliminar = card.querySelector('.btn-eliminar') as HTMLButtonElement;
    btnEliminar.addEventListener('click', () => {
      if (confirm(`¿Eliminar la tarea "${tarea.titulo}"?`)) {
        if (this.onEliminar) this.onEliminar(tarea.id);
      }
    });

    return card;
  }

  private iniciarEdicion(card: HTMLElement, tarea: Tarea): void {
    const cuerpo = card.querySelector('.tarjeta-cuerpo') as HTMLElement;
    cuerpo.innerHTML = `
      <input type="text" class="input-editar-titulo" value="${this.escaparAttr(tarea.titulo)}" maxlength="120">
      <select class="select-editar-prioridad">
        <option value="alta" ${tarea.prioridad === 'alta' ? 'selected' : ''}>Alta</option>
        <option value="media" ${tarea.prioridad === 'media' ? 'selected' : ''}>Media</option>
        <option value="baja" ${tarea.prioridad === 'baja' ? 'selected' : ''}>Baja</option>
      </select>
      <div class="edicion-acciones">
        <button type="button" class="btn-guardar">Guardar</button>
        <button type="button" class="btn-cancelar">Cancelar</button>
      </div>
    `;

    const inputTitulo = cuerpo.querySelector('.input-editar-titulo') as HTMLInputElement;
    const selectPrioridad = cuerpo.querySelector('.select-editar-prioridad') as HTMLSelectElement;
    inputTitulo.focus();
    inputTitulo.select();

    const guardar = () => {
      const nuevoTitulo = inputTitulo.value;
      const nuevaPrioridad = selectPrioridad.value as Prioridad;
      if (this.onEditar) {
        this.onEditar(tarea.id, nuevoTitulo, nuevaPrioridad);
      }
    };

    cuerpo.querySelector('.btn-guardar')?.addEventListener('click', guardar);
    cuerpo.querySelector('.btn-cancelar')?.addEventListener('click', () => {
      // El controlador volverá a renderizar; forzamos re-render
      if (this.onFiltrarOrdenar) this.onFiltrarOrdenar();
    });
    inputTitulo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        guardar();
      }
      if (e.key === 'Escape') {
        if (this.onFiltrarOrdenar) this.onFiltrarOrdenar();
      }
    });
  }

  private escaparHtml(texto: string): string {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  private escaparAttr(texto: string): string {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

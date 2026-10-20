import { Tarea, Prioridad, Categoria } from '../models/Tarea.js';

/**
 * Vista: DOM, eventos y callbacks. Sin lógica de negocio.
 */
export class TareaView {
  private contenedorLista: HTMLElement;
  private formulario: HTMLFormElement;
  private inputTitulo: HTMLInputElement;
  private selectPrioridad: HTMLSelectElement;
  private selectCategoria: HTMLSelectElement;
  private inputFechaLimite: HTMLInputElement;
  private inputBuscar: HTMLInputElement;
  private selectFiltroPrioridad: HTMLSelectElement;
  private selectFiltroCategoria: HTMLSelectElement;
  private selectFiltroEstado: HTMLSelectElement;
  private selectOrden: HTMLSelectElement;
  private mensajeError: HTMLElement;
  private contador: HTMLElement;
  private vistaLista: HTMLElement;
  private vistaResumen: HTMLElement;
  private statsPrioridad: HTMLElement;
  private statsExtra: HTMLElement;
  private temporizadorMensaje: ReturnType<typeof setTimeout> | null = null;

  onAgregar:
    | ((
        titulo: string,
        prioridad: Prioridad,
        categoria: Categoria,
        fechaLimite: string
      ) => void)
    | null = null;
  onToggle: ((id: string) => void) | null = null;
  onEliminar: ((id: string) => void) | null = null;
  onEditar:
    | ((
        id: string,
        titulo: string,
        prioridad: Prioridad,
        categoria: Categoria,
        fechaLimite: string
      ) => void)
    | null = null;
  onFiltrarOrdenar: (() => void) | null = null;
  onDeshacerEliminar: (() => void) | null = null;
  onExportar: (() => void) | null = null;
  onImportar: ((archivo: File) => void) | null = null;

  constructor() {
    this.contenedorLista = this.requerirElemento('#lista-tareas');
    this.formulario = this.requerirElemento('#form-tarea') as HTMLFormElement;
    this.inputTitulo = this.requerirElemento('#titulo') as HTMLInputElement;
    this.selectPrioridad = this.requerirElemento('#prioridad') as HTMLSelectElement;
    this.selectCategoria = this.requerirElemento('#categoria') as HTMLSelectElement;
    this.inputFechaLimite = this.requerirElemento('#fecha-limite') as HTMLInputElement;
    this.inputBuscar = this.requerirElemento('#buscar') as HTMLInputElement;
    this.selectFiltroPrioridad = this.requerirElemento(
      '#filtro-prioridad'
    ) as HTMLSelectElement;
    this.selectFiltroCategoria = this.requerirElemento(
      '#filtro-categoria'
    ) as HTMLSelectElement;
    this.selectFiltroEstado = this.requerirElemento('#filtro-estado') as HTMLSelectElement;
    this.selectOrden = this.requerirElemento('#orden') as HTMLSelectElement;
    this.mensajeError = this.requerirElemento('#mensaje-error');
    this.contador = this.requerirElemento('#contador');
    this.vistaLista = this.requerirElemento('#vista-lista');
    this.vistaResumen = this.requerirElemento('#vista-resumen');
    this.statsPrioridad = this.requerirElemento('#stats-prioridad');
    this.statsExtra = this.requerirElemento('#stats-extra');

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
      const categoria = this.selectCategoria.value as Categoria;
      const fechaLimite = this.inputFechaLimite.value;
      if (this.onAgregar) {
        this.onAgregar(titulo, prioridad, categoria, fechaLimite);
      }
    });

    const refrescar = () => {
      if (this.onFiltrarOrdenar) this.onFiltrarOrdenar();
    };

    this.inputBuscar.addEventListener('input', refrescar);
    this.selectFiltroPrioridad.addEventListener('change', refrescar);
    this.selectFiltroCategoria.addEventListener('change', refrescar);
    this.selectFiltroEstado.addEventListener('change', refrescar);
    this.selectOrden.addEventListener('change', refrescar);

    document.querySelectorAll('.pestana').forEach((btn) => {
      btn.addEventListener('click', () => {
        const vista = (btn as HTMLElement).dataset.vista;
        document.querySelectorAll('.pestana').forEach((b) => b.classList.remove('activa'));
        btn.classList.add('activa');
        if (vista === 'resumen') {
          this.vistaLista.hidden = true;
          this.vistaResumen.hidden = false;
        } else {
          this.vistaLista.hidden = false;
          this.vistaResumen.hidden = true;
        }
        refrescar();
      });
    });

    const btnExportar = document.querySelector('#btn-exportar') as HTMLButtonElement | null;
    const btnImportar = document.querySelector('#btn-importar') as HTMLButtonElement | null;
    const inputImportar = document.querySelector('#input-importar') as HTMLInputElement | null;

    if (btnExportar) {
      btnExportar.addEventListener('click', () => {
        if (this.onExportar) this.onExportar();
      });
    }
    if (btnImportar && inputImportar) {
      btnImportar.addEventListener('click', () => {
        inputImportar.value = '';
        inputImportar.click();
      });
      inputImportar.addEventListener('change', () => {
        const archivo = inputImportar.files?.[0];
        if (archivo && this.onImportar) this.onImportar(archivo);
      });
    }

    document.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      const enCampo =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (e.key === 'Escape') {
        if (enCampo) (target as HTMLInputElement).blur();
        this.ocultarError();
        return;
      }
      if (enCampo || e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        this.inputTitulo.focus();
      }
      if (e.key === '/') {
        e.preventDefault();
        this.inputBuscar.focus();
      }
    });
  }

  limpiarFormulario(): void {
    this.formulario.reset();
    this.inputTitulo.focus();
  }

  mostrarMensaje(mensaje: string, tipo: 'error' | 'exito' = 'error'): void {
    if (this.temporizadorMensaje !== null) {
      clearTimeout(this.temporizadorMensaje);
      this.temporizadorMensaje = null;
    }
    this.mensajeError.innerHTML = '';
    this.mensajeError.textContent = mensaje;
    this.mensajeError.hidden = false;
    this.mensajeError.classList.toggle('es-exito', tipo === 'exito');
    if (tipo === 'exito') {
      this.temporizadorMensaje = setTimeout(() => {
        this.ocultarError();
        this.temporizadorMensaje = null;
      }, 2500);
    }
  }

  mostrarError(mensaje: string): void {
    this.mostrarMensaje(mensaje, 'error');
  }

  ocultarError(): void {
    if (this.temporizadorMensaje !== null) {
      clearTimeout(this.temporizadorMensaje);
      this.temporizadorMensaje = null;
    }
    this.mensajeError.hidden = true;
    this.mensajeError.textContent = '';
    this.mensajeError.innerHTML = '';
    this.mensajeError.classList.remove('es-exito');
  }

  mostrarMensajeConDeshacer(mensaje: string, alDeshacer: () => void): void {
    if (this.temporizadorMensaje !== null) {
      clearTimeout(this.temporizadorMensaje);
      this.temporizadorMensaje = null;
    }
    this.mensajeError.classList.remove('es-exito');
    this.mensajeError.hidden = false;
    this.mensajeError.innerHTML = '';

    const texto = document.createElement('span');
    texto.textContent = `${mensaje} `;

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn-deshacer';
    boton.textContent = 'Deshacer';
    boton.addEventListener('click', () => alDeshacer());

    this.mensajeError.append(texto, boton);
  }

  obtenerCriterios(): {
    busqueda: string;
    prioridad: string;
    categoria: string;
    estado: string;
    orden: string;
  } {
    return {
      busqueda: this.inputBuscar.value.trim().toLowerCase(),
      prioridad: this.selectFiltroPrioridad.value,
      categoria: this.selectFiltroCategoria.value,
      estado: this.selectFiltroEstado.value,
      orden: this.selectOrden.value,
    };
  }

  renderizar(
    tareas: Tarea[],
    totalOriginal: number,
    pendientesTotales: number,
    contadorPrioridad: { alta: number; media: number; baja: number },
    vencidas: number
  ): void {
    this.contenedorLista.innerHTML = '';

    if (totalOriginal === 0) {
      this.contenedorLista.innerHTML = `
        <p class="vacio vacio-inicial">
          No hay tareas aún.<br>
          <span class="vacio-hint">Escribe un título arriba y pulsa <strong>Agregar</strong>.</span>
        </p>
      `;
    } else if (tareas.length === 0) {
      this.contenedorLista.innerHTML = `
        <p class="vacio vacio-filtro">
          Ninguna tarea coincide con la búsqueda o los filtros.
          <span class="vacio-hint">Prueba a limpiar el buscador o cambiar los filtros.</span>
        </p>
      `;
    } else {
      const fragment = document.createDocumentFragment();
      for (const tarea of tareas) {
        fragment.appendChild(this.crearTarjeta(tarea));
      }
      this.contenedorLista.appendChild(fragment);
    }

    this.contador.textContent =
      totalOriginal === 0
        ? 'Sin tareas'
        : `${tareas.length} mostrada${tareas.length !== 1 ? 's' : ''} · ` +
          `Alta ${contadorPrioridad.alta} · Media ${contadorPrioridad.media} · Baja ${contadorPrioridad.baja} · ` +
          `${vencidas} vencida${vencidas !== 1 ? 's' : ''} · ` +
          `${pendientesTotales} pendiente${pendientesTotales !== 1 ? 's' : ''}`;
  }

  renderResumen(
    contadorPrioridad: { alta: number; media: number; baja: number },
    total: number,
    vencidas: number,
    completadas: number
  ): void {
    this.statsPrioridad.innerHTML = `
      <div class="stat alta"><span class="stat-n">${contadorPrioridad.alta}</span><span>Alta</span></div>
      <div class="stat media"><span class="stat-n">${contadorPrioridad.media}</span><span>Media</span></div>
      <div class="stat baja"><span class="stat-n">${contadorPrioridad.baja}</span><span>Baja</span></div>
    `;
    this.statsExtra.textContent = `Total: ${total} · Completadas: ${completadas} · Vencidas: ${vencidas}`;
  }

  private crearTarjeta(tarea: Tarea): HTMLElement {
    const card = document.createElement('article');
    const vencida = tarea.estaVencida();
    card.className = `tarjeta prioridad-${tarea.prioridad}${
      tarea.completada ? ' completada' : ''
    }${vencida ? ' vencida' : ''}`;
    card.dataset.id = tarea.id;

    const fechaFormateada = tarea.fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const limiteHtml = tarea.fechaLimite
      ? `<time class="${vencida ? 'texto-vencida' : ''}" datetime="${tarea.fechaLimite
          .toISOString()
          .slice(0, 10)}">Límite: ${tarea.fechaLimite.toLocaleDateString('es-ES')}</time>`
      : '';

    card.innerHTML = `
      <div class="tarjeta-cuerpo">
        <label class="checkbox-wrap">
          <input type="checkbox" class="chk-completar" ${
            tarea.completada ? 'checked' : ''
          } aria-label="Marcar como completada">
          <span class="titulo">${this.escaparHtml(tarea.titulo)}</span>
        </label>
        <div class="meta">
          <span class="badge badge-${tarea.prioridad}">${tarea.prioridad}</span>
          <span class="badge badge-cat">${tarea.categoria}</span>
          ${limiteHtml}
          ${vencida ? '<span class="alerta-vencida">Vencida</span>' : ''}
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
    const limiteVal = tarea.fechaLimite
      ? tarea.fechaLimite.toISOString().slice(0, 10)
      : '';

    cuerpo.innerHTML = `
      <input type="text" class="input-editar-titulo" value="${this.escaparAttr(
        tarea.titulo
      )}" maxlength="120">
      <select class="select-editar-prioridad">
        <option value="alta" ${tarea.prioridad === 'alta' ? 'selected' : ''}>Alta</option>
        <option value="media" ${tarea.prioridad === 'media' ? 'selected' : ''}>Media</option>
        <option value="baja" ${tarea.prioridad === 'baja' ? 'selected' : ''}>Baja</option>
      </select>
      <select class="select-editar-categoria">
        <option value="trabajo" ${tarea.categoria === 'trabajo' ? 'selected' : ''}>Trabajo</option>
        <option value="personal" ${
          tarea.categoria === 'personal' ? 'selected' : ''
        }>Personal</option>
        <option value="estudio" ${tarea.categoria === 'estudio' ? 'selected' : ''}>Estudio</option>
        <option value="otro" ${tarea.categoria === 'otro' ? 'selected' : ''}>Otro</option>
      </select>
      <input type="date" class="input-editar-limite" value="${limiteVal}">
      <div class="edicion-acciones">
        <button type="button" class="btn-guardar">Guardar</button>
        <button type="button" class="btn-cancelar">Cancelar</button>
      </div>
    `;

    const inputTitulo = cuerpo.querySelector('.input-editar-titulo') as HTMLInputElement;
    const selectPrioridad = cuerpo.querySelector(
      '.select-editar-prioridad'
    ) as HTMLSelectElement;
    const selectCategoria = cuerpo.querySelector(
      '.select-editar-categoria'
    ) as HTMLSelectElement;
    const inputLimite = cuerpo.querySelector('.input-editar-limite') as HTMLInputElement;
    inputTitulo.focus();
    inputTitulo.select();

    const guardar = () => {
      if (this.onEditar) {
        this.onEditar(
          tarea.id,
          inputTitulo.value,
          selectPrioridad.value as Prioridad,
          selectCategoria.value as Categoria,
          inputLimite.value
        );
      }
    };

    cuerpo.querySelector('.btn-guardar')?.addEventListener('click', guardar);
    cuerpo.querySelector('.btn-cancelar')?.addEventListener('click', () => {
      if (this.onFiltrarOrdenar) this.onFiltrarOrdenar();
    });
    inputTitulo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        guardar();
      }
      if (e.key === 'Escape' && this.onFiltrarOrdenar) this.onFiltrarOrdenar();
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

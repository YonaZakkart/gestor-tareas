import { TareaView } from './views/TareaView.js';
import { TareaController } from './controllers/TareaController.js';
//Inicializa la vista y el controlador cuando el DOM está listo
function iniciar(): void {
  try {
    const vista = new TareaView();
    new TareaController(vista);
  } catch (error) {
    console.error('Error al iniciar la aplicación:', error);
    document.body.innerHTML = `
      <div style="padding:2rem;font-family:system-ui;color:#b91c1c;">
        <h1>Error de inicialización</h1>
        <p>${error instanceof Error ? error.message : 'Error desconocido'}</p>
      </div>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar);
} else {
  iniciar();
}

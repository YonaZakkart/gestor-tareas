import { Tarea } from '../models/Tarea.js';

const STORAGE_KEY = 'gestor-tareas-v1';

// Aísla el acceso al almacenamiento del resto de la aplicación
export class StorageService {
  // Devuelve array vacío si no hay datos o si están corruptos
  static cargar(): Tarea[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        console.warn('Datos de almacenamiento no son un array. Se reinicia.');
        return [];
      }
      return parsed.map((item) => Tarea.fromJSON(item as Record<string, unknown>));
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      return [];
    }
  }

  // Guarda el array completo de tareas en localStorage
  static guardar(tareas: Tarea[]): void {
    try {
      const serializado = JSON.stringify(tareas.map((t) => t.toJSON()));
      localStorage.setItem(STORAGE_KEY, serializado);
    } catch (error) {
      console.error('Error al guardar tareas:', error);
      throw new Error('No se pudo guardar en localStorage. Verifique el espacio disponible.');
    }
  }

  //Elimina todos los datos del gestor
  static limpiar(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

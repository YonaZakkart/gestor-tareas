import { describe, it, expect } from 'vitest';
import { Tarea } from './Tarea.js';

describe('Tarea', () => {
  describe('constructor', () => {
    it('crea una tarea válida con valores por defecto', () => {
      const t = new Tarea('Comprar leche', 'media');
      expect(t.titulo).toBe('Comprar leche');
      expect(t.prioridad).toBe('media');
      expect(t.categoria).toBe('otro');
      expect(t.fechaLimite).toBeNull();
      expect(t.completada).toBe(false);
      expect(t.id).toBeTruthy();
      expect(t.fecha).toBeInstanceOf(Date);
    });

    it('recorta espacios del título', () => {
      const t = new Tarea('  Hacer ejercicio  ', 'alta', 'personal');
      expect(t.titulo).toBe('Hacer ejercicio');
      expect(t.categoria).toBe('personal');
    });

    it('rechaza título vacío o solo espacios', () => {
      expect(() => new Tarea('', 'baja')).toThrow(/título/i);
      expect(() => new Tarea('   ', 'baja')).toThrow(/título/i);
    });

    it('rechaza título de más de 120 caracteres', () => {
      const largo = 'a'.repeat(121);
      expect(() => new Tarea(largo, 'media')).toThrow(/120/);
    });

    it('rechaza prioridad inválida', () => {
      // @ts-expect-error prueba de valor inválido en runtime
      expect(() => new Tarea('Algo', 'urgente')).toThrow(/prioridad/i);
    });

    it('rechaza categoría inválida', () => {
      // @ts-expect-error valor inválido
      expect(() => new Tarea('Algo', 'media', 'hogar')).toThrow(/categoría/i);
    });

    it('acepta id, completada, fecha y fecha límite', () => {
      const fecha = new Date('2024-01-15T10:00:00.000Z');
      const limite = new Date('2024-02-01T12:00:00');
      const t = new Tarea('Reunión', 'alta', 'trabajo', limite, 'id-fijo', true, fecha);
      expect(t.id).toBe('id-fijo');
      expect(t.completada).toBe(true);
      expect(t.fecha.toISOString()).toBe(fecha.toISOString());
      expect(t.fechaLimite?.toDateString()).toBe(limite.toDateString());
      expect(t.categoria).toBe('trabajo');
    });
  });

  describe('estaVencida', () => {
    it('detecta tarea vencida pendiente', () => {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const t = new Tarea('Vencida', 'alta', 'trabajo', ayer);
      expect(t.estaVencida()).toBe(true);
    });

    it('no marca como vencida si está completada', () => {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const t = new Tarea('Hecha', 'media', 'personal', ayer, undefined, true);
      expect(t.estaVencida()).toBe(false);
    });

    it('no marca vencida sin fecha límite o con límite futuro', () => {
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      expect(new Tarea('Sin límite', 'baja').estaVencida()).toBe(false);
      expect(new Tarea('Futura', 'baja', 'otro', manana).estaVencida()).toBe(false);
    });
  });

  describe('toggleCompletada', () => {
    it('alterna el estado completada', () => {
      const t = new Tarea('Tarea', 'baja');
      expect(t.completada).toBe(false);
      t.toggleCompletada();
      expect(t.completada).toBe(true);
      t.toggleCompletada();
      expect(t.completada).toBe(false);
    });
  });

  describe('actualizar', () => {
    it('actualiza título, prioridad, categoría y fecha límite', () => {
      const t = new Tarea('Viejo', 'baja');
      const limite = new Date('2026-12-01T12:00:00');
      t.actualizar({
        titulo: 'Nuevo',
        prioridad: 'alta',
        categoria: 'estudio',
        fechaLimite: limite,
      });
      expect(t.titulo).toBe('Nuevo');
      expect(t.prioridad).toBe('alta');
      expect(t.categoria).toBe('estudio');
      expect(t.fechaLimite?.toDateString()).toBe(limite.toDateString());
    });

    it('permite quitar la fecha límite', () => {
      const limite = new Date('2026-06-01T12:00:00');
      const t = new Tarea('Con límite', 'media', 'otro', limite);
      t.actualizar({ fechaLimite: null });
      expect(t.fechaLimite).toBeNull();
    });

    it('rechaza título vacío al actualizar', () => {
      const t = new Tarea('Ok', 'media');
      expect(() => t.actualizar({ titulo: '  ' })).toThrow(/título/i);
    });

    it('rechaza prioridad inválida al actualizar', () => {
      const t = new Tarea('Ok', 'media');
      // @ts-expect-error valor inválido
      expect(() => t.actualizar({ prioridad: 'critica' })).toThrow(/prioridad/i);
    });
  });

  describe('serialización', () => {
    it('toJSON produce un objeto plano serializable', () => {
      const limite = new Date('2025-07-15T12:00:00');
      const t = new Tarea(
        'Serializar',
        'alta',
        'trabajo',
        limite,
        'abc',
        false,
        new Date('2025-06-01T12:00:00.000Z')
      );
      const json = t.toJSON();
      expect(json.id).toBe('abc');
      expect(json.titulo).toBe('Serializar');
      expect(json.prioridad).toBe('alta');
      expect(json.categoria).toBe('trabajo');
      expect(json.completada).toBe(false);
      expect(json.fechaLimite).toBe('2025-07-15');
    });

    it('fromJSON reconstruye una Tarea equivalente', () => {
      const limite = new Date('2025-08-20T12:00:00');
      const original = new Tarea(
        'Ronda',
        'media',
        'personal',
        limite,
        'xyz',
        true,
        new Date('2025-03-10T08:30:00.000Z')
      );
      const copia = Tarea.fromJSON(original.toJSON());
      expect(copia.id).toBe(original.id);
      expect(copia.titulo).toBe(original.titulo);
      expect(copia.prioridad).toBe(original.prioridad);
      expect(copia.categoria).toBe(original.categoria);
      expect(copia.completada).toBe(original.completada);
      expect(copia.fecha.toISOString()).toBe(original.fecha.toISOString());
      expect(copia.fechaLimite?.toISOString().slice(0, 10)).toBe(
        original.fechaLimite?.toISOString().slice(0, 10)
      );
    });

    it('fromJSON acepta datos antiguos sin categoría ni límite', () => {
      const t = Tarea.fromJSON({
        id: 'old',
        titulo: 'Antigua',
        prioridad: 'baja',
        completada: false,
        fecha: '2024-01-01T00:00:00.000Z',
      });
      expect(t.categoria).toBe('otro');
      expect(t.fechaLimite).toBeNull();
    });

    it('fromJSON rechaza datos incompletos o corruptos', () => {
      expect(() => Tarea.fromJSON({})).toThrow(/inválidos/i);
      expect(() =>
        Tarea.fromJSON({
          id: 123,
          titulo: 'x',
          prioridad: 'media',
          completada: false,
          fecha: '2025-01-01',
        })
      ).toThrow(/inválidos/i);
    });
  });
});

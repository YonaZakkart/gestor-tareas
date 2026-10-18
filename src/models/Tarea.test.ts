import { describe, it, expect } from 'vitest';
import { Tarea } from './Tarea.js';

describe('Tarea', () => {
    describe('constructor', () => {
        it('crea una tarea válida con valores por defecto', () => {
            const t = new Tarea('Comprar leche', 'media');
            expect(t.titulo).toBe('Comprar leche');
            expect(t.prioridad).toBe('media');
            expect(t.completada).toBe(false);
            expect(t.id).toBeTruthy();
            expect(t.fecha).toBeInstanceOf(Date);
        });

        it('recorta espacios del título', () => {
            const t = new Tarea('  Hacer ejercicio  ', 'alta');
            expect(t.titulo).toBe('Hacer ejercicio');
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

        it('acepta id, completada y fecha opcionales', () => {
            const fecha = new Date('2024-01-15T10:00:00.000Z');
            const t = new Tarea('Reunión', 'alta', 'id-fijo', true, fecha);
            expect(t.id).toBe('id-fijo');
            expect(t.completada).toBe(true);
            expect(t.fecha.toISOString()).toBe(fecha.toISOString());
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
        it('actualiza título y prioridad', () => {
            const t = new Tarea('Viejo', 'baja');
            t.actualizar('Nuevo', 'alta');
            expect(t.titulo).toBe('Nuevo');
            expect(t.prioridad).toBe('alta');
        });

        it('permite actualizar solo el título', () => {
            const t = new Tarea('Viejo', 'media');
            t.actualizar('Solo título');
            expect(t.titulo).toBe('Solo título');
            expect(t.prioridad).toBe('media');
        });

        it('rechaza título vacío al actualizar', () => {
            const t = new Tarea('Ok', 'media');
            expect(() => t.actualizar('  ')).toThrow(/título/i);
        });

        it('rechaza prioridad inválida al actualizar', () => {
            const t = new Tarea('Ok', 'media');
            // @ts-expect-error valor inválido a propósito
            expect(() => t.actualizar(undefined, 'critica')).toThrow(/prioridad/i);
        });
    });

    describe('serialización', () => {
        it('toJSON produce un objeto plano serializable', () => {
            const t = new Tarea('Serializar', 'alta', 'abc', false, new Date('2025-06-01T12:00:00.000Z'));
            const json = t.toJSON();
            expect(json).toEqual({
                id: 'abc',
                titulo: 'Serializar',
                prioridad: 'alta',
                completada: false,
                fecha: '2025-06-01T12:00:00.000Z',
            });
        });

        it('fromJSON reconstruye una Tarea equivalente', () => {
            const original = new Tarea('Ronda', 'media', 'xyz', true, new Date('2025-03-10T08:30:00.000Z'));
            const copia = Tarea.fromJSON(original.toJSON());
            expect(copia.id).toBe(original.id);
            expect(copia.titulo).toBe(original.titulo);
            expect(copia.prioridad).toBe(original.prioridad);
            expect(copia.completada).toBe(original.completada);
            expect(copia.fecha.toISOString()).toBe(original.fecha.toISOString());
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
# Gestor de Tareas por Prioridad

Aplicación web de gestión de tareas con niveles de prioridad (alta, media, baja), ordenamiento, filtrado y persistencia en `localStorage`. Implementada con **TypeScript** bajo arquitectura **MVC**.

## Características

- Registrar tareas con título y prioridad.
- Ordenar por prioridad (alta→baja / baja→alta) o por fecha (recientes / antiguas).
- Filtrar por prioridad y por estado (pendientes / completadas).
- Búsqueda por título en tiempo real.
- Marcar como completadas (checkbox).
- Edición inline de título y prioridad.
- Eliminación con confirmación del navegador.
- Persistencia automática en `localStorage`.
- Validaciones de dominio (título no vacío, longitud máxima, prioridad válida).
- Interfaz con colores por prioridad y diseño responsive.

## Arquitectura MVC

| Capa        | Archivo                         | Responsabilidad                                      |
|-------------|---------------------------------|------------------------------------------------------|
| **Model**   | `src/models/Tarea.ts`           | Datos, validaciones e invariantes de negocio         |
| **View**    | `src/views/TareaView.ts`        | Renderizado DOM, eventos de UI, callbacks            |
| **Controller** | `src/controllers/TareaController.ts` | CRUD, filtrado, ordenamiento, coordinación      |
| **Service** | `src/services/StorageService.ts`| Persistencia en localStorage (aislado)               |

El punto de entrada `src/main.ts` instancia la vista y el controlador.

## Estructura de carpetas

```
gestor-tareas/
├── index.html
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── main.ts
│   ├── models/
│   │   └── Tarea.ts
│   ├── views/
│   │   └── TareaView.ts
│   ├── controllers/
│   │   └── TareaController.ts
│   ├── services/
│   │   └── StorageService.ts
│   └── styles/
│       └── styles.css
└── dist/          (generado por tsc)
```

## Requisitos

- Node.js 18+
- Navegador moderno con soporte de ES modules y `localStorage`.

## Clonar e instalar

```bash
git clone https://github.com/YonaZakkart/gestor-tareas.git
cd gestor-tareas
npm install
npm run build          # Compila TypeScript → dist/
npx serve .            # Sirve en http://localhost:3000 (o el puerto que indique)
```

Alternativa de desarrollo con recompilación automática:

```bash
npm run dev            
# tsc --watch en otra terminal
# y en otra: npx serve .
```

Abra la URL que muestre el servidor (normalmente `http://localhost:3000`).

## Uso de la interfaz

1. **Agregar**: escriba un título, elija prioridad y pulse *Agregar*.
2. **Completar**: marque el checkbox de la tarjeta.
3. **Editar**: pulse el botón ✎, modifique y *Guardar* (o Enter). Escape o *Cancelar* descarta.
4. **Eliminar**: pulse ✕ y confirme el diálogo.
5. **Buscar / filtrar / ordenar**: use los controles superiores; los cambios se aplican al instante.

## Decisiones de diseño

- **Validación en el modelo**: `Tarea` lanza errores si el título está vacío o la prioridad es inválida. El controlador captura y muestra el mensaje en la vista.
- **Callbacks en la vista**: la vista no conoce el controlador; solo expone propiedades `onXxx` que el controlador registra. Esto mantiene la separación MVC.
- **Orden por prioridad**: se usa un mapa de pesos (`alta=0, media=1, baja=2`) para un sort estable y legible.
- **Edición inline**: se reemplaza el contenido de la tarjeta temporalmente; al cancelar o fallar la validación se vuelve a renderizar desde el estado del modelo.
- **Persistencia**: se serializa el array completo en cada mutación. Clave de almacenamiento: `gestor-tareas-v1`.

## Posibles mejoras

- Undo/redo de eliminaciones.
- Exportar/importar JSON.
- Categorías o etiquetas adicionales.
- Tests unitarios del modelo y del controlador.

## Licencia

MIT

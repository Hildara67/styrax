# Sistema Inteligente de Control de Riego

Sistema de escritorio para automatización y optimización del consumo de agua en cultivos agrícolas, basado en la metodología FAO-56.

## Stack Tecnológico

- **Frontend:** Electron.js (Chromium + HTML5/CSS3/JS ES6+)
- **Backend:** Node.js (Main Process)
- **Base de datos:** MariaDB (vía XAMPP o servidor remoto)
- **API externa:** NASA POWER (datos meteorológicos)

## Instalación

### Prerrequisitos
- Node.js 18.x LTS
- MariaDB (XAMPP o servidor remoto)
- npm

### Pasos

1. Clonar el repositorio
2. Copiar `.env.example` a `.env` y configurar conexión a BD
3. Ejecutar script SQL de inicialización de base de datos
4. Instalar dependencias: `npm install`
5. Iniciar aplicación: `npm start`

## Credenciales de Prueba

- **Supervisor:** admin / admin123
- **Operador:** operador1 / operador123

## Estructura del Proyecto

```
sistema_riego/
├── public/          # Capa UI (HTML + CSS + JS)
│   ├── index.html   # Login
│   ├── dashboard.html
│   ├── captura.html
│   ├── recomendaciones.html
│   ├── historial.html
│   ├── parcelas.html
│   ├── configuracion.html
│   ├── auditoria.html
│   ├── reportes.html
│   ├── usuarios.html
│   ├── css/estilos.css
│   └── js/
├── src/             # Main Process (Node.js)
│   ├── main.js      # Punto de entrada + IPC handlers
│   ├── dto/         # Objetos de transferencia
│   ├── core/        # Lógica de negocio (FAO-56)
│   └── data/        # Persistencia e integración
├── datos/           # Archivos simulados (CSV)
└── docs/            # Documentación
```

## Scripts disponibles

- `npm start` - Inicia la aplicación
- `npm run dev` - Inicia con recarga automática (nodemon)
- `npm run build` - Genera instalador .exe para Windows
- `npm run docs` - Genera documentación JSDoc

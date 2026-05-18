# STYRAX — Sistema Inteligente de Control de Riego

> **Stilla** (lat. "gota") + **Axis** (lat. "eje") = STYRAX  
> *El eje de la gota — el punto exacto donde controlas cada gota*

---

## Problemática

En la agricultura tradicional, el riego se realiza por calendario o estimación visual, lo que genera:

- **Desperdicio de agua** — hasta un 50% del agua usada en riego se pierde por sobreirrigación
- **Estrés hídrico** en cultivos por riego insuficiente o mal timing
- **Falta de trazabilidad** — no hay registro histórico de cuánto, cuándo ni por qué se regó
- **Decisiones empíricas** sin respaldo de datos meteorológicos ni del suelo
- **Dificultad para escalar** — monitorear múltiples parcelas manualmente es inviable

## Solución

STYRAX automatiza la decisión de riego usando la **metodología FAO-56** (estándar internacional de la FAO para calcular necesidades hídricas de los cultivos). El sistema:

1. Captura lecturas de humedad del suelo, temperatura y humedad relativa
2. Consulta datos climáticos reales vía API de **NASA POWER**
3. Calcula la **evapotranspiración del cultivo (ETc)**
4. Compara el balance hídrico contra **umbrales configurables por parcela**
5. Genera **recomendaciones automáticas**: APLICAR RIEGO, DETENER RIEGO o MANTENER
6. Permite flujo de **aprobación** (OPERADOR → SUPERVISOR)
7. Mantiene un **historial completo** de lecturas, decisiones y acciones ejecutadas

## Funcionalidades

| Módulo | Rol | Descripción |
|---|---|---|
| **Dashboard** | OPERADOR | Panel con estado en tiempo real de todas las parcelas, indicadores y alertas |
| **Captura** | OPERADOR | Ingreso manual de lecturas o importación desde sensores CSV |
| **Recomendaciones** | OPERADOR | Visualización de recomendaciones generadas, envío a validación |
| **Historial** | OPERADOR | Consulta y exportación del histórico de lecturas |
| **Parcelas** | SUPERVISOR | CRUD de parcelas agrícolas |
| **Configuración** | SUPERVISOR | Umbrales de humedad, Kc (coeficiente de cultivo), conexión a API y BD |
| **Auditoría** | SUPERVISOR | Validación de recomendaciones, bitácora de acciones |
| **Reportes** | SUPERVISOR | KPIs, estadísticas y resumen por parcela con exportación CSV |
| **Usuarios** | SUPERVISOR | Gestión de usuarios del sistema |

## Demo en Vivo

El proyecto está desplegado en GitHub Pages:

```
https://hildara67.github.io/styrax/
```

### Credenciales de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | SUPERVISOR |
| `operador1` | `operador123` | OPERADOR |

> La demo funciona 100% del lado del cliente con datos simulados persistentes en localStorage. No requiere instalación ni servidor.

## Stack Tecnológico

- **Frontend:** Electron.js (Chromium + HTML5/CSS3/JS ES6+)
- **Backend:** Node.js (Main Process de Electron)
- **Base de datos:** MariaDB (vía XAMPP o servidor remoto)
- **API externa:** NASA POWER (datos meteorológicos)
- **Demo web:** GitHub Pages + mock-api.js con localStorage

## Arquitectura

```
sistema_riego/
├── index.html              # Landing page promocional
├── public/
│   ├── index.html          # Login
│   ├── dashboard.html      # Panel principal (OPERADOR)
│   ├── captura.html        # Captura de lecturas
│   ├── recomendaciones.html# Recomendaciones de riego
│   ├── historial.html      # Historial operativo
│   ├── parcelas.html       # Gestión de parcelas (SUPERVISOR)
│   ├── configuracion.html  # Configuración de umbrales
│   ├── auditoria.html      # Validación y auditoría
│   ├── reportes.html       # Reportes y KPIs
│   ├── usuarios.html       # Gestión de usuarios
│   ├── css/estilos.css     # Estilos responsive
│   └── js/
│       ├── mock-api.js     # API simulada con persistencia localStorage
│       ├── login.js        # Lógica de autenticación
│       ├── dashboard.js
│       ├── captura.js
│       ├── recomendaciones.js
│       ├── historial.js
│       ├── parcelas.js
│       ├── configuracion.js
│       ├── auditoria.js
│       ├── reportes.js
│       ├── usuarios.js
│       └── inactividad.js  # Cierre de sesión por inactividad
├── src/                    # Main Process (solo Electron)
│   ├── main.js             # Punto de entrada + IPC handlers
│   ├── core/               # Lógica FAO-56
│   ├── dto/                # Objetos de transferencia
│   └── data/               # Persistencia e integración
├── datos/                  # Archivos simulados (CSV)
└── docs/                   # Documentación
```

## Instalación (App de Escritorio)

### Prerrequisitos
- Node.js 18.x LTS
- MariaDB (XAMPP o servidor remoto)
- npm

### Pasos

```bash
git clone https://github.com/Hildara67/styrax.git
cd styrax
cp .env.example .env   # Configurar conexión a BD
npm install
npm start
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm start` | Inicia la aplicación Electron |
| `npm run dev` | Inicia con recarga automática (nodemon) |
| `npm run build` | Genera instalador .exe para Windows |
| `npm run docs` | Genera documentación JSDoc |
| `npm run start:web` | Inicia servidor web (Node.js) para demo local |

## Metodología FAO-56

El sistema implementa el balance hídrico del suelo según la FAO-56:

```
ETc = Kc × ETo
Balance = Humedad del suelo + Precipitación - ETc

Si Balance < Umbral mínimo → APLICAR RIEGO
Si Balance > Umbral máximo → DETENER RIEGO
Si está dentro del rango  → MANTENER
```

Donde:
- **ETo**: Evapotranspiración de referencia (NASA POWER)
- **Kc**: Coeficiente de cultivo (configurable por parcela)
- **ETc**: Evapotranspiración del cultivo

---

<p align="center">Proyecto académico · Control de Riego Agrícola · 2026</p>


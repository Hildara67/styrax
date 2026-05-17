# Especificación técnica de implementación

Título del proyecto: Sistema Inteligente de control de riego

## 1.  Resumen del proyecto y metodología.

    1.1 Definicion del Proyecto:
    
El Sistema Inteligente de Control de Riego es un sistema que automatiza la gestión hídrica en cultivos agrícolas mediante la integración de:

\- Lecturas de sensores de campo (simuladas vía CSV)

\- Datos meteorológicos en tiempo real (API NASA POWER)

\- Modelos matemáticos de ingeniería agrícola (FAO-56)

\- Reglas de decisión configurables para optimizar el consumo de agua

    1.2  Propósito:


Proporcionar a operadores agrícolas y supervisores técnicos una herramienta que:

\- Elimine la incertidumbre del riego manual mediante cálculos precisos de evapotranspiración

\- Reduzca el desperdicio hídrico aplicando volúmenes exactos según necesidades del cultivo

\- Garantice trazabilidad completa de cada decisión mediante registros auditables

\- Soporte la toma de decisiones con recomendaciones automáticas validables por criterio experto

    1.3 Metodología de Desarrollo

Modelo en Cascada (Waterfall) - Fase 4: Implementación

<div class="joplin-table-wrapper"><table><tbody><tr><td><p>Fase</p></td><td><p>Estado</p></td><td><p>Entregable principal</p></td></tr><tr><td><ol><li><strong>Requisitos</strong></li></ol></td><td><p>Congelado</p></td><td><p>36 RFs + 5 RNFs documentados</p></td></tr><tr><td><ol><li><strong>Arquitectura</strong></li></ol></td><td><p>Congelado</p></td><td><p>Diagrama de 3 Capas + Actores Externos</p></td></tr><tr><td><ol><li><strong>Diseño</strong></li></ol></td><td><p>Congelado</p></td><td><p>UML (Casos, Secuencia, Clases) + Diccionario de Datos + Wireframes</p></td></tr><tr><td><ol><li><strong>Implementación</strong></li></ol></td><td><p>EN CURSO</p></td><td><p>Código fuente funcional + Evidencia de ejecución</p></td></tr><tr><td><ol><li><strong>Pruebas</strong></li></ol></td><td><p>Pendiente</p></td><td><p>Plan de pruebas + Reporte de validación</p></td></tr><tr><td><ol><li><strong>Mantenimiento</strong></li></ol></td><td><p>Pendiente</p></td><td><p>Plan de actualizaciones futuras</p></td></tr></tbody></table></div>

Principio: No se introduce, modifica ni elimina ningún requisito, componente o regla de negocio definida en las fases 1-3. La implementación es traducción literal del diseño congelado.

    1.4 Justificación Técnica

La selección del stack tecnológico responde a los siguientes criterios académicos y funcionales:

|     |     |     |
| --- | --- | --- |
| Criterio | Decisión Técnica | Justificación |
| **Portabilidad** | Electron.js + Node.js | Permite generar ejecutables .exe para Windows sin depender de navegadores externos, cumpliendo con el requisito de "sistema instalable" del Plan de Negocio. |
| **Separación de capas** | Arquitectura modular en carpetas | Facilita el cumplimiento de RNF-01 (separación estricta UI/Core/Persistencia) mediante imports controlados. |
| **Manejo asíncrono** | JavaScript ES6+ con async/await | Nativo para gestionar timeout de API (RNF-03), lectura de CSV y consultas a BD sin bloquear la interfaz. |
| **Interfaz gráfica** | HTML5 + CSS3 + Canvas API | Permite implementar validaciones en tiempo real (RF-07, RF-09), semáforos visuales (RF-28) y exportación UTF-8 (RF-32) con control total del DOM. |
| **Persistencia** | MariaDB vía XAMPP (local) o servidor remoto | Cumple con el diccionario de datos congelado; la conexión se configura vía variables de entorno para permitir migración futura a la nube sin modificar código. |
| **Gestión de dependencias** | npm + package.json | Estándar de la industria para controlar versiones de librerías (mysql2, axios, csv-parser) y garantizar reproducibilidad del entorno. |

## 2. Arquitectura del proyecto (3 capas congeladas).

    2.1 Diagrama Arquitectónico de Flujo de Datos

**Capa de Interfaz (UI)**

Módulo de vistas Operador

Modulo de vistas Supervisor

**Capa Lógica de Negocio**

Validador de Datos

Motor de Cálculo(FAO-56)

Gestor de Reglas de Decisión

**Capa de Persistencia e Integración**

Gestor de Acceso de Datos (DAO)

Adaptador de API Externa

Gestor de Archivos (Escritura)

Parser de Sensores (Lectura)

**Actores externos:** API Metereologica, Sensores loT, Maria DB, Sistemas de archivos local

**Operador Agricola** va al Módulo de Vistas Operador a Validador de Datos a Motor de Cálculo (FAO-56) a Gestor de Reglas de Decisión a Gestor de acceso a Datos (DAO).

**Supervisor Técnico** va al Módulo de Supervisor a Validador de Datos a Motor de Cálculo (FAO-56) a Gestor de Reglas de Decisión a Gestor de acceso a Datos (DAO).

\- De Gestor de acceso a Datos (DAO) a (1. Persistencia Estructurada) MariaDB.

\- De Gestor de acceso a Datos (DAO) a (2. Datos Predictivos) Adaptador de API Externa a API Metereologica.

\- De Gestor de acceso a Datos (DAO) a (3. Lecturas de Campo(CSV)) Parser de Sensores (Lectura) a Sensores loT.

\- De Gestor de acceso a Datos (DAO) (4. Exportación de Historial (CSV)) a Sistema de Archivos Local "Historial de Riego (.csv)"

Donde cada capa:

**Capa de Interfaz (UI)**

- Electron Renderer Process (Chromium)
- HTML5 + CSS3 + JavaScript (ES6+)
- Validación Cliente (RF-06, RF-07, RF-09)
- Comunicación IPC a Main Process

DTOs (Lectura, Recomendación)

**Capa Lógica de Negocio (Core)**

- Electron Main Process (node.js)
- MotorFAO56: Cálculo ETc = Kc x ET0 (RF-18)
- Gestor Decisiones: Umbrales (RF-20 ... RF-23)
- Validador: Rangos y sanitización (RF-03 ... 04)
- Sin acceso directo a BD ni UI

DTOs + Consultas parametrizadas

**Capa de Persistencia e Integración**
- GestorDAO: SQL a MariaDB (mysql2/promise)
- Adaptador API: NASA POWER (RNF-03)
- Adaptador CSV: sensores.csv (csv-parser)
- SistemaArchivos: Export CSV UTF-8 (RF-32)
- Único punto de contacto con MariaDB

**Actores Externos**
- MariaDB: DB relacional
- NASA POWER API: https://power.larc-nasa.gov...
- sensores.csv: Archivo local (simulacion HW)
- Sistema de Archivos: Exportación de reportes

```
2.2 Reglas de Comunicación entre Capas (RNF-01)
```

1.  UI → Core: La interfaz nunca importa módulos de “core/” ni “data/”. Toda comunicación se realiza mediante eventos IPC de Electron o llamadas a APIs internas expuestas por el Main Process.
2.  Core → Persistencia: La lógica de negocio nunca ejecuta SQL directamente. Solicita operaciones mediante DAOs que retornan DTOs.
3.  Persistencia → BD/API/CSV: Solo los módulos en “src/data/” pueden:

    \- Ejecutar consultas SQL (mysql2)

    \- Realizar peticiones HTTP (axios/fetch)

    \- Leer/escribir archivos locales (fs.promises)

1.  DTOs como contrato: Todos los datos que cruzan capas lo hacen mediante objetos inmutables definidos en “src/dto/”. No se exponen estructuras de tabla ni respuestas crudas de API.

## 3\. Stack tecnológico detallado

```
3.1 Entorno de Ejecución
```

|     |     |     |
| --- | --- | --- |
| Componente | Versión Mínima | Propósito del proyecto |
| **Node.js** | 18.x LTS | Runtime para el Main Process de Electron, manejo de I/O asíncrono y módulos nativos. |
| **Electron** | 28.x | Framework para empaquetar la aplicación como ejecutable de escritorio (.exe), integrando Chromium (frontend) y Node.js (backend). |
| **Chromium** | Integrado en Electron | Motor de renderizado para la interfaz HTML/CSS/JS, garantizando compatibilidad con APIs modernas (Canvas, Fetch, etc.). |
```
3.2 Lenguajes y Estándares
```

|     |     |     |
| --- | --- | --- |
| Elemento | Especificación | Justificación |
| **JavaScript** | ES6+ (Módulos, async/await, clases) | Lenguaje único para frontend y backend, reduciendo curva de aprendizaje y facilitando mantenimiento. |
| **HTML5** | Semántico + ARIA | Estructura accesible y compatible con validaciones nativas de formulario. |
| **CSS3** | Flexbox/Grid + Variables CSS | Diseño responsive y tema corporativo consistente (verde oscuro, blanco, rojo para alertas). |

```
3.3 Dependencias de npm (package.json)
```

json:

{

"dependencies": {

"electron": "^28.0.0",

"mysql2": "^3.6.0",

"axios": "^1.6.0",

"csv-parser": "^3.0.0",

"dotenv": "^16.3.1"

},

"devDependencies": {

"electron-builder": "^24.9.1",

"nodemon": "^3.0.2"

}

}

|

|     |     |     |
| --- | --- | --- |
| Paquete | Función Crítica | Requisito Asociado |
| mysql2/promise | Conexión asíncrona a MariaDB con pool de conexiones | RF-12, RF-15, RF-17 |
| axios | Peticiones HTTP con configuración de timeout | RNF-03 (5 segundos para API NASA) |
| csv-parser | Lectura stream de sensores.csv sin cargar todo en memoria | RF-01, RF-02 |
| dotenv | Carga de variables de entorno para configuración de BD | Permitir conexión a servidor remoto sin hardcodear credenciales |
| electron-builder | Generación de instalador .exe para Windows | Requisito de "sistema instalable" del Plan de Negocio |

```
3.4 Configuración de Base de Datos (MariaDB)
```

Producción / Servidor Remoto

**\- Configuración vía variables de entorno (archivo “.env” en raíz del proyecto):**

env:

DB_HOST=mi-servidor-mysql.com

DB_PORT=3306

DB_USER=usuario_riego

DB_PASSWORD=contraseña_segura

DB_NAME=riego_db

DB_CHARSET=utf8mb4

**\- Conexión en código (“src/data/db.js”):**

javascript:

const mysql = require('mysql2/promise');

require('dotenv').config();

const pool = mysql.createPool({

host: process.env.DB_HOST || 'localhost',

port: parseInt(process.env.DB_PORT) || 3306,

user: process.env.DB_USER || 'root',

password: process.env.DB_PASSWORD || '',

database: process.env.DB_NAME || 'riego_db',

charset: process.env.DB_CHARSET || 'utf8mb4',

waitForConnections: true,

connectionLimit: 10,

queueLimit: 0

});

El mismo código funciona en XAMPP local o en un servidor en la nube (AWS RDS, Google Cloud SQL, etc.) sin modificar una sola línea, solo cambiando el archivo “.env”.

## 4\. Especificaciones técnicas por cada capa
    4.1 Capa de Interfaz (UI) – “public/”

        4.1.1 Estructura de Archivos

public/

├── index.html # Pantalla 1: Login

├── dashboard.html # Pantalla 2: Monitoreo General (Dashboard)

├── captura.html # Pantalla 3: Captura de Datos

├── recomendaciones.html # Pantalla 4: Panel de Recomendaciones

├── historial.html # Pantalla 5: Historial Operativo

├── parcelas.html # Pantalla 6: Gestión de Parcelas (Supervisor)

├── configuracion.html # Pantalla 7: Configuración de Sistema (Supervisor)

├── auditoria.html # Pantalla 8: Auditoría y Validación (Supervisor)

├── reportes.html # Pantalla 9: Reportes Técnicos (Supervisor)

├── usuarios.html # Pantalla 10: Gestión de Usuarios (Supervisor)

├── css/

│ └── estilos.css # Tema corporativo: variables CSS, semáforos, validaciones

└── js/

├── renderer.js # Lógica común del Renderer Process

├── login.js # Validación de credenciales + redirección por rol

├── dashboard.js # Carga de indicadores + tabla de estado

├── captura.js # Validación en tiempo real + envío a Core

└── ... # Un archivo por pantalla para modularidad

        4.1.2 Reglas de Implementación UI

|     |     |     |
| --- | --- | --- |
| Requisito | Implementación Técnica | Archivo/Componente |
| RF-06 (Asteriscos obligatorios) | &lt;label&gt;Hum&lt;sup style="color:red"&gt;\*&lt;/sup&gt;&lt;/label&gt; + validación de required en HTML5 | captura.html, configuracion.html |
| RF-07 (Bloqueo de letras) | Evento input con regex /^\\d\*\\.?\\d\*$/ + event.preventDefault() si no coincide | js/captura.js |
| RF-09 (Alerta visual) | Tooltip CSS con :invalid + .error-msg { display: block } + clase .error en borde del input | css/estilos.css |
| RF-10 (Botón Limpiar) | form.reset() + restaurar estado de botones deshabilitados | js/captura.js |
| RF-28 (Semáforo) | Clase CSS dinámica: .estado-optimo { background: #4caf50 }, .estado-alerta { background: #ff9800 }, .estado-deficit { background: #f44336 } | css/estilos.css + lógica en js/dashboard.js |
| RF-32 (Exportación UTF-8) | new Blob(\["\\uFEFF" + csvContent\], { type: "text/csv;charset=utf-8" }) para incluir BOM | js/historial.js, js/reportes.js |
| RF-35 (Control de roles) | Al cargar la sesión: if (usuario.rol === "OPERADOR") { document.querySelectorAll(".sup-only").forEach(el => el.style.display = "none") } | js/renderer.js |
| RF-36 (Timeout sesión) | setTimeout(logout, 30 \* 60 \* 1000) reiniciado en cada evento mousemove, keypress, click | js/renderer.js |
| RNF-04 (2 decimales) | Number(valor).toFixed(2) en todos los cálculos de volumen y porcentajes antes de renderizar | js/dashboard.js, js/recomendaciones.js |

    4.2 Capa de Lógica de Negocio (Core) - src/core/

        4.2.1 Módulos y Responsabilidades

|     |     |     |     |
| --- | --- | --- | --- |
| Módulo | Archivo | Responsabilidad Técnica | RFs Asociados |
| Validador | validador.js | Sanitización de entrada: rangos físicos (0-100% humedad, -10 a 50°C temp), bloqueo de caracteres no numéricos, validación de consistencia (umbral_min < umbral_max). | RF-03, RF-04, RF-07, RF-08 |
| MotorFAO56 | motor_fao56.js | Cálculo puro de fórmulas: ETc = Kc \* ET0, Balance Hídrico = H_inicial + P + R - ETc - D. Sin I/O, sin efectos secundarios. | RF-18, RF-19 |
| GestorDecisiones | gestor_decisiones.js | Orquestación: recibe lecturas validadas + ET0, ejecuta MotorFAO56, evalúa umbrales, genera RecomendacionDTO con acción y volumen. | RF-20, RF-21, RF-22, RF-23 |

        4.2.2 Reglas de Implementación Core

- Pureza funcional: _MotorFAO56_ y _Validador_ no deben tener estado interno ni depender de módulos externos. Solo reciben parámetros y retornan valores.
- Precisión decimal: Todos los retornos numéricos de volumen, ETc o balances deben aplicar .toFixed(2) y convertirse a Number para evitar strings en cálculos posteriores (RNF-04).
- Manejo de errores: Las funciones del Core deben lanzar excepciones descriptivas (throw new Error("Humedad fuera de rango: " + valor)) que sean capturadas por la UI para mostrar RF-09.
- Inmutabilidad de DTOs: Los objetos _LecturaDTO_ y _RecomendacionDTO_ deben ser creados con Object.freeze() o mediante clases con getters sin setters para prevenir modificaciones accidentales.
```
4.3 Capa de Persistencia e Integración - src/data/
```
        4.3.1 Módulos y Responsabilidades

|     |     |     |     |
| --- | --- | --- | --- |
| Módulo | Archivo | Responsabilidad Técnica | RFs/ RNFs Asociados |
| **GestorDAO** | dao.js | Pool de conexiones a MariaDB, ejecución de consultas parametrizadas, mapeo de resultados a DTOs. | RF-12, RF-15, RF-17 |
| **AdaptadorAPI** | adaptador_api.js | Consumo de NASA POWER API con timeout configurable (default 5000ms), manejo de fallback en caso de error/timeout. | RF-14, RNF-03 |
| **AdaptadorCSV** | adaptador_csv.js | Lectura stream de sensores.csv, parseo a objetos, filtrado de filas inválidas, mapeo a LecturaDTO. | RF-01, RF-02 |
| **SistemaArchivos** | sistema_archivos.js | Exportación de datos a CSV con codificación UTF-8 (BOM), gestión de rutas de archivo multiplataforma. | RF-32 |

        4.3.2 Reglas de Implementación Persistencia

- Consultas parametrizadas: Nunca concatenar strings en SQL. Siempre usar ? placeholders con db.query(sql, \[params\]) para prevenir inyección SQL.
- Timestamp automático: El campo timestamp_registro\`/\`timestamp_generacion debe generarse con NOW() en la consulta SQL, nunca en JavaScript, para garantizar RF-12 (trazabilidad inmutable).
- Manejo de conexiones: Usar mysql2/promise con pool para reutilizar conexiones y evitar agotamiento de recursos en operaciones concurrentes.
- Timeout API: Implementar AbortController o Promise.race() con setTimeout para garantizar que la petición a NASA POWER no bloquee la UI más de 5 segundos (RNF-03).
- UTF-8 en exportación: Al escribir CSV, preceder el contenido con \\uFEFF (Byte Order Mark) para que Excel reconozca la codificación y muestre correctamente acentos y "ñ" (RF-32).

## 5\. ESPECIFICACIÓN DE LAS 10 + 1 PANTALLAS (UI/UX)

Las pantallas están dividas, estas se dividen por los dos roles (Operador y Supervisor), las pantallas que ve cada uno no son las mismas, después del login cada uno tiene su pantalla principal a la que es redirigido después del login (en el diseño de colores, es necesario que se muestre este cambio por colores, las pantallas del Operador deben de ser de un color diferente a las del Supervisor).

**Operador:** Tiene como pantalla principal a dashboard.html y en su menú de pantallas disponibles están captura.html, recomendaciones.html, historial.html.

**Supervisor:** Tiene como pantalla principal a parcelas.html y en su menú de pantallas disponibles están configuración.html, auditoria.html, reportes.html, usuarios.html.

En el cambio de pantallas debe haber una carga no muy larga sino el mensaje que diga “Cargando. + pantalla a la que se esté dirigiendo”. Solo se muestran en caso de que tarden un poco en cargar, los siguientes son los mensajes que pueden ser usado dependiendo de cuál sea el caso:

“Cargando datos”, “Cargando recomendaciones”, “Cargando historial”, etc.

La opción de salir en el menú “Cierra la sesión” mostrando mensaje de Cerrando sesión con el logo y regresa al login”, también se cierra la sesión automáticamente después de 30 minutos sin actividad.

A continuación, se describe el contenido y comportamiento de las pantallas.

**_Pantalla 1: Inicio de Sesión (public/index.html)_**

\- Elementos:

- Título "Sistema Riego" + subtítulo "Control de Riego Agrícola"
- Campos: Usuario (texto), Contraseña (password) con required y asterisco rojo (\*)
- Botón "Ingresar" deshabilitado hasta que ambos campos tengan contenido (RF-06)
- Pie de página con credenciales de prueba: Supervisor: admin/admin123 | Operador: operador1/operador123
- Opción de mostrar contraseña para poder visualizarla un momento al clickear.

\- Comportamiento:

- Al hacer clic en "Ingresar": validar credenciales contra tabla usuarios (simulado en desarrollo)
- Si es válido: guardar { nombre, rol } en sessionStorage y redirigir a la pantalla correspondiente, si usuario es igual a Operador redirigir a dashboard.html, pero si usuario es igual a Supervisor redirigir a parcelas.html.
- Si es inválido: mostrar mensaje de error en rojo (RF-09) y mantener el foco en el campo usuario.
```
5.1 Pantallas del Operador Agrícola
```

**_Pantalla 2: Panel de Control - Dashboard (public/dashboard.html)_**

\- Encabezado:

- Logo "Sistema Riego" + usuario logueado + menú desplegable de navegación + botón "Cerrar Sesión"

\- Indicadores (Cards superiores):

- Total Parcelas: COUNT de tabla \`parcelas\`
- Lecturas del día (Óptimas): COUNT de lecturas_sensores WHERE humedad_suelo BETWEEN 40 AND 80 AND DATE(timestamp_registro) = CURDATE()
- Alertas activas: COUNT WHERE humedad_suelo &lt; 40 OR humedad_suelo &gt; 80
- Déficit detectado: COUNT WHERE humedad_suelo < 40

\- Tabla de Estado Actual:

- Columnas: Parcela, Humedad (%), Temperatura (°C), HR (%) (informativo, no persistente), API Clima (icono + texto), Estado (semáforo), Acción, Detalles (botón que dirige recomendaciones.html).
- Filas: Última lectura por parcela (subquery con MAX(timestamp))

\- Botones de navegación rápida (Estos se deben encontrar en la parte superior de la tabla en esquina y esquina):

- Icono de (+)"Capturar Datos" → captura.html
- Icono de reloj "Historial" → historial.html

\- Leyenda de semáforo:

- 🟢 Verde = Óptimo (dentro de umbrales 40-80%), 🟡 Amarillo = Alerta ( exceso de humedad 30-39% o 81-90%), 🔴 Rojo = Déficit (necesita riego &lt;30% o &gt;90%)

**_Pantalla 3: Captura de Datos (public/captura.html)_**

\- Sección 1: Configuración

- Selector de Parcela (dropdown con opciones de tabla parcelas)
- Selector de Origen: Manual o Sensores (CSV) (radio buttons)

La opción de sensores carga automáticamente el ultimo dato de esa parcela, pone los datos automáticamente en los apartados de la sección 2, se valida y se puede dar la opción de procesar lectura para validar.

\- Sección 2: Lecturas de Campo

- Humedad del Suelo (%): input numérico con placeholder "Ej: 45.50", tooltip "Rango válido: 0%-100%"
- Temperatura Ambiente (°C): input numérico con placeholder "Ej: 24.50", tooltip "Rango válido: -10°C a 50°C"
- Humedad Relativa (%) (opcional): input numérico con placeholder "Ej: 65.00", tooltip "Campo opcional, no se almacena en BD"

Al capturar estos datos debe haber un mensaje de aviso de Lectura guardada exitosamente.

\- Sección 3: Datos Climáticos

- ET0 de Referencia (mm/día): campo numérico calculado automáticamente de solo lectura con placeholder "ETc = Kc × ET0 (calculado)” + tooltip "Se calcula automáticamente”

Este se calcula automáticamente con los datos que se ingresan en la sección 2.

\- Acciones:

- Botón "Limpiar Campos": resetea formulario y habilita/deshabilita según estado
- Botón "Procesar Lectura": deshabilitado por defecto; se habilita solo cuando:
- Campos obligatorios tienen valores numéricos válidos (RF-07)
- Valores están dentro de rangos físicos (RF-03, RF-04)
- Los campos obligatorios son Parcela, Origen, Humedad del Suelo y Temperatura ambiente.

\- Notas de validación (pie de formulario):

- Texto estático explicando RF-06, RF-07, RF-08, RF-12, RNF-04
- Los campos marcados con \* son obligatorios (RF-06)
- Solo se aceptan valores numericos (RF-07)
- Lecturas fuera de rango se marcan como invalidas (RF-08)
- HR es opcional (puede dejarse vacio)
- ETc se calcula automaticamente con Motor FAO-56
- El boton "Procesar" permanece deshabilitado hasta que los datos sean validos

**_Pantalla 4: Panel de Recomendaciones Activas (public/recomendaciones.html)_**

\- Tarjetas de Recomendación (por cada recomendación PENDIENTE):

- Encabezado: "Recomendación para: \[Nombre Parcela\] - \[Cultivo\]"
- Etiqueta de urgencia: "Urgencia: \[CRÍTICO/ALTO/MEDIO/BAJO\]" (calculado por GestorDecisiones) (La urgencia es por colores((badge coloreado)))
- Detalles:
    - Acción sugerida: "APLICAR RIEGO" / "DETENER RIEGO" / "MANTENER"
    - Volumen exacto: "155.50 L" (con 2 decimales, RNF-04)
    - Estado: "Pendiente de ejecución"

\- Controles:

- - Botón "✅ Confirmar Riego" → actualiza estado a "EJECUTADA" (RF-25)
    - Botón "⏸ Posponer" → mantiene estado "PENDIENTE" (RF-30)
    - Botón "🔄 Recalcular" → re-ejecuta MotorFAO56 con últimos datos

Debe incluir in mensaje que confirme los botones, como “Recomendación pospuesta”, “Riego confirmado y ejecutado”, “Recalculando recomendaciones” y “Recomendaciones recalculadas”

\- Historial de Recomendaciones (tabla inferior):

- Columnas: Fecha/Hora, Parcela, Acción (badge coloreado), Vol (L), Estado (badge coloreado)
- Botón "📥 Exportar CSV" → genera archivo UTF-8 con historial filtrado (RF-32)

**_Pantalla 5: Historial Operativo (public/historial.html)_**

\- Titulo “Filtros de Búsqueda”:

- Selector de Parcela (dropdown con opción "Todas" y opciones)
- Campo Desde y Hasta (input type="date")
- Botón "🔍 Filtrar" → recarga tabla con parámetros
- Botón "📥 Exportar CSV" → exporta resultados filtrados a UTF-8 (RF-32)

\- Tabla de Resultados:

- Columnas: Timestamp (Auto), Parcela, Humedad, Temperatura, HR (informativo), Origen (CSV/MANUAL), Válida (Sí/No)
- Filas: Resultados de consulta a lecturas_sensores con JOIN a parcelas y usuarios
- Orden: timestamp_registro DESC
```
5.2 Pantallas del Supervisor Técnico (adicionales)
```
**_Pantalla 6: Listado de Terrenos (public/parcelas.html)_**

\- Botón de Acción: "+ Nueva Parcela" → abre modal (Pantalla 6 Modal)

\- Tabla de Gestión:

- Columnas: ID, Nombre (Único), Área (m²), Cultivo, Acciones (Editar/Eliminar)
- Filas: Datos de tabla parcelas
- Editar / Eliminar son botones el editar abre el modal con los datos a editar de la parcela seleccionada, eliminar lanza aviso “¿Eliminar “Nombre Parcela”? con opción Aceptar y Cancelar.

\- Modal "Nueva Parcela" (overlay con fondo semitransparente):

- Campos obligatorios (\*): Nombre, Área (m²), Cultivo (dropdown)
- Validación: Nombre único (RF-13), área > 0
- Botones: "Guardar" (inserta en BD) / "Cancelar" (cierra modal)

**_Pantalla 7: Configuración de Sistema (public/configuracion.html)_**

\- Sección 1: Configuración de Umbrales (Lado

- Selector de Parcela
- Campos: Mínimo (%), Máximo (%), Kc Actual.
- Validación: Mínimo < Máximo (consistencia de reglas)

Si máximo es menor a mínimo da un mensaje: “El umbral mínimo debe ser menor al máximo”

Tambien otro mensaje es: Los umbrales deben estar entre 0% y 100%. Cuando números son mayores.

Mensaje de Kc Actual cuando números son mayores: “Kc debe estar entre 0.1 y 2.0”

No se aceptan caracteres ni símbolos, solo números

- Botón "Guardar" → actualiza tabla config_sistema con usuario_responsable (RF-12)

\- Sección 2: Configuración de API

- Campo URL (readonly: \`https://power.larc.nasa.gov/api/temporal/daily/point\`)
- Campo Link (readonly: https://power.larc.nasa.gov/docs/services/api/)
- Campo Token (opcional, masked input) placeholder “Sin token requerido”
- Timeout: "5 Segundos (Fijo)" (readonly, RNF-03)
- Botón "Probar conexión" → ejecuta petición de prueba a API + muestra estado: 🔴 Desconectado / 🟢 Conectado

Mensajes a mostrar: No se pudo conectar a la API. Verifique su conexión. Y el de “API conectada con éxito”

La sección 1 y 2 deben estar en mitad y mitad de pantalla en dos cuadros, uno en la derecha y otro en la izquierda. La sección 3 debe estar a lo largo de las dos debajo.

\- Sección 3: Mantenimiento

\- Indicador: "Base de datos: MariaDB" (consulta de conexión)

- Botón "Generar respaldo" → ejecuta mysqldump vía child_process + guarda archivo .sql en sistema de archivos (RF-17)
- Texto: “Genera un respaldo completo de la base de datos en formato JSON.”
- Incluye mensaje de que ha sido generado.

**_Pantalla 8: Auditoría y Validación (public/auditoria.html)_**

\- Botones:

\- Botón “Gestionar Parcelas” que lleva a la pantalla parcelas.html

\- Botón “Configurar Umbrales” que lleva a la pantalla configuración.html

\- Botón “Reportes” que lleva a la pantalla reportes.html

\- Botón “Usuarios” que lleva a la pantalla usuarios.html

\- Sección 1: Recomendaciones pendientes de validar

- Tabla con columnas: ID, Fecha, Parcela, Acción, Vol (L), Operador, Validación
- Columna Validación: Botones "✅" (aprueba → estado "EJECUTADA") / "❌" (rechaza → estado "RECHAZADA")
- Al validar: registra usuario_aprobador y timestamp en recomendaciones_riego (RF-12, RF-26, RF-27)

\- Sección 2: Bitácora de Auditoría

- Tabla con columnas: Timestamp, Usuario, Rol, Acción, Detalle
- Filas: Consultas a tablas de auditoría o logs de aplicación (simulado en desarrollo)

**_Pantalla 9: Reportes Técnicos (public/reportes.html)_**

\- Resumen de KPIs (Cards):

- Total Lecturas, Humedad Promedio, Temp. Promedio, Recomendaciones, Volumen Riego Ejecutado, Ejecutadas, Rechazadas, Pendientes.

Son 5 cuadros arriba (Total Lecturas, Humedad Promedio, Temp. Promedio, Recomendaciones, Volumen Riego Ejecutado) y 3 abajo (Ejecutadas, Rechazadas, Pendientes)

\- Acción: con Botón en la parte superior de esta sección "📥 Exportar CSV" → genera reporte técnico UTF-8 (RF-32)

\- Resumen por Parcela (Tabla):

- Columnas: Parcela, Área (m²), Cultivo, Lecturas, Recomendaciones
- Filas: Agregación por parcelas.id con COUNT y AVG de lecturas

**_Pantalla 10: Gestión de Usuarios (public/usuarios.html)_**

Dos secciones divididas lado a lado, una en lado derecho y la otra en izquierdo:

\- Formulario "Crear Nuevo Usuario":

- Campos: Nombre \* con placeholder “Nombre”, Rol \* (dropdown: OPERADOR/SUPERVISOR), Contraseña (min 8) \* con placeholder “Mínimo 8 caracteres, Confirmar contraseña \* con placeholder “Repite la contraseña”.
- Debe haber una opción para visualizar la contraseña por un momento al seleccionarla.
- Validación: Nombre único, contraseña ≥8 caracteres, confirmación coincide
- Botón "Crear" → inserta en usuarios con password_hash (simulado en desarrollo)

\- Tabla "Usuarios del sistema:

- Columnas: ID, Nombre, Rol, Última Sesión, Acciones (Editar / Desactivar)
- Botón "Desactivar": soft delete (actualiza campo activo = false, no elimina registro para preservar auditoría RF-12)

Para las pantallas agrega colores en los títulos de roles que se visualizan en las tablas donde se muestran, como las pantallas están divididas es necesario saber cuáles son de cual así que para el diseño de la interfaz asigna colores diferentes a las pantallas que puede ver cada uno, el Login tiene un color que ambos pueden ver, en ese caso se puede hacer que el login tenga un diseño que mezcle los dos colores, pero las demás pantallas asignadas a los distintos Roles deben ser diferente.

Usa “Verde” para Supervisor.

Usa “Café” para Operador.

Si el diseño puede ser muy ajustado a la temática del proyecto, puede haber efectos textura de pasto para el color verde y de tierra para el café.

Font llamativo y con diseño profesional, pero no serio.

## 6\. REGLAS DE NEGOCIO Y VALIDACIONES CRÍTICAS
```
6.1 Validaciones de Entrada (Frontend + Backend)
```
|     |     |     |     |     |
| --- | --- | --- | --- | --- |
| Campo | Rango físico | Validación Fronted | Validación Backend | Requisto |
| humedad_suelo | 0% - 100% | Regex /^\\d\*\\.?\\d\*$/ + min/max HTML5 | Validador.esRangoHumedad(valor) | RF-03, RF-07, RF-08 |
| temperatura_ambiente | \-10°C - 50°C | Regex + min/max HTML5 | Validador.esRangoTemperatura(valor) | RF-04, RF-07, RF-08 |
| area_m2 | \> 0 | min="0.01" + step="0.01" | area > 0 en SQL CHECK | RF-13 |
| umbral_min / umbral_max | 0-100% + min < max | Validación en blur de inputs | WHERE umbral_min < umbral_max | RF-20, RF-21 |
| password | ≥8 caracteres | minlength="8" + patrón complejo | Hash con bcrypt antes de guardar | RF-33 |

```
6.2 Cálculos Matemáticos (Core)
```

Javascript:

// MotorFAO56.js - Ejemplo de implementación congelada

class MotorFAO56 {

/\*\*

\* Calcula Evapotranspiración del Cultivo (ETc) según FAO-56

\* @param {number} kc - Coeficiente de cultivo (de config_sistema)

\* @param {number} et0 - Evapotranspiración de referencia (de NASA POWER API)

\* @returns {number} ETc con precisión de 2 decimales (RNF-04)

\*/

static calcularETc(kc, et0) {

if (typeof kc !== 'number' || typeof et0 !== 'number') {

throw new Error("Parámetros deben ser numéricos");

}

const resultado = kc \* et0;

return Number(resultado.toFixed(2)); // RNF-04: precisión exacta

}

/\*\*

\* Calcula Balance Hídrico del suelo

\* Fórmula: H_final = H_inicial + Precipitación + Riego - ETc - Drenaje

\*/

static calcularBalanceHidrico(hInicial, precip, riego, etc, drenaje) {

const balance = hInicial + precip + riego - etc - drenaje;

return Number(balance.toFixed(2));

}

}

```
6.3 Reglas de Decisión (GestorDecisiones)
```
Javascript:

// gestor_decisiones.js - Lógica congelada

class GestorDecisiones {

static evaluarUmbral(hFinal, umbralMin, umbralMax) {

if (hFinal < umbralMin) return 'APLICAR_RIEGO'; // RF-20

if (hFinal > umbralMax) return 'DETENER_RIEGO'; // RF-21

return 'MANTENER'; // RF-22

}

static calcularVolumen(deficit, area) {

if (deficit <= 0) return 0.00;

// Fórmula simplificada: V = déficit (mm) × área (m²) × 10 (factor de conversión)

const volumen = deficit \* area \* 10;

return Number(volumen.toFixed(2)); // RNF-04

}

static determinarUrgencia(hFinal, umbralMin) {

const deficit = umbralMin - hFinal;

if (deficit > 20) return 'CRÍTICO';

if (deficit > 10) return 'ALTO';

if (deficit > 5) return 'MEDIO';

return 'BAJO';

}

}

## 7\. ENTREGABLES ESPERADOS DE ESTA FASE

```
7.1 Estructura de Directorios Final
```
sistema_riego/

├── .env.example # Plantilla de variables de entorno

├── package.json # Dependencias y scripts de Electron

├── electron-builder.yml # Configuración de empaquetado .exe

├── public/ # Frontend (Renderer Process)

│ ├── \*.html # 10 pantallas + 1 modal

│ ├── css/estilos.css # Tema corporativo + validaciones visuales

│ └── js/\*.js # Lógica por pantalla (validación, fetch, IPC)

├── src/ # Backend (Main Process)

│ ├── main.js # Punto de entrada de Electron + IPC handlers

│ ├── dto/ # Objetos de transferencia inmutables

│ │ ├── lectura.dto.js

│ │ ├── recomendacion.dto.js

│ │ └── ...

│ ├── core/ # Lógica de negocio pura

│ │ ├── validador.js

│ │ ├── motor_fao56.js

│ │ └── gestor_decisiones.js

│ └── data/ # Persistencia e integración

│ ├── db.js # Pool de conexiones MariaDB

│ ├── dao.js # Consultas parametrizadas

│ ├── adaptador_api.js # NASA POWER con timeout

│ ├── adaptador_csv.js # Lectura de sensores.csv

│ └── sistema_archivos.js # Exportación CSV UTF-8

├── datos/ # Actores externos simulados

│ └── sensores.csv # Archivo de prueba con formato congelado

└── docs/ # Documentación técnica (JSDoc generado)

```
7.2 Criterios de Aceptación para Cierre de Fase 4
```
El código se considerará implementado cuando:

- La aplicación se empaqueta como .exe ejecutable en Windows sin requerir instalación manual de Node.js
- Todas las pantallas respetan el control de roles (RF-35): Operador no ve menús de Supervisor
- Los formularios aplican validación en tiempo real (RF-07) y deshabilitan botones hasta datos válidos (RF-06)
- Los cálculos de volumen y ETc muestran exactamente 2 decimales (RNF-04)
- La API NASA POWER maneja timeout de 5s con fallback sin congelar la interfaz (RNF-03)
- Los timestamps se generan en BD (NOW()), no en frontend (RF-12)
- La exportación CSV incluye BOM (\\uFEFF) y se lee correctamente en Excel con acentos/ñ (RF-32)
- Cada módulo tiene comentarios JSDoc que referencian los RFs/RNFs que implementa
- La conexión a BD se configura vía variables de entorno para permitir migración a servidor remoto

## 8\. OBSERVACIONES Y PUNTOS DE ATENCIÓN
```
8.1 Coherencia con Fases Anteriores
```
- **No se introducen nuevos campos en la BD**: El campo humedad_relativa aparece en pantallas como dato informativo del CSV, pero **no se persiste** en lecturas_sensores, respetando el diccionario de datos congelado.
- **Nombres de módulos idénticos a arquitectura.pdf**: Motor de Cálculo (FAO-56), Gestor de Reglas de Decisión, etc., se mantienen en comentarios y estructura de carpetas.
- **DTOs como único puente**: La UI nunca accede a tablas ni respuestas de API directamente; todo pasa por LecturaDTO/RecomendacionDTO.
```
8.2 Consideraciones de Implementación
```
1.  **Electron IPC**: Para comunicación segura entre Renderer (UI) y Main (Core/Persistencia), usar ipcRenderer.invoke() / ipcMain.handle() en lugar de exponer módulos directamente.
2.  **Manejo de errores en API**: Implementar reintentos exponenciales (backoff) para la API NASA POWER, pero respetando el timeout máximo de 5s por petición (RNF-03).
3.  **Seguridad de credenciales**: En producción, las contraseñas deben hashearse con bcrypt antes de guardar en BD; en desarrollo académico, se puede simular con comparación directa.
4.  **Pruebas de integración**: Crear scripts de prueba que verifiquen el flujo completo: CSV → AdaptadorCSV → Validador → MotorFAO56 → GestorDecisiones → DAO → BD.

## 9\. Estructura de carpetas definitiva

Basándose en la **arquitectura de 3 capas,** el **diagrama de clases** y las **10+1 pantallas definidas**, la siguiente es la estructura de directorios.
```
9.1 Árbol completo del proyecto
```
sistema_riego/

│

├── 📄 .env.example # Plantilla de variables de entorno (BD, API)

├── 📄 package.json # Dependencias, scripts de Electron y build

├── 📄 electron-builder.yml # Configuración para generar .exe (Windows)

├── 📄 README.md # Documentación básica del proyecto

│

├── 📁 public/ # 🟦 CAPA UI - Renderer Process (Electron)

│ │ # (Lo que el usuario ve y toca)

│ ├── 📄 index.html # Pantalla 1: Login (RF-33)

│ ├── 📄 dashboard.html # Pantalla 2: Monitoreo General (RF-28)

│ ├── 📄 captura.html # Pantalla 3: Captura de Datos (RF-05,06,07)

│ ├── 📄 recomendaciones.html # Pantalla 4: Panel de Recomendaciones (RF-24,30)

│ ├── 📄 historial.html # Pantalla 5: Historial Operativo (RF-16,32)

│ ├── 📄 parcelas.html # Pantalla 6: Gestión de Parcelas (RF-31) \[Supervisor\]

│ ├── 📄 configuracion.html # Pantalla 7: Configuración de Sistema (RF-20-22) \[Sup\]

│ ├── 📄 auditoria.html # Pantalla 8: Auditoría y Validación (RF-25-27) \[Sup\]

│ ├── 📄 reportes.html # Pantalla 9: Reportes Técnicos (RF-32) \[Supervisor\]

│ ├── 📄 usuarios.html # Pantalla 10: Gestión de Usuarios (RF-33-35) \[Sup\]

│ │

│ ├── 📁 css/

│ │ └── 📄 estilos.css # Tema corporativo + validaciones visuales (RF-06,09,28)

│ │

│ └── 📁 js/ # Lógica del Renderer (sin acceso directo a BD)

│ ├── 📄 renderer.js # Común: IPC, validación de sesión, RF-35, RF-36

│ ├── 📄 login.js # Autenticación + redirección por rol

│ ├── 📄 dashboard.js # Carga de indicadores + tabla de estado

│ ├── 📄 captura.js # Validación en tiempo real (RF-07) + envío a Core

│ ├── 📄 recomendaciones.js # Confirmar/Posponer + actualización de estado

│ ├── 📄 historial.js # Filtros + exportación CSV UTF-8 (RF-32)

│ ├── 📄 parcelas.js # CRUD de parcelas + modal de creación

│ ├── 📄 configuracion.js # Umbrales + prueba de conexión API (RNF-03)

│ ├── 📄 auditoria.js # Validación de recomendaciones + bitácora

│ ├── 📄 reportes.js # KPIs + resumen por parcela + exportación

│ └── 📄 usuarios.js # Creación de usuarios + asignación de roles

│

├── 📁 src/ # 🟩🟧 MAIN PROCESS - Backend (Node.js)

│ │ # (Lógica de negocio + Persistencia)

│ ├── 📄 main.js # Punto de entrada de Electron + IPC handlers

│ │

│ ├── 📁 dto/ # 🔄 OBJETOS DE TRANSFERENCIA (Contrato entre capas)

│ │ ├── 📄 lectura.dto.js # LecturaDTO: parcelaId, humedad, temperatura, origen

│ │ ├── 📄 recomendacion.dto.js # RecomendacionDTO: volumen, accion, estado, urgencia

│ │ ├── 📄 usuario.dto.js # UsuarioDTO: id, nombre, rol (sin password)

│ │ └── 📄 parcela.dto.js # ParcelaDTO: id, nombre, area_m2, cultivo

│ │

│ ├── 📁 core/ # 🟩 CAPA LÓGICA DE NEGOCIO (Pura, sin I/O)

│ │ ├── 📄 validador.js # RF-03, RF-04, RF-07, RF-08: Rangos físicos + sanitización

│ │ ├── 📄 motor_fao56.js # RF-18, RF-19: ETc = Kc × ET₀ + Balance Hídrico

│ │ └── 📄 gestor_decisiones.js # RF-20 a RF-23: Evaluación de umbrales + volumen + urgencia

│ │

│ └── 📁 data/ # 🟧 CAPA PERSISTENCIA E INTEGRACIÓN

│ ├── 📄 db.js # Pool de conexiones a MariaDB (mysql2/promise)

│ │

│ ├── 📁 dao/ # Data Access Objects (Únicos que hablan SQL)

│ │ ├── 📄 lectura.dao.js # CRUD de lecturas_sensores + timestamp automático (RF-12)

│ │ ├── 📄 recomendacion.dao.js # CRUD de recomendaciones_riego + estados (RF-24 a RF-27)

│ │ ├── 📄 usuario.dao.js # Autenticación + roles + auditoría (RF-33 a RF-36)

│ │ └── 📄 parcela.dao.js # CRUD de parcelas + validación de nombre único (RF-13)

│ │

│ ├── 📄 adaptador_api.js # NASA POWER API con timeout 5s (RNF-03) + fallback

│ ├── 📄 adaptador_csv.js # Lectura de sensores.csv (csv-parser) + mapeo a DTO

│ └── 📄 sistema_archivos.js # Exportación CSV con BOM UTF-8 (RF-32) + respaldos (RF-17)

│

├── 📁 datos/ # 📦 ACTORES EXTERNOS SIMULADOS

│ └── 📄 sensores.csv # Archivo de prueba con formato congelado:

│ # parcela_id,humedad_suelo,temperatura_ambiente

│

└── 📁 docs/ # 📚 DOCUMENTACIÓN TÉCNICA

└── 📁 jsdoc/ # Documentación auto-generada desde comentarios JSDoc

```
9.2 Mapeo: carpetas ↔ arquitectura
```
|     |     |     |
| --- | --- | --- |
| Carpeta/Archivo | Módulo | Requisito Asociado |
| public/\*.html + js/ | Módulo de Vistas Operador/Supervisor | RF-28, RF-35, RF-36 |
| src/core/validador.js | Validador de Datos | RF-03, RF-04, RF-07, RF-08 |
| src/core/motor_fao56.js | Motor de Cálculo (FAO-56) | RF-18, RF-19, RNF-04 |
| src/core/gestor_decisiones.js | Gestor de Reglas de Decisión | RF-20, RF-21, RF-22, RF-23 |
| src/data/dao/\*.js | Gestor de Acceso a Datos (DAO) | RF-12, RF-15, RF-17 |
| src/data/adaptador_api.js | Adaptador de API Externa | RF-14, RNF-03 |
| src/data/adaptador_csv.js | Sistema de archivos local (lectura) | RF-01, RF-02 |
| src/data/sistema_archivos.js | Sistema de archivos local (exportación) | RF-32, RF-17 |
| src/dto/\*.js | Protocolo Estricto (Notas.pdf Punto 1) | RNF-01, RNF-02 |
| datos/sensores.csv | Sensores IoT (simulados) | RF-01, RF-02 |

```
9.3 Archivos de configuración clave
```
.env.example (Plantilla para variables de entorno)

\# Conexión a MariaDB (desarrollo local con XAMPP)

DB_HOST=localhost

DB_PORT=3306

DB_USER=root

DB_PASSWORD=

DB_NAME=riego_db

DB_CHARSET=utf8mb4

\# API NASA POWER (producción)

API_POWER_BASE_URL=https://power.larc.nasa.gov/api/temporal/daily/point

API_POWER_TIMEOUT=5000

\# Configuración de la aplicación

APP_NAME=Sistema Riego

APP_VERSION=1.0.0

package.json (Dependencias y scripts)

{

"name": "sistema-riego",

"version": "1.0.0",

"description": "Sistema Inteligente de Control de Riego - Fase 4 Implementación",

"main": "src/main.js",

"scripts": {

"start": "electron .",

"dev": "nodemon --exec electron .",

"build": "electron-builder --win",

"docs": "jsdoc src -d docs/jsdoc"

},

"dependencies": {

"axios": "^1.6.0",

"csv-parser": "^3.0.0",

"dotenv": "^16.3.1",

"electron": "^28.0.0",

"mysql2": "^3.6.0"

},

"devDependencies": {

"electron-builder": "^24.9.1",

"jsdoc": "^4.0.2",

"nodemon": "^3.0.2"

},

"build": {

"appId": "com.riego.sistema",

"win": {

"target": "nsis",

"icon": "public/icon.ico"

}

}

}

```
9.4 Flujo de comunicación entre carpetas
```
\[Usuario\]

│

▼

public/\*.html + js/\*.js (UI - Renderer Process)

│ ✅ Validación en cliente (RF-06, RF-07, RF-09)

│ ✅ Renderizado de DTOs a HTML

│

│ ❌ NUNCA importa mysql2, fs, ni core/

│

▼ (IPC: invoke/handle)

src/main.js (Electron Main Process - Orquestador)

│

├──▶ src/core/\*.js (Lógica de Negocio - Pura)

│ ✅ MotorFAO56, GestorDecisiones, Validador

│ ❌ Sin acceso a BD, API o archivos

│

└──▶ src/data/\*.js (Persistencia - I/O permitido)

✅ DAOs: Consultas SQL parametrizadas

✅ AdaptadorAPI: NASA POWER con timeout 5s

✅ AdaptadorCSV: Lectura de sensores.csv

✅ SistemaArchivos: Exportación UTF-8

❌ NUNCA expone estructuras de tabla a UI
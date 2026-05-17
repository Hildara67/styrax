**Entregable para el documento final:** 

**1. Plan de Negocio: Optimización y Control Hídrico** 

1. **Resumen Ejecutivo** 

El **Sistema Inteligente de Riego** es una solución de software diseñada para automatizar y optimizar el consumo de agua en cultivos agrícolas. Mediante la integración de datos climáticos en tiempo real y lecturas de sensores, el sistema aplica modelos matemáticos de ingeniería para determinar con precisión cuándo y cuánto regar, eliminando la incertidumbre del riego manual.  

2. **Definición del Problema** 

Actualmente, la gestión hídrica en el sector agrícola depende de estimaciones empíricas, lo que provoca dos problemas críticos:

- **Desperdicio de recursos:** Uso excesivo de agua que eleva los costos operativos. 
- **Estrés hídrico:** Daño a los cultivos por falta o exceso de humedad, reduciendo la producción.  
- **Falta de datos:** Inexistencia de registros históricos para auditorías o mejora de procesos.  
3. **Propuesta de Solución y Valor** 

El sistema ofrece un **Balance Hídrico Automatizado** basado en la metodología **FAO-56**. El valor diferencial radica en:  

- **Precisión Matemática:** Uso de la fórmula ET\_c = K\_c \* ET\_0 para calcular la pérdida exacta de agua.  
- **Simulación de Escenarios:** Capacidad de procesar datos de sensores vía CSV para validar el comportamiento del sistema antes de su despliegue físico. 
- **Soporte a Decisiones:** Generación de recomendaciones automáticas ("APLICAR RIEGO") basadas en umbrales físicos configurables. 
4. **Mercado Objetivo / Usuarios** 

El software está diseñado para tres perfiles principales:

- **Operadores Agrícolas:** Personal de campo encargado de la ejecución y monitoreo diario.  
- **Supervisores Técnicos / Ingenieros:** Responsables de la configuración de parámetros y análisis de reportes. 
- **Empresas Agroindustriales:** Organizaciones que buscan certificar su uso eficiente del agua y reducir costos de operación. 
5. **Modelo de Operación o Negocio** 

El sistema se implementará bajo un esquema de **Proyecto de Uso Interno con opción a Licenciamiento por Parcela**.  

- Se entrega como una solución instalable (aprovechando MariaDB vía XAMPP) para control total de los datos por parte del cliente. 
- Incluye un módulo de exportación de reportes CSV para cumplimiento normativo y trazabilidad.  
6. **Estructura del Equipo** 

Bajo la **Planificación Técnica** diseñada por la Responsable de Desarrollo (Nicol), el equipo se organiza siguiendo el **Modelo en Cascada** para garantizar que los requisitos y la arquitectura se traduzcan fielmente en código funcional.

- **Ingeniería de Requisitos y Arquitectura (María Guadalupe):** Responsable de las etapas 1 y 2. Sus funciones incluyen la recopilación y estructuración de los 36 requerimientos funcionales, la creación del **Plan de Negocio** y la definición del **Diagrama Arquitectónico** de 3 capas, incluyendo la descripción técnica de los módulos y la interacción con actores externos.
- **Diseño de Software y Programación (Hildara):** Responsable de la etapa 3 y co - responsable de la etapa 4. Su labor es transformar la arquitectura en **Planos UML** (clases, secuencia, casos de uso) y ejecutar la programación de interfaces y bases de datos. 
- **Responsable de Desarrollo (Nicol):** Co-responsable de la etapa 4 (Implementación). Además de definir la estructura de roles y la metodología del equipo, lidera la **codificación pura** en Java y la configuración técnica de MariaDB en XAMPP.  
- **Ingeniería de Pruebas (Danna):** Responsable de la etapa 5. Su función es validar la integridad del sistema intentando encontrar fallas o errores de lógica, asegurando que los 36 requisitos funcionales se cumplan estrictamente antes de la entrega final. 

**2. Especificación Formal de Requerimientos**

Esta sección detalla las acciones específicas que el sistema debe ejecutar, organizadas por el flujo de datos: Captura, Proceso y Almacenamiento.

**Captura y Validación de Datos** 

- **RF-01:** Capturar lecturas de humedad del suelo desde archivo CSV simulado. 
- **RF-02:** Capturar lecturas de temperatura ambiental desde archivo CSV simulado. 
- **RF-03:** Validar que la humedad del suelo esté entre 0% y 100% antes del procesamiento.  
- **RF-04:** Validar que la temperatura ambiental esté entre -10°C y 50°C antes del procesamiento.  
- **RF-05:** Permitir el ingreso manual de lecturas mediante formulario estructurado ante fallas de simulación.  
- **RF-06:** El sistema debe mostrar un asterisco rojo (\*) en las etiquetas de todos los campos obligatorios en los formularios. 
- **RF-07:** Impedir el ingreso de letras o caracteres especiales en los campos de captura manual de humedad y temperatura. 
- **RF-08:** Marcar automáticamente como "inválida" cualquier lectura fuera de los rangos físicos establecidos. 
- **RF-09:** Notificar al Operador con alerta visual inmediata cuando se detecten datos inválidos.  
- **RF-10:** Incluir un botón de "Limpiar campos" en todos los formularios para borrar la información con un solo clic. 

**Gestión y Almacenamiento** 

- **RF-11:** Asociar cada lectura capturada a una parcela específica registrada en el sistema.  
- **RF-12:** Registrar timestamp automático en cada captura para garantizar trazabilidad completa.  
- **RF-13:** Verificar en la base de datos que no existan dos parcelas registradas exactamente con el mismo nombre. 
- **RF-14:** Consultar los datos de evapotranspiración de referencia (ET₀) conectándose a la API meteorológica.  
- **RF-15:** Almacenar en base de datos las lecturas crudas para conformar el historial operativo.  
- **RF-16:** Consultar lecturas históricas por parcela y rango de fechas. 
- **RF-17:** Realizar respaldo automático de la base de datos al finalizar cada sesión de trabajo.  

**Gestión y Almacenamiento** 

- **RF-11:** Asociar cada lectura capturada a una parcela específica registrada en el sistema.  
- **RF-12:** Registrar timestamp automático en cada captura para garantizar trazabilidad completa.  
- **RF-13:** Verificar en la base de datos que no existan dos parcelas registradas exactamente con el mismo nombre. 
- **RF-14:** Consultar los datos de evapotranspiración de referencia (ET₀) conectándose a la API meteorológica.  
- **RF-15:** Almacenar en base de datos las lecturas crudas para conformar el historial operativo.  
- **RF-16:** Consultar lecturas históricas por parcela y rango de fechas. 
- **RF-17:** Realizar respaldo automático de la base de datos al finalizar cada sesión de trabajo.  

**Lógica de Ingeniería y Cálculo** 

18. **RF-18.** Calcular la evapotranspiración del cultivo (ET\_c) usando la fórmula FAO- 56: ET\_c = K\_c × ET₀.**  
18. **RF-19.** Ejecutar el balance hídrico del suelo: H\_final = H\_inicial + P + R - ET\_c - D.**  
18. **RF-20.** Generar recomendación "APLICAR\_RIEGO" automáticamente si H\_final < umbral\_mínimo.**  
18. **RF-21.** Generar recomendación "DETENER\_RIEGO" automáticamente si H\_final > umbral\_máximo.   
22. **RF-22.** Generar recomendación "MANTENER" si H\_final se encuentra dentro del rango óptimo.**  
22. **RF-23.** Calcular volumen de riego sugerido mediante: V = (umbral\_mínimo - H\_final) 

    × Área × Factor.**  

**Operación y Recomendaciones**

- **RF-24:** Registrar cada recomendación generada en base de datos con estado inicial "PENDIENTE".  
- **RF-25:** Actualizar estado de recomendación a "EJECUTADA" tras confirmación explícita del Operador.  
- **RF-26:** Actualizar estado a "RECHAZADA" si el Supervisor invalida la recomendación.  
- **RF-27:** Mostrar historial de recomendaciones con fecha, parcela y estado. 
- **RF-28:** Mostrar monitoreo general con semáforo de estado hídrico por parcela (Verde=Óptimo, Amarillo=Alerta, Rojo=Déficit).  
- **RF-29:** Visualizar recomendación activa con volumen exacto, acción sugerida y nivel de urgencia.  
- **RF-30:** Permitir confirmar o posponer recomendación de riego con un solo clic. 
- **RF-31:** Permitir creación de nueva parcela con ID único, área y cultivo predeterminado.  
- **RF-32:** Exportar historial de recomendaciones a archivo CSV. **Seguridad y Control de Acceso** 
- **RF-33:** Autenticar usuarios con nombre de usuario y contraseña antes de permitir acceso.  
- **RF-34:** Asignar rol "Operador" o "Supervisor" a cada usuario registrado. 
- **RF-35:** Bloquear funciones de configuración (umbrales, parcelas) si el rol es Operador.  
- **RF-36:** Cerrar sesión automáticamente tras 30 minutos de inactividad.

**2. Requisitos No Funcionales (RNF)** 

Atributos de calidad y restricciones técnicas del sistema. 

- **RNF-01:** Mantener separación estricta de capas: Interfaz, Lógica de Negocio y Persistencia.  
- **RNF-02:** Implementar validación de datos de entrada tanto en cliente como en capa lógica.  
- **RNF-03:** Establecer tiempo de espera (timeout) de 5 segundos para las consultas a la API meteorológica.  
- **RNF-04:** Los cálculos de litros de agua deben mostrarse con una precisión de 2 decimales (ej. 10.45 L).  
- **RNF-05:** El sistema debe incluir un manual de usuario básico (1-2 páginas) con instrucciones de uso. 

**Actores Externos**  

**Sensores IoT de campo (simulados) – Tipo:** Sensores/Hardware. Proporcionan lecturas en tiempo real de humedad del suelo, temperatura ambiental y humedad relativa para alimentar los modelos de cálculo del sistema. 

**API de servicios meteorológicos – Tipo:** Software externo (Web API). Consulta datos de evapotranspiración de referencia (ET₀), pronóstico de lluvia y radiación solar para ajustar el modelo predictivo con condiciones climáticas reales. 

**Base de datos relacional (SQLite/MySQL) – Tipo**: Base de datos. Almacena de forma persistente lecturas de sensores, configuraciones de parcelas, histórico de decisiones, usuarios y bitácora de auditoría. 

**Sistema de archivos local – Tipo:** Archivos / Sistema operativo. Permite exportar reportes técnicos en formato CSV, así como guardar logs de ejecución para auditoría y trazabilidad.

**Boceto de Interfaz (Monitoreo de Parcelas)** 

La interfaz del Operador permite visualizar el estado actual y tomar acciones rápidas sobre el riego.  

![](Aspose.Words.0975946e-eb87-48e1-b9db-1bd3496e4aa8.001.jpeg)

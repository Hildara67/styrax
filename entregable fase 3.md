**DISEÑO DE SOFTWARE** 

**1. Diagramación** 

1. **Fundamento y Alineación con Fases Previas** 

Con los Requisitos Funcionales y No Funcionales congelados (Fase 1) y la Arquitectura de 3 Capas aprobada  (Fase  2),  esta  etapa  traduce  los  contratos  técnicos  en  un  plano  de  implementación ejecutable. El objetivo es definir internamente la estructura de módulos, el modelo de datos, la comunicación estricta entre capas y los estándares de interfaz y codificación, garantizando que los desarrolladores  sepan  exactamente  qué  codificar  y  cómo  se  conectan  los  componentes, minimizando el riesgo de reescrituras masivas durante la fase de Implementación. 

Trazabilidad explícita: Cada decisión de diseño se deriva directamente de los RFs congelados, las notas y el diagrama arquitectónico. No se introducen nuevos requisitos ni se modifican los existentes. 

2. **Entregable Principal: Diseño UML** 

El  diseño  UML  materializa  la  arquitectura  y  los  requisitos  en  representaciones  visuales estandarizadas. Se documentan los tres diagramas solicitados, renderizados y validados antes del congelamiento. 

1. **Diagrama de Casos de Uso** 

Propósito: Delimitar el alcance funcional del sistema y asignar responsabilidades por rol, alineándose a los 10+10 funcionalidades congeladas. 

Muestra las funcionalidades y usos que cada usuario tendrá sobre el sistema de recaudación de patentes. 

Actores:  Operador Agrícola,  Supervisor Técnico,  Sensores  CSV, API  Meteorológica  (simulada). Trazabilidad: Cada burbuja representa un grupo de RFs (ej: Capturar/Sincronizar lecturas cubre RF- 01, RF-02, RF-05, RF-07, RF-08). 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.001.jpeg)

***Figura 1.** Caso de uso de Sistema inteligente de riego*

El diagrama de casos de uso delimita el alcance del sistema. Se distinguen dos actores humanos (Operador y Supervisor) según los niveles de acceso definidos en la Fase 1. La interacción con los Actores Externos se modela explícitamente:  

1. Sensores IoT (CSV): Actúa como fuente de datos de entrada para la sincronización (UC1). 
1. API Meteorológica: Provee la ET₀ necesaria para el cálculo (UC2).  
1. MariaDB: Persistencia relacional que soporta la configuración y auditoría (UC4).  
1. Sistema de Archivos: Destino de la exportación de reportes CSV (UC6).  

Esto valida que el diseño contempla tanto la interacción usuario-sistema como la integración técnica definida en las notas. 

2. **Diagrama de Secuencia por cada caso de uso** 

Propósito: Modelar la interacción temporal entre capas y actores externos para el flujo que integra el motor FAO-56, validaciones y persistencia. 

Se  generaron  diagramas  de  secuencia  para  los  6  flujos  críticos  del  sistema.  Cada  diagrama demuestra: 

- La interacción estricta entre las 3 capas arquitectónicas (UI → Core → Persistencia) 
- El uso de DTOs para transferencia de datos (RNF-01) 
- El cumplimiento de requisitos no funcionales (timeout 5s, timestamps automáticos, precisión decimal) 

Rutas cubiertas: UI → Core (DTO) → CSV/API → Cálculo → DB → UI. 

Validación de Arquitectura: Demuestra que la UI nunca contacta directamente a MariaDB ni a actores externos, cumpliendo NF-10 y RNF-01. 

1. **Caso de uso “Consulta Recomendación”** 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.002.jpeg)

***Figura 2.** Diagrama de secuencia que modela "Consultar Recomendación"*

El diagrama de secuencia modela el flujo crítico de 'Consultar Recomendación', demostrando la interacción temporal entre las tres capas arquitectónicas. Se observa estrictamente que:  

1. La UI nunca accede directamente a MariaDB. 
1. Los datos fluyen mediante DTOs (LecturaDTO) 
1. El timeout de 5 segundos se aplica en el Adaptador de API (RNF-03) 
1. El timestamp se genera internamente en la capa de persistencia (RF-12).  

El flujo valida RF-01, RF-10, RF-14, RF-18, RF-20 y RF-24. 

2. **Caso de uso “Capturar/Sincronizar Lecturas”** 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.003.jpeg)

***Figura 3.** Diagrama de secuencia que modela "Capturar/Sincronizar lecturas"* 

El diagrama representa el proceso de captura manual y sincronización desde CSV. Demuestra la validación en tiempo real (RF-07) donde: 

1. El Validador de Datos rechaza caracteres no numéricos antes del procesamiento. 
1. Si los datos son inválidos, se muestra un tooltip rojo inmediato (RF-09) y el botón permanece deshabilitado (RF-06).  
1. Cuando los datos son válidos, el Gestor de Acceso a Datos (DAO) persiste la lectura con timestamp automático (RF-12).  
1. La sincronización masiva desde CSV sigue el mismo patrón de validación y almacenamiento.

Cumple RF-01, RF-02, RF-03, RF-04, RF-05, RF-07, RF-08 y RF-12. 

3. **Caso de uso “Validar Decisiones”** 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.004.jpeg)

***Figura 4**. Diagrama de secuencia que modela "Validar decisiones"*

El diagrama ilustra el flujo de validación experta del Supervisor Técnico. El sistema consulta todas las recomendaciones con estado 'PENDIENTE' desde MariaDB y las presenta para revisión. El Supervisor compara contra su criterio experto y decide aprobar o rechazar. La decisión actualiza el estado a 'EJECUTADA' o 'RECHAZADA' mediante el DAO, manteniendo la trazabilidad del usuario aprobador  (RF-12).  Este  flujo  garantiza  que  ninguna  recomendación  se  ejecute  sin  validación humana cuando el rol es Supervisor.  

Cumple RF-25, RF-26, RF-27 y RF-35. 

4. **Caso de uso “Configurar Umbrales”** 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.005.jpeg)

***Figura 5.** Diagrama de secuencia que modela "Configurar umbrales"* 

El diagrama muestra el proceso de configuración de parámetros del modelo por parte del Supervisor.  El sistema valida que el umbral mínimo sea estrictamente menor al máximo (consistencia de reglas). Si la validación falla, se notifica el error inmediatamente.  

Cuando los parámetros son válidos, se persisten en la tabla config\_sistema junto con el coeficiente Kc actual y el usuario responsable (trazabilidad RF-12). La visibilidad de esta función está restringida exclusivamente al rol Supervisor (RF-35).  

Cumple RF-20, RF-21, RF-22, RF-35 y RNF-01." 

5. **Caso de uso “Exportar Historial”** 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.006.jpeg)

***Figura 6.** Diagrama de secuencia que modela "Exportar historial"* 

El diagrama representa el flujo de exportación de datos operativos.  

1. El Operador selecciona un rango de fechas y/o parcela específica.  
1. El sistema consulta el historial completo desde MariaDB aplicando los filtros solicitados.  
1. Los datos se formatean en estructura CSV con codificación UTF-8 para garantizar que los nombres de parcelas con acentos o 'ñ' se lean correctamente en Excel (RF-32).  
1. El archivo se genera en el sistema de archivos local con timestamp de exportación.  

Este proceso no modifica la base de datos, solo lectura y escritura de archivos.  

Cumple RF-16, RF-32 y RNF-04 

**1.2.2.5 Caso de uso “Confirmar/Posponer riego”**

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.007.jpeg)

***Figura 7.** Diagrama de secuencia que modela "Confirmar/Posponer riego"*

El diagrama modela la interacción del Operador con las recomendaciones activas.  

1. Al  seleccionar  una  recomendación  pendiente,  el  sistema  muestra  el  volumen  exacto calculado (con precisión de 2 decimales, RNF-04) y la acción sugerida.  
1. El Operador puede confirmar (cambiando estado a 'EJECUTADA') o posponer (manteniendo 'PENDIENTE').  
1. La actualización se realiza mediante el DAO con timestamp automático de ejecución (RF-

   12).  

Este flujo permite al Operador tener control final sobre el riego antes de su aplicación física en campo.  Cumple RF-25, RF-30, RF-42, RF-43 y RNF-04. 

3. **Diagrama de Clases (DTOs + 3 Capas)** 

Propósito: Definir la estructura estática del sistema, paquetes por capa, DTOs y relaciones de integridad. 

Estructura: 

- Capa UI: Vistas con lógica de presentación mínima. 
- DTOs: Objetos inmutables que cruzan capas sin exponer estructuras de BD. 
- Capa Core: MotorFAO56, GestorDecisiones, ValidadorCampos. 
- Capa Persistencia: DAO específicos + AdaptadorCSV/AdaptadorAPI.

Trazabilidad: Las relaciones (--->, ..>) reflejan las dependencias permitidas por la arquitectura congelada.

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.008.jpeg)

***Figura 8.** Diagrama de clases*

El diagrama de clases materializa la arquitectura de 3 capas definida en la Fase 2, utilizando nombres oficiales de módulos. Se observa el uso estricto de DTOs (LecturaDTO, RecomendacionDTO) como protocolo  de  comunicación  entre  capas,  garantizando  que  la  Capa  de  Interfaz  nunca  acceda directamente a MariaDB.  

La Capa de Persistencia e Integración contiene el Gestor de Acceso a Datos (DAO), Adaptador de API Externa y Sistema de archivos local, cumpliendo con RNF-01 (separación estricta de capas). Las  relaciones  unidireccionales  (-->)  reflejan  el  flujo  permitido:  UI  →  Core  →  Persistencia  → MariaDB. 

3. **Diagrama de Base de datos** 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.009.jpeg)

***Figura 9**. Diagrama de base de datos* 

**Nota de diseño:** ON DELETE SET NULL preserva el histórico si se elimina un usuario. Cumple RF-12 (trazabilidad) sin romper integridad. 

**1.3.1 Diccionario de datos**



|**Nombre del archivo:** sistema\_riego||||
| - | :- | :- | :- |
|**Descripción:** Base de datos que contiene la estructura completa del Sistema Inteligente de Control ||||
|de Riego||||
|**Campo** |**Tamaño** |**Tipo de Dato** |**Descripción** |



|||||
| :- | :- | :- | :- |
|***Id*** |- |INTEGER |Clave primaria autoincremental del usuario |
|***nombre*** |50 |VARCHAR |Nombre de usuario para autenticación (único) |
|***rol*** |- |ENUM |Perfil de acceso: 'OPERADOR' o 'SUPERVISOR' |
|***password\_hash*** |255 |VARCHAR |Contraseña encriptada (SHA-256/bcrypt) |
|***fecha\_creacion*** |- |TIMESTAMP |Fecha de alta del registro (automático) |
|||||
|***Id*** |- |INTEGER |Clave primaria autoincremental de parcela |
|***nombre*** |50 |VARCHAR |Nombre identificador de la parcela (único) |
|***area\_m2*** |10,2 |DECIMAL |Superficie en metros cuadrados |
|***cultivo*** |50 |VARCHAR |Tipo de cultivo (Maíz, Trigo, Soya, etc.) |
|***fecha\_registro*** |- |TIMESTAMP |Fecha de creación del registro (automático) |
|||||
|***Id*** |- |INTEGER |Clave primaria autoincremental de lectura |
|***parcela\_id*** |- |INTEGER |Clave foránea a parcelas (relación 1:N) |
|***humedad\_suelo*** |5,2 |DECIMAL |Porcentaje de humedad (0-100%) |
|***temperatura\_ambiente*** |5,2 |DECIMAL |Temperatura en °C (-10 a 50) |
|***origen*** |- |ENUM |Fuente: 'CSV' (simulado) o 'MANUAL' |
|***es\_valida*** |- |BOOLEAN |Indica si cumple rangos físicos (default: TRUE) |
|***usuario\_registro*** |- |INTEGER |Clave foránea a usuarios (auditoría) |
|***timestamp\_registro*** |- |TIMESTAMP |Fecha/hora automática de captura (RF-12) |
|||||
|***Id*** |- |INTEGER |Clave primaria autoincremental |
|***parcela\_id*** |- |INTEGER |Clave foránea a parcelas (relación 1:N) |
|***volumen\_sugerido\_L*** |8,2 |DECIMAL |Litros recomendados (2 decimales, RNF- 04) |
|***accion*** |- |ENUM |'APLICAR\_RIEGO', 'DETENER\_RIEGO', 'MANTENER' |
|***estado*** |- |ENUM |'PENDIENTE', 'EJECUTADA', 'RECHAZADA' |
|***usuario\_aprobador*** |- |INTEGER |Clave foránea a usuarios (Supervisor) |
|***timestamp\_generacion*** |- |TIMESTAMP |Fecha/hora automática (RF-12) |
|||||
|***Id*** |- |INTEGER |Clave primaria autoincremental |
|***parcela\_id*** |- |INTEGER |Clave foránea única a parcelas (1:1) |



|***umbral\_min*** |5,2 |DECIMAL |Límite inferior de humedad % (default: 40.00) |
| - | - | - | :- |
|***umbral\_max*** |5,2 |DECIMAL |Límite superior de humedad % (default: 80.00) |
|***kc\_actual*** |4,2 |DECIMAL |Coeficiente de cultivo FAO-56 (default: 1.00) |
|***usuario\_responsable*** |- |INTEGER |Clave foránea a usuarios (Supervisor) |

**Relaciones:** 

- lecturas\_sensores(parcela\_id) → parcelas(id)   (CASCADE) 
- lecturas\_sensores(usuario\_registro) → usuarios(id)  (SET NULL) 
- recomendaciones\_riego(parcela\_id) → parcelas(id)  (CASCADE) 
- recomendaciones\_riego(usuario\_aprobador) → usuarios(id)   (SET NULL) 
- config\_sistema(parcela\_id) → parcelas(id)  (CASCADE) 
- config\_sistema(usuario\_responsable) → usuarios(id)  (SET NULL) 

**Campos Clave:** 

- Primarias: id en todas las tablas 
- Foráneas: parcela\_id, usuario\_registro, usuario\_aprobador, usuario\_responsable 
- Únicas: nombre (usuarios, parcelas), parcela\_id (config\_sistema) 
4. **Trazabilidad con Requisitos** 



|**Elemento de Diseño** |**Requisitos Cumplidos** |**Justificación** |
| - | - | - |
|**Diagrama de Casos de Uso** |RF-01 a RF-36 |Define el alcance funcional total del sistema, identificando las interacciones entre los actores (Operador/Supervisor) y los procesos automatizados. |
|**Diagrama de Secuencia** |RF-01, RF-10, RF-14, RF-18, RF-20, RF-24 |Modela el flujo de mensajes en tiempo real, integrando el timeout de 5s (RNF-03) y la generación de timestamps automáticos (RF-12). |
|**Diagrama de Clases con DTOs** |RNF-01, RNF- 02 |Implementa la arquitectura por capas, asegurando que la Capa UI se comunique mediante objetos de transferencia sin acceso directo a la base de datos. |
|**Tabla lecturas\_sensores** |RF-08, RF-12, RF-15 |Estructura el almacenamiento del historial de humedad y temperatura, vinculando cada registro a un usuario y momento específico para trazabilidad. |
|**Tabla recomendaciones\_riego** |RF-24, RF-25, RF-26, RF-27 |Permite la gestión del ciclo de vida del riego (PENDIENTE/EJECUTADA/RECHAZADA), cumpliendo con los requerimientos de auditoría. |
|**Tabla config\_sistema** |RF-20, RF-21, RF-22 |Centraliza los parámetros críticos de cálculo, como los coeficientes de cultivo (Kc) y umbrales para el algoritmo FAO-56. |
|**Restricción ON DELETE SET NULL** |RF-12 |Mecanismo de integridad referencial que evita la pérdida de registros históricos de auditoría en caso de baja de personal en el sistema. |
|**Tipo DECIMAL(8,2) (Volumen)** |RNF-04 |Asegura la precisión matemática necesaria en el cálculo de litros de agua, evitando errores de redondeo en el riego. |
|**Codificación UTF-8** |RF-32 |Garantiza que la exportación de archivos CSV mantenga la integridad de caracteres especiales (acentos y ñ) requeridos en la región. |

5. **Pantallas** 

La interfaz del sistema ha sido diseñada siguiendo estrictamente las reglas de usabilidad y validación definidas en las notas. A continuación, se presentan los wireframes de las 10 pantallas obligatorias (5 para Operador, 5 para Supervisor). 

Los diseños cumplen con los siguientes atributos de calidad: 

- Protocolo Estricto (RNF-01): La interfaz visual solo interactúa con objetos DTO; nunca manipula directamente la estructura de la base de datos. 
- Control de Roles (RF-35): Se observa visualmente que las pantallas del Supervisor (Gestión de Usuarios, Configuración) poseen permisos elevados que no están disponibles en el menú del Operador. 
- Validación en Tiempo Real (RF-07, RF-09): Los formularios de entrada (Pantallas 03 y 06) incluyen asteriscos rojos de obligatoriedad y máscaras de entrada numérica para prevenir errores de captura. 
- Trazabilidad (RF-12): Todos los reportes y bitácoras incluyen campos de timestamp generados automáticamente por el sistema, visibles al final de las pantallas de auditoría. 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.010.jpeg)

***Figura 10.** Pantalla 01 Login de Acceso.* 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.011.jpeg)

***Figura 11**. Pantalla 02 Monitoreo General.* 

**Nota:** El campo "Humedad Relativa" se muestra en las pantallas como un dato informativo extraído del archivo CSV de simulación. Dicho campo no se persiste en la tabla lecturas\_sensores de MariaDB, manteniendo así la integridad del diccionario de datos congelado en la Fase 3. 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.012.jpeg)

***Figura 12.** Pantalla 03 Captura de Datos.* 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.013.jpeg)

***Figura 13.** Pantalla 04 Panel de Recomendaciones.* 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.014.jpeg)

***Figura 14.** Pantalla 05 Historial Operativo.* 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.015.jpeg)

***Figura 15.** Pantalla 06 Panel de Control de Parcelas.* 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.016.jpeg)

***Figura 16.** Pantalla 06 Panel de Control de Parcelas (Modal)* 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.017.jpeg)

***Figura 17.** Pantalla 07 Configuración de Sistema.* 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.018.jpeg)

***Figura 18.** Pantalla 08 Validación y Auditoría.* 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.019.jpeg)

***Figura 19.** Pantalla 09 Reportes Técnicos.* 

![](Aspose.Words.de3c7028-9ce0-4d8c-9fc8-7287070d2ead.020.jpeg)

***Figura 20.** Pantalla 10 **Gestión de Usuarios.*** 

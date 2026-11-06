# AGENTS.md — Proyecto Au Ido Viajes

Estas instrucciones se aplican al trabajo en `viajes/`. Para cambios en archivos compartidos o de otras aplicaciones, consulta también las instrucciones de sus respectivos ámbitos. Las funciones descritas son objetivos o referencias; verifica su estado en el código antes de afirmarlas.

## 1. Identidad del proyecto

**Nombre:** Au Ido Viajes

**Finalidad:** Aplicación web para organizar, consultar, documentar y compartir viajes, rutas y experiencias personales.

Forma parte del ecosistema Au Ido, junto con las herramientas de gestión de gastos y planificación de vacaciones.

El objetivo es disponer de un entorno sencillo y centralizado para gestionar los viajes.

## 2. Entorno tecnológico

Repositorio GitHub conocido:

`instalberto-gif/au-ido-gastos`

Publicación web:

`https://instalberto-gif.github.io/au-ido-gastos/`

Secciones conocidas:

- `/viajes/` — Gestión de viajes.
- `/vacaciones/` — Planificación de vacaciones.
- Portal principal — Acceso a las aplicaciones.

Servicios utilizados:

- GitHub para el control de versiones.
- GitHub Pages para la publicación.
- Supabase para autenticación y almacenamiento de datos.

Antes de realizar modificaciones, inspecciona la implementación actual. No presupongas frameworks, librerías, tablas o rutas que no estén confirmadas en el código.

## 3. Objetivos funcionales

La aplicación debe permitir, según las funcionalidades existentes y las ampliaciones autorizadas:

- Crear, consultar, editar y organizar viajes.
- Registrar fechas, destinos, descripciones y fotografías.
- Incorporar notas y recuerdos de cada viaje.
- Asociar rutas y mapas.
- Relacionar viajes con gastos y vacaciones.
- Consultar la información desde diferentes dispositivos.
- Compartir viajes con usuarios autorizados.

No implementes funcionalidades nuevas únicamente porque aparezcan descritas como objetivos. Distingue entre lo existente y lo pendiente.

## 4. Gestión de usuarios y permisos

La privacidad es un requisito prioritario.

Reglas funcionales:

1. Los viajes serán privados por defecto.
2. El propietario podrá editar sus propios viajes.
3. El propietario podrá seleccionar qué usuarios tienen permiso para visualizar cada viaje.
4. Los participantes autorizados podrán consultar los viajes compartidos.
5. No se permitirá modificar viajes ajenos sin autorización expresa.
6. Los controles de acceso deben aplicarse en la base de datos, no únicamente en la interfaz.

Respeta las políticas de seguridad existentes de Supabase, especialmente Row Level Security (RLS).

No alteres políticas, roles ni permisos sin comprobar previamente su funcionamiento.

## 5. Organización de los viajes

La ficha de un viaje tendrá como estructura funcional de referencia:

- Resumen.
- Mapa.
- Gastos.
- Vacaciones.
- Notas.

Conserva las pestañas existentes y su navegación.

Mantén las relaciones entre los viajes y los registros de gastos o vacaciones.

Las cuentas de gastos deben vincularse a un viaje existente, respetando el modelo de datos actual.

Los permisos de edición compartida de gastos y vacaciones deben conservarse según las políticas específicas implementadas.

## 6. Mapas y rutas

La aplicación debe admitir la utilización de mapas de viaje.

Integraciones previstas o existentes:

- Google My Maps.
- Archivos GPX.
- Enlaces a mapas externos.

Mantén la posibilidad de utilizar Google My Maps cuando esté implementada.

No sustituyas una integración existente por otra sin autorización.

Ten en cuenta que los permisos de Google My Maps son independientes de los permisos de Au Ido Viajes.

Las futuras mejoras podrán incluir mapas interactivos, puntos de interés, recorridos y diarios de ruta.

## 7. Diseño e interfaz

Mantén la identidad visual del ecosistema Au Ido.

Criterios:

- Respetar los colores y estilos existentes.
- Mantener coherencia con Au Ido Gastos.
- Utilizar el logotipo y los elementos gráficos actuales.
- Evitar cambios estéticos innecesarios.
- Priorizar la navegación intuitiva.
- Garantizar una buena experiencia desde dispositivos móviles.
- Mantener una presentación clara de fichas, mapas, fechas y fotografías.

Cualquier rediseño importante necesitará autorización.

## 8. Integración entre aplicaciones

Au Ido Viajes forma parte de un conjunto de aplicaciones relacionadas.

Conserva:

- La integración con Au Ido Gastos.
- La relación con la planificación de vacaciones.
- El sistema de acceso compartido entre aplicaciones.
- La navegación hacia el portal principal.
- La consistencia de los datos almacenados en Supabase.

Antes de modificar elementos comunes, comprueba las consecuencias sobre el resto del ecosistema.

## 9. Datos y seguridad

- No elimines viajes ni registros existentes sin autorización.
- Protege las fotografías, notas y datos personales.
- No expongas claves privadas de Supabase.
- Mantén las políticas de acceso actuales.
- Evita operaciones destructivas sobre la base de datos.
- Para cambios relevantes de esquema, prepara una migración y una estrategia de recuperación.
- No publiques información privada en el repositorio.

## 10. Control de cambios y pruebas

Antes de publicar una modificación:

1. Comprueba que la aplicación carga correctamente.
2. Verifica la navegación.
3. Comprueba el acceso y la autenticación.
4. Revisa que los viajes existentes siguen mostrándose.
5. Verifica los permisos de visualización y edición cuando se vean afectados.
6. Comprueba la integración con gastos, vacaciones y mapas cuando corresponda.
7. Verifica el funcionamiento móvil.
8. Comunica las pruebas no realizadas.

No despliegues cambios en producción sin autorización expresa.

## 11. Desarrollo progresivo

El proyecto evolucionará por fases.

En cada intervención:

- Prioriza la funcionalidad solicitada.
- Conserva las características que ya funcionan.
- Evita introducir complejidad innecesaria.
- Identifica posibles mejoras sin implementarlas automáticamente.
- Documenta los cambios importantes.
- Mantén la compatibilidad con el resto de aplicaciones.

Las nuevas funcionalidades y reglas se incorporarán progresivamente a este documento cuando sean aprobadas.

**Principio fundamental:** mejorar Au Ido Viajes sin comprometer los datos, la privacidad ni el funcionamiento de las aplicaciones existentes.

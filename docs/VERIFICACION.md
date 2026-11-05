# Comprobación antes de dar por cerrado el acceso

Las pruebas automáticas usan peticiones simuladas. No sustituyen estas comprobaciones con las cuentas reales ni prueban las reglas activas de Supabase. Este cambio no modifica tablas, usuarios ni reglas de acceso.

## Configuración del administrador

En Supabase → Authentication → URL Configuration, comprobar que Site URL es:

`https://instalberto-gif.github.io/au-ido-gastos/`

Si se usa una lista de Redirect URLs, autorizar esa misma dirección exacta. No se necesita autorizar dominios ajenos ni comodines amplios. La recuperación pide volver a esa portada. Comprobar también la plantilla de recuperación y el envío de correo configurado en el proyecto. La aplicación no puede corregir límites del proveedor ni la entrega a spam.

## Prueba con dos miembros y una cuenta sin autorización

Usar perfiles de navegador separados. No compartir contraseñas ni copiarlas a archivos de pruebas.

| Caso | Resultado esperado |
| --- | --- |
| Alta con correo autorizado | Recibir la confirmación cuando esté habilitada; volver al portal e iniciar sesión. |
| Contraseña incorrecta | Mensaje comprensible; sin datos privados. |
| He olvidado mi contraseña | Pedir solo el correo; mensaje genérico, sin confirmar si existe una cuenta. |
| Abrir enlace del correo | El enlace desaparece de la barra; aparecen nueva contraseña y confirmación. |
| Guardar contraseña | Cerrar la sesión de recuperación y solicitar inicio con la nueva contraseña. |
| Enlace caducado o ya usado | Mostrar error y permitir solicitar otro. |
| Cuenta registrada, correo no autorizado | Denegar datos aunque haya sesión de autenticación. |
| Miembro A crea cuentas de gastos y vacaciones | Miembro B autorizado puede consultarlas y editarlas: comportamiento actual del grupo. |
| A crea un viaje privado | B no lo ve. |
| A comparte un viaje con B | B puede consultarlo y su mapa; no editar ni administrar permisos. |
| A retira el acceso a B | B deja de recibir el viaje al actualizar. |
| B intenta abrir enlace directo a un viaje no compartido | El servidor no devuelve el registro. |
| Cerrar sesión con varias pestañas abiertas | Desaparecer acceso y datos de las otras pestañas. Renovar tokens de la misma cuenta no debe recargarlas. |
| Dos dispositivos editan el calendario a la vez | El segundo recibe un conflicto y debe actualizar, sin sobrescribir al primero. |

## Copias y navegación

- Descargar la copia completa desde la portada y guardarla en una carpeta privada de OneDrive. No subirla al repositorio.
- Recuperar Gastos desde «Importar copia»: crea cuentas nuevas. Si una importación falla a mitad, revisar el contador antes de repetirla; no se promete una transacción de todo el archivo.
- Recuperar Vacaciones desde «Importar planificación»: revisar y confirmar la sustitución del calendario compartido. Exportar antes la versión actual.
- Recuperar Viajes desde «Recuperar copia»: crea viajes privados del usuario actual, conserva rutas y puntos, no recupera permisos ni sobrescribe viajes existentes. Repetir no duplica los mismos viajes de la copia. Fotografías locales no están incluidas porque no se sincronizan.
- Comprobar el aviso semanal de copia de la portada. Es un recordatorio al visitar la página, no una tarea automática ni una garantía de que el usuario guardó el archivo.
- Desde Viajes, abrir Gastos: si ya hay cuentas vinculadas, abrirlas; si no, revisar y guardar un formulario. Esas cuentas son accesibles para todo el grupo autorizado.
- Desde Viajes, abrir Vacaciones: revisar persona, fechas y estado antes de guardar. Si cruza de año, crear los tramos en cada año por separado.
- Probar el menú superior, formularios, desplazamiento y calendario en móvil y ordenador, navegación con teclado y PDF con días marcados.

## Mantenimiento

Recomendación: descargar una copia por semana de actividad y antes de importaciones o cambios importantes. Mantener al menos cuatro copias semanales. Las fechas del aviso se guardan por cuenta en cada navegador y no se sincronizan. Para una copia automática del servidor hace falta configurar una tarea y un destino privado con acceso administrativo; no se ha activado ni se han almacenado claves administrativas en GitHub.

# AU Ido · Vacaciones

Módulo independiente: no modifica archivos ni tablas de gastos.

## Activación pendiente

1. En el proyecto Supabase ya usado por AU Ido, abre SQL Editor.
2. Copia y ejecuta `vacaciones/setup.sql` una vez. Es repetible y conserva los registros; no cambia `au_ido_members` ni `au_ido_trips`.
3. Abre la subruta `/au-ido-gastos/vacaciones/` de GitHub Pages e inicia sesión con una cuenta autorizada en AU Ido.
4. Se crea el calendario compartido al guardar el primer cambio. Los perfiles son personas a planificar, no cuentas de acceso. Todos los miembros autorizados pueden editar todos los perfiles y años.

## Recuperar el plan anterior de Alberto

En Importar planificación selecciona el HTML anterior `Vacaciones_2027_Alberto.html`. Se recuperan los cuatro periodos iniciales de 2027 y sus festivos, con marzo como Solicitado. Se muestra una revisión antes de sustituir el calendario completo. El HTML contiene el plan inicial, no cambios que hubieras guardado en el almacenamiento de otro navegador. También admite las copias JSON del panel anterior, que no incluyen festivos, y las copias JSON del nuevo panel.

Los datos personales no se incrustan en este repositorio público. Se guardan tras iniciar sesión, protegidos por RLS. La aplicación usa solo los datos públicos de conexión del config.js existente. No publiques copias de planificación con datos personales en GitHub.

## Funciones

- Selector de año entre 2000 y 2100, sin copiar festivos de un año a otro.
- Personas con nombre editable y bolsa anual propia (22 días por defecto).
- Periodos editables: Propuesta, Solicitado o Aprobado; se pueden excluir del cómputo.
- Se descuentan fines de semana y festivos; un solapamiento de vacaciones no se cuenta dos veces.
- Comparación por personas incluyendo descansos inmediatamente contiguos.
- Festivos comunes por año: alta manual, eliminación o importación con revisión CSV/JSON/ICS. No admite recurrencias ICS ni eventos de varios días.
- CSV: cabecera `fecha;nombre`, fechas ISO o DD/MM/AAAA. JSON: array con `date` y `name`. Un archivo puede incluir varios años entre 2000 y 2100. La revisión agrupa los festivos por año y el guardado actualiza cada lista sin borrar vacaciones, bolsas ni otros festivos. El selector de año no limita la importación.
- Copias JSON de todos los años y personas. La importación de planificación reemplaza el calendario completo tras una revisión.
- Acceso desde dispositivos distintos con la misma cuenta o cuentas autorizadas. Pulsa Actualizar datos para recoger cambios hechos en otro dispositivo.
- Control de revisión ante edición simultánea: actualiza y repite tu cambio si otra persona ha guardado antes.

## Límites y verificación

El calendario común de festivos supone el mismo calendario laboral para todas las personas. No interpreta turnos, medias jornadas ni teletrabajo. Los cambios requieren Internet y un guardado confirmado; no hay guardado local silencioso. No se reserva ni se solicita ninguna vacación a empresas.

Comprobaciones de lógica realizadas: plan previo de 25 días, 8 solicitados de marzo, no duplicación de solapamientos, años bisiestos, importación CSV/JSON/ICS y distribución de festivos entre varios años, conservación de periodos y bolsas, reimportación sin duplicados y rechazo de fechas inválidas, y generación de 12 meses. Queda pendiente comprobar visualmente en navegador y probar las políticas con dos cuentas autorizadas y otra sin acceso después de activar SQL.


## Botón CAIB · Palma

El botón usa el año seleccionado. Intenta leer en directo la página anual española de CAIB. Exige una cabecera del año correcto, 12 festivos generales y 2 de una fila llamada exactamente Palma (no Palmanyola), 14 fechas distintas y una fuente HTTPS de CAIB. Si CORS o la publicación impiden la lectura directa, descarga una copia oficial verificada desde `vacaciones/data/caib-palma-AAAA.json` en la rama principal mediante raw.githubusercontent.com. La pantalla indica el origen y la fecha real de consulta. No se calculan fiestas, no se copian de otro año y no se importan conjuntos parciales.

Se incluyen copias verificadas de 2026 (página CAIB) y 2027 (BOIB oficial, resolución 9716, número 122 del 29/09/2026). Las copias se actualizan a diario a las 05:30 UTC mediante `.github/workflows/caib-festivos.yml`; también se puede ejecutar desde Actions → Actualizar festivos CAIB → Run workflow. La actualización automática añade o renueva las copias oficiales, pero no altera el calendario compartido: cada usuario debe pulsar el botón para incorporarlas. Comprueba la fecha mostrada antes de usarlas. Si Actions se desactiva, la última copia permanece con su fecha visible.

La sincronización requiere iniciar sesión y guardar con éxito en Supabase. Conserva vacaciones, bolsas, otros años y festivos manuales/importados. Solo sustituye los registros marcados `origin: CAIB`, para retirar una fecha oficial obsoleta sin borrar festivos propios. Una fecha manual que coincida con una oficial se actualiza con la información oficial. Los dos festivos locales aparecen como Local Palma; los nacionales/autonómicos aplicables como General Baleares.

`scripts/update_caib.py` usa la página anual oficial y, para 2027, el PDF BOIB exacto como alternativa. Si una fuente cambia o el año aún no está disponible, conserva la copia anterior y registra el fallo; nunca genera datos provisionales. Las pruebas están en `vacaciones/tests/test_caib.py`.

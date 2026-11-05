# AU Ido · Portal del grupo

Portal en `index.html`, con dos accesos principales: Viajes y Vacaciones. Los gastos se gestionan desde la ficha de cada viaje. Conexión y acceso se encuentra en el menú superior derecho. Una cuenta de Supabase para **Gastos**, **Vacaciones** y **Viajes**. El menú permite registrarse, entrar, cerrar sesión y recuperar la contraseña. Muestra el correo validado del usuario conectado. `store.js` gestiona la autenticación y renovación de sesión común para las tres aplicaciones.

- **Gastos:** `gastos/`. Todos los miembros autorizados pueden consultar y editar las cuentas del grupo.
- **Vacaciones:** `vacaciones/`. Calendario compartido; sus perfiles de personas no son cuentas de acceso. Todos los miembros autorizados pueden editarlo.
- **Viajes:** `viajes/`. El propietario edita y elige quién puede consultar cada viaje. Los viajes privados no se convierten en públicos al vincularlos; crear sus cuentas en Gastos sí comparte ese nombre y esas cuentas con todo el grupo, previa confirmación del formulario.

Desde un viaje se pueden abrir sus cuentas o preparar un periodo de vacaciones. Solo se guarda al confirmar el formulario. Los nombres y fechas se copian en ese momento: no hay sincronización automática de ediciones posteriores entre aplicaciones. Los viajes que cruzan de año necesitan tramos de vacaciones separados.

## Recuperación de contraseña

En la portada, introducir el correo y pulsar «He olvidado mi contraseña». El correo lleva a la portada, que valida la sesión temporal y permite guardar una contraseña de al menos diez caracteres. Después solicita entrar de nuevo. Los tokens del enlace se eliminan del historial antes de validar la sesión. La confirmación de alta también se procesa desde la portada. Mantener la Site URL de Supabase configurada como la dirección completa de esta portada; revisar envío de correo y plantillas.

## Copias y recuperación

La portada permite descargar una copia `au-ido-backup-v1` con los gastos del grupo, su calendario y los viajes propios del usuario actual. No incluye contraseñas, tokens, permisos ni viajes de otros propietarios. Guardar en privado. El aviso semanal se calcula al abrir la portada y se conserva por cuenta en ese navegador; no se han configurado descargas automáticas ni copias administrativas del servidor.

Cada aplicación admite recuperar su parte de esa copia completa. Gastos crea cuentas nuevas; Vacaciones sustituye el calendario tras revisar y confirmar; Viajes crea registros privados conservando rutas y puntos, sin duplicar viajes de la misma copia que ya estén presentes. Viajes también exporta su propia copia `au-ido-viajes-backup-v1`. Las fotografías del ordenador no están sincronizadas ni incluidas.

Consulta [la guía de verificación y mantenimiento](docs/VERIFICACION.md) para configurar las redirecciones, probar permisos con varias cuentas y comprobar la recuperación de copias. Las pruebas automáticas simulan el servidor y no certifican las reglas activas de Supabase.

## Gastos · Cuentas de viaje

App web para móvil y ordenador, basada en la tabla de Alberto. Reparte por parejas, no por personas. Código sin dependencias y preparado para GitHub Pages.

## Qué hace

- Varios viajes, parejas configurables y gastos con fecha, concepto, categoría, importe y pagador.
- Reparto igualitario entre las parejas seleccionadas en cada gasto, con ajuste exacto de céntimos.
- Gastos editables y eliminables, búsqueda y filtro por categoría.
- Saldos, propuestas de abono y registro de devoluciones parciales o completas.
- Exportación CSV compatible con Excel en español y copia JSON recuperable como un viaje nuevo.
- Modo local explícito para pruebas. Modo compartido con Supabase Auth y permisos en base de datos.
- En modo compartido se actualiza cada 30 segundos cuando no hay un formulario abierto. La revisión evita sobrescribir cambios de otra persona; ante conflicto, cierra el formulario, actualiza y vuelve a introducir el cambio.

## Ejemplo del Excel

El botón «Cargar ejemplo de tu Excel» crea este viaje solo en modo local:

| Viaje | Fecha | Concepto | Importe | Parejas | Pagado por |
| --- | --- | --- | ---: | --- | --- |
| 2026-07 · Puy de Fou | 27/07/2026 | vuelo mayo Iberia | 240,20 € | AyC y JAyMC | JAyMC |

Resultado: 120,10 € por pareja. AyC debe abonar 120,10 € a JAyMC. La fecha y el concepto se conservan tal como se facilitaron, sin corregirlos por otras referencias del viaje.

## Probar en tu ordenador

Con Node.js 22 o posterior, abre una terminal en esta carpeta y ejecuta:

```sh
node serve.mjs
```

Abre http://127.0.0.1:8794. No se necesita instalar paquetes. No abras index.html con doble clic: los módulos necesitan HTTP.

Sin configuración, los datos están solo en ese navegador. Una URL de GitHub Pages NO hace que el almacenamiento local se comparta. Exporta una copia JSON antes de cambiar de navegador o borrar sus datos.

## Activar el uso compartido

1. Crea un proyecto en https://supabase.com/dashboard. Revisa las condiciones y límites de tu plan antes de contratar.
2. Abre SQL Editor. Copia `schema.sql`, cambia `cambia-esto@ejemplo.com` por tu correo real y ejecútalo una vez. No desactives RLS.
3. Añade los correos de tus amigos con la instrucción comentada al final del SQL. Solo ellos podrán leer y modificar los datos. Todos los miembros autorizados tienen los mismos permisos de edición sobre todos los viajes.
4. En la configuración API del proyecto copia su URL y la clave **publishable** (o `anon` heredada). Ponlas en `config.js`. Son datos públicos de conexión: los permisos los aplica RLS. **Nunca uses claves secret ni service_role**, y nunca pongas contraseñas en GitHub.
5. En Authentication / URL Configuration establece Site URL como la URL completa de GitHub Pages (por ejemplo, `https://instalberto-gif.github.io/au-ido-gastos/`). Si mantienes otra URL de prueba, añádela a las redirecciones permitidas según necesites.
6. Mantén activada la confirmación de correo en el proveedor Email. Configura el envío de correo (SMTP) del proyecto para el uso real del grupo y revisa los límites del proveedor. No se incluye inicio con Google.
7. Publica el cambio de `config.js`. Cada amigo abre «Conexión y acceso», pulsa «Crear cuenta», confirma el correo y entra con su correo y contraseña. Haber creado una cuenta NO concede acceso sin estar también en `au_ido_members`.
8. Para una contraseña olvidada, usar «He olvidado mi contraseña» en el portal. El usuario recibe un enlace y elige una nueva contraseña en la propia portada. La entrega del correo depende de la configuración de Supabase.

Los viajes locales no se suben solos. Para transferir uno, descarga su copia JSON, activa el modo compartido y usa «Importar copia» en un viaje (crea primero un viaje vacío si no hay ninguno). Comprueba los importes después de importar. La importación crea una copia y nunca reemplaza el original.

Los tokens de sesión se guardan en el navegador. Cierra sesión en equipos compartidos. El código de los datos del viaje no se incluye en el repositorio público. No publiques copias JSON ni CSV con información personal en GitHub.

## Publicar en GitHub Pages

1. En tu cuenta de GitHub crea un repositorio llamado `au-ido-gastos`.
2. Sube el contenido de esta carpeta directamente a la raíz, sin la carpeta `dist` ni la carpeta `.openai` (esta última es exclusiva de la vista de prueba en ChatGPT).
3. En Settings → Pages, selecciona «Deploy from a branch», rama `main`, carpeta `/ (root)` y guarda.
4. Espera a que GitHub muestre el despliegue terminado. Con ese nombre, en la cuenta indicada por Alberto la URL esperada es `https://instalberto-gif.github.io/au-ido-gastos/`. No se considera publicada hasta que GitHub lo confirme.
5. Comparte ese enlace con tus amigos una vez configurado y probado el modo compartido.

No hay secretos ni contraseñas de administrador en el código. Un repositorio público puede contener la app, la URL y la clave publicable; los registros de gastos permanecen en Supabase y RLS exige pertenecer al grupo.

## Verificación

```sh
node --test tests/*.test.mjs
node build.mjs
```

Las pruebas cubren el ejemplo del Excel, céntimos, selección de participantes, abonos parciales y excesivos, entradas inválidas y conservación de saldos. La conexión real a Supabase requiere ejecutar el SQL y configurar el proyecto: antes de invitar al grupo, prueba dos cuentas autorizadas y una no autorizada, el alta de gastos, un abono y una edición simultánea.

## Archivos

`index.html` y `portal.js`: portada, acceso, ayuda y copia completa. `style.css` y `app.js`: interfaz de Gastos. `lib/accounts.mjs`: cálculo en céntimos. `store.js`: almacenamiento local o API compartida. `config.js`: conexión pública. `schema.sql`: tablas y permisos del grupo. `serve.mjs`: servidor de prueba local. `build.mjs`: prepara los ficheros estáticos. La app no importa XLSX directamente; el CSV es una exportación, y la importación admite las copias JSON de la propia app.

## Documentación oficial

- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://supabase.com/docs/guides/api/api-keys
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/passwords


## Cuentas de gastos vinculadas a Viajes

La creación de cuentas exige seleccionar un viaje existente y consultable por el usuario. La cuenta toma su nombre. Si no hay viajes disponibles, hay que crear uno en Viajes o solicitar acceso al propietario. Las importaciones también exigen elegir el viaje de cada cuenta. Los datos antiguos se conservan y pueden exportarse; antes de guardar cambios hay que vincularlos con el botón «Vincular viaje».

La aplicación comprueba el vínculo antes de guardar. Para que la misma regla sea obligatoria en el servidor, el administrador debe ejecutar una vez [`gastos-vincular-viajes.sql`](gastos-vincular-viajes.sql) en el SQL Editor del proyecto existente. No vuelve a ejecutar `schema.sql`. El script añade una clave foránea y un trigger, conserva las cuentas antiguas pendientes y evita borrar un viaje con cuentas vinculadas. No concede acceso a viajes privados. La edición compartida de Gastos se mantiene para el grupo aunque un miembro no pueda consultar el viaje privado asociado.

El script se prueba con las tablas y políticas reales del repositorio en una base PostgreSQL desechable de GitHub Actions. Esa prueba no ejecuta cambios en Supabase. Los archivos de `tests/sql/` son exclusivos de pruebas y no deben ejecutarse en producción.

## Ficha de viaje

Viajes muestra tarjetas con foto y título. Al abrir una tarjeta se accede a Resumen, Mapa, Gastos, Vacaciones y Notas, con un enlace protegido `viajes/?viaje=UUID`. El propietario puede editar la foto de portada, fechas, participantes, estado, notas y presupuesto. La foto se reduce en el navegador y se guarda con los datos protegidos del viaje; aparece también en sus copias. No se guardan los originales ni una galería de fotos.

Al crear o editar se consultan los periodos incluidos del calendario de vacaciones, con persona, fechas y estado. Seleccionar uno rellena las fechas y guarda su referencia; permite ajustarlas. No se modifican vacaciones ni se añaden participantes automáticamente. La ficha muestra la coincidencia por persona y avisa si sus fechas difieren del periodo de origen.

El coste se calcula con los gastos de las cuentas cuyo `data.travelId` coincide con el viaje. Los abonos entre parejas no suman coste. Las posibles copias se detectan por referencia de origen o movimientos idénticos y se excluyen por defecto del total; el propietario puede revisar las casillas de inclusión. Las preferencias se guardan en el viaje y no eliminan movimientos. El presupuesto usa céntimos y es opcional.

Los datos adicionales se guardan en el JSON existente: no se requieren tablas nuevas para la ficha. Los permisos de Viajes y Gastos se mantienen. Las cuentas antiguas siguen accesibles desde «Copias e importaciones → Vincular cuentas antiguas». Las cuentas abiertas desde una ficha se filtran a ese viaje y ofrecen un enlace de regreso.

## Participantes desde usuarios registrados

En Editar viaje se seleccionan cuentas registradas, con correo confirmado y autorizadas en AU Ido. El administrador debe activar una vez `viajes/participantes.sql` en el mismo proyecto Supabase. La aplicación usa funciones autenticadas con comprobación de pertenencia al grupo y de propietario; no necesita claves administrativas en el navegador. Hasta activarlo, la ficha explica que el directorio no está disponible y permite guardar otros campos sin cambiar permisos.

Guardar con participantes usa una única transacción: actualiza los datos y concede acceso de consulta a las cuentas seleccionadas. Desmarcar retira solo los permisos concedidos por participación; los accesos manuales de Compartir se conservan. Los nombres antiguos se muestran aparte y no se convierten en identidades. Pueden retirarse al guardar si el propietario lo decide. Importar o recuperar un viaje conserva los nombres como anteriores y no restaura permisos ni usuarios participantes vinculados.

La lista devuelve únicamente identificador, correo y nombre de los miembros registrados y confirmados. Usuarios ajenos y anónimos no pueden consultarla. Las pruebas SQL se ejecutan en una base desechable, no en el proyecto real de Supabase.

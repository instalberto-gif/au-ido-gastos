# AU Ido · Cuentas de viaje

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
8. Para una contraseña olvidada, el administrador puede iniciar el restablecimiento desde Authentication / Users del panel de Supabase. La app no incluye un formulario propio de recuperación.

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

`index.html`, `style.css`, `app.js`: interfaz. `lib/accounts.mjs`: cálculo en céntimos. `store.js`: almacenamiento local o API compartida. `config.js`: conexión pública. `schema.sql`: tablas y permisos del grupo. `serve.mjs`: servidor de prueba local. `build.mjs`: prepara los ficheros estáticos. La app no importa XLSX directamente; el CSV es una exportación, y la importación admite las copias JSON de la propia app.

## Documentación oficial

- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://supabase.com/docs/guides/api/api-keys
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/passwords

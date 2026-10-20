# BiblioTK-front-admin — App del rol `admin` (bibliotecario)

Parte del sistema BiblioTK (ver `../CLAUDE.md`). Gestión del material bibliográfico, de los préstamos y de los reportes para el rol `admin` — ojo, este rol **no** es el "admin" del sistema viejo (ese ahora es `superadmin`, ver `../BiblioTK-front-superadmin`); acá `admin` es el bibliotecario. React 19 + React Router 7 + Vite 8 + Tailwind CSS 4.

- **Arranque:** `npm run dev` → http://localhost:5174 (`VITE_PORT` si hay `.env.local`)
- **Librería de interfaz:** `bibliotk-ui` `^0.2.0` **de npm** (repo `UiBiblioTK`), con JS y CSS ya compilados. `CoverImage` viene de ahí.
- **CSS:** `src/app/styles/globals.css`, enlazado con `<link>` en `index.html` (no se importa desde `main.jsx`): fuentes + `bibliotk-ui/styles.css` + solo `theme` y `utilities` de Tailwind. Ver `../UiBiblioTK/CLAUDE.md`.
- **Íconos:** un import por ícono (`@phosphor-icons/react/Books`); ESLint prohíbe el paquete entero. `IconContext` sale de `@phosphor-icons/react/dist/lib/context`.
- **Carga:** `Home` va en el paquete inicial; Materiales, Préstamos, Reportes y Perfil se cargan con `React.lazy` y se precargan cuando el navegador queda libre. La sesión se pide al cargar `App.jsx`.
- **Acceso:** solo cuentas de bibliotecario, pero el front nunca ve el rol: `esSesionDeEstaApp` (`LoginService.js`) compara el origen del `destino` que devuelve `GET /Sesion` (sin caché) con el de esta app. Sin sesión o con una cuenta de otra app se reemplaza (`location.replace`) por la landing con `?motivo=sesion_expirada|sin_permiso` (URL armada con `new URL(ruta, VITE_LOGIN_APP_URL)`); cerrar sesión también usa `replace`. La sesión se vuelve a consultar cada vez que la página vuelve a mostrarse (bfcache con "atrás" o al volver a la pestaña) y la página se oculta al salir. Igual que en `BiblioTK-front-user`.
- **Backends:** InicioSesion (3001), Materiales (3003), Préstamos (3005) y Perfil (3002).

## Estructura

```
src/
  app/
    pages/
      App.jsx         # Rutas (secciones con React.lazy), guarda de sesión, PanelLayout (Resumen, Materiales, Préstamos, Reportes, Mi perfil)
      Home.jsx         # /HomeAdmin — Material bibliográfico, Préstamos, Mi perfil (un solo botón) y Reportes
      Materiales.jsx   # /materiales — tabla con miniaturas + alta/edición (con portada)/borrado
      Prestamos.jsx    # /prestamos — tabla de todos los préstamos (tabla reportes), filtros y "Marcar devuelto"
      Reportes.jsx     # /reportes — filtros (estado, fechas), resumen, vista previa y "Descargar PDF" (export con nombre: `Reportes`)
      Profile.jsx      # /perfil — "Editar mis datos" + "Eliminar mi cuenta" (copia de la del lector)
    styles/globals.css         # Hoja única (se enlaza desde index.html)
    dto/material.dto.js        # Arma el FormData (datos + portada)
    dto/updateProfile.dto.js
    utils/userValidation.js    # Reglas del perfil sin dependencias (el lector usa Zod)
  service/
    LoginService.js       # getCurrentSession, esSesionDeEstaApp, logoutUser → :3001
    NotificacionesService.js # conectarNotificaciones → :3006 (Socket.IO)
    MaterialesService.js   # listMateriales, getMaterial, createMaterial, updateMaterial, deleteMaterial → :3003
    PrestamosService.js    # listReportes, devolverPrestamo, downloadReportePdf → :3005
    ProfileService.js      # getProfile, updateProfile, deleteAccount → :3002
```

Variables opcionales (`.env.local`): `VITE_PORT`, `VITE_NOTIFICACIONES_URL`, `VITE_LOGIN_APP_URL`, `VITE_SESSION_URL`, `VITE_LOGOUT_URL`, `VITE_MATERIALES_URL`, `VITE_PRESTAMOS_URL`, `VITE_PROFILE_URL`.

## Préstamos y reportes

- **Préstamos** (botón del inicio): la tabla con todos los préstamos hechos, con los datos del lector y del material que guarda la tabla `reportes`. Filtros por estado (con contadores) y búsqueda sin tildes; "Marcar devuelto" abre un diálogo con observaciones opcionales y el material vuelve a estar disponible.
- **Reportes** (botón del inicio): exporta el PDF que genera `PrestamosBiblioTK` (`GET /Reportes/pdf`) con los filtros elegidos. Con rango de fechas inválido o sin resultados el botón queda deshabilitado.

## Material bibliográfico

El formulario se monta con `key` en cada apertura (sin efectos de reinicio). La sección **Portada** permite subir un archivo (JPG/PNG/WEBP, máx. 3 MB, vista previa con `FileReader`), pegar una URL (por ejemplo de Cloudinary) o quitarla; todo viaja en un solo `multipart/form-data`. Si el backend no pudo copiar la imagen a Cloudinary, la página muestra su `aviso`.

## Perfil

Mismo esquema que el lector: un solo botón "Editar perfil" en el inicio y, dentro de `/perfil`, editar datos o eliminar la cuenta. El backend solo deja eliminarla si queda otro bibliotecario.

## Notificaciones en tiempo real

- `src/service/NotificacionesService.js` abre el socket de `NotificacionesBiblioTK` (`/NotificacionesBiblioTK/socket.io`, solo WebSocket) con la cookie de sesión: el servidor decide qué recibe la cuenta, el front no conoce el rol. `VITE_NOTIFICACIONES_URL` (por defecto `http://localhost:3006`; vacía = mismo origen, detrás del gateway).
- `src/app/hooks/useNotificaciones.js` guarda el historial (20, el que manda el servidor al conectar), los avisos emergentes (máximo 3) y las no leídas (marca "leídas hasta" en `localStorage`, por navegador). Se conecta cuando la sesión ya se validó; si el servidor corta el socket (sesión cerrada en otra pestaña, cuenta borrada), revalida la sesión y vuelve a la landing.
- `App.jsx` pinta `NotificationCenter`: botón flotante abajo a la derecha con contador, panel con el historial y avisos arriba a la derecha.
- ⚠️ `src/app/components/NotificationCenter.jsx` y su `.css` son una **copia** de `bibliotk-ui` 0.4.0, que todavía no está publicada. Al publicarla: `npm install bibliotk-ui@^0.4.0`, importar `NotificationCenter` desde `"bibliotk-ui"` en `App.jsx`, borrar la copia y quitar su `@import` de `globals.css`.

## Pendientes conocidos

- No hay confirmación de contraseña al borrar un material (a diferencia de borrar una cuenta): ya lo protege `verificarRolAdmin` en el backend.
- `README.md` sigue siendo la plantilla por defecto de Vite.

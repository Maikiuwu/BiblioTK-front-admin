# BiblioTK-front-admin — App del rol `admin` (bibliotecario)

Parte del sistema BiblioTK (ver `../CLAUDE.md`). Gestión del material bibliográfico, de los préstamos y de los reportes para el rol `admin` — ojo, este rol **no** es el "admin" del sistema viejo (ese ahora es `superadmin`, ver `../BiblioTK-front-superadmin`); acá `admin` es el bibliotecario. React 19 + React Router 7 + Vite 8 + Tailwind CSS 4.

- **Arranque:** `npm run dev` → http://localhost:5174 (`VITE_PORT` si hay `.env.local`)
- **Librería de interfaz:** `bibliotk-ui` `^0.1.0` **de npm** (repo `UiBiblioTK`). En esta máquina `node_modules/bibliotk-ui` todavía es un enlace a `../BiblioTK-ui` de una instalación vieja; con `npm install` se reemplaza por la de npm. Usar solo lo que exporta npm (no `Select`, `Footer` ni `ErrorBoundary`).
- **Acceso:** solo rol `admin`. Sin sesión o con otro rol, redirige a la landing con `?motivo=sesion_expirada|sin_permiso` (URL armada con `new URL(ruta, VITE_LOGIN_APP_URL)`).
- **Backends:** InicioSesion (3001), Materiales (3003), Préstamos (3005) y Perfil (3002).

## Estructura

```
src/
  app/
    pages/
      App.jsx         # Rutas, guarda de rol "admin", PanelLayout (Resumen, Materiales, Préstamos, Reportes, Mi perfil)
      Home.jsx         # /HomeAdmin — Material bibliográfico, Préstamos, Mi perfil (un solo botón) y Reportes
      Materiales.jsx   # /materiales — tabla con miniaturas + alta/edición (con portada)/borrado
      Prestamos.jsx    # /prestamos — tabla de todos los préstamos (tabla reportes), filtros y "Marcar devuelto"
      Reportes.jsx     # /reportes — filtros (estado, fechas), resumen, vista previa y "Descargar PDF"
      Profile.jsx      # /perfil — "Editar mis datos" + "Eliminar mi cuenta" (copia de la del lector)
    components/CoverImage.jsx  # Portada con respaldo remota → local (copia igual en front-user y front)
    dto/material.dto.js        # Arma el FormData (datos + portada)
    dto/updateProfile.dto.js
    utils/userValidation.js    # Reglas del perfil sin dependencias (el lector usa Zod)
  service/
    LoginService.js       # getCurrentSession, logoutUser → :3001
    MaterialesService.js   # listMateriales, getMaterial, createMaterial, updateMaterial, deleteMaterial → :3003
    PrestamosService.js    # listReportes, devolverPrestamo, downloadReportePdf → :3005
    ProfileService.js      # getProfile, updateProfile, deleteAccount → :3002
```

Variables opcionales (`.env.local`): `VITE_PORT`, `VITE_LOGIN_APP_URL`, `VITE_SESSION_URL`, `VITE_LOGOUT_URL`, `VITE_MATERIALES_URL`, `VITE_PRESTAMOS_URL`, `VITE_PROFILE_URL`.

## Préstamos y reportes

- **Préstamos** (botón del inicio): la tabla con todos los préstamos hechos, con los datos del lector y del material que guarda la tabla `reportes`. Filtros por estado (con contadores) y búsqueda sin tildes; "Marcar devuelto" abre un diálogo con observaciones opcionales y el material vuelve a estar disponible.
- **Reportes** (botón del inicio): exporta el PDF que genera `PrestamosBiblioTK` (`GET /Reportes/pdf`) con los filtros elegidos. Con rango de fechas inválido o sin resultados el botón queda deshabilitado.

## Material bibliográfico

El formulario se monta con `key` en cada apertura (sin efectos de reinicio). La sección **Portada** permite subir un archivo (JPG/PNG/WEBP, máx. 3 MB, vista previa con `FileReader`), pegar una URL (por ejemplo de Cloudinary) o quitarla; todo viaja en un solo `multipart/form-data`. Si el backend no pudo copiar la imagen a Cloudinary, la página muestra su `aviso`.

## Perfil

Mismo esquema que el lector: un solo botón "Editar perfil" en el inicio y, dentro de `/perfil`, editar datos o eliminar la cuenta. El backend solo deja eliminarla si queda otro bibliotecario.

## Pendientes conocidos

- `CoverImage` y los ajustes de la cabecera (barra deslizable en pantallas angostas, en `globals.css`) deberían pasar a `UiBiblioTK`.
- No hay confirmación de contraseña al borrar un material (a diferencia de borrar una cuenta): ya lo protege `verificarRolAdmin` en el backend.
- `README.md` sigue siendo la plantilla por defecto de Vite.

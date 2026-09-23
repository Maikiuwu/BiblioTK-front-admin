# BiblioTK-front-admin — App del rol `admin` (bibliotecario)

Parte del sistema BiblioTK (ver `../CLAUDE.md`). Gestión del material bibliográfico para el rol `admin` — ojo, este rol **no** es el "admin" del sistema viejo (ese ahora es `superadmin`, ver `../BiblioTK-front-superadmin`); acá `admin` es el bibliotecario que administra el catálogo. React 19 + React Router 7 + Vite 8 + Tailwind CSS 4.

- **Arranque:** `npm run dev` → http://localhost:5174
- **Librería de interfaz:** `bibliotk-ui` (`file:../BiblioTK-ui`).
- **Acceso:** solo rol `admin`. Sin sesión o con otro rol, redirige a `${LOGIN_URL}/login?motivo=sesion_expirada|sin_permiso` (ver "Mensajes tras un redirect entre apps" en `BiblioTK-front/CLAUDE.md`).
- **Backend propio:** `MaterialesBiblioTK` (puerto 3004, nuevo) — ver su CLAUDE.md para los endpoints y la validación.

## Estructura

```
src/
  app/
    pages/
      App.jsx        # Rutas, guarda de rol "admin", PanelLayout
      Home.jsx        # /HomeAdmin — cuadro grande "Material bibliográfico" + Préstamos/Reportes
      Materiales.jsx  # /materiales — tabla + alta/edición/borrado, todo en un archivo
    dto/material.dto.js
  service/
    LoginService.js       # getCurrentSession, logoutUser → :3001
    MaterialesService.js   # listMateriales, getMaterial, createMaterial, updateMaterial, deleteMaterial → :3004
```

Sin tarjeta de perfil ni ruta `/perfil`: igual que el `admin` del sistema viejo, los roles de gestión no la tienen (solo `usuario`).

## `Materiales.jsx`

Un solo archivo con piezas locales (`MaterialFormDialog`, `DeleteMaterialDialog`, `MaterialRow`) — así lo pide la regla de `bibliotk-ui` para componentes de una sola página. El formulario usa el `Select` de `bibliotk-ui` (nuevo, agregado junto con esta app) para `tipoMaterial`. La validación del cliente es liviana; `MaterialesBiblioTK` (`validarMaterial`) es la que manda.

## Pendientes conocidos

- No hay confirmación de contraseña al borrar un material (a diferencia de borrar una cuenta): ya lo protege `verificarRolAdmin` en el backend.
- `README.md` sigue siendo la plantilla por defecto de Vite.

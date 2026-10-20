# Imagen de la app del bibliotecario. Etapa 1: compila con Vite. Las variables VITE_* quedan fijas en el
# código compilado, así que se pasan aquí: por defecto, detrás del gateway (rutas relativas,
# un solo origen) y con la subruta /bibliotecario/
FROM node:24-alpine AS compilacion

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_BASE=/bibliotecario/
ARG VITE_LOGIN_APP_URL=/
ARG VITE_SESSION_URL=/BiblioTK/Sesion
ARG VITE_LOGOUT_URL=/BiblioTK/Logout
ARG VITE_PROFILE_URL=/PerfilBiblioTK/Perfil
ARG VITE_MATERIALES_URL=/MaterialesBiblioTK/Materiales
ARG VITE_PRESTAMOS_URL=/PrestamosBiblioTK
ARG VITE_NOTIFICACIONES_URL=
ENV VITE_BASE=$VITE_BASE \
    VITE_LOGIN_APP_URL=$VITE_LOGIN_APP_URL \
    VITE_SESSION_URL=$VITE_SESSION_URL \
    VITE_LOGOUT_URL=$VITE_LOGOUT_URL \
    VITE_PROFILE_URL=$VITE_PROFILE_URL \
    VITE_MATERIALES_URL=$VITE_MATERIALES_URL \
    VITE_PRESTAMOS_URL=$VITE_PRESTAMOS_URL \
    VITE_NOTIFICACIONES_URL=$VITE_NOTIFICACIONES_URL
RUN npm run build

# Etapa 2: solo los archivos estáticos, servidos por nginx sin root
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilacion /app/dist /usr/share/nginx/html
EXPOSE 8080

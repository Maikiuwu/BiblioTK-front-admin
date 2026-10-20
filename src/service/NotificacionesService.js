import { io } from "socket.io-client";

// Sin variable: el servicio local. Con VITE_NOTIFICACIONES_URL vacía (detrás del gateway), el mismo origen
const notificacionesUrl =
	import.meta.env.VITE_NOTIFICACIONES_URL ?? "http://localhost:3006";
const rutaSocket = "/NotificacionesBiblioTK/socket.io";

// Abre el socket con la cookie de sesión (el servidor decide qué recibe esta cuenta) y devuelve
// la función para cerrarlo. Solo WebSocket, igual que el servidor
export function conectarNotificaciones({
	alCambiarEstado,
	alRecibirHistorial,
	alRecibir,
	alCortarlo,
}) {
	const socket = io(notificacionesUrl || undefined, {
		path: rutaSocket,
		transports: ["websocket"],
		withCredentials: true,
	});

	socket.on("connect", () => alCambiarEstado("connected"));
	socket.on("connect_error", () => alCambiarEstado("disconnected"));
	socket.io.on("reconnect_attempt", () => alCambiarEstado("connecting"));
	socket.on("disconnect", (motivo) => {
		alCambiarEstado("disconnected");
		// El servidor lo cortó: se cerró la sesión (en otra pestaña) o se borró la cuenta
		if (motivo === "io server disconnect") alCortarlo?.();
	});
	socket.on("historial", alRecibirHistorial);
	socket.on("notificacion", alRecibir);

	return () => socket.disconnect();
}

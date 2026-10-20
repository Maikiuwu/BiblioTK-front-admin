import { useCallback, useEffect, useState } from "react";
import { conectarNotificaciones } from "../../service/NotificacionesService.js";

const MAX_NOTIFICACIONES = 20;
const MAX_AVISOS = 3;
// Hasta cuándo están leídas (ISO). Por navegador: es solo una comodidad, no un dato de la cuenta
const CLAVE_LEIDAS = "bibliotk:notificaciones:leidas-hasta";

function leerMarca() {
	try {
		return localStorage.getItem(CLAVE_LEIDAS) ?? "";
	} catch {
		return "";
	}
}

function guardarMarca(fecha) {
	try {
		localStorage.setItem(CLAVE_LEIDAS, fecha);
	} catch {
		// Sin almacenamiento (modo privado): las no leídas solo duran lo que dure la página
	}
}

// Conecta las notificaciones mientras "activa" sea true. alCortarlo se llama si el servidor
// cierra el socket (sesión cerrada en otra pestaña o cuenta borrada)
export function useNotificaciones(activa, alCortarlo) {
	const [notificaciones, setNotificaciones] = useState([]);
	const [avisos, setAvisos] = useState([]);
	const [estado, setEstado] = useState("connecting");
	const [leidasHasta, setLeidasHasta] = useState(leerMarca);

	useEffect(() => {
		if (!activa) return;

		return conectarNotificaciones({
			alCambiarEstado: setEstado,
			alRecibirHistorial: (historial) => {
				setNotificaciones(historial);
				// La primera vez en este navegador, lo que ya había no cuenta como nuevo
				if (!leerMarca()) {
					const ahora = new Date().toISOString();
					guardarMarca(ahora);
					setLeidasHasta(ahora);
				}
			},
			alRecibir: (notificacion) => {
				setNotificaciones((lista) =>
					[
						notificacion,
						...lista.filter((n) => n.id !== notificacion.id),
					].slice(0, MAX_NOTIFICACIONES),
				);
				setAvisos((lista) => [...lista, notificacion].slice(-MAX_AVISOS));
			},
			alCortarlo,
		});
	}, [activa, alCortarlo]);

	const marcarLeidas = useCallback(() => {
		const ahora = new Date().toISOString();
		guardarMarca(ahora);
		setLeidasHasta(ahora);
	}, []);

	const descartarAviso = useCallback((id) => {
		setAvisos((lista) => lista.filter((aviso) => aviso.id !== id));
	}, []);

	return {
		notificaciones,
		avisos,
		estado,
		leidasHasta,
		sinLeer: notificaciones.filter((n) => n.fecha > leidasHasta).length,
		marcarLeidas,
		descartarAviso,
	};
}

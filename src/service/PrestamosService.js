const prestamosUrl =
	import.meta.env.VITE_PRESTAMOS_URL ??
	"http://localhost:3005/PrestamosBiblioTK";

const sesionTerminada = "Tu sesión terminó. Inicia sesión de nuevo para continuar.";

async function requestPrestamos(path, options, fallbackMessage) {
	let response;

	try {
		response = await fetch(`${prestamosUrl}${path}`, {
			credentials: "include",
			cache: "no-store",
			...options,
		});
	} catch {
		throw new Error("No se pudo conectar con el servicio de préstamos.");
	}

	const data = await response.json().catch(() => ({}));

	if (!response.ok) {
		const error = new Error(
			response.status === 401 ? sesionTerminada : (data.message ?? fallbackMessage),
		);
		error.status = response.status;
		error.field = data.campo;
		throw error;
	}

	return data;
}

// Filtros opcionales: { estado, desde, hasta, buscar }; los vacíos no viajan
function queryDe(filtros = {}) {
	const params = new URLSearchParams(
		Object.entries(filtros).filter(([, valor]) => Boolean(valor)),
	);
	const texto = params.toString();
	return texto ? `?${texto}` : "";
}

// Devuelve { reportes, resumen }: cada reporte trae los datos del usuario y del material
export async function listReportes(filtros) {
	return requestPrestamos(
		`/Reportes${queryDe(filtros)}`,
		{},
		"No se pudieron obtener los préstamos.",
	);
}

export async function devolverPrestamo(prestamoId, observaciones) {
	const data = await requestPrestamos(
		`/Prestamos/${prestamoId}/devolucion`,
		{
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ observaciones }),
		},
		"No se pudo registrar la devolución.",
	);
	return data.prestamo;
}

// Cancela el préstamo de cualquier usuario (ACTIVO o VENCIDO); el motivo es opcional
export async function cancelarPrestamo(prestamoId, motivo) {
	const data = await requestPrestamos(
		`/Prestamos/${prestamoId}/cancelacion`,
		{
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ motivo }),
		},
		"No se pudo cancelar el préstamo.",
	);
	return data.prestamo;
}

// Descarga el PDF que arma PrestamosBiblioTK con los mismos filtros de la tabla
export async function downloadReportePdf(filtros) {
	let response;

	try {
		response = await fetch(`${prestamosUrl}/Reportes/pdf${queryDe(filtros)}`, {
			credentials: "include",
			cache: "no-store",
		});
	} catch {
		throw new Error("No se pudo conectar con el servicio de préstamos.");
	}

	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		throw new Error(
			response.status === 401
				? sesionTerminada
				: (data.message ?? "No se pudo generar el reporte."),
		);
	}

	const archivo = await response.blob();
	const enlace = document.createElement("a");
	const hoy = new Date();
	const fecha = [
		hoy.getFullYear(),
		String(hoy.getMonth() + 1).padStart(2, "0"),
		String(hoy.getDate()).padStart(2, "0"),
	].join("-");

	enlace.href = URL.createObjectURL(archivo);
	enlace.download = `reporte-prestamos-${fecha}.pdf`;
	document.body.append(enlace);
	enlace.click();
	enlace.remove();
	// Se libera después: algunos navegadores todavía están leyendo el blob al volver del click
	setTimeout(() => URL.revokeObjectURL(enlace.href), 10000);
}

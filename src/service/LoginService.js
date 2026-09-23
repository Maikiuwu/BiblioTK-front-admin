const sessionUrl =
	import.meta.env.VITE_SESSION_URL ?? "http://localhost:3001/BiblioTK/Sesion";
const logoutUrl =
	import.meta.env.VITE_LOGOUT_URL ?? "http://localhost:3001/BiblioTK/Logout";

export async function getCurrentSession() {
	let response;

	try {
		response = await fetch(sessionUrl, {
			credentials: "include",
		});
	} catch {
		throw new Error("No se pudo conectar con el servicio de autenticación.");
	}

	if (!response.ok) {
		throw new Error("Sesión no válida o expirada.");
	}

	return await response.json();
}

export async function logoutUser() {
	let response;

	try {
		response = await fetch(logoutUrl, {
			method: "POST",
			credentials: "include",
		});
	} catch {
		throw new Error("No se pudo conectar con el servicio de autenticación.");
	}

	if (!response.ok) {
		throw new Error("No se pudo cerrar la sesión.");
	}
}

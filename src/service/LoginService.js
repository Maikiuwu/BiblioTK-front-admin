const sessionUrl =
	import.meta.env.VITE_SESSION_URL ?? "http://localhost:3001/BiblioTK/Sesion";
const logoutUrl =
	import.meta.env.VITE_LOGOUT_URL ?? "http://localhost:3001/BiblioTK/Logout";

export async function getCurrentSession() {
	let response;

	try {
		// Sin caché: al volver con "atrás", el navegador devolvía la respuesta de una sesión ya cerrada
		response = await fetch(sessionUrl, {
			credentials: "include",
			cache: "no-store",
		});
	} catch {
		throw new Error("No se pudo conectar con el servicio de autenticación.");
	}

	if (!response.ok) {
		throw new Error("Sesión no válida o expirada.");
	}

	return await response.json();
}

// La sesión no trae el rol: el servidor dice a qué app va la cuenta (destino) y basta con comparar orígenes
export function esSesionDeEstaApp(session) {
	try {
		return new URL(session?.destino).origin === window.location.origin;
	} catch {
		return false;
	}
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

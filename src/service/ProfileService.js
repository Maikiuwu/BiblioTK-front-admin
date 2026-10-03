const profileUrl =
	import.meta.env.VITE_PROFILE_URL ??
	"http://localhost:3002/PerfilBiblioTK/Perfil";

async function requestProfile(options, fallbackMessage) {
	let response;

	try {
		response = await fetch(profileUrl, {
			credentials: "include",
			cache: "no-store",
			...options,
		});
	} catch {
		throw new Error("No se pudo conectar con el servicio de perfil.");
	}

	const data = await response.json().catch(() => ({}));

	if (!response.ok) {
		const error = new Error(data.message ?? fallbackMessage);
		error.status = response.status;
		// Nombre del campo con problema, cuando el backend lo indica (400, 403 o 409)
		error.field = data.campo;
		throw error;
	}

	return data;
}

export async function getProfile() {
	const data = await requestProfile({}, "No se pudo obtener tu perfil.");
	return data.perfil;
}

export async function updateProfile(profileData) {
	const data = await requestProfile(
		{
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(profileData),
		},
		"No se pudieron guardar los cambios.",
	);
	return data.perfil;
}

export async function deleteAccount(password) {
	await requestProfile(
		{
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ contrasena: password }),
		},
		"No se pudo borrar tu cuenta.",
	);
}

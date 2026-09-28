const materialesUrl =
	import.meta.env.VITE_MATERIALES_URL ??
	"http://localhost:3003/MaterialesBiblioTK/Materiales";

async function requestMateriales(path, options, fallbackMessage) {
	let response;

	try {
		response = await fetch(`${materialesUrl}${path}`, {
			credentials: "include",
			cache: "no-store",
			...options,
		});
	} catch {
		throw new Error("No se pudo conectar con el servicio de materiales.");
	}

	const data = await response.json().catch(() => ({}));

	if (!response.ok) {
		const error = new Error(data.message ?? fallbackMessage);
		error.status = response.status;
		// Nombre del campo con problema, cuando el backend lo indica (400 o 409)
		error.field = data.campo;
		throw error;
	}

	return data;
}

export async function listMateriales() {
	const data = await requestMateriales(
		"",
		{},
		"No se pudieron obtener los materiales.",
	);
	return data.materiales;
}

export async function getMaterial(id) {
	const data = await requestMateriales(
		`/${id}`,
		{},
	"No se pudo obtener el material.",
	);
	return data.material;
}

export async function createMaterial(materialData) {
	const data = await requestMateriales(
		"",
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(materialData),
		},
		"No se pudo registrar el material.",
	);
	return data.material;
}

export async function updateMaterial(id, materialData) {
	const data = await requestMateriales(
		`/${id}`,
		{
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(materialData),
		},
		"No se pudieron guardar los cambios.",
	);
	return data.material;
}

export async function deleteMaterial(id) {
	await requestMateriales(
		`/${id}`,
		{ method: "DELETE" },
		"No se pudo eliminar el material.",
	);
}

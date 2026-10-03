// Multipart para MaterialesBiblioTK: los datos del material más la portada.
// portada: { archivo, url, quitar } — archivo (File) gana sobre la URL; quitar borra las dos copias
export function createMaterialDto(formData, portada = {}) {
	const datos = new FormData();

	datos.append("titulo", formData.titulo.trim());
	datos.append("autor", formData.autor.trim());
	datos.append(
		"tipoMaterial",
		String(formData.tipoMaterial ?? "")
			.trim()
			.toUpperCase(),
	);
	datos.append("editorial", formData.editorial.trim());
	datos.append("anioPublicacion", String(Number(formData.anioPublicacion)));
	datos.append("isbn", formData.isbn.trim());
	datos.append("disponible", String(Boolean(formData.disponible)));
	datos.append("imagenUrl", (portada.url ?? "").trim());

	if (portada.archivo) {
		datos.append("imagen", portada.archivo);
	} else if (portada.quitar) {
		datos.append("quitarImagen", "true");
	}

	return datos;
}

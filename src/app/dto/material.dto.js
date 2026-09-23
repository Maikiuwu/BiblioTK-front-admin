export function createMaterialDto(formData) {
	return {
		titulo: formData.titulo.trim(),
		autor: formData.autor.trim(),
		tipoMaterial: String(formData.tipoMaterial ?? "")
			.trim()
			.toUpperCase(),
		editorial: formData.editorial.trim(),
		anioPublicacion: Number(formData.anioPublicacion),
		isbn: formData.isbn.trim(),
		disponible: Boolean(formData.disponible),
	};
}

// La cédula no viaja: no se puede cambiar desde el perfil (PerfilBiblioTK la ignora)
export function createUpdateProfileDto(formData) {
	return {
		nombres: formData.nombres.trim(),
		apellidos: formData.apellidos.trim(),
		nombreUsuario: formData.nombreUsuario.trim(),
		email: formData.email.trim(),
		celular: formData.celular.trim(),
	};
}

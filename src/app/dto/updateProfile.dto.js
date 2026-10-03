export function createUpdateProfileDto(formData) {
	return {
		nombres: formData.nombres.trim(),
		apellidos: formData.apellidos.trim(),
		nombreUsuario: formData.nombreUsuario.trim(),
		email: formData.email.trim(),
		cc: formData.cc.trim(),
		celular: formData.celular.trim(),
	};
}

// Mismas reglas del perfil que BiblioTK-front-user (allá con Zod) y que PerfilBiblioTK,
// escritas sin dependencias: esta app no necesita Zod para nada más
const letters = "A-Za-zÁÉÍÓÚÜÑáéíóúüñ";
const nameRegex = new RegExp(`^[${letters}]+(?:[ '-][${letters}]+)*$`);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Largo máximo de cada columna de la tabla usuarios
const fieldLimits = {
	nombres: 50,
	apellidos: 50,
	email: 100,
	cc: 15,
	nombreUsuario: 30,
};

const rules = [
	{
		field: "nombres",
		test: (value) => nameRegex.test(value) && value.length <= fieldLimits.nombres,
		message: "Los nombres solo pueden contener letras, espacios, apóstrofes o guiones.",
	},
	{
		field: "apellidos",
		test: (value) => nameRegex.test(value) && value.length <= fieldLimits.apellidos,
		message:
			"Los apellidos solo pueden contener letras, espacios, apóstrofes o guiones.",
	},
	{
		field: "cc",
		test: (value) => /^[1-9]\d*$/.test(value) && value.length <= fieldLimits.cc,
		message: `La cédula debe ser un número entero mayor que 0, de hasta ${fieldLimits.cc} dígitos.`,
	},
	{
		field: "email",
		test: (value) => emailRegex.test(value) && value.length <= fieldLimits.email,
		message: "Ingresa un correo válido, por ejemplo: tu@correo.com.",
	},
	{
		field: "celular",
		test: (value) => /^\d{7,15}$/.test(value),
		message: "El celular debe contener solo números, entre 7 y 15 dígitos.",
	},
	{
		field: "nombreUsuario",
		test: (value) => value.length >= 1 && value.length <= fieldLimits.nombreUsuario,
		message: `El nombre de usuario debe tener entre 1 y ${fieldLimits.nombreUsuario} caracteres.`,
	},
];

// { field, message } del primer campo con problema, o null
export function validateUserData(formData) {
	const failed = rules.find(
		(rule) => !rule.test(String(formData[rule.field] ?? "").trim()),
	);
	return failed ? { field: failed.field, message: failed.message } : null;
}

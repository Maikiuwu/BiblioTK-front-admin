import { BookOpenText } from "@phosphor-icons/react";
import { cn } from "bibliotk-ui";
import { useState } from "react";

// Vive en esta app y no en bibliotk-ui porque la versión publicada en npm todavía no lo trae.
// Hay una copia igual en BiblioTK-front-admin y BiblioTK-front: si se sube a la librería, borrar las tres.

// Portadas subidas por MaterialesBiblioTK a Cloudinary: se piden ya optimizadas
// (formato y calidad automáticos, ancho máximo). Las URL pegadas a mano se usan tal cual
const patronCloudinary =
	/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/bibliotk\/materiales\/)/;

// Cada material puede tener dos copias de la portada: la remota (Cloudinary u otra URL)
// y la local del servidor. Se prueba primero la remota y, si no carga, la local
function fuentesPortada(material, ancho = 480) {
	const remota = material?.imagenUrl?.replace(
		patronCloudinary,
		`$1f_auto,q_auto,c_limit,w_${ancho}/$2`,
	);
	return [remota, material?.imagenLocal].filter(Boolean);
}

function PortadaVacia({ titulo, compacta, className }) {
	return (
		<div
			role="img"
			aria-label={titulo ? `${titulo}, sin portada` : "Sin portada"}
			className={cn(
				"grain relative flex size-full overflow-hidden bg-pine-900 text-sand-50",
				compacta ? "items-center justify-center" : "items-end p-5",
				className,
			)}
		>
			<BookOpenText
				aria-hidden="true"
				className={cn(
					"text-honey-300",
					compacta ? "size-5" : "absolute top-5 right-5 size-7",
				)}
			/>
			{!compacta && (
				<p className="line-clamp-4 font-display text-xl leading-tight font-extrabold tracking-[-0.03em]">
					{titulo}
				</p>
			)}
		</div>
	);
}

function Portada({ fuentes, titulo, compacta, className }) {
	const [intento, setIntento] = useState(0);
	const fuente = fuentes[intento];

	if (!fuente) {
		return (
			<PortadaVacia titulo={titulo} compacta={compacta} className={className} />
		);
	}

	return (
		<img
			src={fuente}
			alt={titulo ? `Portada de ${titulo}` : ""}
			loading="lazy"
			decoding="async"
			onError={() => setIntento((actual) => actual + 1)}
			className={cn("size-full object-cover", className)}
		/>
	);
}

// compacta: miniatura (sin el título escrito sobre la portada vacía)
function CoverImage({ material, ancho, compacta = false, className }) {
	const fuentes = fuentesPortada(material, ancho);

	// La key reinicia los intentos cuando cambia la portada del material
	return (
		<Portada
			key={fuentes.join(" ")}
			fuentes={fuentes}
			titulo={material?.titulo}
			compacta={compacta}
			className={className}
		/>
	);
}

export default CoverImage;

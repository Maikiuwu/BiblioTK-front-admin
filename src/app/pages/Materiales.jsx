import { ArrowsClockwise } from "@phosphor-icons/react/ArrowsClockwise";
import { Books } from "@phosphor-icons/react/Books";
import { PencilSimple } from "@phosphor-icons/react/PencilSimple";
import { Plus } from "@phosphor-icons/react/Plus";
import { Trash } from "@phosphor-icons/react/Trash";
import { UploadSimple } from "@phosphor-icons/react/UploadSimple";
import {
	Alert,
	Button,
	buttonClasses,
	Checkbox,
	cn,
	CoverImage,
	Dialog,
	inputClasses,
	TextField,
} from "bibliotk-ui";
import { useCallback, useEffect, useState } from "react";
import {
	createMaterial,
	deleteMaterial,
	listMateriales,
	updateMaterial,
} from "../../service/MaterialesService.js";
import { createMaterialDto } from "../dto/material.dto.js";

const tiposValidos = ["LIBRO", "REVISTA", "NOVELA"];
const tiposPortada = ["image/jpeg", "image/png", "image/webp"];
const pesoMaximoPortada = 3 * 1024 * 1024;

// Largo real de las columnas en la BD (titulo 150; autor y editorial 100)
const limites = { titulo: 150, autor: 100, editorial: 100, isbn: 17 };

const emptyFormData = {
	titulo: "",
	autor: "",
	tipoMaterial: "LIBRO",
	editorial: "",
	anioPublicacion: "",
	isbn: "",
	disponible: true,
};

function toFormData(material) {
	if (!material) return emptyFormData;

	return {
		titulo: material.titulo ?? "",
		autor: material.autor ?? "",
		tipoMaterial: material.tipoMaterial ?? "LIBRO",
		editorial: material.editorial ?? "",
		anioPublicacion:
			material.anioPublicacion == null ? "" : String(material.anioPublicacion),
		isbn: material.isbn ?? "",
		disponible: Boolean(material.disponible),
	};
}

// Chequeo liviano en el cliente; el backend (validarMaterial) sigue siendo la autoridad
function validarMaterial(formData, portada) {
	if (!formData.titulo.trim()) {
		return { field: "titulo", message: "El título es obligatorio." };
	}

	if (!formData.autor.trim()) {
		return { field: "autor", message: "El autor es obligatorio." };
	}

	if (!tiposValidos.includes(formData.tipoMaterial)) {
		return { field: "tipoMaterial", message: "Selecciona un tipo de material." };
	}

	const anio = Number(formData.anioPublicacion);

	if (!Number.isInteger(anio) || anio < 1400 || anio > new Date().getFullYear() + 1) {
		return { field: "anioPublicacion", message: "Ingresa un año de publicación válido." };
	}

	if (portada.url.trim() && !/^https?:\/\//i.test(portada.url.trim())) {
		return {
			field: "imagenUrl",
			message: "La URL de la portada debe empezar por https://",
		};
	}

	return null;
}

// FileReader en vez de URL.createObjectURL: no hay que liberar nada al cerrar el diálogo
function leerComoDataUrl(archivo) {
	return new Promise((resolve, reject) => {
		const lector = new FileReader();
		lector.onload = () => resolve(lector.result);
		lector.onerror = () => reject(lector.error);
		lector.readAsDataURL(archivo);
	});
}

function MaterialTypeSelect({ value, onChange, error }) {
	return (
		<div className="grid content-start gap-2">
			<label htmlFor="tipoMaterial" className="text-[13px] font-semibold text-pine-900">
				Tipo
			</label>
			<select
				id="tipoMaterial"
				name="tipoMaterial"
				aria-invalid={error ? true : undefined}
				className={inputClasses}
				value={value}
				onChange={onChange}
				required
			>
				<option value="LIBRO">Libro</option>
				<option value="REVISTA">Revista</option>
				<option value="NOVELA">Novela</option>
			</select>
			{error && <p className="text-[13px] font-medium text-clay-600">{error}</p>}
		</div>
	);
}

// Portada: archivo (se guarda en el servidor y, si está configurado, en Cloudinary)
// o URL pegada (por ejemplo, una imagen que ya está en Cloudinary)
// Mientras se escribe la URL no se pide nada: solo cuando ya parece una dirección completa
const patronUrlCompleta = /^https?:\/\/[^\s/]+\.[^\s/]+\/\S+$/i;

function PortadaField({ titulo, material, portada, onChange, error, urlError }) {
	let vista = { titulo };

	if (portada.vistaPrevia) {
		vista = { titulo, imagenUrl: portada.vistaPrevia };
	} else if (!portada.quitar) {
		vista = {
			titulo,
			imagenUrl: patronUrlCompleta.test(portada.url.trim()) ? portada.url.trim() : null,
			// La copia local solo sigue valiendo si la URL no cambió por otra imagen
			imagenLocal:
				!portada.url.trim() || portada.url === (material?.imagenUrl ?? "")
					? (material?.imagenLocal ?? null)
					: null,
		};
	}

	const tienePortada = Boolean(vista.imagenUrl || vista.imagenLocal);

	async function handleArchivo(event) {
		const [archivo] = event.target.files;
		event.target.value = "";

		if (!archivo) return;

		if (!tiposPortada.includes(archivo.type)) {
			onChange(portada, "La portada debe ser una imagen JPG, PNG o WEBP.");
			return;
		}

		if (archivo.size > pesoMaximoPortada) {
			onChange(portada, "La portada debe pesar máximo 3 MB.");
			return;
		}

		const vistaPrevia = await leerComoDataUrl(archivo).catch(() => null);
		onChange({ archivo, vistaPrevia, url: "", quitar: false });
	}

	return (
		<fieldset className="grid gap-4 sm:col-span-2">
			<legend className="mb-2 text-[13px] font-semibold text-pine-900">Portada</legend>
			<div className="flex gap-4">
				<div className="h-36 w-24 shrink-0 overflow-hidden rounded-xl bg-sand-200 shadow-[inset_0_0_0_1px_var(--color-sand-300)]">
					<CoverImage material={vista} ancho={240} compacta />
				</div>
				<div className="grid min-w-0 flex-1 content-start gap-3">
					<div className="flex flex-wrap gap-2">
						<label
							className={buttonClasses({
								variant: "outline",
								size: "sm",
								className:
									"cursor-pointer focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-honey-600",
							})}
						>
							<UploadSimple aria-hidden="true" className="size-4" />
							{tienePortada ? "Cambiar imagen" : "Subir imagen"}
							<input
								type="file"
								name="imagen"
								accept={tiposPortada.join(",")}
								className="sr-only"
								onChange={handleArchivo}
							/>
						</label>
						{tienePortada && (
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									onChange({ archivo: null, vistaPrevia: null, url: "", quitar: true })
								}
							>
								<Trash aria-hidden="true" className="size-4" />
								Quitar
							</Button>
						)}
					</div>
					<p className="text-[13px] leading-snug text-ink-soft">
						{portada.archivo
							? `Imagen elegida: ${portada.archivo.name}`
							: "JPG, PNG o WEBP de hasta 3 MB. Se guarda en el servidor y, si está configurado, también en Cloudinary."}
					</p>
					{error && <p className="text-[13px] font-medium text-clay-600">{error}</p>}
				</div>
			</div>
			<TextField
				id="imagenUrl"
				name="imagenUrl"
				label="O pega la URL de la imagen"
				hint="Opcional. Por ejemplo, una imagen que ya está en Cloudinary."
				inputMode="url"
				maxLength={500}
				value={portada.url}
				onChange={(event) =>
					onChange({
						archivo: null,
						vistaPrevia: null,
						url: event.target.value,
						quitar: false,
					})
				}
				error={urlError}
			/>
		</fieldset>
	);
}

// Se monta al abrirse (key en el padre): el estado inicial sale del material, sin efectos de reinicio
function MaterialFormDialog({ mode, material, onClose, onSaved }) {
	const [formData, setFormData] = useState(() => toFormData(material));
	const [portada, setPortada] = useState(() => ({
		archivo: null,
		vistaPrevia: null,
		url: material?.imagenUrl ?? "",
		quitar: false,
	}));
	const [fieldError, setFieldError] = useState(null);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	function handleChange(event) {
		const { name, value, type, checked } = event.target;
		setFormData((current) => ({
			...current,
			[name]: type === "checkbox" ? checked : value,
		}));

		if (fieldError?.field === name) {
			setFieldError(null);
		}
	}

	function handlePortadaChange(nuevaPortada, mensajeError) {
		setPortada(nuevaPortada);
		setFieldError(mensajeError ? { field: "imagen", message: mensajeError } : null);
	}

	function errorFor(field) {
		return fieldError?.field === field ? fieldError.message : undefined;
	}

	function handleClose() {
		if (isSubmitting) return;
		onClose();
	}

	async function handleSubmit(event) {
		event.preventDefault();
		const validationError = validarMaterial(formData, portada);

		if (validationError) {
			setFieldError(validationError);
			setError("");
			return;
		}

		setFieldError(null);
		setError("");
		setIsSubmitting(true);

		try {
			const dto = createMaterialDto(formData, portada);
			const { material: saved, aviso } =
				mode === "editar"
					? await updateMaterial(material.id, dto)
					: await createMaterial(dto);
			onSaved(saved, aviso);
		} catch (submitError) {
			if (submitError.field) {
				setFieldError({ field: submitError.field, message: submitError.message });
			} else {
				setError(submitError.message);
			}
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog
			open
			onClose={handleClose}
			dismissible={!isSubmitting}
			title={mode === "editar" ? "Editar material" : "Registrar material"}
			description="Completa los datos del libro, revista o novela y su portada."
			className="sm:max-w-xl"
		>
			<form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
				<TextField
					id="titulo"
					name="titulo"
					label="Título"
					className="sm:col-span-2"
					required
					maxLength={limites.titulo}
					value={formData.titulo}
					onChange={handleChange}
					error={errorFor("titulo")}
				/>
				<TextField
					id="autor"
					name="autor"
					label="Autor"
					required
					maxLength={limites.autor}
					value={formData.autor}
					onChange={handleChange}
					error={errorFor("autor")}
				/>
				<MaterialTypeSelect
					value={formData.tipoMaterial}
					onChange={handleChange}
					error={errorFor("tipoMaterial")}
				/>
				<TextField
					id="editorial"
					name="editorial"
					label="Editorial"
					hint="Opcional"
					maxLength={limites.editorial}
					value={formData.editorial}
					onChange={handleChange}
					error={errorFor("editorial")}
				/>
				<TextField
					id="anioPublicacion"
					name="anioPublicacion"
					label="Año de publicación"
					type="number"
					inputMode="numeric"
					required
					value={formData.anioPublicacion}
					onChange={handleChange}
					error={errorFor("anioPublicacion")}
				/>
				<TextField
					id="isbn"
					name="isbn"
					label="ISBN"
					hint="Opcional"
					maxLength={limites.isbn}
					value={formData.isbn}
					onChange={handleChange}
					error={errorFor("isbn")}
				/>
				<Checkbox
					id="disponible"
					name="disponible"
					label="Disponible para préstamo"
					className="self-center sm:mt-5"
					checked={formData.disponible}
					onChange={handleChange}
				/>

				<PortadaField
					titulo={formData.titulo}
					material={material}
					portada={portada}
					onChange={handlePortadaChange}
					error={errorFor("imagen")}
					urlError={errorFor("imagenUrl")}
				/>

				{error && (
					<Alert tone="error" className="sm:col-span-2">
						{error}
					</Alert>
				)}

				<div className="mt-2 flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
					<Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
						Cancelar
					</Button>
					<Button type="submit" loading={isSubmitting}>
						{isSubmitting ? "Guardando..." : "Guardar"}
					</Button>
				</div>
			</form>
		</Dialog>
	);
}

function DeleteMaterialDialog({ material, onClose, onDeleted }) {
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	function handleClose() {
		if (isSubmitting) return;
		onClose();
	}

	async function handleConfirm() {
		setIsSubmitting(true);
		setError("");

		try {
			await deleteMaterial(material.id);
			onDeleted(material.id);
		} catch (deleteError) {
			setError(deleteError.message);
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog
			open
			onClose={handleClose}
			dismissible={!isSubmitting}
			tone="danger"
			icon={<Trash aria-hidden="true" className="size-6" />}
			title="¿Eliminar este material?"
			description={`Se eliminará «${material.titulo}» del catálogo, junto con su portada. Esta acción no se puede deshacer.`}
		>
			<div className="grid gap-5">
				{error && <Alert tone="error">{error}</Alert>}
				<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
						Cancelar
					</Button>
					<Button variant="danger" loading={isSubmitting} onClick={handleConfirm}>
						{isSubmitting ? "Eliminando..." : "Eliminar"}
					</Button>
				</div>
			</div>
		</Dialog>
	);
}

function MaterialRow({ material, onEdit, onDelete }) {
	return (
		<tr className="border-b border-sand-200 last:border-0">
			<td className="py-3 pr-4">
				<div className="flex items-center gap-3">
					<div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-sand-200">
						<CoverImage material={material} ancho={120} compacta />
					</div>
					<div className="min-w-0">
						<p className="font-semibold text-pine-950">{material.titulo}</p>
						<p className="text-sm text-ink-soft">{material.autor}</p>
					</div>
				</div>
			</td>
			<td className="py-3 pr-4 text-sm text-ink-soft">{material.tipoMaterial}</td>
			<td className="py-3 pr-4">
				<span
					className={cn(
						"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
						material.disponible
							? "bg-pine-100 text-pine-800"
							: "bg-sand-200 text-ink-soft",
					)}
				>
					{material.disponible ? "Disponible" : "No disponible"}
				</span>
			</td>
			<td className="py-3 pl-4 text-right">
				<div className="flex justify-end gap-2">
					<Button variant="outline" size="sm" onClick={() => onEdit(material)}>
						<PencilSimple aria-hidden="true" className="size-4" />
						Editar
					</Button>
					<Button variant="outline" size="sm" onClick={() => onDelete(material)}>
						<Trash aria-hidden="true" className="size-4" />
						Borrar
					</Button>
				</div>
			</td>
		</tr>
	);
}

function Materiales() {
	const [materiales, setMateriales] = useState([]);
	const [status, setStatus] = useState("loading");
	const [error, setError] = useState("");
	const [aviso, setAviso] = useState("");
	// key cambia en cada apertura para que el formulario arranque limpio
	const [formDialog, setFormDialog] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);

	// Solo actualiza el estado al responder: el "cargando" inicial ya viene del useState
	const loadMateriales = useCallback(() => {
		listMateriales()
			.then((data) => {
				setMateriales(data);
				setStatus("ready");
			})
			.catch((loadError) => {
				setError(loadError.message);
				setStatus("error");
			});
	}, []);

	useEffect(() => {
		loadMateriales();
	}, [loadMateriales]);

	function retryLoad() {
		setStatus("loading");
		setError("");
		loadMateriales();
	}

	function openForm(mode, material = null) {
		setAviso("");
		setFormDialog({ mode, material, key: Date.now() });
	}

	function handleSaved(saved, avisoPortada) {
		setFormDialog(null);
		setAviso(avisoPortada ?? "");
		setMateriales((current) => {
			const existe = current.some((item) => item.id === saved.id);
			return existe
				? current.map((item) => (item.id === saved.id ? saved : item))
				: [...current, saved].sort((a, b) => a.titulo.localeCompare(b.titulo));
		});
	}

	function handleDeleted(id) {
		setDeleteTarget(null);
		setMateriales((current) => current.filter((item) => item.id !== id));
	}

	return (
		<>
			<header className="flex flex-wrap items-end justify-between gap-4 motion-safe:animate-rise">
				<div>
					<h1 className="font-display text-[clamp(2.5rem,5.5vw,4rem)] leading-[0.94] font-extrabold tracking-[-0.045em] text-pine-950">
						Material bibliográfico
					</h1>
					<p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
						Registra y administra los libros, revistas y novelas del catálogo.
					</p>
				</div>
				<Button onClick={() => openForm("crear")}>
					<Plus aria-hidden="true" className="size-[18px]" />
					Nuevo material
				</Button>
			</header>

			{aviso && (
				<Alert tone="info" className="mt-6">
					{aviso}
				</Alert>
			)}

			{status === "loading" && (
				<div
					aria-busy="true"
					className="mt-10 rounded-[28px] bg-sand-50 p-6 shadow-[inset_0_0_0_1px_var(--color-sand-200)] md:p-10"
				>
					<span className="block h-4 w-40 animate-pulse rounded-full bg-sand-200" />
					<div className="mt-6 grid gap-3">
						{[0, 1, 2].map((key) => (
							<span
								key={key}
								className="block h-14 w-full animate-pulse rounded-xl bg-sand-200/70"
							/>
						))}
					</div>
				</div>
			)}

			{status === "error" && (
				<div className="mt-10 rounded-[28px] bg-sand-50 p-6 shadow-[inset_0_0_0_1px_var(--color-sand-200)] md:p-10">
					<Alert tone="error">{error}</Alert>
					<Button className="mt-6" onClick={retryLoad}>
						<ArrowsClockwise aria-hidden="true" className="size-[18px]" />
						Reintentar
					</Button>
				</div>
			)}

			{status === "ready" && (
				<section className="mt-10 rounded-[28px] bg-sand-50 p-6 shadow-[inset_0_0_0_1px_var(--color-sand-200)] motion-safe:animate-rise md:p-10 [animation-delay:80ms]">
					{materiales.length === 0 ? (
						<div className="grid place-items-center gap-3 py-12 text-center">
							<span className="grid size-12 place-items-center rounded-2xl bg-pine-900 text-honey-300">
								<Books aria-hidden="true" className="size-6" />
							</span>
							<strong className="font-display text-xl font-extrabold tracking-[-0.03em] text-pine-950">
								Todavía no hay material registrado
							</strong>
							<p className="max-w-xs text-sm text-ink-soft">
								Usa "Nuevo material" para agregar el primer libro, revista o
								novela al catálogo.
							</p>
						</div>
					) : (
						<div className="relative overflow-x-auto">
							<table className="w-full min-w-[640px] border-collapse text-left">
								<thead>
									<tr className="border-b border-sand-200 text-xs font-semibold tracking-wide text-ink-soft uppercase">
										<th className="pb-3 pr-4 font-semibold">Título</th>
										<th className="pb-3 pr-4 font-semibold">Tipo</th>
										<th className="pb-3 pr-4 font-semibold">Estado</th>
										<th className="pb-3 pl-4">
											<span className="sr-only">Acciones</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{materiales.map((material) => (
										<MaterialRow
											key={material.id}
											material={material}
											onEdit={(item) => openForm("editar", item)}
											onDelete={setDeleteTarget}
										/>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>
			)}

			{formDialog && (
				<MaterialFormDialog
					key={formDialog.key}
					mode={formDialog.mode}
					material={formDialog.material}
					onClose={() => setFormDialog(null)}
					onSaved={handleSaved}
				/>
			)}

			{deleteTarget && (
				<DeleteMaterialDialog
					key={deleteTarget.id}
					material={deleteTarget}
					onClose={() => setDeleteTarget(null)}
					onDeleted={handleDeleted}
				/>
			)}
		</>
	);
}

export default Materiales;

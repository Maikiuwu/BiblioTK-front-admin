import {
	ArrowsClockwise,
	Books,
	PencilSimple,
	Plus,
	Trash,
} from "@phosphor-icons/react";
import { Alert, Button, Checkbox, cn, Dialog, Select, TextField } from "bibliotk-ui";
import { useCallback, useEffect, useState } from "react";
import {
	createMaterial,
	deleteMaterial,
	listMateriales,
	updateMaterial,
} from "../../service/MaterialesService.js";
import { createMaterialDto } from "../dto/material.dto.js";

const tiposValidos = ["LIBRO", "REVISTA", "NOVELA"];

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
function validarMaterial(formData) {
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

	return null;
}

function MaterialFormDialog({ open, mode, material, onClose, onSaved }) {
	const [formData, setFormData] = useState(() => toFormData(material));
	const [fieldError, setFieldError] = useState(null);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (open) {
			setFormData(toFormData(material));
			setFieldError(null);
			setError("");
		}
	}, [open, material]);

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

	function errorFor(field) {
		return fieldError?.field === field ? fieldError.message : undefined;
	}

	function handleClose() {
		if (isSubmitting) return;
		onClose();
	}

	async function handleSubmit(event) {
		event.preventDefault();
		const validationError = validarMaterial(formData);

		if (validationError) {
			setFieldError(validationError);
			setError("");
			return;
		}

		setFieldError(null);
		setError("");
		setIsSubmitting(true);

		try {
			const dto = createMaterialDto(formData);
			const saved =
				mode === "editar"
					? await updateMaterial(material.id, dto)
					: await createMaterial(dto);
			onSaved(saved);
		} catch (submitError) {
			if (submitError.field) {
				setFieldError({ field: submitError.field, message: submitError.message });
			} else {
				setError(submitError.message);
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			dismissible={!isSubmitting}
			title={mode === "editar" ? "Editar material" : "Registrar material"}
			description="Completa los datos del libro, revista o novela."
		>
			<form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
				<TextField
					id="titulo"
					name="titulo"
					label="Título"
					className="sm:col-span-2"
					required
					value={formData.titulo}
					onChange={handleChange}
					error={errorFor("titulo")}
				/>
				<TextField
					id="autor"
					name="autor"
					label="Autor"
					required
					value={formData.autor}
					onChange={handleChange}
					error={errorFor("autor")}
				/>
				<Select
					id="tipoMaterial"
					name="tipoMaterial"
					label="Tipo"
					required
					value={formData.tipoMaterial}
					onChange={handleChange}
					error={errorFor("tipoMaterial")}
				>
					<option value="LIBRO">Libro</option>
					<option value="REVISTA">Revista</option>
					<option value="NOVELA">Novela</option>
				</Select>
				<TextField
					id="editorial"
					name="editorial"
					label="Editorial"
					hint="Opcional"
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
					value={formData.isbn}
					onChange={handleChange}
					error={errorFor("isbn")}
				/>
				<Checkbox
					id="disponible"
					name="disponible"
					label="Disponible para préstamo"
					className="sm:col-span-2"
					checked={formData.disponible}
					onChange={handleChange}
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

function DeleteMaterialDialog({ open, material, onClose, onDeleted }) {
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	function handleClose() {
		if (isSubmitting) return;
		setError("");
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
			open={open}
			onClose={handleClose}
			dismissible={!isSubmitting}
			tone="danger"
			icon={<Trash aria-hidden="true" className="size-6" />}
			title="¿Eliminar este material?"
			description={
				material
					? `Se eliminará «${material.titulo}» del catálogo. Esta acción no se puede deshacer.`
					: undefined
			}
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
				<p className="font-semibold text-pine-950">{material.titulo}</p>
				<p className="text-sm text-ink-soft">{material.autor}</p>
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
	const [formDialog, setFormDialog] = useState({
		open: false,
		mode: "crear",
		material: null,
	});
	const [deleteTarget, setDeleteTarget] = useState(null);

	const loadMateriales = useCallback(() => {
		setStatus("loading");

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

	function handleSaved(saved) {
		setFormDialog({ open: false, mode: "crear", material: null });
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
				<Button
					onClick={() => setFormDialog({ open: true, mode: "crear", material: null })}
				>
					<Plus aria-hidden="true" className="size-[18px]" />
					Nuevo material
				</Button>
			</header>

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
					<Button className="mt-6" onClick={loadMateriales}>
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
						<div className="overflow-x-auto">
							<table className="w-full min-w-[640px] border-collapse text-left">
								<thead>
									<tr className="border-b border-sand-200 text-xs font-semibold tracking-wide text-ink-soft uppercase">
										<th className="pb-3 pr-4 font-semibold">Título</th>
										<th className="pb-3 pr-4 font-semibold">Tipo</th>
										<th className="pb-3 pr-4 font-semibold">Estado</th>
										<th className="pb-3 pl-4" />
									</tr>
								</thead>
								<tbody>
									{materiales.map((material) => (
										<MaterialRow
											key={material.id}
											material={material}
											onEdit={(item) =>
												setFormDialog({
													open: true,
													mode: "editar",
													material: item,
												})
											}
											onDelete={setDeleteTarget}
										/>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>
			)}

			<MaterialFormDialog
				open={formDialog.open}
				mode={formDialog.mode}
				material={formDialog.material}
				onClose={() => setFormDialog({ open: false, mode: "crear", material: null })}
				onSaved={handleSaved}
			/>

			<DeleteMaterialDialog
				open={Boolean(deleteTarget)}
				material={deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onDeleted={handleDeleted}
			/>
		</>
	);
}

export default Materiales;

import {
	ArrowCounterClockwise,
	ArrowsClockwise,
	ArrowsLeftRight,
	FilePdf,
	XCircle,
} from "@phosphor-icons/react";
import {
	Alert,
	Button,
	buttonClasses,
	cn,
	Dialog,
	TextField,
} from "bibliotk-ui";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMateriales } from "../../service/MaterialesService.js";
import {
	cancelarPrestamo,
	devolverPrestamo,
	listReportes,
} from "../../service/PrestamosService.js";
import CoverImage from "../components/CoverImage.jsx";

const cardClasses =
	"rounded-[28px] bg-sand-50 shadow-[inset_0_0_0_1px_var(--color-sand-200)]";

const estados = {
	ACTIVO: { etiqueta: "Activo", clase: "bg-pine-100 text-pine-800" },
	VENCIDO: {
		etiqueta: "Vencido",
		clase: "bg-clay-50 text-clay-700 shadow-[inset_0_0_0_1px_rgb(163_64_47/0.18)]",
	},
	DEVUELTO: { etiqueta: "Devuelto", clase: "bg-sand-200 text-ink-soft" },
	CANCELADO: {
		etiqueta: "Cancelado",
		clase: "bg-honey-100 text-honey-700 shadow-[inset_0_0_0_1px_rgb(168_112_44/0.2)]",
	},
};

const filtrosEstado = [
	{ valor: "", etiqueta: "Todos", clave: "total" },
	{ valor: "ACTIVO", etiqueta: "Activos", clave: "activos" },
	{ valor: "VENCIDO", etiqueta: "Vencidos", clave: "vencidos" },
	{ valor: "DEVUELTO", etiqueta: "Devueltos", clave: "devueltos" },
	{ valor: "CANCELADO", etiqueta: "Cancelados", clave: "cancelados" },
];

const canceladoPor = {
	usuario: "por el usuario",
	admin: "por el bibliotecario",
};

// En la tabla la fecha va corta (28/09/2026, igual que en el PDF): la larga no cabe en una línea
const formatoFechaCorta = new Intl.DateTimeFormat("es-CO", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
});

function fechaCorta(valor) {
	const fecha = valor ? new Date(valor) : null;
	return fecha && !Number.isNaN(fecha.getTime()) ? formatoFechaCorta.format(fecha) : "—";
}

// Minúsculas y sin tildes: "garcia" encuentra "García"
function normalizar(texto) {
	return String(texto ?? "")
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase();
}

function resumir(reportes) {
	return {
		total: reportes.length,
		activos: reportes.filter((reporte) => reporte.estado === "ACTIVO").length,
		vencidos: reportes.filter((reporte) => reporte.estado === "VENCIDO").length,
		devueltos: reportes.filter((reporte) => reporte.estado === "DEVUELTO").length,
		cancelados: reportes.filter((reporte) => reporte.estado === "CANCELADO").length,
	};
}

function EstadoBadge({ estado }) {
	const datos = estados[estado] ?? estados.ACTIVO;

	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
				datos.clase,
			)}
		>
			{datos.etiqueta}
		</span>
	);
}

function DevolucionDialog({ reporte, onClose, onDevuelto }) {
	const [observaciones, setObservaciones] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			const actualizado = await devolverPrestamo(
				reporte.prestamoId,
				observaciones.trim(),
			);
			onDevuelto(actualizado);
		} catch (submitError) {
			setError(submitError.message);
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog
			open
			onClose={onClose}
			dismissible={!isSubmitting}
			icon={<ArrowCounterClockwise aria-hidden="true" className="size-6" />}
			title="¿Registrar la devolución?"
			description={`«${reporte.materialTitulo}» vuelve a quedar disponible en el catálogo${reporte.usuarioNombre ? ` y se cierra el préstamo de ${reporte.usuarioNombre}` : ""}.`}
		>
			<form onSubmit={handleSubmit} className="grid gap-5">
				<TextField
					id="observaciones"
					label="Observaciones"
					hint="Opcional. Por ejemplo: devuelto en buen estado."
					maxLength={255}
					value={observaciones}
					onChange={(event) => setObservaciones(event.target.value)}
				/>
				{error && <Alert tone="error">{error}</Alert>}
				<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Button variant="outline" onClick={onClose} disabled={isSubmitting}>
						Volver
					</Button>
					<Button type="submit" loading={isSubmitting}>
						{isSubmitting ? "Registrando..." : "Registrar devolución"}
					</Button>
				</div>
			</form>
		</Dialog>
	);
}

// Cancelar sirve cuando el libro nunca se entregó (el lector no vino, fue un error…).
// Si el lector ya lo tiene, lo que corresponde es registrar la devolución
function CancelacionDialog({ reporte, onClose, onCancelado }) {
	const [motivo, setMotivo] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			onCancelado(await cancelarPrestamo(reporte.prestamoId, motivo.trim()));
		} catch (submitError) {
			setError(submitError.message);
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog
			open
			onClose={onClose}
			dismissible={!isSubmitting}
			tone="danger"
			icon={<XCircle aria-hidden="true" className="size-6" />}
			title="¿Cancelar este préstamo?"
			description={`Se cancela el préstamo de «${reporte.materialTitulo}»${reporte.usuarioNombre ? ` a ${reporte.usuarioNombre}` : ""} y el material vuelve a estar disponible. Si el lector ya tiene el libro, usa "Marcar devuelto".`}
		>
			<form onSubmit={handleSubmit} className="grid gap-5">
				<TextField
					id="motivo-cancelacion"
					label="Motivo"
					hint="Opcional. Por ejemplo: el lector no vino a recogerlo."
					maxLength={255}
					value={motivo}
					onChange={(event) => setMotivo(event.target.value)}
				/>
				{error && <Alert tone="error">{error}</Alert>}
				<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Button variant="outline" onClick={onClose} disabled={isSubmitting}>
						Volver
					</Button>
					<Button type="submit" variant="danger" loading={isSubmitting}>
						{isSubmitting ? "Cancelando..." : "Cancelar préstamo"}
					</Button>
				</div>
			</form>
		</Dialog>
	);
}

function TextoCierre({ reporte }) {
	if (reporte.estado === "DEVUELTO") {
		return `Devuelto el ${fechaCorta(reporte.fechaDevolucionReal)}`;
	}

	if (reporte.estado === "CANCELADO") {
		return `Cancelado el ${fechaCorta(reporte.fechaCancelacion)}`;
	}

	return `Antes del ${fechaCorta(reporte.fechaDevolucionEsperada)}`;
}

function PrestamoRow({ reporte, material, onDevolver, onCancelar }) {
	const abierto = reporte.estado === "ACTIVO" || reporte.estado === "VENCIDO";

	return (
		<tr className="border-b border-sand-200 align-top last:border-0">
			<td className="py-3 pr-4">
				<div className="flex gap-3">
					<div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-sand-200">
						<CoverImage
							material={material ?? { titulo: reporte.materialTitulo }}
							ancho={120}
							compacta
						/>
					</div>
					<div className="min-w-0">
						<p className="font-semibold text-pine-950">{reporte.materialTitulo}</p>
						<p className="text-sm text-ink-soft">{reporte.materialAutor}</p>
					</div>
				</div>
			</td>
			<td className="py-3 pr-4">
				<p className="font-semibold text-pine-950">
					{reporte.usuarioNombre ?? "Usuario eliminado"}
				</p>
				{reporte.usuarioCc && (
					<p className="text-sm text-ink-soft">C.C. {reporte.usuarioCc}</p>
				)}
				{reporte.usuarioEmail && (
					<p className="text-sm text-ink-soft [overflow-wrap:anywhere]">
						{reporte.usuarioEmail}
					</p>
				)}
			</td>
			<td className="py-3 pr-4 text-sm whitespace-nowrap text-ink-soft">
				{fechaCorta(reporte.fechaPrestamo)}
			</td>
			<td className="py-3 pr-4 text-sm text-ink-soft">
				<p
					className={cn(
						"whitespace-nowrap",
						reporte.estado === "VENCIDO" && "font-semibold text-clay-700",
					)}
				>
					<TextoCierre reporte={reporte} />
				</p>
				{reporte.estado === "CANCELADO" && canceladoPor[reporte.canceladoPor] && (
					<p className="text-xs text-ink-faint">{canceladoPor[reporte.canceladoPor]}</p>
				)}
				{reporte.observaciones && (
					<p className="mt-1 max-w-56 text-xs text-ink-faint">
						{reporte.observaciones}
					</p>
				)}
			</td>
			<td className="py-3 pr-4">
				<EstadoBadge estado={reporte.estado} />
			</td>
			<td className="py-3 pl-4">
				{abierto && reporte.prestamoId && (
					<div className="flex flex-col items-end gap-2">
						<Button
							variant="outline"
							size="sm"
							aria-label={`Marcar como devuelto «${reporte.materialTitulo}»`}
							onClick={() => onDevolver(reporte)}
						>
							<ArrowCounterClockwise aria-hidden="true" className="size-4" />
							Marcar devuelto
						</Button>
						<Button
							variant="outline"
							size="sm"
							aria-label={`Cancelar el préstamo de «${reporte.materialTitulo}»`}
							onClick={() => onCancelar(reporte)}
						>
							<XCircle aria-hidden="true" className="size-4" />
							Cancelar
						</Button>
					</div>
				)}
			</td>
		</tr>
	);
}

function Prestamos() {
	const [reportes, setReportes] = useState([]);
	const [portadas, setPortadas] = useState(() => new Map());
	const [status, setStatus] = useState("loading");
	const [error, setError] = useState("");
	const [estado, setEstado] = useState("");
	const [busqueda, setBusqueda] = useState("");
	const [devolucion, setDevolucion] = useState(null);
	const [cancelacion, setCancelacion] = useState(null);

	// Solo actualiza el estado al responder: el "cargando" inicial ya viene del useState.
	// Las portadas salen del catálogo; si MaterialesBiblioTK no responde, se muestran vacías
	const cargar = useCallback(() => {
		Promise.all([listReportes(), listMateriales().catch(() => [])])
			.then(([datos, materiales]) => {
				setReportes(datos.reportes);
				setPortadas(new Map(materiales.map((material) => [material.id, material])));
				setStatus("ready");
			})
			.catch((loadError) => {
				setError(loadError.message);
				setStatus("error");
			});
	}, []);

	useEffect(() => {
		cargar();
	}, [cargar]);

	function reintentar() {
		setStatus("loading");
		setError("");
		cargar();
	}

	// Tras devolver o cancelar, la fila se reemplaza por la que devolvió el backend
	function handleActualizado(actualizado) {
		setDevolucion(null);
		setCancelacion(null);
		setReportes((actuales) =>
			actuales.map((reporte) => (reporte.id === actualizado.id ? actualizado : reporte)),
		);
	}

	const resumen = resumir(reportes);
	const texto = normalizar(busqueda.trim());
	const visibles = reportes.filter(
		(reporte) =>
			(!estado || reporte.estado === estado) &&
			(!texto ||
				[
					reporte.usuarioNombre,
					reporte.usuarioEmail,
					reporte.usuarioCc,
					reporte.materialTitulo,
					reporte.materialAutor,
					reporte.materialIsbn,
				].some((campo) => normalizar(campo).includes(texto))),
	);

	return (
		<>
			<header className="flex flex-wrap items-end justify-between gap-4 motion-safe:animate-rise">
				<div>
					<h1 className="font-display text-[clamp(2.5rem,5.5vw,4rem)] leading-[0.94] font-extrabold tracking-[-0.045em] text-pine-950">
						Préstamos
					</h1>
					<p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
						Todos los préstamos hechos por los usuarios, con los datos del lector
						y del material.
					</p>
				</div>
				<Link to="/reportes" className={buttonClasses({ variant: "outline" })}>
					<FilePdf aria-hidden="true" className="size-[18px]" />
					Exportar en PDF
				</Link>
			</header>

			{status === "loading" && (
				<div aria-busy="true" className={cn(cardClasses, "mt-10 p-6 md:p-10")}>
					<span className="block h-4 w-40 animate-pulse rounded-full bg-sand-200" />
					<div className="mt-6 grid gap-3">
						{[0, 1, 2].map((key) => (
							<span
								key={key}
								className="block h-16 w-full animate-pulse rounded-xl bg-sand-200/70"
							/>
						))}
					</div>
					<p className="sr-only">Cargando los préstamos</p>
				</div>
			)}

			{status === "error" && (
				<div className={cn(cardClasses, "mt-10 p-6 md:p-10")}>
					<Alert tone="error">{error}</Alert>
					<Button className="mt-6" onClick={reintentar}>
						<ArrowsClockwise aria-hidden="true" className="size-[18px]" />
						Reintentar
					</Button>
				</div>
			)}

			{status === "ready" && (
				<section
					aria-label="Tabla de préstamos"
					className={cn(
						cardClasses,
						"mt-10 p-6 motion-safe:animate-rise [animation-delay:80ms] md:p-10",
					)}
				>
					{reportes.length === 0 ? (
						<div className="grid place-items-center gap-3 py-12 text-center">
							<span className="grid size-12 place-items-center rounded-2xl bg-pine-900 text-honey-300">
								<ArrowsLeftRight aria-hidden="true" className="size-6" />
							</span>
							<strong className="font-display text-xl font-extrabold tracking-[-0.03em] text-pine-950">
								Todavía no hay préstamos
							</strong>
							<p className="max-w-xs text-sm text-ink-soft">
								Cuando un usuario pida un material desde el catálogo, aparecerá
								aquí.
							</p>
						</div>
					) : (
						<>
							<div className="flex flex-wrap items-end justify-between gap-4">
								<fieldset className="flex flex-wrap gap-2">
									<legend className="sr-only">Estado del préstamo</legend>
									{filtrosEstado.map((filtro) => (
										<button
											key={filtro.clave}
											type="button"
											aria-pressed={estado === filtro.valor}
											onClick={() => setEstado(filtro.valor)}
											className={cn(
												"inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-[background-color,color,transform] duration-150 ease-out-strong active:scale-[0.97]",
												estado === filtro.valor
													? "bg-pine-900 text-sand-50"
													: "bg-sand-100 text-pine-900 shadow-[inset_0_0_0_1px_var(--color-sand-300)] hover:bg-sand-200",
											)}
										>
											{filtro.etiqueta}
											<span
												className={cn(
													"rounded-full px-1.5 text-xs tabular-nums",
													estado === filtro.valor
														? "bg-sand-50/15"
														: "bg-pine-950/10",
												)}
											>
												{resumen[filtro.clave]}
											</span>
										</button>
									))}
								</fieldset>
								<TextField
									id="buscar-prestamo"
									label="Buscar"
									type="search"
									placeholder="Usuario, cédula, correo, título o ISBN"
									autoComplete="off"
									className="w-full sm:w-80"
									value={busqueda}
									onChange={(event) => setBusqueda(event.target.value)}
								/>
							</div>

							{visibles.length === 0 ? (
								<p className="mt-8 py-8 text-center text-sm text-ink-soft">
									No hay préstamos con esos filtros.
								</p>
							) : (
								// relative: el sr-only de la cabecera (absolute) no debe escaparse del scroll
								<div className="relative mt-6 overflow-x-auto">
									<table className="w-full min-w-[860px] border-collapse text-left">
										<thead>
											<tr className="border-b border-sand-200 text-xs font-semibold tracking-wide text-ink-soft uppercase">
												<th className="min-w-60 pb-3 pr-4 font-semibold">Material</th>
												<th className="min-w-52 pb-3 pr-4 font-semibold">Usuario</th>
												<th className="pb-3 pr-4 font-semibold">Prestado</th>
												<th className="pb-3 pr-4 font-semibold">Devolución</th>
												<th className="pb-3 pr-4 font-semibold">Estado</th>
												<th className="pb-3 pl-4">
													<span className="sr-only">Acciones</span>
												</th>
											</tr>
										</thead>
										<tbody>
											{visibles.map((reporte) => (
												<PrestamoRow
													key={reporte.id}
													reporte={reporte}
													material={portadas.get(reporte.materialId)}
													onDevolver={setDevolucion}
													onCancelar={setCancelacion}
												/>
											))}
										</tbody>
									</table>
								</div>
							)}
						</>
					)}
				</section>
			)}

			{devolucion && (
				<DevolucionDialog
					key={devolucion.id}
					reporte={devolucion}
					onClose={() => setDevolucion(null)}
					onDevuelto={handleActualizado}
				/>
			)}

			{cancelacion && (
				<CancelacionDialog
					key={cancelacion.id}
					reporte={cancelacion}
					onClose={() => setCancelacion(null)}
					onCancelado={handleActualizado}
				/>
			)}
		</>
	);
}

export default Prestamos;

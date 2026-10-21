import { ArrowCounterClockwise } from "@phosphor-icons/react/ArrowCounterClockwise";
import { ArrowsClockwise } from "@phosphor-icons/react/ArrowsClockwise";
import { ArrowsLeftRight } from "@phosphor-icons/react/ArrowsLeftRight";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { FilePdf } from "@phosphor-icons/react/FilePdf";
import { HourglassMedium } from "@phosphor-icons/react/HourglassMedium";
import { Prohibit } from "@phosphor-icons/react/Prohibit";
import { XCircle } from "@phosphor-icons/react/XCircle";
import {
	Alert,
	Button,
	buttonClasses,
	cn,
	CoverImage,
	Dialog,
	TextField,
} from "bibliotk-ui";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMateriales } from "../../service/MaterialesService.js";
import {
	aprobarPrestamo,
	cancelarPrestamo,
	devolverPrestamo,
	listReportes,
	rechazarPrestamo,
} from "../../service/PrestamosService.js";

const cardClasses =
	"rounded-[28px] bg-sand-50 shadow-[inset_0_0_0_1px_var(--color-sand-200)]";

const estados = {
	SOLICITADO: {
		etiqueta: "Por aprobar",
		clase: "bg-honey-100 text-honey-700 shadow-[inset_0_0_0_1px_rgb(168_112_44/0.2)]",
	},
	ACTIVO: { etiqueta: "Activo", clase: "bg-pine-100 text-pine-800" },
	VENCIDO: {
		etiqueta: "Vencido",
		clase: "bg-clay-50 text-clay-700 shadow-[inset_0_0_0_1px_rgb(163_64_47/0.18)]",
	},
	DEVUELTO: { etiqueta: "Devuelto", clase: "bg-sand-200 text-ink-soft" },
	CANCELADO: {
		etiqueta: "Cancelado",
		clase: "bg-sand-200 text-ink-soft shadow-[inset_0_0_0_1px_var(--color-sand-300)]",
	},
	RECHAZADO: {
		etiqueta: "Rechazado",
		clase: "bg-clay-50 text-clay-700",
	},
};

const filtrosEstado = [
	{ valor: "", etiqueta: "Todos", clave: "total" },
	{ valor: "SOLICITADO", etiqueta: "Por aprobar", clave: "solicitados" },
	{ valor: "ACTIVO", etiqueta: "Activos", clave: "activos" },
	{ valor: "VENCIDO", etiqueta: "Vencidos", clave: "vencidos" },
	{ valor: "DEVUELTO", etiqueta: "Devueltos", clave: "devueltos" },
	{ valor: "CANCELADO", etiqueta: "Cancelados", clave: "cancelados" },
	{ valor: "RECHAZADO", etiqueta: "Rechazados", clave: "rechazados" },
];

// Nunca se aprobó (sigue esperando, se rechazó o el lector la canceló antes): la fecha de la
// columna "Prestado" es la de la solicitud
function fueSolicitud(reporte) {
	return (
		reporte.estado === "SOLICITADO" ||
		reporte.estado === "RECHAZADO" ||
		(reporte.estado === "CANCELADO" &&
			Boolean(reporte.fechaSolicitud) &&
			!reporte.fechaRespuesta)
	);
}

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
		solicitados: reportes.filter((reporte) => reporte.estado === "SOLICITADO").length,
		activos: reportes.filter((reporte) => reporte.estado === "ACTIVO").length,
		vencidos: reportes.filter((reporte) => reporte.estado === "VENCIDO").length,
		devueltos: reportes.filter((reporte) => reporte.estado === "DEVUELTO").length,
		cancelados: reportes.filter((reporte) => reporte.estado === "CANCELADO").length,
		rechazados: reportes.filter((reporte) => reporte.estado === "RECHAZADO").length,
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

// Aprobar confirma que el libro está listo para entregar: el lector recibe el aviso con el
// lugar de recogida y desde ese momento corren los días del préstamo
function AprobacionDialog({ reporte, onClose, onAprobado }) {
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleConfirm() {
		setError("");
		setIsSubmitting(true);

		try {
			onAprobado(await aprobarPrestamo(reporte.prestamoId));
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
			icon={<CheckCircle aria-hidden="true" className="size-6" />}
			title="¿Aprobar este préstamo?"
			description={`${reporte.usuarioNombre ?? "El lector"} podrá recoger «${reporte.materialTitulo}» y le avisaremos de inmediato. El plazo de devolución empieza a contar desde hoy.`}
		>
			<div className="grid gap-5">
				{error && <Alert tone="error">{error}</Alert>}
				<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Button variant="outline" onClick={onClose} disabled={isSubmitting}>
						Volver
					</Button>
					<Button loading={isSubmitting} onClick={handleConfirm}>
						{isSubmitting ? "Aprobando..." : "Aprobar préstamo"}
					</Button>
				</div>
			</div>
		</Dialog>
	);
}

function RechazoDialog({ reporte, onClose, onRechazado }) {
	const [motivo, setMotivo] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			onRechazado(await rechazarPrestamo(reporte.prestamoId, motivo.trim()));
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
			icon={<Prohibit aria-hidden="true" className="size-6" />}
			title="¿Rechazar esta solicitud?"
			description={`${reporte.usuarioNombre ?? "El lector"} no podrá recoger «${reporte.materialTitulo}» y el material vuelve a estar disponible en el catálogo.`}
		>
			<form onSubmit={handleSubmit} className="grid gap-5">
				<TextField
					id="motivo-rechazo"
					label="Motivo"
					hint="Opcional. Se lo mostramos al lector. Por ejemplo: el ejemplar está en reparación."
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
						{isSubmitting ? "Rechazando..." : "Rechazar solicitud"}
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

	if (reporte.estado === "RECHAZADO") {
		return `Rechazado el ${fechaCorta(reporte.fechaRespuesta)}`;
	}

	if (reporte.estado === "SOLICITADO") {
		return "Empieza al aprobarlo";
	}

	return `Antes del ${fechaCorta(reporte.fechaDevolucionEsperada)}`;
}

function PrestamoRow({ reporte, material, onAprobar, onRechazar, onDevolver, onCancelar }) {
	const abierto = reporte.estado === "ACTIVO" || reporte.estado === "VENCIDO";
	const solicitado = reporte.estado === "SOLICITADO";

	return (
		<tr
			className={cn(
				"border-b border-sand-200 align-top last:border-0",
				solicitado && "bg-honey-100/40",
			)}
		>
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
				{fueSolicitud(reporte) && (
					<p className="text-xs text-ink-faint">Solicitud</p>
				)}
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
				{solicitado && reporte.prestamoId && (
					<div className="flex flex-col items-end gap-2">
						<Button
							size="sm"
							aria-label={`Aprobar el préstamo de «${reporte.materialTitulo}»`}
							onClick={() => onAprobar(reporte)}
						>
							<CheckCircle aria-hidden="true" className="size-4" />
							Aprobar
						</Button>
						<Button
							variant="outline"
							size="sm"
							aria-label={`Rechazar la solicitud de «${reporte.materialTitulo}»`}
							onClick={() => onRechazar(reporte)}
						>
							<Prohibit aria-hidden="true" className="size-4" />
							Rechazar
						</Button>
					</div>
				)}
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
	const [aprobacion, setAprobacion] = useState(null);
	const [rechazo, setRechazo] = useState(null);
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

	// Una solicitud nueva (o una cancelación del lector) llega por la campana: la tabla se
	// recarga sola para que el bibliotecario la vea sin refrescar la página
	useEffect(() => {
		function alNotificar(event) {
			if (event.detail?.categoria === "prestamos") cargar();
		}

		window.addEventListener("bibliotk:notificacion", alNotificar);
		return () => window.removeEventListener("bibliotk:notificacion", alNotificar);
	}, [cargar]);

	function reintentar() {
		setStatus("loading");
		setError("");
		cargar();
	}

	// Tras aprobar, rechazar, devolver o cancelar, la fila se reemplaza por la que devolvió el backend
	function handleActualizado(actualizado) {
		setAprobacion(null);
		setRechazo(null);
		setDevolucion(null);
		setCancelacion(null);
		setReportes((actuales) =>
			actuales.map((reporte) => (reporte.id === actualizado.id ? actualizado : reporte)),
		);
	}

	const resumen = resumir(reportes);
	const texto = normalizar(busqueda.trim());
	const visibles = reportes
		.filter(
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
		)
		// Las solicitudes por aprobar, arriba (sort es estable: el resto conserva su orden)
		.sort(
			(a, b) => Number(b.estado === "SOLICITADO") - Number(a.estado === "SOLICITADO"),
		);

	return (
		<>
			<header className="flex flex-wrap items-end justify-between gap-4 motion-safe:animate-rise">
				<div>
					<h1 className="font-display text-[clamp(2.5rem,5.5vw,4rem)] leading-[0.94] font-extrabold tracking-[-0.045em] text-pine-950">
						Préstamos
					</h1>
					<p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
						Aprueba las solicitudes de los lectores y lleva el control de los
						préstamos, con los datos del lector y del material.
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
							{resumen.solicitados > 0 && estado !== "SOLICITADO" && (
								<div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-honey-100 p-4 text-honey-700 shadow-[inset_0_0_0_1px_rgb(168_112_44/0.2)]">
									<p className="flex items-center gap-3 text-[15px] font-semibold leading-snug">
										<HourglassMedium aria-hidden="true" className="size-5 shrink-0" />
										{resumen.solicitados === 1
											? "Hay 1 solicitud esperando tu aprobación."
											: `Hay ${resumen.solicitados} solicitudes esperando tu aprobación.`}
									</p>
									<Button size="sm" onClick={() => setEstado("SOLICITADO")}>
										Ver solicitudes
									</Button>
								</div>
							)}
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
													onAprobar={setAprobacion}
													onRechazar={setRechazo}
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

			{aprobacion && (
				<AprobacionDialog
					key={aprobacion.id}
					reporte={aprobacion}
					onClose={() => setAprobacion(null)}
					onAprobado={handleActualizado}
				/>
			)}

			{rechazo && (
				<RechazoDialog
					key={rechazo.id}
					reporte={rechazo}
					onClose={() => setRechazo(null)}
					onRechazado={handleActualizado}
				/>
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

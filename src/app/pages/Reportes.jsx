import { ArrowsClockwise } from "@phosphor-icons/react/ArrowsClockwise";
import { FilePdf } from "@phosphor-icons/react/FilePdf";
import {
	Alert,
	Button,
	cn,
	formatDate,
	formatNumber,
	inputClasses,
	TextField,
} from "bibliotk-ui";
import { useEffect, useState } from "react";
import {
	downloadReportePdf,
	listReportes,
} from "../../service/PrestamosService.js";

const cardClasses =
	"rounded-[28px] bg-sand-50 shadow-[inset_0_0_0_1px_var(--color-sand-200)]";

const opcionesEstado = [
	{ valor: "", etiqueta: "Todos los estados" },
	{ valor: "ACTIVO", etiqueta: "Activos" },
	{ valor: "VENCIDO", etiqueta: "Vencidos" },
	{ valor: "DEVUELTO", etiqueta: "Devueltos" },
	{ valor: "CANCELADO", etiqueta: "Cancelados" },
];

const etiquetasEstado = {
	ACTIVO: "Activo",
	VENCIDO: "Vencido",
	DEVUELTO: "Devuelto",
	CANCELADO: "Cancelado",
};

const tarjetasResumen = [
	{ clave: "total", etiqueta: "Total", clase: "text-pine-950" },
	{ clave: "activos", etiqueta: "Activos", clase: "text-pine-700" },
	{ clave: "vencidos", etiqueta: "Vencidos", clase: "text-clay-600" },
	{ clave: "devueltos", etiqueta: "Devueltos", clase: "text-ink-soft" },
	{ clave: "cancelados", etiqueta: "Cancelados", clase: "text-honey-700" },
];

const filasVistaPrevia = 5;

function EstadoSelect({ value, onChange }) {
	return (
		<div className="grid content-start gap-2">
			<label htmlFor="reporte-estado" className="text-[13px] font-semibold text-pine-900">
				Estado
			</label>
			<select
				id="reporte-estado"
				className={inputClasses}
				value={value}
				onChange={(event) => onChange(event.target.value)}
			>
				{opcionesEstado.map((opcion) => (
					<option key={opcion.valor || "todos"} value={opcion.valor}>
						{opcion.etiqueta}
					</option>
				))}
			</select>
		</div>
	);
}

export function Reportes() {
	const [estado, setEstado] = useState("");
	const [desde, setDesde] = useState("");
	const [hasta, setHasta] = useState("");
	const [intento, setIntento] = useState(0);
	const [resultado, setResultado] = useState(null);
	const [descarga, setDescarga] = useState({ enCurso: false, error: "" });

	const rangoInvalido = Boolean(desde && hasta && desde > hasta);
	const clave = `${estado}|${desde}|${hasta}|${intento}`;

	// Vista previa con los mismos filtros del PDF. El estado solo cambia al responder:
	// "cargando" se deduce de que el resultado guardado sea de otros filtros
	useEffect(() => {
		if (rangoInvalido) return undefined;

		let activo = true;
		const claveActual = `${estado}|${desde}|${hasta}|${intento}`;

		listReportes({ estado, desde, hasta })
			.then((datos) => {
				if (activo) setResultado({ clave: claveActual, ...datos });
			})
			.catch((loadError) => {
				if (activo) setResultado({ clave: claveActual, error: loadError.message });
			});

		return () => {
			activo = false;
		};
	}, [estado, desde, hasta, intento, rangoInvalido]);

	const cargando = !rangoInvalido && resultado?.clave !== clave;
	const listo = !cargando && !rangoInvalido && resultado && !resultado.error;
	const total = listo ? resultado.resumen.total : 0;

	let mensajePdf = "Preparando la vista previa…";
	if (rangoInvalido) mensajePdf = "Corrige el rango de fechas para generar el PDF.";
	else if (listo) {
		mensajePdf = `El PDF incluirá ${total === 1 ? "1 préstamo" : `${formatNumber(total)} préstamos`}.`;
	} else if (!cargando) mensajePdf = "No se pudo preparar la vista previa.";

	async function handleDescargar() {
		setDescarga({ enCurso: true, error: "" });

		try {
			await downloadReportePdf({ estado, desde, hasta });
			setDescarga({ enCurso: false, error: "" });
		} catch (downloadError) {
			setDescarga({ enCurso: false, error: downloadError.message });
		}
	}

	return (
		<>
			<header className="motion-safe:animate-rise">
				<h1 className="font-display text-[clamp(2.5rem,5.5vw,4rem)] leading-[0.94] font-extrabold tracking-[-0.045em] text-pine-950">
					Reportes
				</h1>
				<p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
					Exporta en PDF el historial de préstamos, con los datos de cada usuario
					y de cada material.
				</p>
			</header>

			<section
				aria-label="Filtros del reporte"
				className={cn(
					cardClasses,
					"mt-10 grid gap-5 p-6 motion-safe:animate-rise [animation-delay:80ms] sm:grid-cols-3 md:p-8",
				)}
			>
				<EstadoSelect value={estado} onChange={setEstado} />
				<TextField
					id="reporte-desde"
					label="Prestados desde"
					type="date"
					value={desde}
					max={hasta || undefined}
					onChange={(event) => setDesde(event.target.value)}
				/>
				<TextField
					id="reporte-hasta"
					label="Hasta"
					type="date"
					value={hasta}
					min={desde || undefined}
					onChange={(event) => setHasta(event.target.value)}
					error={
						rangoInvalido
							? "La fecha final no puede ser anterior a la inicial."
							: undefined
					}
				/>
			</section>

			<section
				aria-label="Vista previa del reporte"
				aria-busy={cargando}
				className={cn(
					cardClasses,
					"mt-3 p-6 motion-safe:animate-rise [animation-delay:140ms] md:p-8",
				)}
			>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
					{tarjetasResumen.map((tarjeta) => (
						<div key={tarjeta.clave} className="rounded-2xl bg-sand-100 px-4 py-3">
							<p className="text-[13px] text-ink-soft">{tarjeta.etiqueta}</p>
							{listo ? (
								<p
									className={cn(
										"mt-1 text-2xl font-semibold tabular-nums",
										tarjeta.clase,
									)}
								>
									{formatNumber(resultado.resumen[tarjeta.clave])}
								</p>
							) : (
								<span className="mt-2 block h-6 w-10 animate-pulse rounded-full bg-sand-200" />
							)}
						</div>
					))}
				</div>

				{resultado?.error && !cargando && !rangoInvalido && (
					<div className="mt-6">
						<Alert tone="error">{resultado.error}</Alert>
						<Button
							className="mt-4"
							variant="outline"
							size="sm"
							onClick={() => setIntento((actual) => actual + 1)}
						>
							<ArrowsClockwise aria-hidden="true" className="size-4" />
							Reintentar
						</Button>
					</div>
				)}

				{listo && total > 0 && (
					<div className="mt-6">
						<h2 className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
							Vista previa
						</h2>
						<ul className="mt-2 divide-y divide-sand-200">
							{resultado.reportes.slice(0, filasVistaPrevia).map((reporte) => (
								<li
									key={reporte.id}
									className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
								>
									<p className="min-w-0 text-sm">
										<span className="font-semibold text-pine-950">
											{reporte.materialTitulo}
										</span>{" "}
										<span className="text-ink-soft">
											· {reporte.usuarioNombre ?? "Usuario eliminado"}
										</span>
									</p>
									<p className="text-[13px] whitespace-nowrap text-ink-soft">
										{formatDate(reporte.fechaPrestamo)} ·{" "}
										{etiquetasEstado[reporte.estado] ?? reporte.estado}
									</p>
								</li>
							))}
						</ul>
						{total > filasVistaPrevia && (
							<p className="mt-2 text-[13px] text-ink-soft">
								…y {formatNumber(total - filasVistaPrevia)} más en el PDF.
							</p>
						)}
					</div>
				)}

				{listo && total === 0 && (
					<p className="mt-6 text-sm text-ink-soft">
						No hay préstamos con estos filtros.
					</p>
				)}

				{descarga.error && (
					<Alert tone="error" className="mt-6">
						{descarga.error}
					</Alert>
				)}

				<div className="mt-6 flex flex-col-reverse items-stretch gap-3 border-t border-sand-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
					<p aria-live="polite" className="text-sm text-ink-soft">
						{mensajePdf}
					</p>
					<Button
						onClick={handleDescargar}
						loading={descarga.enCurso}
						disabled={!listo || total === 0}
					>
						{!descarga.enCurso && <FilePdf aria-hidden="true" className="size-[18px]" />}
						{descarga.enCurso ? "Generando PDF..." : "Descargar PDF"}
					</Button>
				</div>
			</section>
		</>
	);
}


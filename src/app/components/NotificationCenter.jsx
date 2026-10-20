// Copia de NotificationCenter de bibliotk-ui 0.4.0, que todavía no está publicada en npm.
// Al publicarla: importar { NotificationCenter } desde "bibliotk-ui" y borrar este archivo y su .css.
import { ArrowsLeftRight } from "@phosphor-icons/react/ArrowsLeftRight";
import { Bell } from "@phosphor-icons/react/Bell";
import { Books } from "@phosphor-icons/react/Books";
import { UsersThree } from "@phosphor-icons/react/UsersThree";
import { X } from "@phosphor-icons/react/X";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "bibliotk-ui";

const relativeFormatter = new Intl.RelativeTimeFormat("es-ES", {
	numeric: "auto",
});

const shortDateFormatter = new Intl.DateTimeFormat("es-ES", {
	day: "numeric",
	month: "short",
});

// "hace un momento", "hace 5 minutos", "hace 2 horas"; desde el día anterior, la fecha corta ("20 oct")
function formatRelativeTime(value, now = Date.now()) {
	const date = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(date.getTime())) return "";

	const seconds = Math.round((date.getTime() - now) / 1000);

	if (seconds > -45) return "hace un momento";

	const minutes = Math.round(seconds / 60);

	if (minutes > -60) return relativeFormatter.format(minutes, "minute");

	const hours = Math.round(minutes / 60);

	if (hours > -24) return relativeFormatter.format(hours, "hour");

	return shortDateFormatter.format(date);
}

const categoryIcons = {
	usuarios: UsersThree,
	catalogo: Books,
	prestamos: ArrowsLeftRight,
};

const statusLabels = {
	connected: "En vivo",
	connecting: "Conectando…",
	disconnected: "Sin conexión, reintentando…",
};

function CategoryIcon({ category, className }) {
	const Icon = categoryIcons[category] ?? Bell;
	return <Icon aria-hidden="true" className={className} />;
}

function Toast({ toast, duration, onDismiss }) {
	// El temporizador no se reinicia si la app pasa una función nueva en cada render
	const onDismissRef = useRef(onDismiss);

	useEffect(() => {
		onDismissRef.current = onDismiss;
	});

	useEffect(() => {
		const timer = setTimeout(() => onDismissRef.current?.(toast.id), duration);
		return () => clearTimeout(timer);
	}, [toast.id, duration]);

	return (
		<div className="btk-toast">
			<span className="btk-toast__icon">
				<CategoryIcon
					category={toast.categoria}
					className="btk-toast__icon-svg"
				/>
			</span>
			<div className="btk-toast__text">
				<p className="btk-toast__title">{toast.titulo}</p>
				<p className="btk-toast__message">{toast.mensaje}</p>
			</div>
			<button
				type="button"
				onClick={() => onDismiss?.(toast.id)}
				aria-label="Cerrar aviso"
				className="btk-toast__close"
			>
				<X aria-hidden="true" className="btk-toast__close-icon" />
			</button>
		</div>
	);
}

// Centro de notificaciones: botón flotante con contador, panel con el historial y avisos
// emergentes. Solo muestra lo que recibe: la conexión (Socket.IO) la maneja cada app.
// Cada notificación: { id, titulo, mensaje, fecha (ISO), categoria }.
function NotificationCenter({
	notifications = [],
	unreadCount = 0,
	readUntil = "",
	toasts = [],
	onDismissToast,
	onOpen,
	status = "connecting",
	toastDuration = 6000,
	className,
}) {
	const [open, setOpen] = useState(false);
	// Al abrir se marcan como leídas, pero se siguen resaltando las nuevas mientras el panel esté abierto
	const [highlightAfter, setHighlightAfter] = useState("");
	// "hace X minutos" se calcula con la hora en que se abrió el panel (explícita: un compilador
	// que memoriza el render no la deja vieja)
	const [now, setNow] = useState(() => Date.now());
	const rootRef = useRef(null);
	const buttonRef = useRef(null);
	const panelId = useId();
	const titleId = useId();

	useEffect(() => {
		if (!open) return;

		function handleKeyDown(event) {
			if (event.key !== "Escape") return;
			setOpen(false);
			buttonRef.current?.focus();
		}

		function handlePointerDown(event) {
			if (!rootRef.current?.contains(event.target)) setOpen(false);
		}

		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("pointerdown", handlePointerDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("pointerdown", handlePointerDown);
		};
	}, [open]);

	function toggle() {
		if (!open) {
			setHighlightAfter(readUntil);
			setNow(Date.now());
			onOpen?.();
		}
		setOpen(!open);
	}

	const buttonLabel =
		unreadCount > 0
			? `Notificaciones, ${unreadCount} sin leer`
			: "Notificaciones";

	return (
		<>
			<section aria-live="polite" aria-label="Avisos" className="btk-toasts">
				{toasts.map((toast) => (
					<Toast
						key={toast.id}
						toast={toast}
						duration={toastDuration}
						onDismiss={onDismissToast}
					/>
				))}
			</section>
			<div ref={rootRef} className={cn("btk-notifications", className)}>
				{open && (
					<div
						id={panelId}
						role="dialog"
						aria-labelledby={titleId}
						className="btk-notifications__panel"
					>
						<header className="btk-notifications__header">
							<h2 id={titleId} className="btk-notifications__title">
								Notificaciones
							</h2>
							<span
								className={cn(
									"btk-notifications__status",
									`btk-notifications__status--${status}`,
								)}
							>
								{statusLabels[status] ?? statusLabels.connecting}
							</span>
						</header>
						{notifications.length === 0 ? (
							<p className="btk-notifications__empty">
								Todavía no hay notificaciones. Lo que pase en la biblioteca
								aparecerá aquí en tiempo real.
							</p>
						) : (
							<ol className="btk-notifications__list">
								{notifications.map((notification) => (
									<li
										key={notification.id}
										className={cn(
											"btk-notifications__item",
											notification.fecha > highlightAfter &&
												"btk-notifications__item--new",
										)}
									>
										<span className="btk-notifications__item-icon">
											<CategoryIcon
												category={notification.categoria}
												className="btk-notifications__item-svg"
											/>
										</span>
										<div className="btk-notifications__item-text">
											<p className="btk-notifications__item-title">
												{notification.titulo}
											</p>
											<p className="btk-notifications__item-message">
												{notification.mensaje}
											</p>
											<time
												dateTime={notification.fecha}
												className="btk-notifications__item-time"
											>
												{formatRelativeTime(notification.fecha, now)}
											</time>
										</div>
									</li>
								))}
							</ol>
						)}
					</div>
				)}
				<button
					ref={buttonRef}
					type="button"
					onClick={toggle}
					aria-expanded={open}
					aria-controls={open ? panelId : undefined}
					aria-label={buttonLabel}
					className="btk-notifications__button"
				>
					<Bell aria-hidden="true" className="btk-notifications__bell" />
					{unreadCount > 0 && (
						<span aria-hidden="true" className="btk-notifications__badge">
							{unreadCount > 9 ? "9+" : unreadCount}
						</span>
					)}
				</button>
			</div>
		</>
	);
}

export default NotificationCenter;

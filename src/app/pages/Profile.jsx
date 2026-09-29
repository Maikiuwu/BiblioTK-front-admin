import { ArrowLeft, ArrowsClockwise, Trash } from "@phosphor-icons/react";
import {
	Alert,
	Button,
	buttonClasses,
	Dialog,
	formatDate,
	PasswordField,
	TextField,
} from "bibliotk-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
	deleteAccount,
	getProfile,
	updateProfile,
} from "../../service/ProfileService.js";
import { createUpdateProfileDto } from "../dto/updateProfile.dto.js";
import { validateUserData } from "../utils/userValidation.js";

const HOME_PATH = "/HomeAdmin";

const cardClasses =
	"max-w-3xl rounded-[28px] bg-sand-50 p-6 shadow-[inset_0_0_0_1px_var(--color-sand-200)] md:p-10";

function toFormData(profile) {
	return {
		nombres: profile?.nombres ?? "",
		apellidos: profile?.apellidos ?? "",
		nombreUsuario: profile?.nombreUsuario ?? "",
		email: profile?.email ?? "",
		cc: profile?.cc == null ? "" : String(profile.cc),
		celular: profile?.celular == null ? "" : String(profile.celular),
	};
}

function DeleteAccountDialog({ open, onClose, onDeleted }) {
	const [password, setPassword] = useState("");
	const [fieldError, setFieldError] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	function handleClose() {
		setPassword("");
		setFieldError("");
		setError("");
		onClose();
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setFieldError("");
		setError("");
		setIsSubmitting(true);

		try {
			await deleteAccount(password);
			await onDeleted();
		} catch (deleteError) {
			if (deleteError.field === "contrasena") {
				setFieldError(deleteError.message);
			} else {
				setError(deleteError.message);
			}
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
			title="¿Eliminar tu cuenta?"
			description="Se eliminarán tu cuenta y tus datos personales de BiblioTK. Esta acción no se puede deshacer."
		>
			<form onSubmit={handleSubmit} className="grid gap-5">
				<PasswordField
					id="confirmar-contrasena"
					label="Escribe tu contraseña para confirmar"
					autoComplete="current-password"
					required
					value={password}
					onChange={(event) => {
						setPassword(event.target.value);
						setFieldError("");
					}}
					error={fieldError || undefined}
				/>
				{error && <Alert tone="error">{error}</Alert>}
				<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
						Cancelar
					</Button>
					<Button type="submit" variant="danger" loading={isSubmitting}>
						{isSubmitting ? "Eliminando..." : "Eliminar cuenta"}
					</Button>
				</div>
			</form>
		</Dialog>
	);
}

// /perfil: aquí adentro están las dos opciones del botón "Editar perfil" del inicio.
// Copia de la página de BiblioTK-front-user (misma API de PerfilBiblioTK), con el inicio y el
// texto de borrado propios del bibliotecario
function Profile({ onAccountDeleted }) {
	const [status, setStatus] = useState("loading");
	const [profile, setProfile] = useState(null);
	const [formData, setFormData] = useState(() => toFormData(null));
	const [fieldError, setFieldError] = useState(null);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const isMountedRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// Solo actualiza el estado al responder: el "cargando" inicial ya viene del useState
	const loadProfile = useCallback(() => {
		getProfile()
			.then((data) => {
				if (!isMountedRef.current) return;
				setProfile(data);
				setFormData(toFormData(data));
				setStatus("ready");
			})
			.catch((loadError) => {
				if (!isMountedRef.current) return;
				setError(loadError.message);
				setStatus("error");
			});
	}, []);

	useEffect(() => {
		loadProfile();
	}, [loadProfile]);

	function retryLoad() {
		setStatus("loading");
		setError("");
		loadProfile();
	}

	const savedFormData = toFormData(profile);
	const hasChanges = Object.keys(formData).some(
		(field) => formData[field] !== savedFormData[field],
	);
	const initials =
		`${profile?.nombres?.[0] ?? ""}${profile?.apellidos?.[0] ?? ""}`.toUpperCase();
	const memberSince = profile?.fechaRegistro
		? formatDate(profile.fechaRegistro)
		: "";

	function handleChange(event) {
		const { name, value } = event.target;
		setFormData((currentData) => ({ ...currentData, [name]: value }));
		setSuccess("");

		if (fieldError?.field === name) {
			setFieldError(null);
		}
	}

	function errorFor(field) {
		return fieldError?.field === field ? fieldError.message : undefined;
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setSuccess("");

		const validationError = validateUserData(formData);

		if (validationError) {
			setFieldError(validationError);
			document.getElementById(validationError.field)?.focus();
			return;
		}

		setFieldError(null);
		setIsSubmitting(true);

		try {
			const updatedProfile = await updateProfile(
				createUpdateProfileDto(formData),
			);
			const emailChanged = updatedProfile.email !== profile.email;
			setProfile(updatedProfile);
			setFormData(toFormData(updatedProfile));
			setSuccess(
				emailChanged
					? "Tus datos se guardaron. La próxima vez inicia sesión con tu nuevo correo."
					: "Tus datos se guardaron correctamente.",
			);
		} catch (saveError) {
			if (saveError.field) {
				setFieldError({ field: saveError.field, message: saveError.message });
				document.getElementById(saveError.field)?.focus();
			} else {
				setError(saveError.message);
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			<header className="motion-safe:animate-rise">
				<Link
					to={HOME_PATH}
					className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition-colors duration-150 hover:text-pine-900"
				>
					<ArrowLeft
						aria-hidden="true"
						className="size-4 transition-transform duration-200 ease-out-strong group-hover:-translate-x-0.5"
					/>
					Volver al inicio
				</Link>
				<h1 className="mt-6 font-display text-[clamp(2.5rem,5.5vw,4rem)] leading-[0.94] font-extrabold tracking-[-0.045em] text-pine-950">
					Mi perfil
				</h1>
				<p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
					Edita tus datos personales o elimina tu cuenta.
				</p>
			</header>

			{status === "loading" && (
				<div aria-busy="true" className={`${cardClasses} mt-10`}>
					<div className="flex items-center gap-4">
						<span className="block size-14 animate-pulse rounded-2xl bg-sand-200" />
						<div className="grid gap-2">
							<span className="block h-5 w-48 animate-pulse rounded-full bg-sand-200" />
							<span className="block h-3.5 w-36 animate-pulse rounded-full bg-sand-200" />
						</div>
					</div>
					<div className="mt-8 grid gap-5 sm:grid-cols-2">
						{Object.keys(savedFormData).map((field) => (
							<span
								key={field}
								className="block h-[4.75rem] animate-pulse rounded-xl bg-sand-200/70"
							/>
						))}
					</div>
					<p className="sr-only">Cargando tu perfil</p>
				</div>
			)}

			{status === "error" && (
				<div className={`${cardClasses} mt-10`}>
					<Alert tone="error">{error}</Alert>
					<Button className="mt-6" onClick={retryLoad}>
						<ArrowsClockwise aria-hidden="true" className="size-[18px]" />
						Reintentar
					</Button>
				</div>
			)}

			{status === "ready" && (
				<>
					<section
						aria-labelledby="perfil-editar"
						className={`${cardClasses} mt-10 motion-safe:animate-rise [animation-delay:80ms]`}
					>
						<div className="flex items-center gap-4">
							<span
								aria-hidden="true"
								className="grid size-14 shrink-0 place-items-center rounded-2xl bg-pine-900 font-display text-lg font-extrabold tracking-[-0.02em] text-honey-300"
							>
								{initials}
							</span>
							<div className="min-w-0">
								<p className="truncate font-display text-2xl font-extrabold tracking-[-0.035em] text-pine-950">
									{profile.nombres} {profile.apellidos}
								</p>
								{memberSince && (
									<p className="mt-1 text-sm text-ink-soft">
										Miembro desde el {memberSince}
									</p>
								)}
							</div>
						</div>

						<h2
							id="perfil-editar"
							className="mt-8 font-display text-xl font-extrabold tracking-[-0.03em] text-pine-950"
						>
							Editar mis datos
						</h2>

						<form
							onSubmit={handleSubmit}
							className="mt-5 grid gap-5 sm:grid-cols-2"
						>
							<TextField
								id="nombres"
								name="nombres"
								label="Nombres"
								type="text"
								autoComplete="given-name"
								required
								value={formData.nombres}
								onChange={handleChange}
								error={errorFor("nombres")}
							/>
							<TextField
								id="apellidos"
								name="apellidos"
								label="Apellidos"
								type="text"
								autoComplete="family-name"
								required
								value={formData.apellidos}
								onChange={handleChange}
								error={errorFor("apellidos")}
							/>
							<TextField
								id="nombreUsuario"
								name="nombreUsuario"
								label="Nombre de usuario"
								type="text"
								autoComplete="username"
								required
								value={formData.nombreUsuario}
								onChange={handleChange}
								error={errorFor("nombreUsuario")}
							/>
							<TextField
								id="email"
								name="email"
								label="Correo electrónico"
								type="email"
								autoComplete="email"
								required
								value={formData.email}
								onChange={handleChange}
								error={errorFor("email")}
							/>
							<TextField
								id="cc"
								name="cc"
								label="Cédula de identidad"
								type="text"
								inputMode="numeric"
								autoComplete="off"
								required
								value={formData.cc}
								onChange={handleChange}
								error={errorFor("cc")}
							/>
							<TextField
								id="celular"
								name="celular"
								label="Celular"
								type="tel"
								autoComplete="tel"
								required
								value={formData.celular}
								onChange={handleChange}
								error={errorFor("celular")}
							/>

							{error && (
								<Alert tone="error" className="sm:col-span-2">
									{error}
								</Alert>
							)}
							{success && (
								<Alert tone="success" className="sm:col-span-2">
									{success}
								</Alert>
							)}

							<div className="mt-2 flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
								<Link to={HOME_PATH} className={buttonClasses({ variant: "outline" })}>
									Cancelar
								</Link>
								<Button
									type="submit"
									loading={isSubmitting}
									disabled={!hasChanges}
								>
									{isSubmitting ? "Guardando..." : "Guardar cambios"}
								</Button>
							</div>
						</form>
					</section>

					<section
						aria-labelledby="perfil-eliminar"
						className={`${cardClasses} mt-3 motion-safe:animate-rise [animation-delay:140ms]`}
					>
						<h2
							id="perfil-eliminar"
							className="font-display text-xl font-extrabold tracking-[-0.03em] text-pine-950"
						>
							Eliminar mi cuenta
						</h2>
						<p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
							Borra tu cuenta de bibliotecario y tus datos personales de BiblioTK
							de forma permanente. Solo es posible si queda al menos otra cuenta
							de bibliotecario para administrar el catálogo.
						</p>
						<Button
							variant="danger"
							className="mt-5"
							onClick={() => setIsDeleteOpen(true)}
						>
							<Trash aria-hidden="true" className="size-4" />
							Eliminar mi cuenta
						</Button>
					</section>

					<DeleteAccountDialog
						open={isDeleteOpen}
						onClose={() => setIsDeleteOpen(false)}
						onDeleted={onAccountDeleted}
					/>
				</>
			)}
		</>
	);
}

export default Profile;

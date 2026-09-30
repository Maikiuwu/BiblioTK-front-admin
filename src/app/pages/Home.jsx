import { ArrowsLeftRight } from "@phosphor-icons/react/ArrowsLeftRight";
import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { Books } from "@phosphor-icons/react/Books";
import { FilePdf } from "@phosphor-icons/react/FilePdf";
import { PencilSimple } from "@phosphor-icons/react/PencilSimple";
import { UserCircle } from "@phosphor-icons/react/UserCircle";
import { buttonClasses, cn, formatToday } from "bibliotk-ui";
import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile } from "../../service/ProfileService.js";

const sandSurface = "bg-sand-50 shadow-[inset_0_0_0_1px_var(--color-sand-200)]";

function MaterialesTile() {
	return (
		<Link
			to="/materiales"
			className="grain group relative isolate flex min-h-80 flex-col justify-between overflow-hidden rounded-[28px] bg-pine-900 p-7 text-sand-50 transition-transform duration-200 ease-out-strong active:scale-[0.99] motion-safe:animate-rise md:col-span-2 md:row-span-2 md:min-h-[27rem] md:p-10 [animation-delay:80ms]"
		>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -right-24 -bottom-28 size-[22rem] rounded-full border border-honey-400/30 shadow-[0_0_0_40px_rgb(217_165_90/0.05)] md:size-[30rem]"
			/>
			<div className="relative flex items-start justify-between gap-6">
				<span className="grid size-12 place-items-center rounded-2xl bg-sand-50/10 text-honey-300">
					<Books aria-hidden="true" className="size-6" />
				</span>
				<span className="grid size-12 place-items-center rounded-full bg-honey-400 text-pine-950 transition-transform duration-200 ease-out-strong group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
					<ArrowUpRight aria-hidden="true" className="size-5" />
				</span>
			</div>
			<div className="relative mt-16">
				<h2 className="font-display text-[clamp(3rem,7vw,5rem)] leading-[0.9] font-extrabold tracking-[-0.05em]">
					Material bibliográfico
				</h2>
				<p className="mt-4 max-w-md text-[15px] leading-relaxed text-pine-200">
					Registra y administra libros, revistas y novelas del catálogo, con sus
					portadas.
				</p>
			</div>
		</Link>
	);
}

function SectionTile({ to, title, description, icon: Icon, surface, wide, delay }) {
	return (
		<Link
			to={to}
			className={cn(
				"group flex min-h-52 flex-col justify-between rounded-[28px] p-7 transition-transform duration-200 ease-out-strong active:scale-[0.99] motion-safe:animate-rise",
				surface,
				wide && "md:col-span-3 md:min-h-40 md:flex-row md:items-end",
			)}
			style={{ animationDelay: `${delay}ms` }}
		>
			<div
				className={cn(
					"flex items-start justify-between gap-4",
					wide && "md:flex-1 md:flex-col md:justify-end",
				)}
			>
				<span className="grid size-11 place-items-center rounded-2xl bg-pine-950/10 text-pine-900">
					<Icon aria-hidden="true" className="size-[22px]" />
				</span>
				<span
					aria-hidden="true"
					className={cn(
						"grid size-9 place-items-center rounded-full bg-pine-950/10 text-pine-900 transition-transform duration-200 ease-out-strong group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
						wide && "md:hidden",
					)}
				>
					<ArrowUpRight className="size-4" />
				</span>
			</div>
			<div className={cn("mt-10", wide && "md:mt-0 md:flex-1")}>
				<h2 className="font-display text-3xl font-extrabold tracking-[-0.035em] text-pine-950">
					{title}
				</h2>
				<p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
					{description}
				</p>
			</div>
			{wide && (
				<span
					aria-hidden="true"
					className="hidden size-9 place-items-center rounded-full bg-pine-950/10 text-pine-900 transition-transform duration-200 ease-out-strong group-hover:-translate-y-0.5 group-hover:translate-x-0.5 md:grid"
				>
					<ArrowUpRight className="size-4" />
				</span>
			)}
		</Link>
	);
}

// Un solo botón: editar y eliminar la cuenta viven dentro de /perfil (igual que el lector)
function ProfileTile() {
	const titleId = useId();
	const [profile, setProfile] = useState(null);
	const [status, setStatus] = useState("loading");

	useEffect(() => {
		let isMounted = true;

		getProfile()
			.then((data) => {
				if (!isMounted) return;
				setProfile(data);
				setStatus("ready");
			})
			.catch(() => {
				if (isMounted) setStatus("error");
			});

		return () => {
			isMounted = false;
		};
	}, []);

	const initials = profile
		? `${profile.nombres?.[0] ?? ""}${profile.apellidos?.[0] ?? ""}`.toUpperCase()
		: "";

	return (
		<article
			aria-labelledby={titleId}
			className="flex min-h-52 flex-col justify-between gap-6 rounded-[28px] bg-honey-200 p-7 motion-safe:animate-rise [animation-delay:200ms]"
		>
			<span
				aria-hidden="true"
				className="grid size-11 shrink-0 place-items-center rounded-2xl bg-pine-900 font-display text-sm font-extrabold tracking-[-0.02em] text-honey-300"
			>
				{initials || <UserCircle className="size-5.5" />}
			</span>
			<div>
				<h2
					id={titleId}
					className="font-display text-3xl font-extrabold tracking-[-0.035em] text-pine-950"
				>
					Mi perfil
				</h2>
				{status === "loading" && (
					<div aria-hidden="true" className="mt-3 grid gap-2">
						<span className="block h-3.5 w-36 animate-pulse rounded-full bg-pine-950/10" />
						<span className="block h-3.5 w-44 animate-pulse rounded-full bg-pine-950/10" />
					</div>
				)}
				{status === "ready" && (
					<p className="mt-2 text-sm leading-relaxed text-ink-soft">
						<span className="block truncate font-semibold text-pine-900">
							{profile.nombres} {profile.apellidos}
						</span>
						<span className="block truncate">{profile.email}</span>
					</p>
				)}
				{status === "error" && (
					<p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
						No pudimos cargar tus datos en este momento.
					</p>
				)}
				<Link
					to="/perfil"
					className={buttonClasses({ size: "sm", className: "mt-5" })}
				>
					<PencilSimple aria-hidden="true" className="size-4" />
					Editar perfil
				</Link>
			</div>
		</article>
	);
}

function Home() {
	return (
		<>
			<header className="motion-safe:animate-rise">
				<p className="text-sm font-medium text-ink-soft">{formatToday()}</p>
				<h1 className="mt-3 max-w-3xl font-display text-[clamp(2.75rem,6vw,4.5rem)] leading-[0.94] font-extrabold tracking-[-0.045em] text-pine-950">
					Panel del bibliotecario
				</h1>
				<p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
					Selecciona una sección para gestionar el catálogo y los préstamos.
				</p>
			</header>

			<section
				aria-label="Secciones del panel"
				className="mt-10 grid gap-3 md:mt-14 md:grid-cols-3"
			>
				<MaterialesTile />
				<SectionTile
					to="/prestamos"
					title="Préstamos"
					description="Consulta la tabla con todos los préstamos hechos y registra las devoluciones."
					icon={ArrowsLeftRight}
					surface={sandSurface}
					delay={140}
				/>
				<ProfileTile />
				<SectionTile
					to="/reportes"
					title="Reportes"
					description="Exporta en PDF el reporte de préstamos con los datos de cada usuario y material."
					icon={FilePdf}
					surface="bg-pine-100"
					wide
					delay={260}
				/>
			</section>
		</>
	);
}

export default Home;

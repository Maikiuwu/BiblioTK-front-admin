import {
	ArrowsLeftRight,
	ArrowUpRight,
	Books,
	ChartLineUp,
	Clock,
} from "@phosphor-icons/react";
import { cn, formatToday } from "bibliotk-ui";
import { Link } from "react-router-dom";

const sandSurface = "bg-sand-50 shadow-[inset_0_0_0_1px_var(--color-sand-200)]";

const upcomingSections = [
	{
		title: "Préstamos",
		description: "Supervisa los préstamos activos y su historial.",
		icon: ArrowsLeftRight,
		surface: sandSurface,
	},
	{
		title: "Reportes",
		description: "Genera reportes de actividad de la biblioteca.",
		icon: ChartLineUp,
		surface: "bg-pine-100",
		wide: true,
	},
];

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
					Registra y administra libros, revistas y novelas del catálogo.
				</p>
			</div>
		</Link>
	);
}

function UpcomingTile({ title, description, icon: Icon, surface, wide, delay }) {
	return (
		<article
			aria-label={`${title}, próximamente`}
			className={cn(
				"flex min-h-52 flex-col justify-between rounded-[28px] p-7 motion-safe:animate-rise",
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
					className={cn(
						"inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft",
						wide && "md:hidden",
					)}
				>
					<Clock aria-hidden="true" className="size-3.5" />
					Próximamente
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
				<span className="hidden items-center gap-1.5 text-xs font-semibold text-ink-soft md:inline-flex">
					<Clock aria-hidden="true" className="size-3.5" />
					Próximamente
				</span>
			)}
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
					Selecciona una sección para comenzar a gestionar el catálogo.
				</p>
			</header>

			<section
				aria-label="Secciones del panel"
				className="mt-10 grid gap-3 md:mt-14 md:grid-cols-3"
			>
				<MaterialesTile />
				{upcomingSections.map((section, index) => (
					<UpcomingTile key={section.title} {...section} delay={140 + index * 60} />
				))}
			</section>
		</>
	);
}

export default Home;

import { lazy, Suspense, useEffect, useState } from "react";
import { PanelLayout } from "bibliotk-ui";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import {
	esSesionDeEstaApp,
	getCurrentSession,
	logoutUser,
} from "../../service/LoginService.js";

import Home from "./Home.jsx";

// El resumen llega en el paquete inicial; las demás secciones se descargan aparte
const cargarMateriales = () => import("./Materiales.jsx");
const cargarPrestamos = () => import("./Prestamos.jsx");
const cargarProfile = () => import("./Profile.jsx");
const cargarReportes = () =>
	import("./Reportes.jsx").then((modulo) => ({ default: modulo.Reportes }));

const Materiales = lazy(cargarMateriales);
const Prestamos = lazy(cargarPrestamos);
const Profile = lazy(cargarProfile);
const Reportes = lazy(cargarReportes);

function precargarSecciones() {
	cargarMateriales();
	cargarPrestamos();
	cargarProfile();
	cargarReportes();
}

// La sesión se pide apenas carga el módulo, sin esperar al primer render
const sesionInicial = getCurrentSession().then(
	(session) => ({ session }),
	(error) => ({ error }),
);

const LOGIN_URL = import.meta.env.VITE_LOGIN_APP_URL ?? "http://localhost:5172";

// VITE_LOGIN_APP_URL puede venir con "/" final o incluso con "/login": la ruta se resuelve
// sobre su origen para no terminar en "//login" (que la landing no reconoce)
function landingUrl(ruta) {
	return new URL(ruta, LOGIN_URL).toString();
}

function getSessionUser(session) {
	return session?.user ?? session ?? null;
}

function ProtectedApp() {
	const [user, setUser] = useState(null);
	const [status, setStatus] = useState("loading");

	useEffect(() => {
		let isActive = true;

		sesionInicial.then(({ session, error }) => {
			if (!isActive) return;

			if (error) {
				setStatus("unauthenticated");
				return;
			}

			setUser(getSessionUser(session));
			setStatus(esSesionDeEstaApp(session) ? "ready" : "forbidden");
		});

		return () => {
			isActive = false;
		};
	}, []);

	useEffect(() => {
		// Con "atrás" el navegador puede mostrar la página tal como quedó (bfcache) sin volver a pedir
		// la sesión, y otra pestaña pudo cerrarla: cada vez que la página vuelve a verse se le pregunta
		// al servidor. Al salir se oculta, para que no se alcance a ver si la sesión ya no existe
		let revisando = false;

		async function revalidarSesion() {
			if (revisando) return;
			revisando = true;

			try {
				const session = await getCurrentSession();

				if (esSesionDeEstaApp(session)) {
					document.documentElement.style.visibility = "";
				} else {
					window.location.replace(landingUrl("/login?motivo=sin_permiso"));
				}
			} catch {
				window.location.replace(landingUrl("/login?motivo=sesion_expirada"));
			} finally {
				revisando = false;
			}
		}

		function ocultarAlSalir() {
			document.documentElement.style.visibility = "hidden";
		}

		function revisarAlVolver(event) {
			if (event.persisted) revalidarSesion();
		}

		function revisarAlMostrarPestana() {
			if (document.visibilityState === "visible") revalidarSesion();
		}

		window.addEventListener("pagehide", ocultarAlSalir);
		window.addEventListener("pageshow", revisarAlVolver);
		document.addEventListener("visibilitychange", revisarAlMostrarPestana);

		return () => {
			window.removeEventListener("pagehide", ocultarAlSalir);
			window.removeEventListener("pageshow", revisarAlVolver);
			document.removeEventListener("visibilitychange", revisarAlMostrarPestana);
		};
	}, []);

	useEffect(() => {
		// Sin sesión o con otra cuenta: esta app no tiene "/" propio, se vuelve a la landing.
		// El motivo viaja por la URL porque no hay forma de pasar estado de React entre apps.
		// replace (no assign): así "atrás" no regresa a una página que solo vuelve a redirigir
		if (status === "unauthenticated") {
			window.location.replace(landingUrl("/login?motivo=sesion_expirada"));
		} else if (status === "forbidden") {
			window.location.replace(landingUrl("/login?motivo=sin_permiso"));
		} else if (status === "ready") {
			// Con el panel en pantalla, las demás secciones se bajan cuando el navegador queda libre
			if ("requestIdleCallback" in window) {
				requestIdleCallback(precargarSecciones);
			} else {
				setTimeout(precargarSecciones, 200);
			}
		}
	}, [status]);

	// replace: la página del panel sale del historial y "atrás" no vuelve a ella
	async function handleLogout() {
		try {
			await logoutUser();
		} finally {
			window.location.replace(LOGIN_URL);
		}
	}

	async function handleAccountDeleted() {
		await logoutUser().catch(() => undefined);
		window.location.replace(landingUrl("/login?motivo=cuenta_eliminada"));
	}

	if (status !== "ready") return null;

	return (
		<Routes>
			<Route
				element={
					<PanelLayout
						navItems={[
							{ to: "/HomeAdmin", label: "Resumen", end: true },
							{ to: "/materiales", label: "Materiales" },
							{ to: "/prestamos", label: "Préstamos" },
							{ to: "/reportes", label: "Reportes" },
							{ to: "/perfil", label: "Mi perfil" },
						]}
						homePath="/HomeAdmin"
						userLabel={user?.email ?? user?.correo}
						onLogout={handleLogout}
					>
						<Suspense fallback={null}>
							<Outlet />
						</Suspense>
					</PanelLayout>
				}
			>
				<Route path="/HomeAdmin" element={<Home />} />
				<Route path="/materiales" element={<Materiales />} />
				<Route path="/prestamos" element={<Prestamos />} />
				<Route path="/reportes" element={<Reportes />} />
				<Route
					path="/perfil"
					element={<Profile onAccountDeleted={handleAccountDeleted} />}
				/>
			</Route>
			<Route path="*" element={<Navigate to="/HomeAdmin" replace />} />
		</Routes>
	);
}

function App() {
	return <ProtectedApp />;
}

export default App;

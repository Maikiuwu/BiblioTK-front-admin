import { lazy, Suspense, useEffect, useState } from "react";
import { NotificationCenter, PanelLayout } from "bibliotk-ui";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import {
	esSesionDeEstaApp,
	getCurrentSession,
	logoutUser,
} from "../../service/LoginService.js";
import { useNotificaciones } from "../hooks/useNotificaciones.js";

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
// sobre su origen para no terminar en "//login" (que la landing no reconoce). Detrás del gateway
// es relativa ("/"), así que primero se resuelve contra el origen de esta página
function landingUrl(ruta) {
	return new URL(ruta, new URL(LOGIN_URL, window.location.origin)).toString();
}

// Se le pregunta otra vez al servidor si la sesión sigue viva y es de esta app; si no, a la landing.
// La usan el regreso con "atrás" o a la pestaña y el aviso de que el servidor cortó las notificaciones
let revisandoSesion = false;

async function revalidarSesion() {
	if (revisandoSesion) return;
	revisandoSesion = true;

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
		revisandoSesion = false;
	}
}

function getSessionUser(session) {
	return session?.user ?? session ?? null;
}

function ProtectedApp() {
	const [user, setUser] = useState(null);
	const [status, setStatus] = useState("loading");
	// Notificaciones en tiempo real: se conectan cuando la sesión ya se validó
	const centro = useNotificaciones(status === "ready", revalidarSesion);

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
		<>
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
			<NotificationCenter
				notifications={centro.notificaciones}
				unreadCount={centro.sinLeer}
				readUntil={centro.leidasHasta}
				toasts={centro.avisos}
				onDismissToast={centro.descartarAviso}
				onOpen={centro.marcarLeidas}
				status={centro.estado}
			/>
		</>
	);
}

function App() {
	return <ProtectedApp />;
}

export default App;

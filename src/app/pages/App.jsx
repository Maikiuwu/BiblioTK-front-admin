import { lazy, Suspense, useEffect, useState } from "react";
import { PanelLayout } from "bibliotk-ui";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { getCurrentSession, logoutUser } from "../../service/LoginService.js";

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

function getSessionRole(user) {
	return String(user?.rol ?? user?.role ?? "")
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "");
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

			const currentUser = getSessionUser(session);
			setUser(currentUser);
			setStatus(
				getSessionRole(currentUser) === "admin" ? "ready" : "forbidden",
			);
		});

		return () => {
			isActive = false;
		};
	}, []);

	useEffect(() => {
		// Sin sesión o con otro rol: esta app no tiene "/" propio, se vuelve a la landing.
		// El motivo viaja por la URL porque no hay forma de pasar estado de React entre apps.
		if (status === "unauthenticated") {
			window.location.assign(landingUrl("/login?motivo=sesion_expirada"));
		} else if (status === "forbidden") {
			window.location.assign(landingUrl("/login?motivo=sin_permiso"));
		} else if (status === "ready") {
			// Con el panel en pantalla, las demás secciones se bajan cuando el navegador queda libre
			if ("requestIdleCallback" in window) {
				requestIdleCallback(precargarSecciones);
			} else {
				setTimeout(precargarSecciones, 200);
			}
		}
	}, [status]);

	async function handleLogout() {
		try {
			await logoutUser();
		} finally {
			window.location.assign(LOGIN_URL);
		}
	}

	async function handleAccountDeleted() {
		await logoutUser().catch(() => undefined);
		window.location.assign(landingUrl("/login?motivo=cuenta_eliminada"));
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

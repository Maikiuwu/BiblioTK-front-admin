import { useEffect, useState } from "react";
import { PanelLayout } from "bibliotk-ui";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { getCurrentSession, logoutUser } from "../../service/LoginService.js";

import Home from "./Home.jsx";
import Materiales from "./Materiales.jsx";

const LOGIN_URL = import.meta.env.VITE_LOGIN_APP_URL ?? "http://localhost:5172";

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

		getCurrentSession()
			.then((session) => {
				if (!isActive) return;
				const currentUser = getSessionUser(session);
				setUser(currentUser);
				setStatus(
					getSessionRole(currentUser) === "admin" ? "ready" : "forbidden",
				);
			})
			.catch(() => {
				if (isActive) setStatus("unauthenticated");
			});

		return () => {
			isActive = false;
		};
	}, []);

	useEffect(() => {
		// Sin sesión o con otro rol: esta app no tiene "/" propio, se vuelve a la landing.
		// El motivo viaja por la URL porque no hay forma de pasar estado de React entre apps.
		if (status === "unauthenticated") {
			window.location.assign(`${LOGIN_URL}/login?motivo=sesion_expirada`);
		} else if (status === "forbidden") {
			window.location.assign(`${LOGIN_URL}/login?motivo=sin_permiso`);
		}
	}, [status]);

	async function handleLogout() {
		try {
			await logoutUser();
		} finally {
			window.location.assign(LOGIN_URL);
		}
	}

	if (status !== "ready") return null;

	return (
		<Routes>
			<Route
				element={
					<PanelLayout
						navItems={[
							{ to: "/HomeAdmin", label: "Resumen", end: true },
							{ to: "/materiales", label: "Material bibliográfico" },
						]}
						homePath="/HomeAdmin"
						userLabel={user?.email ?? user?.correo}
						onLogout={handleLogout}
					>
						<Outlet />
					</PanelLayout>
				}
			>
				<Route path="/HomeAdmin" element={<Home />} />
				<Route path="/materiales" element={<Materiales />} />
			</Route>
			<Route path="*" element={<Navigate to="/HomeAdmin" replace />} />
		</Routes>
	);
}

function App() {
	return <ProtectedApp />;
}

export default App;

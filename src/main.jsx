import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource-variable/geist";
import { IconContext } from "@phosphor-icons/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/pages/App.jsx";
import "./app/styles/globals.css";

const iconDefaults = { weight: "bold", size: 18 };

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<IconContext.Provider value={iconDefaults}>
			<BrowserRouter>
				<App />
			</BrowserRouter>
		</IconContext.Provider>
	</StrictMode>,
);

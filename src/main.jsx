// Los estilos (fuentes, bibliotk-ui y Tailwind) se enlazan desde index.html
import { IconContext } from "@phosphor-icons/react/dist/lib/context";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/pages/App.jsx";

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

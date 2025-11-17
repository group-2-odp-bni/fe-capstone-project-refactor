import { useEffect } from "react";
import AppRoutes from "./routes";
import { loadClarity } from "./util/clarity";

function App() {
  useEffect(() => {
    const projectId = import.meta.env.VITE_CLARITY_ID;
    if (projectId) {
      loadClarity(projectId);
    } else {
      console.warn("VITE_CLARITY_ID not found");
    }
  }, []);

  return <AppRoutes />;
}
export default App;

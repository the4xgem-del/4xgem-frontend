import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./app/App.tsx";
import { AuthProvider } from "./features/auth/AuthContext";
import { MarketDataProvider } from "./features/market/MarketDataContext";
import "./styles/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MarketDataProvider>
        <App />
      </MarketDataProvider>
    </AuthProvider>
  </QueryClientProvider>,
);

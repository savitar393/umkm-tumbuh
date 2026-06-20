import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppRouter } from "./router";
import "../shared/styles/globals.css";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster position="top-center" richColors toastOptions={{ style: { fontSize: "15px", padding: "16px 24px" } }} />
    </QueryClientProvider>
  );
}

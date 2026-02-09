
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthChecker from "./components/AuthChecker";
import Welcome from "./pages/Welcome";
import WelcomePage from "./pages/WelcomePage";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Likes from "./pages/Likes";
import Chats from "./pages/Chats";
import Oferta from "./pages/Oferta";
import YandexCallback from "./pages/YandexCallback";
import TelegramCallback from "./pages/TelegramCallback";
import ChatGPTPage from "./pages/ChatGPTPage";
import BreedingProcess from "./pages/BreedingProcess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthChecker />
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/feed" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/likes" element={<ProtectedRoute><Likes /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
          <Route path="/oferta" element={<Oferta />} />
          <Route path="/chatgpt" element={<ProtectedRoute><ChatGPTPage /></ProtectedRoute>} />
          <Route path="/breeding-process" element={<ProtectedRoute><BreedingProcess /></ProtectedRoute>} />
          <Route path="/auth/yandex/callback" element={<YandexCallback />} />
          <Route path="/auth/telegram/callback" element={<TelegramCallback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
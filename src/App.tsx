import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "./contexts/LanguageContext";
import { TopicProvider } from "./contexts/TopicContext";
import { SoundProvider } from "./contexts/SoundContext";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Levels from "./pages/Levels";
import Game from "./pages/Game";
import Ranking from "./pages/Ranking";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <LanguageProvider>
        <SoundProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <TopicProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/levels" element={<Levels />} />
                  <Route path="/game/:level" element={<Game />} />
                  <Route path="/ranking" element={<Ranking />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/auth" element={<Auth />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TopicProvider>
          </BrowserRouter>
        </TooltipProvider>
        </SoundProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

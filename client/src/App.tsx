import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BookingPage from "./pages/BookingPage";
import AppointmentsManager from "./pages/AppointmentsManager";
import Analytics from "./pages/Analytics";
import AppointmentHistory from "./pages/AppointmentHistory";
import ClientCancelAppointment from "./pages/ClientCancelAppointment";
import BarberBreaksManagement from "./pages/BarberBreaksManagement";
import ReportsExport from "./pages/ReportsExport";

import BreaksCalendarView from "./pages/BreaksCalendarView";
import BreaksCalendarManagement from "./pages/BreaksCalendarManagement";
import SettingsGeneral from "./pages/SettingsGeneral";
import SettingsHours from "./pages/SettingsHours";
import SettingsServices from "./pages/SettingsServices";
import SettingsBreaks from "./pages/SettingsBreaks";
import BarberManagement from "./pages/BarberManagement";
import SyncMonitoringDashboard from "./pages/SyncMonitoringDashboard";
import WhatsappSettings from "./pages/WhatsappSettings";
import SuperAdmin from "./pages/SuperAdmin";
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  const { loading } = useAuth();

  // Show loading spinner while auth state is being resolved
  // This prevents routes from falling through to NotFound during auth transitions
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/booking"} component={BookingPage} />
      {/* Super Admin */}
      <Route path={"/super-admin"} component={SuperAdmin} />
      {/* Dashboard routes — auth is enforced by DashboardLayout */}
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/appointments"} component={AppointmentsManager} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/settings"} component={SettingsGeneral} />
      <Route path={"/settings/hours"} component={SettingsHours} />
      <Route path={"/settings/services"} component={SettingsServices} />
      <Route path={"/settings/breaks"} component={SettingsBreaks} />
      <Route path={"/settings/whatsapp"} component={WhatsappSettings} />
      <Route path={"/barbers"} component={BarberManagement} />
      <Route path={"/appointment-history"} component={AppointmentHistory} />
      <Route path={"/barber-breaks"} component={BarberBreaksManagement} />
      <Route path={"/breaks-calendar"} component={BreaksCalendarView} />
      <Route path={"/breaks-calendar-management"} component={BreaksCalendarManagement} />
      <Route path={"/reports"} component={ReportsExport} />
      <Route path={"/client-cancel"} component={ClientCancelAppointment} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

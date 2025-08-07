import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";

// Pages
import MainPage from "@/pages/main";
import OrdersPage from "@/pages/orders";
import StaffPage from "@/pages/staff";
import EntryStatusPage from "@/pages/entry-status";
import DeliveryPage from "@/pages/delivery";
import GoogleSheetsPage from "@/pages/google-sheets";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MainPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/staff" component={StaffPage} />
      <Route path="/entry-status" component={EntryStatusPage} />
      <Route path="/delivery" component={DeliveryPage} />
      <Route path="/google-sheets" component={GoogleSheetsPage} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-bg-main">
          {/* Header */}
          <header className="bg-navy-dark text-white text-center py-6 shadow-lg">
            <h1 className="text-3xl font-bold tracking-wider">RAJMAHAL the groom studio</h1>
          </header>

          {/* Navigation */}
          <Navigation />

          {/* Main Content */}
          <main className="max-w-4xl mx-auto my-8 bg-white rounded-xl shadow-lg p-8 min-h-96">
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

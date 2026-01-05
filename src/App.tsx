import { useState } from "react";
import { HomeScreen } from "@/pages/HomeScreen";
import { HealthcareScreen } from "@/pages/HealthcareScreen";
import { EmergencyScreen } from "@/pages/EmergencyScreen";
import { LegalScreen } from "@/pages/LegalScreen";
import { GovernmentScreen } from "@/pages/GovernmentScreen";
import { EmploymentScreen } from "@/pages/EmploymentScreen";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { ServiceId } from "@/lib/voiceNavigation";

function AppContent() {
  const [activeScreen, setActiveScreen] = useState<ServiceId | "home">("home");

  const handleServiceSelect = (serviceId: ServiceId) => {
    setActiveScreen(serviceId);
  };

  const handleBack = () => {
    setActiveScreen("home");
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case "home":
        return <HomeScreen onServiceSelect={handleServiceSelect} />;
      case "healthcare":
        return <HealthcareScreen onBack={handleBack} />;
      case "emergency":
        return <EmergencyScreen onBack={handleBack} />;
      case "legal":
        return <LegalScreen onBack={handleBack} />;
      case "government":
        return <GovernmentScreen onBack={handleBack} />;
      case "employment":
        return <EmploymentScreen onBack={handleBack} />;
      default:
        return <HomeScreen onServiceSelect={handleServiceSelect} />;
    }
  };

  return <div className="min-h-screen bg-background">{renderScreen()}</div>;
}

function App() {
  return (
    <TranslationProvider>
      <AppContent />
    </TranslationProvider>
  );
}

export default App;

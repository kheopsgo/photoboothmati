import { PhotoboothProvider, usePhotobooth } from "@/contexts/PhotoboothContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { BackendHealthProvider } from "@/contexts/BackendHealthContext";
import WelcomeScreen from "./WelcomeScreen";
import ModeSelection from "./ModeSelection";
import FilterSelection from "./FilterSelection";
import PreviewScreen from "./PreviewScreen";
import CountdownScreen from "./CountdownScreen";
import CaptureFlow from "./CaptureFlow";
import ResultScreen from "./ResultScreen";
import ThanksScreen from "./ThanksScreen";
import ErrorBoundary from "./ErrorBoundary";

function ScreenRouter() {
  const { screen } = usePhotobooth();

  switch (screen) {
    case "welcome":
      return <WelcomeScreen />;
    case "mode":
      return <ModeSelection />;
    case "filter":
      return <FilterSelection />;
    case "preview":
      return <PreviewScreen />;
    case "countdown":
      return <CountdownScreen />;
    case "capturing":
      return <CaptureFlow />;
    case "result":
    case "share":
      return <ResultScreen />;
    case "thanks":
      return <ThanksScreen />;
    default:
      return <WelcomeScreen />;
  }
}

function AppWithErrorBoundary() {
  const { restart } = usePhotobooth();
  return (
    <ErrorBoundary onReset={restart}>
      <ScreenRouter />
    </ErrorBoundary>
  );
}

export default function PhotoboothApp() {
  return (
    <SettingsProvider>
      <BackendHealthProvider>
        <PhotoboothProvider>
          <div className="mx-auto h-screen w-full bg-background relative overflow-hidden select-none touch-manipulation landscape-app">
            <AppWithErrorBoundary />
          </div>
        </PhotoboothProvider>
      </BackendHealthProvider>
    </SettingsProvider>
  );
}

import { PhotoboothProvider, usePhotobooth } from "@/contexts/PhotoboothContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import WelcomeScreen from "./WelcomeScreen";
import ModeSelection from "./ModeSelection";
import FilterSelection from "./FilterSelection";
import CountdownScreen from "./CountdownScreen";
import CaptureFlow from "./CaptureFlow";
import ResultScreen from "./ResultScreen";
import ShareScreen from "./ShareScreen";

function ScreenRouter() {
  const { screen } = usePhotobooth();

  switch (screen) {
    case "welcome":
      return <WelcomeScreen />;
    case "mode":
      return <ModeSelection />;
    case "filter":
      return <FilterSelection />;
    case "countdown":
      return <CountdownScreen />;
    case "capturing":
      return <CaptureFlow />;
    case "result":
      return <ResultScreen />;
    case "share":
      return <ShareScreen />;
    default:
      return <WelcomeScreen />;
  }
}

export default function PhotoboothApp() {
  return (
    <SettingsProvider>
      <PhotoboothProvider>
        <div className="max-w-lg mx-auto min-h-screen bg-background relative overflow-hidden">
          <ScreenRouter />
        </div>
      </PhotoboothProvider>
    </SettingsProvider>
  );
}

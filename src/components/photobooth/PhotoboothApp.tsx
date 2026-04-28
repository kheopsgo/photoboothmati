import { PhotoboothProvider, usePhotobooth } from "@/contexts/PhotoboothContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import WelcomeScreen from "./WelcomeScreen";
import ModeSelection from "./ModeSelection";
import FilterSelection from "./FilterSelection";
import PreviewScreen from "./PreviewScreen";
import CountdownScreen from "./CountdownScreen";
import CaptureFlow from "./CaptureFlow";
import ResultScreen from "./ResultScreen";
import ThanksScreen from "./ThanksScreen";

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

export default function PhotoboothApp() {
  return (
    <SettingsProvider>
      <PhotoboothProvider>
        <div className="mx-auto min-h-screen w-full max-w-[1100px] bg-background relative overflow-hidden select-none touch-manipulation">
          <ScreenRouter />
        </div>
      </PhotoboothProvider>
    </SettingsProvider>
  );
}

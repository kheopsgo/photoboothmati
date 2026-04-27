import { useState, useEffect, useCallback, useRef } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { X, Camera, Grid2X2, Frame, Palette, Type, Wifi, Loader2, RefreshCw, Lock, Signal, Timer, Upload, CheckCircle, AlertCircle } from "lucide-react";
import type { EventConfig } from "@/config/eventConfig";
import { configureWifi, getWifiNetworks, uploadFrame, type WifiNetwork } from "@/services/api";
import { captureElementAsTransparentPng } from "@/services/frameOverlay";
import PhotoFrame from "./PhotoFrame";

const FRAME_STYLES: { id: EventConfig["frameStyle"]; label: string }[] = [
  { id: "elegant", label: "Élégant" },
  { id: "minimal", label: "Minimal" },
  { id: "botanical", label: "Botanique" },
  { id: "geometric", label: "Géométrique" },
  { id: "polaroid", label: "Polaroid" },
];

const EVENT_TYPES: { id: EventConfig["type"]; label: string }[] = [
  { id: "wedding", label: "Mariage" },
  { id: "birthday", label: "Anniversaire" },
  { id: "corporate", label: "Entreprise" },
  { id: "party", label: "Fête" },
  { id: "custom", label: "Personnalisé" },
];

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, updateEventConfig } = useSettings();
  const { eventConfig } = settings;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-md bg-background h-full overflow-y-auto shadow-2xl animate-slide-up-enter">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display text-2xl text-foreground">Paramètres</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* === MODES === */}
          <Section icon={<Camera size={18} />} title="Modes photo">
            <ToggleRow
              label="1 photo"
              description="Portrait unique"
              checked={settings.allowSingle}
              onChange={(v) => updateSettings({ allowSingle: v })}
              disabled={!settings.allowFour}
            />
            <ToggleRow
              label="4 photos"
              description="Bande photobooth"
              checked={settings.allowFour}
              onChange={(v) => updateSettings({ allowFour: v })}
              disabled={!settings.allowSingle}
            />
          </Section>

          {/* === FILTERS === */}
          <Section icon={<Palette size={18} />} title="Filtres">
            <ToggleRow
              label="Sélection de filtre"
              description="Proposer le choix du filtre aux invités"
              checked={settings.filtersEnabled}
              onChange={(v) => updateSettings({ filtersEnabled: v })}
            />
          </Section>

          {/* === FRAME === */}
          <Section icon={<Frame size={18} />} title="Cadre photo">
            <ToggleRow
              label="Afficher le cadre"
              description="Ajouter un cadre décoratif à la photo"
              checked={settings.frameEnabled}
              onChange={(v) => updateSettings({ frameEnabled: v })}
            />

            {settings.frameEnabled && (
              <div className="space-y-4 mt-4 pl-1 animate-float-up">
                {/* Frame style */}
                <div className="space-y-2">
                  <label className="font-body text-sm font-medium text-foreground">Style du cadre</label>
                  <div className="flex flex-wrap gap-2">
                    {FRAME_STYLES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => updateEventConfig({ frameStyle: s.id })}
                        className={`px-3 py-1.5 rounded-lg font-body text-sm transition-all ${
                          eventConfig.frameStyle === s.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live preview of the selected/customized frame */}
                <div className="space-y-2">
                  <label className="font-body text-sm font-medium text-foreground">Aperçu du cadre</label>
                  <div className="rounded-xl bg-muted/40 border border-border p-4 flex justify-center">
                    <div className="w-48">
                      <PhotoFrame variant="single">
                        <div
                          style={{
                            width: "100%",
                            aspectRatio: "3 / 4",
                            background:
                              "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--background)) 0% 50%) 50% / 16px 16px",
                            borderRadius: "4px",
                          }}
                        />
                      </PhotoFrame>
                    </div>
                  </div>
                </div>

                <SaveFrameButton />

                <p className="font-body text-xs text-muted-foreground leading-relaxed">
                  Ce bouton applique le cadre aux impressions, aux QR codes et aux envois par e-mail.
                </p>
              </div>
            )}
          </Section>

          {/* === WIFI === */}
          <Section icon={<Wifi size={18} />} title="Wi-Fi">
            <WifiSettings />
          </Section>

          {/* === EVENT CONFIG === */}
          <Section icon={<Type size={18} />} title="Personnalisation">
            <div className="space-y-4">
              {/* Event type */}
              <div className="space-y-2">
                <label className="font-body text-sm font-medium text-foreground">Type d'événement</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updateEventConfig({ type: t.id })}
                      className={`px-3 py-1.5 rounded-lg font-body text-sm transition-all ${
                        eventConfig.type === t.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <InputField
                label="Titre"
                placeholder="Alice & Baptiste"
                value={eventConfig.title}
                onChange={(v) => updateEventConfig({ title: v })}
              />
              <InputField
                label="Sous-titre / Date"
                placeholder="12 Juillet 2026"
                value={eventConfig.subtitle}
                onChange={(v) => updateEventConfig({ subtitle: v })}
              />
              <InputField
                label="Monogramme"
                placeholder="A & B"
                value={eventConfig.monogram}
                onChange={(v) => updateEventConfig({ monogram: v })}
                maxLength={10}
              />
              <InputField
                label="URL du logo (optionnel)"
                placeholder="https://..."
                value={eventConfig.logoUrl || ""}
                onChange={(v) => updateEventConfig({ logoUrl: v || undefined })}
              />
              <InputField
                label="Texte du pied de page"
                placeholder="Merci d'avoir partagé ce moment..."
                value={eventConfig.footer || ""}
                onChange={(v) => updateEventConfig({ footer: v || undefined })}
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

/* --- Sub-components --- */

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-primary">{icon}</span>
        <h3 className="font-display text-xl text-foreground">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors disabled:opacity-40"
    >
      <div className="text-left">
        <p className="font-body text-sm font-medium text-foreground">{label}</p>
        <p className="font-body text-xs text-muted-foreground">{description}</p>
      </div>
      <div
        className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-primary-foreground shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}

function signalBars(signalStr: string): number {
  const n = parseInt(signalStr, 10);
  if (isNaN(n)) return 0;
  if (n >= 75) return 4;
  if (n >= 50) return 3;
  if (n >= 25) return 2;
  if (n > 0) return 1;
  return 0;
}

function WifiSettings() {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [networksStatus, setNetworksStatus] = useState<"idle" | "loading" | "error">("idle");
  const [networksError, setNetworksError] = useState("");

  const loadNetworks = useCallback(async () => {
    setNetworksStatus("loading");
    setNetworksError("");
    try {
      const data = await getWifiNetworks();
      // Deduplicate by SSID, keep strongest signal
      const map = new Map<string, WifiNetwork>();
      for (const n of data.networks || []) {
        if (!n.ssid) continue;
        const existing = map.get(n.ssid);
        if (!existing || parseInt(n.signal, 10) > parseInt(existing.signal, 10)) {
          map.set(n.ssid, n);
        }
      }
      const list = Array.from(map.values()).sort(
        (a, b) => parseInt(b.signal, 10) - parseInt(a.signal, 10)
      );
      setNetworks(list);
      setNetworksStatus("idle");
    } catch (err) {
      setNetworksError(err instanceof Error ? err.message : "Erreur lors du chargement des réseaux Wi-Fi");
      setNetworksStatus("error");
    }
  }, []);

  useEffect(() => {
    loadNetworks();
  }, [loadNetworks]);

  const handleConnect = async () => {
    if (!ssid.trim()) return;
    setStatus("loading");
    setErrorMessage("");
    try {
      await configureWifi(ssid.trim(), password);
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur lors de la connexion Wi-Fi");
      setStatus("error");
    }
  };

  const isConnecting = status === "loading";

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="font-body text-xs text-muted-foreground leading-relaxed">
          ⚠️ La connexion peut être temporairement interrompue pendant le changement de réseau.
        </p>
      </div>

      {/* Available networks */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-body text-sm font-medium text-foreground">
            Réseaux Wi-Fi disponibles
          </label>
          <button
            onClick={loadNetworks}
            disabled={networksStatus === "loading" || isConnecting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors text-xs font-body font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={networksStatus === "loading" ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        <div className="rounded-lg border border-border bg-card divide-y divide-border max-h-72 overflow-y-auto">
          {networksStatus === "loading" && networks.length === 0 && (
            <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              <span className="font-body text-sm">Recherche des réseaux...</span>
            </div>
          )}

          {networksStatus === "error" && networks.length === 0 && (
            <div className="p-4">
              <p className="font-body text-sm text-destructive">
                {networksError || "Erreur lors du chargement des réseaux Wi-Fi"}
              </p>
            </div>
          )}

          {networksStatus !== "loading" && networks.length === 0 && networksStatus !== "error" && (
            <div className="p-4">
              <p className="font-body text-sm text-muted-foreground text-center">
                Aucun réseau détecté
              </p>
            </div>
          )}

          {networks.map((net) => {
            const bars = signalBars(net.signal);
            const isSelected = ssid === net.ssid;
            return (
              <button
                key={net.ssid}
                onClick={() => setSsid(net.ssid)}
                disabled={isConnecting}
                className={`w-full flex items-center justify-between gap-3 p-4 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-end gap-0.5 h-5 shrink-0">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-sm ${
                          i <= bars ? "bg-primary" : "bg-border"
                        }`}
                        style={{ height: `${i * 25}%` }}
                      />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm font-medium text-foreground truncate">
                      {net.ssid}
                    </p>
                    <p className="font-body text-xs text-muted-foreground flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Lock size={10} />
                        {net.security || "Ouvert"}
                      </span>
                      <span>•</span>
                      <span>Signal {net.signal}%</span>
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <span className="shrink-0 text-xs font-body font-medium text-primary">
                    Sélectionné
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <InputField
        label="Nom du Wi-Fi"
        placeholder="MonReseauWifi"
        value={ssid}
        onChange={setSsid}
      />

      <div className="space-y-1">
        <label className="font-body text-sm font-medium text-foreground">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isConnecting}
          className="w-full h-12 rounded-lg border border-border bg-background px-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <button
        onClick={handleConnect}
        disabled={isConnecting || !ssid.trim()}
        className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-body text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isConnecting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Connexion en cours...
          </>
        ) : (
          "Connecter"
        )}
      </button>

      {status === "success" && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <p className="font-body text-sm text-foreground">✓ Connexion Wi-Fi réussie !</p>
        </div>
      )}

      {status === "error" && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <p className="font-body text-sm text-destructive">{errorMessage || "Erreur lors de la connexion Wi-Fi"}</p>
        </div>
      )}
    </div>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="font-body text-sm font-medium text-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
      />
    </div>
  );
}

function CaptureOffsetSetting({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const MIN = 0;
  const MAX = 2500;
  const STEP = 100;
  const safeValue = Math.max(MIN, Math.min(MAX, Number.isFinite(value) ? value : 1500));

  const handleNumber = (raw: string) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) {
      onChange(0);
      return;
    }
    const clamped = Math.max(MIN, Math.min(MAX, Math.round(n / STEP) * STEP));
    onChange(clamped);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="font-body text-sm font-medium text-foreground">
          Décalage de déclenchement (ms)
        </label>
        <p className="font-body text-xs text-muted-foreground leading-relaxed">
          Permet de compenser la latence de l'appareil photo. Plus la valeur est élevée,
          plus le déclenchement réel part tôt avant la fin du décompte.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={safeValue}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="flex-1 h-2 rounded-full bg-muted accent-primary cursor-pointer touch-manipulation"
        />
        <input
          type="number"
          min={MIN}
          max={MAX}
          step={STEP}
          value={safeValue}
          onChange={(e) => handleNumber(e.target.value)}
          className="w-24 h-11 rounded-lg border border-border bg-background px-3 text-sm font-body text-foreground focus:border-primary focus:outline-none transition-colors text-center"
        />
      </div>

      <div className="flex items-center justify-between text-xs font-body text-muted-foreground">
        <span>{MIN} ms</span>
        <span>{MAX} ms</span>
      </div>

      <p className="font-body text-sm text-foreground">
        {safeValue === 0
          ? "Déclenchement sans anticipation"
          : `Le déclenchement réel part ${safeValue} ms avant la fin visuelle du décompte`}
      </p>
    </div>
  );
}

function SaveFrameButton() {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const frameRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    if (status === "saving") return;
    const el = frameRef.current;
    if (!el) {
      setStatus("error");
      setMessage("Cadre introuvable");
      return;
    }
    setStatus("saving");
    setMessage("");
    try {
      // Wait one frame so the offscreen render is fully laid out
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const dataUrl = await captureElementAsTransparentPng(el, 1200, 1600);
      await uploadFrame(dataUrl);
      setStatus("success");
      setMessage("Cadre enregistré pour l'impression");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error && err.message ? err.message : "Erreur lors de l'enregistrement du cadre");
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleSave}
        disabled={status === "saving"}
        className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-body text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {status === "saving" ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Enregistrement du cadre...
          </>
        ) : (
          <>
            <Upload size={16} />
            Enregistrer ce cadre pour l'impression
          </>
        )}
      </button>

      {status === "success" && message && (
        <p className="text-sm text-accent-foreground flex items-center gap-1.5">
          <CheckCircle size={14} />
          {message}
        </p>
      )}
      {status === "error" && message && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <AlertCircle size={14} />
          {message}
        </p>
      )}

      {/* Offscreen render of the frame with a transparent hole, used as the export source */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          width: "1200px",
          pointerEvents: "none",
          opacity: 1,
        }}
      >
        <div ref={frameRef} style={{ width: "1200px", background: "transparent" }}>
          <PhotoFrame variant="single">
            {/* Transparent placeholder matching the printed photo aspect ratio (3:4) */}
            <div
              style={{
                width: "100%",
                aspectRatio: "3 / 4",
                background: "transparent",
              }}
            />
          </PhotoFrame>
        </div>
      </div>
    </div>
  );
}

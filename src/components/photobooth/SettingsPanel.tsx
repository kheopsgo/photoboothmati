import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { X, Camera, Grid2X2, Frame, Palette, Type, Wifi, Loader2 } from "lucide-react";
import type { EventConfig } from "@/config/eventConfig";
import { configureWifi } from "@/services/api";

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

function WifiSettings() {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

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

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="font-body text-xs text-muted-foreground leading-relaxed">
          ⚠️ La connexion peut être temporairement interrompue pendant le changement de réseau.
        </p>
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
          className="w-full h-12 rounded-lg border border-border bg-background px-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <button
        onClick={handleConnect}
        disabled={status === "loading" || !ssid.trim()}
        className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-body text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {status === "loading" ? (
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

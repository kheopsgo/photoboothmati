import { useState, useEffect, useCallback, useRef } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { X, Camera, Grid2X2, Frame, Palette, Type, Wifi, Loader2, RefreshCw, Lock, Signal, Timer, Upload, CheckCircle, AlertCircle, Github, Download, Maximize2, Minimize2, Trash2, Cloud, ExternalLink } from "lucide-react";
import { enterFullscreen, exitFullscreen, isFullscreen } from "@/lib/fullscreen";
import type { EventConfig } from "@/config/eventConfig";
import { configureWifi, getWifiNetworks, trashPhotos, updateFrontend, uploadFrame, type WifiNetwork } from "@/services/api";
import { captureElementAsTransparentPng } from "@/services/frameOverlay";
import PhotoFrame from "./PhotoFrame";
import QRCode from "qrcode";

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

          {/* === GOOGLE DRIVE === */}
          <Section icon={<Cloud size={18} />} title="Sauvegarde Google Drive">
            <GoogleDriveSection />
          </Section>

          {/* === SECURITY === */}
          <Section icon={<Lock size={18} />} title="Sécurité événement">
            <ToggleRow
              label="Mode événement verrouillé"
              description="Cache les paramètres. Appui long 5s sur le logo pour accéder."
              checked={settings.lockedMode}
              onChange={(v) => updateSettings({ lockedMode: v })}
            />
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-foreground">Code PIN admin</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={settings.adminPin}
                onChange={(e) =>
                  updateSettings({ adminPin: e.target.value.replace(/\D/g, "") })
                }
                className="w-full h-12 rounded-lg border border-border bg-background px-4 font-mono text-lg tracking-widest"
                placeholder="1234"
              />
              <p className="text-xs text-muted-foreground">
                4 à 8 chiffres. Demandé après l'appui long sur le logo.
              </p>
            </div>
          </Section>

          {/* === SYSTEM === */}
          <Section icon={<Github size={18} />} title="Système">
            <FullscreenToggle />
            <UpdateFromGithub />
            <TrashPhotosButton />
          </Section>
        </div>
      </div>
    </div>
  );
}

function FullscreenToggle() {
  const [active, setActive] = useState(isFullscreen());

  useEffect(() => {
    const onChange = () => setActive(isFullscreen());
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const handleToggle = async () => {
    if (active) {
      exitFullscreen();
    } else {
      await enterFullscreen();
    }
    setActive(isFullscreen());
  };

  return (
    <button
      onClick={handleToggle}
      className="w-full h-12 rounded-lg bg-muted text-foreground font-body text-sm font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2 border border-border"
    >
      {active ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      {active ? "Quitter le plein écran" : "Activer plein écran"}
    </button>
  );
}

function UpdateFromGithub() {
  const [status, setStatus] = useState<"idle" | "confirm" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleClick = () => {
    if (status === "loading") return;
    setStatus("confirm");
  };

  const handleConfirm = async () => {
    setStatus("loading");
    setMessage("");
    try {
      const res = await updateFrontend();
      setMessage(res.message || "Mise à jour terminée, rechargement…");
      setStatus("success");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
      setStatus("error");
    }
  };

  const handleCancel = () => {
    setStatus("idle");
    setMessage("");
  };

  const isLoading = status === "loading";

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="font-body text-xs text-muted-foreground leading-relaxed">
          Met à jour l'interface du photobooth depuis le dépôt GitHub. La page sera rechargée automatiquement.
        </p>
      </div>

      {status === "confirm" ? (
        <div className="space-y-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
          <p className="font-body text-sm text-foreground">
            Voulez-vous mettre à jour l'interface depuis GitHub ?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-body text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Oui, mettre à jour
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 h-11 rounded-lg bg-muted text-muted-foreground font-body text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={isLoading || status === "success"}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-body text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Mise à jour en cours…
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle size={16} />
              Rechargement…
            </>
          ) : (
            <>
              <Download size={16} />
              Mettre à jour depuis GitHub
            </>
          )}
        </button>
      )}

      {status === "success" && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <p className="font-body text-sm text-foreground">✓ {message || "Mise à jour terminée, rechargement…"}</p>
        </div>
      )}

      {status === "error" && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <p className="font-body text-sm text-destructive flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{message || "Erreur lors de la mise à jour"}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function TrashPhotosButton() {
  const [status, setStatus] = useState<"idle" | "confirm" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleConfirm = async () => {
    setStatus("loading");
    setMessage("");
    try {
      const res = await trashPhotos();
      setMessage(res.message || "Photos mises à la corbeille");
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur lors de la mise à la corbeille");
      setStatus("error");
    }
  };

  const isLoading = status === "loading";

  return (
    <div className="space-y-3">
      {status === "confirm" ? (
        <div className="space-y-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <p className="font-body text-sm text-foreground">
            Voulez-vous vraiment mettre toutes les photos à la corbeille ?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="flex-1 h-11 rounded-lg bg-destructive text-destructive-foreground font-body text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              Oui, à la corbeille
            </button>
            <button
              onClick={() => { setStatus("idle"); setMessage(""); }}
              className="flex-1 h-11 rounded-lg bg-muted text-muted-foreground font-body text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => !isLoading && setStatus("confirm")}
          disabled={isLoading}
          className="w-full h-12 rounded-lg bg-muted text-foreground font-body text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-border"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Mise à la corbeille…
            </>
          ) : (
            <>
              <Trash2 size={16} />
              Mettre les photos à la corbeille
            </>
          )}
        </button>
      )}

      {status === "success" && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <p className="font-body text-sm text-foreground">✓ {message}</p>
        </div>
      )}

      {status === "error" && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <p className="font-body text-sm text-destructive flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{message}</span>
          </p>
        </div>
      )}
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

    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 6000;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    let lastErr: unknown = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const data = await getWifiNetworks();
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
        return;
      } catch (err) {
        lastErr = err;
        if (attempt < MAX_ATTEMPTS) {
          await sleep(RETRY_DELAY_MS);
        }
      }
    }

    console.warn("Wi-Fi networks fetch failed after retries", lastErr);
    setNetworksError(
      "Impossible de récupérer les réseaux. Vérifiez que vous êtes reconnecté au WiFi Photobooth_Setup puis réessayez."
    );
    setNetworksStatus("error");
  }, []);

  useEffect(() => {
    loadNetworks();
  }, [loadNetworks]);

  const [showTimeoutHint, setShowTimeoutHint] = useState(false);

  const handleConnect = () => {
    if (!ssid.trim()) return;
    setErrorMessage("");
    setShowTimeoutHint(false);
    // Fire-and-forget: the backend will switch network and the response will likely never come back.
    configureWifi(ssid.trim(), password).catch(() => {
      // Ignore — losing the connection is the expected behavior.
    });
    setStatus("loading");
    // Show fallback hint after 10s if the page hasn't reloaded yet
    window.setTimeout(() => setShowTimeoutHint(true), 10000);
  };

  const handleReconnect = () => {
    window.location.href = "http://photobooth.local:8080";
  };

  const isConnecting = status === "loading";

  return (
    <div className="space-y-4">
      {isConnecting && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-2xl text-center space-y-5">
            <Loader2 size={48} className="animate-spin text-primary mx-auto" />
            <h2 className="font-display text-2xl text-foreground">Connexion en cours...</h2>
            <div className="space-y-2">
              <p className="font-body text-base text-foreground">
                Le photobooth va changer de réseau
              </p>
              <p className="font-body text-sm text-muted-foreground">
                Reconnectez-vous au Wi-Fi du client
              </p>
            </div>
            <button
              onClick={handleReconnect}
              className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-body text-base font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Reconnexion
            </button>
            {showTimeoutHint && (
              <div className="p-3 rounded-lg bg-muted border border-border">
                <p className="font-body text-xs text-muted-foreground leading-relaxed">
                  Si la page ne se recharge pas automatiquement, reconnectez-vous au Wi-Fi et relancez l'application.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
            <div className="flex items-start gap-2 p-6 text-muted-foreground">
              <Loader2 size={16} className="animate-spin mt-0.5 shrink-0" />
              <span className="font-body text-sm">
                Recherche des réseaux en cours… La connexion peut être interrompue quelques secondes.
              </span>
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
    setPreviewUrl(null);
    try {
      // Wait two frames so the offscreen render is fully laid out and styles applied
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const dataUrl = await captureElementAsTransparentPng(el, 1200, 1600);
      setPreviewUrl(dataUrl);
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

      {/* Debug preview of the actual PNG that was uploaded.
          Shown over a checkerboard so transparent areas are visible. */}
      {previewUrl && (
        <div className="space-y-1">
          <p className="font-body text-xs text-muted-foreground">
            Aperçu du PNG envoyé (les zones à damier sont transparentes) :
          </p>
          <div
            className="rounded-lg border border-border p-2 flex justify-center"
            style={{
              background:
                "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--background)) 0% 50%) 50% / 12px 12px",
            }}
          >
            <img
              src={previewUrl}
              alt="Aperçu du cadre exporté"
              className="max-w-full h-auto"
              style={{ maxHeight: 320 }}
            />
          </div>
        </div>
      )}

      {/* Offscreen render of the frame, used as the export source.
          We DO want to keep the decorative backgrounds (card bg, borders,
          ornaments, text). Only the inner photo placeholder must stay
          transparent so the backend can composite the real photo underneath. */}
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
        <div
          ref={frameRef}
          className="frame-export-root"
          style={{ width: "1200px" }}
        >
          <PhotoFrame variant="single">
            {/* Transparent placeholder matching the printed photo aspect ratio (3:4).
                This area must remain fully transparent in the exported PNG so the
                backend can composite the real photo underneath. */}
            <div
              data-frame-photo-hole
              style={{
                width: "100%",
                aspectRatio: "3 / 4",
                background: "transparent",
                backgroundColor: "transparent",
              }}
            />
          </PhotoFrame>
        </div>
      </div>
    </div>
  );
}

function GoogleDriveSection() {
  const driveUrl = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_URL;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!driveUrl) return;
    QRCode.toDataURL(driveUrl, { width: 200, margin: 2 })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(null));
  }, [driveUrl]);

  if (!driveUrl) {
    return (
      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="font-body text-sm text-muted-foreground">
          Lien Google Drive non configuré
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-body text-sm text-muted-foreground leading-relaxed">
        Scannez ce QR code pour ouvrir le dossier des photos sauvegardées
      </p>

      {qrDataUrl && (
        <div className="flex justify-center">
          <div className="p-3 rounded-xl bg-white border border-border">
            <img
              src={qrDataUrl}
              alt="QR code Google Drive"
              className="w-48 h-48"
            />
          </div>
        </div>
      )}

      <button
        onClick={() => window.open(driveUrl, "_blank")}
        className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-body text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        <ExternalLink size={16} />
        Ouvrir Google Drive
      </button>
    </div>
  );
}

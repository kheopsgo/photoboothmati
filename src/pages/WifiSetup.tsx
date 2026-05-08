import { useEffect, useState, useCallback } from "react";
import { Wifi, WifiOff, RefreshCw, Globe, Lock, Loader2, CheckCircle2, AlertCircle, Signal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// On the Raspberry the page is served by Flask on the same host (10.42.0.1:5000),
// so relative URLs work. In dev/preview we fall back to the configured API base.
// When the page is served from the Raspberry Pi (hotspot 10.42.0.1, pi.local,
// or any local IP on port 8080/5000), talk to the Flask backend on port 5000
// of the same host. Otherwise fall back to the configured API base.
function resolveApiBase(): string {
  if (typeof window === "undefined") return import.meta.env.VITE_API_BASE || "";
  const { hostname, port, protocol } = window.location;
  if (port === "5000") return ""; // same origin
  const isLocalHost =
    hostname === "10.42.0.1" ||
    hostname === "pi.local" ||
    hostname.endsWith(".local") ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
  if (isLocalHost) return `${protocol}//${hostname}:5000`;
  return import.meta.env.VITE_API_BASE || "";
}
const API_BASE = resolveApiBase();

interface AdminStatus {
  hotspot?: { active?: boolean; ip?: string; ssid?: string };
  wlan0?: { ssid?: string | null; ip?: string | null; connected?: boolean };
  internet?: boolean;
}

interface WifiNet {
  ssid: string;
  signal: number | string;
  security?: string;
}

type Tone = "green" | "orange" | "red";

function StatusCard({
  title,
  tone,
  icon,
  primary,
  secondary,
}: {
  title: string;
  tone: Tone;
  icon: React.ReactNode;
  primary: string;
  secondary?: string;
}) {
  const tones: Record<Tone, string> = {
    green: "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",
    orange: "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    red: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  };
  return (
    <div className={`rounded-2xl border-2 p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase opacity-80">{title}</div>
          <div className="truncate text-lg font-semibold">{primary}</div>
          {secondary && <div className="truncate text-xs opacity-80">{secondary}</div>}
        </div>
      </div>
    </div>
  );
}

function signalBars(signal: number | string) {
  const n = typeof signal === "string" ? parseInt(signal, 10) || 0 : signal;
  if (n >= 75) return 4;
  if (n >= 50) return 3;
  if (n >= 25) return 2;
  return 1;
}

export default function WifiSetup() {
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [networks, setNetworks] = useState<WifiNet[]>([]);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [password, setPassword] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);

  // Allow scrolling on this page (override photobooth global lock)
  useEffect(() => {
    const targets = [document.documentElement, document.body, document.getElementById("root")];
    const prev = targets.map((el) => el && { overflow: el.style.overflow, height: el.style.height });
    targets.forEach((el) => {
      if (el) {
        el.style.overflow = "auto";
        el.style.height = "auto";
      }
    });
    return () => {
      targets.forEach((el, i) => {
        const p = prev[i];
        if (el && p) {
          el.style.overflow = p.overflow;
          el.style.height = p.height;
        }
      });
    };
  }, []);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch(`${API_BASE}/admin/status`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      // Don't toast on initial silent load failures
      console.warn("status fetch failed", e);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const scan = async () => {
    setScanning(true);
    setNetworks([]);
    try {
      // Try the legacy endpoint first (backend exposes /wifi-networks),
      // then fall back to the namespaced one if available.
      let res = await fetch(`${API_BASE}/wifi-networks`);
      if (!res.ok) {
        const alt = await fetch(`${API_BASE}/api/wifi/networks`);
        if (alt.ok) res = alt;
      }
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const list: WifiNet[] = Array.isArray(data)
        ? data
        : data.networks || data.results || [];
      // Dédupliquer par SSID, garder le meilleur signal
      const map = new Map<string, WifiNet>();
      for (const n of list) {
        if (!n.ssid) continue;
        const prev = map.get(n.ssid);
        const s = typeof n.signal === "string" ? parseInt(n.signal, 10) || 0 : n.signal;
        const ps = prev ? (typeof prev.signal === "string" ? parseInt(prev.signal, 10) || 0 : prev.signal) : -1;
        if (!prev || s > ps) map.set(n.ssid, n);
      }
      setNetworks([...map.values()].sort((a, b) => signalBars(b.signal) - signalBars(a.signal)));
    } catch (e) {
      console.error("wifi scan failed", e);
      const msg = e instanceof Error ? e.message : "";
      toast.error(`Impossible de scanner les réseaux Wi-Fi${msg ? ` (${msg})` : ""}`);
    } finally {
      setScanning(false);
    }
  };

  const connect = async () => {
    if (!selected) {
      toast.error("Sélectionnez un réseau Wi-Fi");
      return;
    }
    setConnecting(true);
    try {
      let res = await fetch(`${API_BASE}/wifi-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssid: selected, password, interface: "wlan0" }),
      });
      if (!res.ok && res.status === 404) {
        res = await fetch(`${API_BASE}/api/wifi/connect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ssid: selected, password, interface: "wlan0" }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || data.error || "Échec de la connexion");
      }
      toast.success(`Connecté à ${selected}`);
      setPassword("");
      setTimeout(fetchStatus, 2500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur de connexion";
      toast.error(msg);
    } finally {
      setConnecting(false);
    }
  };

  const testInternet = async () => {
    setTesting(true);
    try {
      let res = await fetch(`${API_BASE}/wifi/internet-test`);
      if (!res.ok && res.status === 404) {
        res = await fetch(`${API_BASE}/api/wifi/internet-test`);
      }
      const data = await res.json().catch(() => ({}));
      const ok = data.internet ?? data.success ?? res.ok;
      if (ok) toast.success("Internet disponible ✓");
      else toast.error("Pas d'accès Internet");
      setStatus((s) => ({ ...(s || {}), internet: !!ok }));
    } catch {
      toast.error("Pas d'accès Internet");
      setStatus((s) => ({ ...(s || {}), internet: false }));
    } finally {
      setTesting(false);
    }
  };

  const hotspotActive = status?.hotspot?.active ?? true;
  const wlan0Connected = !!status?.wlan0?.connected || !!status?.wlan0?.ssid;
  const internetOk = status?.internet === true;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Configuration Wi-Fi</h1>
          <p className="text-sm text-muted-foreground">
            Connectez le photobooth au Wi-Fi du lieu de l'événement.
          </p>
        </header>

        {/* Statuts */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatusCard
            title="Hotspot"
            tone={hotspotActive ? "green" : "red"}
            icon={hotspotActive ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
            primary={hotspotActive ? "Actif" : "Inactif"}
            secondary={status?.hotspot?.ip || "10.42.0.1"}
          />
          <StatusCard
            title="Wi-Fi (wlan0)"
            tone={wlan0Connected ? "green" : "orange"}
            icon={wlan0Connected ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
            primary={status?.wlan0?.ssid || "Non connecté"}
            secondary={status?.wlan0?.ip || "—"}
          />
          <StatusCard
            title="Internet"
            tone={internetOk ? "green" : wlan0Connected ? "orange" : "red"}
            icon={<Globe className="h-6 w-6" />}
            primary={internetOk ? "Disponible" : "Indisponible"}
          />
        </section>

        <div className="flex flex-wrap gap-2">
          <Button onClick={fetchStatus} variant="outline" disabled={loadingStatus} size="sm">
            {loadingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Actualiser le statut
          </Button>
          <Button onClick={testInternet} variant="outline" disabled={testing} size="sm">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            Tester Internet
          </Button>
        </div>

        {/* Scan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl">
              <span>Réseaux Wi-Fi disponibles</span>
              <Button onClick={scan} disabled={scanning} size="sm">
                {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {scanning ? "Scan…" : "Scanner"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {networks.length === 0 && !scanning && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Appuyez sur « Scanner » pour détecter les réseaux Wi-Fi à proximité.
              </p>
            )}
            {networks.map((n) => {
              const active = selected === n.ssid;
              const bars = signalBars(n.signal);
              return (
                <button
                  key={n.ssid}
                  type="button"
                  onClick={() => setSelected(n.ssid)}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  <Signal className="h-5 w-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{n.ssid}</div>
                    <div className="text-xs text-muted-foreground">
                      Signal {bars}/4 {n.security ? `• ${n.security}` : ""}
                    </div>
                  </div>
                  {n.security && n.security.toLowerCase() !== "open" && (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  {active && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Connexion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Connecter le photobooth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ssid">Réseau Wi-Fi</Label>
              <Input
                id="ssid"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                placeholder="Sélectionnez ou saisissez un SSID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd">Mot de passe</Label>
              <Input
                id="pwd"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe Wi-Fi"
                autoComplete="off"
              />
            </div>
            <Button onClick={connect} disabled={connecting || !selected} className="w-full" size="lg">
              {connecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wifi className="h-5 w-5" />}
              {connecting ? "Connexion en cours…" : "Connecter le photobooth à ce réseau"}
            </Button>
            <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Le hotspot <Badge variant="outline" className="mx-1">Photobooth_Setup</Badge>
                reste actif pendant et après la connexion. Vous ne perdrez pas l'accès à cette page.
              </span>
            </div>
          </CardContent>
        </Card>

        <footer className="text-center text-xs text-muted-foreground py-4">
          Photobooth • Setup Wi-Fi
        </footer>
      </div>
    </div>
  );
}

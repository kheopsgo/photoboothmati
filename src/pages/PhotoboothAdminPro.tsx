import { useEffect, useState, useCallback, Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useBackendHealth } from "@/contexts/BackendHealthContext";
import {
  API_BASE,
  trashPhotos,
  updateFrontend,
} from "@/services/api";
import {
  Activity,
  Wifi,
  HardDrive,
  Image as ImageIcon,
  Server,
  RefreshCw,
  Radio,
  Trash2,
  Download,
  ExternalLink,
  Network,
  Loader2,
  Usb,
  Link2,
  Clock,
} from "lucide-react";

interface UsbStatus {
  connected: boolean;
  freeGb?: number;
  totalGb?: number;
  photoCount?: number;
  error?: string;
}

interface AdminStatus {
  backend?: string;
  camera?: string;
  wifi?: string;
  storage?: string;
  ssid?: string;
  ip?: string;
  hostname?: string;
  diskPercent?: number;
  photosCount?: number;
}

const SETUP_URL = "http://10.42.0.1:5000/setup";

// Error boundary to avoid a fully blank screen if something throws.
class AdminErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[AdminPro] crash:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
          <div className="mx-auto max-w-3xl space-y-4">
            <h1 className="text-2xl font-bold">Erreur sur la page admin</h1>
            <pre className="whitespace-pre-wrap rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-slate-800 px-4 py-2 text-slate-100 hover:bg-slate-700"
            >
              Recharger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function safeFetch(url: string, init?: RequestInit) {
  return fetch(url, init).catch((err) => {
    // eslint-disable-next-line no-console
    console.warn("[AdminPro] fetch failed", url, err);
    return null as unknown as Response;
  });
}

function AdminPage() {
  const { toast } = useToast();
  const { online } = useBackendHealth();
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [usb, setUsb] = useState<UsbStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const buildTime = import.meta.env.VITE_BUILD_TIME;

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [healthRes, statusRes, usbRes] = await Promise.all([
        safeFetch(`${API_BASE}/health`, { cache: "no-store" }),
        safeFetch(`${API_BASE}/admin/status`, { cache: "no-store" }),
        safeFetch(`${API_BASE}/usb-status`, { cache: "no-store" }),
      ]);

      setHealthOk(healthRes?.ok === true);

      if (statusRes && statusRes.ok) {
        try {
          const data = await statusRes.json();
          setStatus(data && typeof data === "object" ? data : {});
        } catch {
          setStatus({});
        }
      }

      if (usbRes && usbRes.ok) {
        try {
          const data = await usbRes.json();
          setUsb(data && typeof data === "object" ? data : { connected: false });
        } catch {
          setUsb({ connected: false });
        }
      } else {
        setUsb({ connected: false });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = window.setInterval(fetchStatus, 10000);
    return () => window.clearInterval(id);
  }, [fetchStatus]);

  // The global photobooth CSS forces html/body/#root to height:100% with
  // overflow:hidden (to lock the landscape capture UI). On the admin page we
  // need normal scrolling, so we relax those rules while this page is mounted.
  useEffect(() => {
    const targets = [document.documentElement, document.body];
    const root = document.getElementById("root");
    if (root) targets.push(root);
    const previous = targets.map((el) => ({
      el,
      overflow: el.style.overflow,
      height: el.style.height,
    }));
    targets.forEach((el) => {
      el.style.overflow = "auto";
      el.style.height = "auto";
    });
    return () => {
      previous.forEach(({ el, overflow, height }) => {
        el.style.overflow = overflow;
        el.style.height = height;
      });
    };
  }, []);

  const handleHotspot = async () => {
    setBusy("hotspot");
    try {
      const res = await fetch(`${API_BASE}/admin/hotspot`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur");
      toast({ title: "Hotspot activé", description: "Le mode hotspot est en cours d'activation." });
    } catch {
      toast({ title: "Échec", description: "Impossible d'activer le hotspot.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleTrash = async () => {
    setBusy("trash");
    try {
      await trashPhotos();
      toast({ title: "Photos vidées", description: "Toutes les photos ont été déplacées à la corbeille." });
      fetchStatus();
    } catch (e) {
      toast({ title: "Échec", description: e instanceof Error ? e.message : "Erreur", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleUpdate = async () => {
    setBusy("update");
    try {
      await updateFrontend();
      toast({ title: "Mise à jour lancée", description: "Le frontend est en cours de mise à jour." });
    } catch (e) {
      toast({ title: "Échec", description: e instanceof Error ? e.message : "Erreur", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const StatusDot = ({ ok }: { ok: boolean | null | undefined }) => (
    <span className="relative flex h-3 w-3">
      {ok && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />}
      <span
        className={`relative inline-flex h-3 w-3 rounded-full ${
          ok === true ? "bg-green-500" : ok === false ? "bg-red-500" : "bg-yellow-500"
        }`}
      />
    </span>
  );

  const links = [
    { label: "Interface photobooth", url: "http://pi.local:8080" },
    { label: "Admin", url: "http://pi.local:8080/#/admin" },
    { label: "Setup Wi-Fi", url: SETUP_URL },
    { label: "API health", url: "http://pi.local:5000/health" },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Photobooth Admin</h1>
            <p className="text-slate-400 mt-1">Tableau de bord terrain</p>
          </div>
          <Button
            onClick={fetchStatus}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700"
          >
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Actualiser
          </Button>
        </div>

        {/* Statut système */}
        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Activity className="h-5 w-5" /> Statut système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatBox
                icon={<Server className="h-5 w-5" />}
                label="Backend Flask"
                value={
                  <span className="flex items-center gap-2">
                    <StatusDot ok={healthOk === true || status?.backend === "ok"} />
                    {status?.backend === "ok" || healthOk === true
                      ? "En ligne"
                      : healthOk === false || online === false
                      ? "Hors ligne"
                      : "—"}
                  </span>
                }
              />
              <StatBox
                icon={<Link2 className="h-5 w-5" />}
                label="Connexion frontend"
                value={
                  <span className="flex items-center gap-2">
                    <StatusDot ok={online === true || online === null} />
                    {online === true ? "En ligne" : online === false ? "Hors ligne" : "Inconnue"}
                  </span>
                }
              />
              <StatBox
                icon={<Wifi className="h-5 w-5" />}
                label="Wi-Fi connecté"
                value={status?.ssid || "—"}
              />
              <StatBox
                icon={<Network className="h-5 w-5" />}
                label="Adresse IP"
                value={status?.ip || "—"}
              />
              <StatBox
                icon={<Server className="h-5 w-5" />}
                label="Hostname"
                value={status?.hostname || "—"}
              />
              <StatBox
                icon={<HardDrive className="h-5 w-5" />}
                label="Stockage utilisé"
                value={status?.diskPercent != null ? `${status.diskPercent}%` : "—"}
              />
              <StatBox
                icon={<ImageIcon className="h-5 w-5" />}
                label="Nombre de photos"
                value={status?.photosCount != null ? String(status.photosCount) : "—"}
              />
              <StatBox
                icon={<Clock className="h-5 w-5" />}
                label="Build frontend"
                value={
                  buildTime
                    ? new Date(buildTime).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "—"
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Clé USB */}
        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Usb className="h-5 w-5" /> Sauvegarde clé USB
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <StatusDot ok={usb?.connected === true} />
              <span className="font-medium">
                {usb?.connected ? "Clé USB détectée" : "Aucune clé USB détectée"}
              </span>
              {usb?.connected && (
                <Badge variant="secondary" className="bg-slate-800 text-slate-100 border border-slate-700">
                  {usb.photoCount ?? 0} photos sauvegardées
                </Badge>
              )}
            </div>
            {usb?.connected ? (
              <p className="text-sm text-slate-400">
                Espace libre : <span className="text-slate-200 font-medium">{usb.freeGb ?? "?"} Go</span>
                {usb.totalGb ? <> / {usb.totalGb} Go</> : null}. Les photos sont copiées automatiquement dans <code className="text-slate-200">/media/usb/photobooth</code>.
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                Branchez une clé USB au Raspberry Pi. La configuration se fait une seule fois — voir le fichier <code className="text-slate-200">BACKEND_USB_BACKUP.md</code> du dépôt pour les instructions.
              </p>
            )}
          </CardContent>
        </Card>



        {/* Actions rapides */}
        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader>
            <CardTitle className="text-slate-100">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                onClick={fetchStatus}
                disabled={loading}
                className="h-16 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700"
              >
                {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                Actualiser
              </Button>
              <Button
                onClick={handleHotspot}
                disabled={busy === "hotspot"}
                className="h-16 bg-amber-600 hover:bg-amber-500 text-white"
              >
                {busy === "hotspot" ? <Loader2 className="animate-spin" /> : <Radio />}
                Forcer hotspot
              </Button>
              <Button
                onClick={handleTrash}
                disabled={busy === "trash"}
                className="h-16 bg-red-700 hover:bg-red-600 text-white"
              >
                {busy === "trash" ? <Loader2 className="animate-spin" /> : <Trash2 />}
                Vider photos
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={busy === "update"}
                className="h-16 bg-blue-700 hover:bg-blue-600 text-white"
              >
                {busy === "update" ? <Loader2 className="animate-spin" /> : <Download />}
                MAJ frontend
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WiFi */}
        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Wifi className="h-5 w-5" /> Wi-Fi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-400">Réseau actuel :</span>
              <Badge variant="secondary" className="bg-slate-800 text-slate-100 border border-slate-700 text-base px-3 py-1">
                {status?.ssid || "Non connecté"}
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              Pour changer de réseau, connectez la tablette au hotspot <code className="text-slate-200">Photobooth_Setup</code>,
              puis ouvrez la page de configuration ci-dessous.
            </p>
            <Button
              asChild
              className="h-14 bg-emerald-700 hover:bg-emerald-600 text-white"
            >
              <a href={SETUP_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink /> Ouvrir la page de configuration Wi-Fi
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Adresses utiles */}
        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader>
            <CardTitle className="text-slate-100">Adresses utiles</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-800">
              {links.map((l) => (
                <li key={l.url} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="font-medium">{l.label}</div>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-400 hover:text-slate-200 break-all"
                    >
                      {l.url}
                    </a>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700"
                  >
                    <a href={l.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink /> Ouvrir
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 pt-4">
          API : <code>{API_BASE}</code>
        </p>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-lg font-semibold break-all">{value}</div>
    </div>
  );
}

export default function PhotoboothAdminPro() {
  return (
    <AdminErrorBoundary>
      <AdminPage />
    </AdminErrorBoundary>
  );
}

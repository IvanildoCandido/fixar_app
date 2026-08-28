import { FormEvent, useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Session } from "@supabase/supabase-js";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Check,
  ChevronRight,
  CircleHelp,
  Database,
  Download,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Plus,
  Printer,
  QrCode,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import {
  createEquipmentQrPayload,
  createEquipmentReference,
  normalizeEquipmentReference,
} from "@fixar/qr-contract";
import { supabase } from "./supabase";
import { PublicEquipmentPage } from "./PublicEquipmentPage";

type GeneratedCode = { reference: string; dataUrl: string };
type Metrics = { users: number; organizations: number; customers: number; assets: number; work_orders: number; qr_codes: number; storage_files: number; storage_bytes: number };

const menuItems = [
  { label: "Visão geral", icon: LayoutDashboard, active: true },
  { label: "QR Codes", icon: QrCode },
  { label: "Organizações", icon: Boxes },
  { label: "Usuários", icon: Users },
];

function AdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [referenceInput, setReferenceInput] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [codes, setCodes] = useState<GeneratedCode[]>([]);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) void loadSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) void loadSession(nextSession);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  async function loadSession(nextSession: Session | null) {
    setAuthLoading(true);
    setSession(nextSession);
    setAuthorized(false);
    setMetrics(null);
    if (!nextSession) { setAuthLoading(false); return; }
    const { data, error } = await supabase.from("platform_admins").select("user_id").eq("user_id", nextSession.user.id).maybeSingle();
    if (error || !data) {
      await supabase.auth.signOut();
      setAuthError("Esta conta não tem acesso ao painel global.");
      setAuthLoading(false);
      return;
    }
    setAuthorized(true);
    setAuthLoading(false);
    await loadDashboardData();
  }

  async function loadDashboardData() {
    setLoadingMetrics(true);
    setDashboardError("");
    try {
      const [{ data: metricData, error: metricError }, { data: qrData, error: qrError }] = await Promise.all([
        supabase.rpc("platform_admin_metrics"),
        supabase.from("generated_qr_codes").select("reference, payload").order("created_at", { ascending: false }).limit(48),
      ]);
      if (metricError || qrError) throw new Error("Falha ao carregar dados do painel.");
      if (metricData) setMetrics(metricData as Metrics);
      if (qrData) {
        const restored = await Promise.all(qrData.map(async (row) => ({ reference: row.reference, dataUrl: await QRCode.toDataURL(row.payload, { width: 480, margin: 2, color: { dark: "#10261d", light: "#ffffff" } }) })));
        setCodes(restored);
      }
    } catch {
      setDashboardError("Não foi possível atualizar os dados. Tente novamente.");
    } finally {
      setLoadingMetrics(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({ email: String(form.get("email")).trim().toLowerCase(), password: String(form.get("password")) });
    if (error) setAuthError("E-mail ou senha inválidos.");
  }

  async function signOut() { await supabase.auth.signOut(); setCodes([]); }

  async function generateCodes() {
    setError("");
    const references = referenceInput.trim()
      ? [normalizeEquipmentReference(referenceInput)]
      : Array.from({ length: quantity }, () => createEquipmentReference());

    if (references.some((reference) => reference.length !== 7)) {
      setError("Informe uma referência com 7 caracteres ou deixe vazio para gerar automaticamente.");
      return;
    }

    const generated = await Promise.all(references.map(async (reference) => ({
      reference,
      payload: createEquipmentQrPayload(reference),
      dataUrl: await QRCode.toDataURL(createEquipmentQrPayload(reference), {
        width: 480,
        margin: 2,
        color: { dark: "#10261d", light: "#ffffff" },
      }),
    })));
    if (!session) return;
    const { error: insertError } = await supabase.from("generated_qr_codes").insert(generated.map(({ reference, payload }) => ({ reference, payload, generated_by: session.user.id })));
    if (insertError) { setError(insertError.code === "23505" ? "Uma ou mais referências já existem. Gere novamente." : "Não foi possível persistir os QR Codes."); return; }
    setCodes(generated.map(({ reference, dataUrl }) => ({ reference, dataUrl })));
    setMetrics((current) => current ? { ...current, qr_codes: current.qr_codes + generated.length } : current);
  }

  function downloadCode(code: GeneratedCode) {
    const link = document.createElement("a");
    link.download = `fixar-${code.reference}.png`;
    link.href = code.dataUrl;
    link.click();
  }

  function printCodes() {
    if (!codes.length) return;
    window.print();
  }

  const visibleCodes = showAll ? codes : codes.slice(0, 6);
  const ownerName = String(session?.user.user_metadata?.display_name || session?.user.email?.split("@")[0] || "Proprietário");
  const ownerInitials = ownerName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  if (authLoading) return <div className="auth-screen"><div className="auth-box"><div className="brand-mark"><WrenchMark /></div><span className="eyebrow">FIXAR ADMIN</span><h1>Carregando painel</h1><p>Validando seu acesso seguro.</p></div></div>;
  if (!session || !authorized) return <LoginScreen error={authError} onSubmit={handleLogin} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><WrenchMark /></div>
          <div><strong>fixar</strong><span>painel do proprietário</span></div>
        </div>
        <div className="workspace-label">OPERAÇÃO</div>
        <nav className="main-nav" aria-label="Navegação principal">
          {menuItems.map(({ label, icon: Icon, active }) => (
            <button className={`nav-item ${active ? "active" : ""}`} key={label} type="button">
              <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
              <span>{label}</span>
              {active && <ChevronRight size={15} className="nav-chevron" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="system-card">
          <div className="system-card-icon"><ShieldCheck size={18} /></div>
          <div><strong>Ambiente seguro</strong><span>Dados administrativos protegidos</span></div>
        </div>
        <button className="nav-item" type="button"><Settings size={18} /><span>Configurações</span></button>
        <button className="nav-item" type="button"><CircleHelp size={18} /><span>Ajuda</span></button>
        <div className="profile-row">
          <div className="avatar">{ownerInitials}</div>
          <div><strong>{ownerName}</strong><span>Proprietário</span></div>
          <LogOut size={17} className="profile-action" />
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><span className="eyebrow">CENTRAL DE CONTROLE</span><h1>Visão geral</h1></div>
          <div className="topbar-actions"><span className="live-dot"><i /> Operação local</span><button className="icon-button" aria-label="Configurações" type="button"><Settings size={19} /></button></div>
        </header>

        <div className="content-wrap">
          <section className="welcome-row">
            <div><h2>Bom dia, {ownerName.split(/\s+/)[0]}.</h2><p>Acompanhe a operação do Fixar e cuide dos detalhes que mantêm tudo em movimento.</p></div>
            <div className="date-chip">27 AGO 2026 <span>•</span> QUINTA-FEIRA</div>
          </section>

          <section className="metric-grid" aria-label="Indicadores do sistema">
            <MetricCard label="Usuários cadastrados" value={metrics ? String(metrics.users) : "…"} detail="Contas no Auth" icon={Users} tone="green" />
            <MetricCard label="Organizações" value={metrics ? String(metrics.organizations) : "…"} detail={`${metrics?.customers ?? "…"} clientes cadastrados`} icon={Boxes} tone="blue" />
            <MetricCard label="Armazenamento" value={metrics ? formatBytes(metrics.storage_bytes) : "…"} detail={metrics ? `${metrics.storage_files} arquivos` : "Consultando banco"} icon={Database} tone="amber" />
            <MetricCard label="Ordens de serviço" value={metrics ? String(metrics.work_orders) : "…"} detail={metrics ? `${metrics.assets} equipamentos ativos` : "Consultando banco"} icon={Activity} tone="red" />
          </section>
          {dashboardError && <div className="dashboard-error" role="alert"><X size={16} />{dashboardError}</div>}

          <section className="primary-grid">
            <div className="panel qr-panel">
              <div className="panel-heading"><div><span className="section-kicker"><QrCode size={15} /> IDENTIFICAÇÃO</span><h3>Gerar QR Codes</h3><p>Crie etiquetas de equipamento compatíveis com o app Fixar.</p></div><span className="local-badge">GERAÇÃO LOCAL</span></div>
              <div className="generator-form">
                <label>Referência do equipamento <span>opcional</span><input value={referenceInput} onChange={(event) => setReferenceInput(event.target.value)} placeholder="Ex.: FXR8K2M" maxLength={20} /></label>
                <div className="form-divider"><span>ou gere automaticamente</span></div>
                <label className="quantity-label">Quantidade <div className="stepper"><button aria-label="Diminuir quantidade" disabled={quantity <= 1} onClick={() => setQuantity((current) => Math.max(1, current - 1))} type="button">−</button><strong>{quantity}</strong><button aria-label="Aumentar quantidade" disabled={quantity >= 24} onClick={() => setQuantity((current) => Math.min(24, current + 1))} type="button">+</button></div></label>
                {error && <div className="form-error"><X size={15} />{error}</div>}
                <button className="primary-button" onClick={generateCodes} type="button"><Plus size={18} /> Gerar {referenceInput.trim() ? "QR Code" : `${quantity} QR Code${quantity > 1 ? "s" : ""}`}</button>
              </div>
              <div className="panel-note"><ShieldCheck size={16} /><span>O código é criado no navegador e não envia informações para serviços externos.</span></div>
            </div>
            <div className="panel insight-panel"><div className="section-kicker"><Gauge size={15} /> PRÓXIMOS INDICADORES</div><h3>Seu painel está pronto para crescer.</h3><p>Os dados operacionais já estão conectados. Novos indicadores administrativos entram conforme as fontes forem integradas.</p><div className="insight-list"><div><BarChart3 size={17} /><span>Uso por organização</span><em>planejado</em></div><div><Database size={17} /><span>Saúde do banco</span><em>planejado</em></div><div><FileText size={17} /><span>Auditoria de ações</span><em>planejado</em></div></div></div>
          </section>

          {codes.length > 0 && <section className="panel codes-panel" id="qr-results"><div className="panel-heading results-heading"><div><span className="section-kicker"><Check size={15} /> PRONTOS PARA USO</span><h3>QR Codes gerados</h3><p>{codes.length} etiqueta{codes.length > 1 ? "s" : ""} criada{codes.length > 1 ? "s" : ""} nesta sessão.</p></div><div className="results-actions"><button className="secondary-button" onClick={printCodes} type="button"><Printer size={17} /> Imprimir</button><button className="icon-button" onClick={() => setCodes([])} aria-label="Fechar resultados" type="button"><X size={18} /></button></div></div><div className="code-grid">{visibleCodes.map((code) => <article className="code-card" key={code.reference}><div className="code-image-wrap"><img src={code.dataUrl} alt={`QR Code da referência ${code.reference}`} /></div><div className="code-card-footer"><div><span>REFERÊNCIA</span><strong>{code.reference}</strong></div><button className="download-button" onClick={() => downloadCode(code)} aria-label={`Baixar QR Code ${code.reference}`} type="button"><Download size={17} /></button></div></article>)}</div>{codes.length > 6 && <button className="show-more" onClick={() => setShowAll((current) => !current)} type="button">{showAll ? "Mostrar menos" : `Ver os ${codes.length} códigos`} <ArrowUpRight size={16} /></button>}</section>}

          <footer className="footer-note"><span><span className="status-pip" /> Fixar Admin <b>v1.0</b></span><span>{loadingMetrics ? "Atualizando dados..." : "Dados atualizados agora"} · <button className="footer-action" onClick={loadDashboardData} type="button">Atualizar</button> · <button className="footer-action" onClick={signOut} type="button">Sair</button></span></footer>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: typeof Users; tone: string }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={19} /></div><div className="metric-label">{label}</div><strong>{value}</strong><span>{detail}</span></article>;
}

function LoginScreen({ error, onSubmit }: { error: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="auth-screen"><div className="auth-box"><div className="brand-mark"><WrenchMark /></div><span className="eyebrow">FIXAR ADMIN</span><h1>Acesso do proprietário</h1><p>Entre para acompanhar a operação global do Fixar.</p><form onSubmit={onSubmit}><label>E-mail<input name="email" type="email" autoComplete="email" placeholder="seu@email.com" required /></label><label>Senha<input name="password" type="password" autoComplete="current-password" placeholder="Sua senha" required /></label>{error && <div className="form-error"><X size={15} />{error}</div>}<button className="primary-button" type="submit">Entrar no painel</button></form></div></div>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function WrenchMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4.3 4.3 0 0 0-5.5 5.5L4.4 16.6a2.1 2.1 0 1 0 3 3l4.8-4.8a4.3 4.3 0 0 0 5.5-5.5l-2.8 2.8-2.7-.7-.7-2.7 2.8-2.4Z" /></svg>;
}

function App() {
  const match = window.location.pathname.match(/^\/e\/([^/]+)\/?$/i);
  return match ? <PublicEquipmentPage token={match[1]} /> : <AdminApp />;
}

export default App;

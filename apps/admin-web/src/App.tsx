import { useState } from "react";
import QRCode from "qrcode";
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

type GeneratedCode = { reference: string; dataUrl: string };

const menuItems = [
  { label: "Visão geral", icon: LayoutDashboard, active: true },
  { label: "QR Codes", icon: QrCode },
  { label: "Organizações", icon: Boxes },
  { label: "Usuários", icon: Users },
];

const metricCards = [
  { label: "Usuários ativos", value: "--", detail: "Conectar fonte de dados", icon: Users, tone: "green" },
  { label: "Organizações", value: "--", detail: "Conectar fonte de dados", icon: Boxes, tone: "blue" },
  { label: "Armazenamento", value: "--", detail: "Aguardando integração", icon: Database, tone: "amber" },
  { label: "Banda utilizada", value: "--", detail: "Aguardando integração", icon: Activity, tone: "red" },
];

function App() {
  const [referenceInput, setReferenceInput] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [codes, setCodes] = useState<GeneratedCode[]>([]);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

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
      dataUrl: await QRCode.toDataURL(createEquipmentQrPayload(reference), {
        width: 480,
        margin: 2,
        color: { dark: "#10261d", light: "#ffffff" },
      }),
    })));
    setCodes(generated);
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
          <div className="avatar">IC</div>
          <div><strong>Ivanildo Candido</strong><span>Proprietário</span></div>
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
            <div><h2>Bom dia, Ivanildo.</h2><p>Acompanhe a operação do Fixar e cuide dos detalhes que mantêm tudo em movimento.</p></div>
            <div className="date-chip">27 AGO 2026 <span>•</span> QUINTA-FEIRA</div>
          </section>

          <section className="metric-grid" aria-label="Indicadores do sistema">
            {metricCards.map(({ label, value, detail, icon: Icon, tone }) => <article className="metric-card" key={label}>
              <div className={`metric-icon ${tone}`}><Icon size={19} /></div><div className="metric-label">{label}</div><strong>{value}</strong><span>{detail}</span>
            </article>)}
          </section>

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
            <div className="panel insight-panel"><div className="section-kicker"><Gauge size={15} /> PRÓXIMOS INDICADORES</div><h3>Seu painel está pronto para crescer.</h3><p>As métricas de usuários, banco e consumo serão conectadas ao backend administrativo em uma próxima etapa.</p><div className="insight-list"><div><BarChart3 size={17} /><span>Uso por organização</span><em>planejado</em></div><div><Database size={17} /><span>Saúde do banco</span><em>planejado</em></div><div><FileText size={17} /><span>Auditoria de ações</span><em>planejado</em></div></div></div>
          </section>

          {codes.length > 0 && <section className="panel codes-panel" id="qr-results"><div className="panel-heading results-heading"><div><span className="section-kicker"><Check size={15} /> PRONTOS PARA USO</span><h3>QR Codes gerados</h3><p>{codes.length} etiqueta{codes.length > 1 ? "s" : ""} criada{codes.length > 1 ? "s" : ""} nesta sessão.</p></div><div className="results-actions"><button className="secondary-button" onClick={printCodes} type="button"><Printer size={17} /> Imprimir</button><button className="icon-button" onClick={() => setCodes([])} aria-label="Fechar resultados" type="button"><X size={18} /></button></div></div><div className="code-grid">{visibleCodes.map((code) => <article className="code-card" key={code.reference}><div className="code-image-wrap"><img src={code.dataUrl} alt={`QR Code da referência ${code.reference}`} /></div><div className="code-card-footer"><div><span>REFERÊNCIA</span><strong>{code.reference}</strong></div><button className="download-button" onClick={() => downloadCode(code)} aria-label={`Baixar QR Code ${code.reference}`} type="button"><Download size={17} /></button></div></article>)}</div>{codes.length > 6 && <button className="show-more" onClick={() => setShowAll((current) => !current)} type="button">{showAll ? "Mostrar menos" : `Ver os ${codes.length} códigos`} <ArrowUpRight size={16} /></button>}</section>}

          <footer className="footer-note"><span><span className="status-pip" /> Fixar Admin <b>v1.0</b></span><span>Última atualização: agora</span></footer>
        </div>
      </main>
    </div>
  );
}

function WrenchMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4.3 4.3 0 0 0-5.5 5.5L4.4 16.6a2.1 2.1 0 1 0 3 3l4.8-4.8a4.3 4.3 0 0 0 5.5-5.5l-2.8 2.8-2.7-.7-.7-2.7 2.8-2.4Z" /></svg>;
}

export default App;

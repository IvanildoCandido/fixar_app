import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, MapPin, MessageCircle, ShieldCheck, Wrench } from "lucide-react";
import { supabase } from "./supabase";

type Maintenance = { date: string; services: string[]; status: "completed" };
type PublicEquipment = {
  organization: { name: string; logo_path: string | null; phone: string | null };
  equipment: { reference: string; type: string | null; brand: string | null; model: string | null; capacity_btu: number | null; location: string };
  last_maintenance: Maintenance | null;
  next_maintenance: { date: string } | null;
  history: Maintenance[];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const formatDate = (value: string) => dateFormatter.format(new Date(value));
const serviceLabel = (services: string[]) => services.length ? services.join(" • ") : "Manutenção realizada";

export function PublicEquipmentPage({ token }: { token: string }) {
  const [data, setData] = useState<PublicEquipment | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    supabase.rpc("get_public_equipment", { token }).then(({ data: result, error }) => {
      if (active && !error && result) setData(result as PublicEquipment);
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [token]);

  if (loading) return <main className="public-state"><span className="public-spinner" /><p>Carregando ficha do equipamento...</p></main>;
  if (!data) return <main className="public-state"><ShieldCheck size={38} /><h1>Equipamento não encontrado</h1><p>Confira se este é um QR Code válido do FIXAR.</p></main>;

  const { organization, equipment } = data;
  const logoUrl = organization.logo_path ? supabase.storage.from("organization-logos").getPublicUrl(organization.logo_path).data.publicUrl : null;
  const phone = organization.phone?.replace(/\D/g, "");
  const whatsapp = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(`Olá! Consultei o equipamento ${equipment.reference} pelo QR Code do FIXAR e gostaria de solicitar uma manutenção.`)}` : null;
  const equipmentName = [equipment.brand, equipment.model].filter(Boolean).join(" ") || equipment.type || "Equipamento";

  return <main className="public-page">
    <header className="public-hero">
      <div className="public-brand">{logoUrl ? <img src={logoUrl} alt={`Logo de ${organization.name}`} /> : <span>{organization.name.slice(0, 2).toUpperCase()}</span>}<div><small>Assistência responsável por este QR</small><strong>{organization.name}</strong></div></div>
      <div className="public-equipment-title"><span>Ficha digital</span><h1>{equipmentName}</h1><p><MapPin size={16} />{equipment.location}</p></div>
    </header>
    <section className="public-grid">
      <article className="public-card"><div className="public-card-heading"><Wrench size={20} /><h2>Equipamento</h2></div><dl><div><dt>Identificação</dt><dd>{equipment.reference}</dd></div>{equipment.type && <div><dt>Tipo</dt><dd>{equipment.type}</dd></div>}{equipment.capacity_btu && <div><dt>Capacidade</dt><dd>{equipment.capacity_btu.toLocaleString("pt-BR")} BTU</dd></div>}</dl></article>
      <article className="public-card public-feature-card"><div className="public-card-heading"><CheckCircle2 size={20} /><h2>Última manutenção</h2></div>{data.last_maintenance ? <><strong className="public-date">{formatDate(data.last_maintenance.date)}</strong><p>{serviceLabel(data.last_maintenance.services)}</p><span className="public-status"><CheckCircle2 size={14} /> Concluída</span></> : <p className="public-muted">Nenhuma manutenção concluída registrada.</p>}</article>
      <article className="public-card"><div className="public-card-heading"><CalendarClock size={20} /><h2>Próxima manutenção</h2></div>{data.next_maintenance ? <><strong className="public-date">{formatDate(data.next_maintenance.date)}</strong>{new Date(data.next_maintenance.date) < new Date() && <p className="public-recommended">Manutenção recomendada</p>}</> : <p className="public-muted">Sem data programada.</p>}</article>
    </section>
    <section className="public-history"><div className="public-section-title"><small>Registros da assistência</small><h2>Histórico de manutenção</h2></div>{data.history.length ? <ol>{data.history.map((item, index) => <li key={`${item.date}-${index}`}><span /><div><time>{formatDate(item.date)}</time><strong>{serviceLabel(item.services)}</strong><small>Concluída</small></div></li>)}</ol> : <p className="public-muted">O histórico aparecerá aqui após a primeira manutenção concluída.</p>}</section>
    {whatsapp && <a className="public-contact" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={20} />Falar com a assistência</a>}
    <footer><ShieldCheck size={15} /> Consulta segura fornecida pelo FIXAR</footer>
  </main>;
}

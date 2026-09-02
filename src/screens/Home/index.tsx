import { BarChart3, Bell, Building2, Check, ClipboardCheck, CloudOff, CreditCard, FileText, Lock, LogOut, Moon, QrCode, Sun, Wrench, X } from "lucide-react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import { Alert, ScrollView } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import { useFixarTheme } from "../../design-system";
import { useTheme } from "styled-components/native";
import { dismissMaintenanceReminder, listMaintenanceRemindersPage } from "../../services/API";
import { cancelMaintenanceReminder } from "../../services/maintenanceReminders";
import { MaintenanceReminder } from "../../types/data";
import {
  Action, ActionIcon, ActionLabel, ActionsGrid, CompanyBadge, CompanyName,
  Container, Content, Greeting, Header, HeaderTop, Kicker, SectionTitle,
  SignOutButton, Subtitle,
  ReminderCard, ReminderContent, ReminderDate, ReminderEmpty, ReminderList,
  ReminderMeta, ReminderTitle, SectionHeaderRow, SectionLink, PendingCard, PendingText, PendingAction, PendingDismiss, ReminderAction, ReminderDismiss,
  FirstStepsCard, FirstStepsHeader, FirstStepsTitle, FirstStepsDismiss, FirstStep, FirstStepLabel, CoachCard, CoachKicker, CoachText, CoachActions, CoachAction,
} from "./styles";
import { clearOfflineMaintenances, listOfflineMaintenances } from "../../services/offlineMaintenance";
import { completeCoach, hideChecklist, isChecklistHidden, loadFirstSteps, shouldShowCoach } from "../../services/onboarding";
import { useCommercial } from "../../commercial/CommercialContext";

const actions = [
  { label: "Nova ordem", Icon: ClipboardCheck, route: "Repair" },
  { label: "Ordens em lote", Icon: Wrench, route: "MultiRepair" },
  { label: "Relatórios", Icon: BarChart3, route: "FinishedServices" },
  { label: "Orçamentos", Icon: FileText, route: "Budgets" },
  { label: "Dados da empresa", Icon: Building2, route: "OrganizationProfile" },
  { label: "Meu Plano", Icon: CreditCard, route: "MyPlan" },
  { label: "QR Codes e etiquetas", Icon: QrCode, route: "EquipmentLabels" },
] as const;

export const Home = () => {
  const navigation = useNavigation<any>();
  const { session, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useFixarTheme();
  const theme = useTheme();
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [remindersTotal, setRemindersTotal] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const { entitlements, showUpgrade } = useCommercial();
  const contentRef = useRef<ScrollView>(null);
  const [firstSteps, setFirstSteps] = useState<{customer:boolean;equipment:boolean;qr:boolean;maintenance:boolean} | null>(null);
  const [checklistHidden, setChecklistHidden] = useState(false);
  const [coachIndex, setCoachIndex] = useState<number | null>(null);
  const coachTips = ["Comece um atendimento por aqui.", "Gere etiquetas para identificar seus equipamentos.", "Acompanhe os retornos programados."];

  useFocusEffect(
    useCallback(() => {
      let active = true;
      contentRef.current?.scrollTo({ y: 0, animated: false });
      listMaintenanceRemindersPage(0, 5)
        .then((result) => {
          if (active) { setReminders(result.items); setRemindersTotal(result.total); }
        })
        .catch(() => {
          if (active) setReminders([]);
        });
      if (session) {
        listOfflineMaintenances({ userId: session.user.id, organizationId: session.organization.id })
          .then((items) => { if (active) setPendingTotal(items.length); })
          .catch(() => { if (active) setPendingTotal(0); });
        Promise.all([loadFirstSteps(session.organization.id), isChecklistHidden(session.user.id, session.organization.id), shouldShowCoach(session.user.id, session.organization.id)])
          .then(([steps, hidden, coach]) => { if (active) { setFirstSteps(steps); setChecklistHidden(hidden); if (coach) setCoachIndex(0); } }).catch(() => undefined);
      }
      return () => { active = false; };
    }, [session])
  );

  const stepsDone = firstSteps && firstSteps.customer && firstSteps.equipment && firstSteps.qr && firstSteps.maintenance;
  const dismissChecklist = async () => { if (!session) return; await hideChecklist(session.user.id, session.organization.id); setChecklistHidden(true); };
  const finishCoach = async () => { if (session) await completeCoach(session.user.id); setCoachIndex(null); };

  const reminderDateLabel = (dueAt: string) => {
    const dueDate = new Date(dueAt);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const days = Math.round((dueDate.getTime() - today.getTime()) / 86400000);
    if (days < 0) return `Vencida há ${Math.abs(days)} ${Math.abs(days) === 1 ? "dia" : "dias"}`;
    if (days === 0) return "Vence hoje";
    return `Em ${days} ${days === 1 ? "dia" : "dias"}`;
  };

  const confirmDismissReminder = (reminder: MaintenanceReminder) => {
    Alert.alert(
      "Dispensar lembrete?",
      `A próxima manutenção de ${reminder.Device.reference} deixará de aparecer.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Dispensar", style: "destructive", onPress: async () => {
          try {
            await dismissMaintenanceReminder(reminder.id);
            setReminders((current) => current.filter((item) => item.id !== reminder.id));
            setRemindersTotal((current) => Math.max(0, current - 1));
            try { await cancelMaintenanceReminder(reminder.id); } catch { /* O lembrete persistido já foi dispensado. */ }
          } catch {
            Alert.alert("Não foi possível dispensar", "Verifique sua conexão e tente novamente.");
          }
        } },
      ]
    );
  };

  const confirmDismissPending = () => {
    if (!session || pendingTotal === 0) return;
    Alert.alert(
      pendingTotal === 1 ? "Descartar manutenção salva?" : `Descartar ${pendingTotal} manutenções salvas?`,
      pendingTotal === 1
        ? "Ela ainda não foi enviada para a nuvem e será excluída permanentemente deste dispositivo."
        : "Elas ainda não foram enviadas para a nuvem e serão excluídas permanentemente deste dispositivo.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: async () => {
          try {
            await clearOfflineMaintenances({ userId: session.user.id, organizationId: session.organization.id });
            setPendingTotal(0);
          } catch {
            Alert.alert("Não foi possível descartar", "Tente novamente.");
          }
        } },
      ]
    );
  };

  return (
    <Container>
      <Header>
        <HeaderTop>
          <CompanyBadge>
            <Wrench size={22} color={theme.colors.primaryForeground} />
            <CompanyName>fixar</CompanyName>
          </CompanyBadge>
          <SignOutButton accessibilityLabel={resolvedTheme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"} onPress={toggleTheme}>
            {resolvedTheme === "dark" ? <Sun size={20} color={theme.colors.primaryForeground} /> : <Moon size={20} color={theme.colors.primaryForeground} />}
          </SignOutButton>
          <SignOutButton accessibilityLabel="Sair" onPress={signOut}>
            <LogOut size={20} color={theme.colors.primaryForeground} />
          </SignOutButton>
        </HeaderTop>
        <Kicker>{session?.organization.name}</Kicker>
        <Greeting>Olá, {session?.user.name}</Greeting>
        <Subtitle>Visão rápida da sua operação de serviços.</Subtitle>
      </Header>

      <Content ref={contentRef} showsVerticalScrollIndicator={false}>
        {coachIndex !== null ? <CoachCard><CoachKicker>Dica {coachIndex + 1} de 3</CoachKicker><CoachText>{coachTips[coachIndex]}</CoachText><CoachActions><CoachAction onPress={finishCoach}><PendingText>Pular</PendingText></CoachAction><CoachAction onPress={() => coachIndex === 2 ? finishCoach() : setCoachIndex(coachIndex + 1)}><PendingText>{coachIndex === 2 ? "Concluir" : "Próximo"}</PendingText></CoachAction></CoachActions></CoachCard> : null}
        {firstSteps && !checklistHidden && !stepsDone ? <FirstStepsCard><FirstStepsHeader><FirstStepsTitle>Primeiros passos</FirstStepsTitle><FirstStepsDismiss accessibilityRole="button" accessibilityLabel="Ocultar primeiros passos" onPress={dismissChecklist}><X size={18} color={theme.colors.muted} /></FirstStepsDismiss></FirstStepsHeader>
          {[{key:"company",label:"Completar dados da empresa",done:Boolean(session?.organization.name && session?.organization.phone),route:"OrganizationProfile"},{key:"customer",label:"Cadastrar primeiro cliente",done:firstSteps.customer,route:"Clientes"},{key:"equipment",label:"Cadastrar primeiro equipamento",done:firstSteps.equipment,route:"Ativos"},{key:"qr",label:"Gerar primeiros QR Codes",done:firstSteps.qr,route:"EquipmentLabels"},{key:"maintenance",label:"Registrar primeira manutenção",done:firstSteps.maintenance,route:"Repair"}].map((item) => <FirstStep key={item.key} disabled={item.done} onPress={() => !item.done && navigation.navigate(item.route)}><Check size={18} color={item.done ? theme.colors.primary : theme.colors.border} /><FirstStepLabel done={item.done}>{item.done ? "✓ " : ""}{item.label}</FirstStepLabel></FirstStep>)}
        </FirstStepsCard> : null}
        {pendingTotal > 0 ? <PendingCard>
          <PendingAction accessibilityRole="button" accessibilityLabel={`${pendingTotal} manutenções locais`} onPress={() => navigation.navigate("FinishedServices")}>
            <CloudOff size={20} color={theme.colors.syncPending} />
            <PendingText>{pendingTotal} {pendingTotal === 1 ? "manutenção salva" : "manutenções salvas"} neste dispositivo</PendingText>
          </PendingAction>
          <PendingDismiss accessibilityRole="button" accessibilityLabel="Descartar manutenções salvas neste dispositivo" onPress={confirmDismissPending}>
            <X size={20} color={theme.colors.danger} />
          </PendingDismiss>
        </PendingCard> : null}
        <SectionHeaderRow><SectionTitle>Próximas manutenções</SectionTitle>{remindersTotal > 5 ? <SectionLink onPress={() => navigation.navigate("MaintenanceReminders")}>Ver todas ({remindersTotal})</SectionLink> : null}</SectionHeaderRow>
        <ReminderList>
          {reminders.length ? reminders.slice(0, 5).map((reminder) => (
            <ReminderCard key={reminder.id}>
              <ReminderAction accessibilityRole="button" accessibilityLabel={`Iniciar manutenção de ${reminder.Device.reference}`} onPress={() => navigation.navigate("Repair", { customer: reminder.Customer, device: reminder.Device })}>
                <Bell size={20} color={new Date(reminder.dueAt).getTime() <= Date.now() ? theme.colors.warning : theme.colors.primary} />
                <ReminderContent>
                  <ReminderTitle>{reminder.Device.reference}</ReminderTitle>
                  <ReminderMeta>{reminder.Customer.name}</ReminderMeta>
                </ReminderContent>
                <ReminderDate due={new Date(reminder.dueAt).getTime() <= Date.now()}>{reminderDateLabel(reminder.dueAt)}</ReminderDate>
              </ReminderAction>
              <ReminderDismiss accessibilityRole="button" accessibilityLabel={`Dispensar lembrete de ${reminder.Device.reference}`} onPress={() => confirmDismissReminder(reminder)}>
                <X size={20} color={theme.colors.danger} />
              </ReminderDismiss>
            </ReminderCard>
          )) : <ReminderEmpty>Nenhuma manutenção programada.</ReminderEmpty>}
        </ReminderList>
        <SectionTitle>Ações rápidas</SectionTitle>
        <ActionsGrid>
          {actions.map((action) => { const batchLocked=action.route==="MultiRepair"&&entitlements&&!entitlements.features.batch_orders; return (
            <Action key={action.route} onPress={() => batchLocked ? showUpgrade({feature:"batch_orders",message:"Ordens em lote estão disponíveis no plano Profissional."}) : navigation.navigate(action.route)}>
              <ActionIcon>{batchLocked?<Lock size={24} color={theme.colors.muted}/>:<action.Icon size={25} color={theme.colors.primary} />}</ActionIcon>
              <ActionLabel>{action.label}{batchLocked?"  🔒":""}</ActionLabel>
            </Action>
          )})}
        </ActionsGrid>
      </Content>
    </Container>
  );
};

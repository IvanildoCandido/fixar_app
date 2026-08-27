import { BarChart3, Bell, Building2, ClipboardCheck, FileText, LogOut, Moon, Sun, Wrench } from "lucide-react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import { useFixarTheme } from "../../design-system";
import { useTheme } from "styled-components/native";
import { listMaintenanceRemindersPage } from "../../services/API";
import { MaintenanceReminder } from "../../types/data";
import {
  Action, ActionIcon, ActionLabel, ActionsGrid, CompanyBadge, CompanyName,
  Container, Content, Greeting, Header, HeaderTop, Kicker, SectionTitle,
  SignOutButton, Subtitle,
  ReminderCard, ReminderContent, ReminderDate, ReminderEmpty, ReminderList,
  ReminderMeta, ReminderTitle, SectionHeaderRow, SectionLink,
} from "./styles";

const actions = [
  { label: "Nova ordem", Icon: ClipboardCheck, route: "Repair" },
  { label: "Ordens em lote", Icon: Wrench, route: "MultiRepair" },
  { label: "Relatórios", Icon: BarChart3, route: "FinishedServices" },
  { label: "Orçamentos", Icon: FileText, route: "Budgets" },
  { label: "Dados da empresa", Icon: Building2, route: "OrganizationProfile" },
] as const;

export const Home = () => {
  const navigation = useNavigation<any>();
  const { session, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useFixarTheme();
  const theme = useTheme();
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [remindersTotal, setRemindersTotal] = useState(0);
  const contentRef = useRef<ScrollView>(null);

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
      return () => { active = false; };
    }, [])
  );

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
        <SectionHeaderRow><SectionTitle>Próximas manutenções</SectionTitle>{remindersTotal > 5 ? <SectionLink onPress={() => navigation.navigate("MaintenanceReminders")}>Ver todas ({remindersTotal})</SectionLink> : null}</SectionHeaderRow>
        <ReminderList>
          {reminders.length ? reminders.slice(0, 5).map((reminder) => (
            <ReminderCard key={reminder.id} accessibilityRole="button" accessibilityLabel={`Iniciar manutenção de ${reminder.Device.reference}`} onPress={() => navigation.navigate("Repair", { customer: reminder.Customer, device: reminder.Device })}>
              <Bell size={20} color={new Date(reminder.dueAt).getTime() <= Date.now() ? theme.colors.warning : theme.colors.primary} />
              <ReminderContent>
                <ReminderTitle>{reminder.Device.reference}</ReminderTitle>
                <ReminderMeta>{reminder.Customer.name}</ReminderMeta>
              </ReminderContent>
              <ReminderDate due={new Date(reminder.dueAt).getTime() <= Date.now()}>
                {reminderDateLabel(reminder.dueAt)}
              </ReminderDate>
            </ReminderCard>
          )) : <ReminderEmpty>Nenhuma manutenção programada.</ReminderEmpty>}
        </ReminderList>
        <SectionTitle>Ações rápidas</SectionTitle>
        <ActionsGrid>
          {actions.map((action) => (
            <Action key={action.route} onPress={() => navigation.navigate(action.route)}>
              <ActionIcon><action.Icon size={25} color={theme.colors.primary} /></ActionIcon>
              <ActionLabel>{action.label}</ActionLabel>
            </Action>
          ))}
        </ActionsGrid>
      </Content>
    </Container>
  );
};

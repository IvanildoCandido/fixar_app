import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState, useRef } from "react";
import { TextInputMaskMethods } from "react-native-masked-text";
import { Button } from "../../components/Form/Button";
import { CheckBox } from "../../components/Form/CheckBox";
import { Input } from "../../components/Form/Input";
import { ItensProps, SelectItens } from "../../components/Form/ItensSelector";
import { Customer, Device, MaintenanceDiagnosis, MaintenanceResult, TechnicalCheck, TechnicalMeasurement } from "../../types/data";
import { Header } from "../../components/Header";
import {
  Container,
  ContentArea,
  InfoText,
  TextArea,
  EntriesArea,
  Side,
  TotalArea,
  TotalLabel,
  TotalValue,
  ButtonsArea,
  ScanArea,
  ScanHeader,
  ScanTitle,
  ScanDescription,
} from "./styles";
import { Alert, AppState, Modal, ScrollView } from "react-native";
import { defaultCustomer, defaultDevice } from "../../utils/dafaultValues";
import API, { createRepairIdempotent } from "../../services/API";
import { ScannerQR } from "../../components/ScannerQR";
import { ButtonScan } from "../../components/AddDevice/styles";
import { QrCode } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import { FormField } from "../../design-system";
import { useAuth } from "../../auth/AuthContext";
import { calculateReminderDueDate, scheduleMaintenanceReminder } from "../../services/maintenanceReminders";
import { RootParamList } from "../../routes/routes.types";
import { ChoiceChips, CollapsibleSection, MeasurementsEditor, TechnicalChecksEditor } from "../../components/TechnicalMaintenance";
import { checksForServiceNames, makeDefaultChecks, maskedMoneyValue, withCalculatedDeltaT } from "../../domain/technicalMaintenance";
import { SignaturePad } from "../../components/SignaturePad";
import { SelectCustomers } from "../../components/Form/SelectCustomers";
import { SelectDevices } from "../../components/Form/SelectDevices";
import {
  createOfflineMaintenanceId,
  getOfflineMaintenance,
  isNetworkError,
  listOfflineMaintenances,
  OfflineMaintenanceForm,
  OfflineMaintenanceStatus,
  removeOfflineMaintenance,
  saveOfflineMaintenance,
} from "../../services/offlineMaintenance";

export const Repair = () => {
  type SectionKey = "diagnosis" | "services" | "checks" | "measurements" | "parts" | "result" | "comments" | "values" | "signatures";
  const sectionOrder: SectionKey[] = ["diagnosis", "services", "checks", "measurements", "parts", "result", "comments", "values", "signatures"];
  const theme = useTheme();
  const route = useRoute<RouteProp<RootParamList, "Repair">>();
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer>(route.params?.customer ?? defaultCustomer);
  const [selectedDevice, setSelectedDevice] = useState<Device>(route.params?.device ?? defaultDevice);
  const [services, setServices] = useState<ItensProps[]>([]);
  const [parts, setParts] = useState<ItensProps[]>([]);
  const [notification, setNotification] = useState(false);
  const [reminderDays, setReminderDays] = useState("90");
  const [reminderError, setReminderError] = useState("");
  const [increment, setIncrement] = useState("0");
  const [discount, setDiscount] = useState("0");
  const incrementRaw = useRef<TextInputMaskMethods | any>(null);
  const discountRaw = useRef<TextInputMaskMethods | any>(null);
  const [comments, setComments] = useState("");
  const [diagnosis, setDiagnosis] = useState<MaintenanceDiagnosis>({});
  const [checks, setChecks] = useState<TechnicalCheck[]>(makeDefaultChecks);
  const [measurements, setMeasurements] = useState<TechnicalMeasurement[]>([]);
  const [result, setResult] = useState<MaintenanceResult>({});
  const [technicianSignatureSvg, setTechnicianSignatureSvg] = useState("");
  const [customerSignatureSvg, setCustomerSignatureSvg] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [openSection, setOpenSection] = useState<SectionKey | null>(route.params?.device?.id ? "diagnosis" : null);
  const contentRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Partial<Record<SectionKey, number>>>({});
  const [customerSignerName, setCustomerSignerName] = useState("");
  const [total, setTotal] = useState(0);
  const navigation = useNavigation<any>();
  const [modal, setModal] = useState(false);
  const { session } = useAuth();
  const localIdRef = useRef(route.params?.localId ?? createOfflineMaintenanceId());
  const [localStatus, setLocalStatus] = useState<OfflineMaintenanceStatus>("draft");
  const [localReady, setLocalReady] = useState(false);
  const [localSaveError, setLocalSaveError] = useState("");
  const startedAtRef = useRef(new Date().toISOString());
  const latestLocalRecord = useRef<Parameters<typeof saveOfflineMaintenance>[0] | null>(null);

  const restoreForm = (form: OfflineMaintenanceForm) => {
    setSelectedCustomer(form.customer);
    setSelectedDevice(form.device);
    setServices(form.services);
    setParts(form.parts);
    setComments(form.comments);
    setNotification(form.notification);
    setReminderDays(form.reminderDays);
    setIncrement(form.increment);
    setDiscount(form.discount);
    setDiagnosis(form.diagnosis);
    setChecks(form.checks);
    setMeasurements(form.measurements);
    setResult(form.result);
    setTechnicianSignatureSvg(form.technicianSignatureSvg);
    setCustomerSignatureSvg(form.customerSignatureSvg);
    setCustomerSignerName(form.customerSignerName);
    startedAtRef.current = form.date;
  };

  useEffect(() => {
    if (!session) return;
    let active = true;
    const scope = { userId: session.user.id, organizationId: session.organization.id };
    (async () => {
      const requested = route.params?.localId
        ? await getOfflineMaintenance(route.params.localId, scope)
        : (route.params?.customer || route.params?.device ? null : (await listOfflineMaintenances(scope)).find((item) => item.status === "draft") ?? null);
      if (!active) return;
      if (requested) {
        localIdRef.current = requested.localId;
        setLocalStatus(requested.status);
        restoreForm(requested.form);
        Alert.alert("Manutenção recuperada", "O preenchimento salvo neste dispositivo foi restaurado.");
      }
      setLocalReady(true);
    })().catch(() => setLocalReady(true));
    return () => { active = false; };
  }, [route.params?.localId, session?.organization.id, session?.user.id]);

  useEffect(() => {
    if (selectedDevice.id && selectedDevice.Customer?.id !== selectedCustomer.id) {
      setSelectedDevice(defaultDevice);
      setOpenSection(null);
      contentRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [selectedCustomer.id, selectedDevice.Customer?.id, selectedDevice.id]);

  useEffect(() => {
    if (!selectedDevice.id) return;
    setOpenSection("diagnosis");
    setTimeout(() => scrollToSection("diagnosis"), 100);
  }, [selectedDevice.id]);

  const scrollToSection = (section: SectionKey) => {
    const y = sectionPositions.current[section];
    if (y !== undefined) contentRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
  };
  const sectionProps = (section: SectionKey) => ({
    open: openSection === section,
    onToggle: () => {
      const currentIndex = sectionOrder.indexOf(section);
      const next = openSection === section ? sectionOrder[currentIndex + 1] ?? null : section;
      setOpenSection(next);
      if (next) setTimeout(() => scrollToSection(next), 100);
    },
    onLayout: (event: any) => {
      sectionPositions.current[section] = event.nativeEvent.layout.y;
      if (openSection === section) requestAnimationFrame(() => scrollToSection(section));
    },
  });

  useEffect(() => {
    const totalParts = parts.reduce((acc, value) => {
      return acc + parseFloat(value.price) * Number(value.quantity ?? 1);
    }, 0);
    const totalServices = services.reduce((acc, value) => {
      return acc + parseFloat(value.price) * Number(value.quantity ?? 1);
    }, 0);
    setTotal(
      totalServices +
        totalParts +
        maskedMoneyValue(incrementRaw, increment) -
        maskedMoneyValue(discountRaw, discount)
    );
  }, [parts, services, increment, discount]);

  useEffect(() => {
    setChecks((current) => checksForServiceNames(services.map((item) => item.name), current));
  }, [services]);

  useEffect(() => {
    if (!session || !localReady || !selectedCustomer.id || !selectedDevice.id) return;
    const timer = setTimeout(() => {
      const form: OfflineMaintenanceForm = {
        customerId: selectedCustomer.id, deviceId: selectedDevice.id, customer: selectedCustomer, device: selectedDevice,
        services, parts, comments, total, date: startedAtRef.current, assignedTo: session.user.id,
        reminderEnabled: notification, reminderIntervalDays: notification ? Number(reminderDays) || null : null,
        reminderDueAt: null, diagnosis, checks, measurements, result, technicianName: session.user.name,
        technicianSignatureSvg, customerSignatureSvg, customerSignerName,
        signedAt: technicianSignatureSvg || customerSignatureSvg ? new Date().toISOString() : null,
        notification, reminderDays, increment, discount,
      };
      const record = {
        localId: localIdRef.current, userId: session.user.id, organizationId: session.organization.id,
        status: localStatus, form,
      };
      latestLocalRecord.current = record;
      saveOfflineMaintenance(record)
        .then(() => setLocalSaveError(""))
        .catch(() => setLocalSaveError("O rascunho não pôde ser atualizado neste dispositivo."));
    }, 800);
    return () => clearTimeout(timer);
  }, [checks, comments, customerSignatureSvg, customerSignerName, diagnosis, discount, increment, localReady, localStatus, measurements, notification, parts, reminderDays, result, selectedCustomer, selectedDevice, services, session, technicianSignatureSvg, total]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" && latestLocalRecord.current) {
        void saveOfflineMaintenance(latestLocalRecord.current);
      }
    });
    return () => {
      subscription.remove();
      if (latestLocalRecord.current) void saveOfflineMaintenance(latestLocalRecord.current);
    };
  }, []);

  const handlerRegister = async () => {
    if (!selectedCustomer.id || !selectedDevice.id) {
      setOpenSection(null);
      contentRef.current?.scrollTo({ y: 0, animated: true });
      Alert.alert("Identificação obrigatória", "Selecione o cliente e o equipamento antes de finalizar a manutenção.");
      return;
    }
    const intervalDays = Number(reminderDays);
    if (notification && (!Number.isInteger(intervalDays) || intervalDays < 1)) {
      setReminderError("Informe um prazo válido, em dias.");
      return;
    }
    setReminderError("");
    const completedAt = new Date();
    const reminderDueAt = notification
      ? calculateReminderDueDate(intervalDays, completedAt)
      : null;
    const newRepair = {
      customerId: selectedCustomer.id,
      deviceId: selectedDevice.id,
      services,
      parts,
      comments,
      total,
      date: completedAt.toISOString(),
      assignedTo: session?.user.id,
      reminderEnabled: notification,
      reminderIntervalDays: notification ? intervalDays : null,
      reminderDueAt: reminderDueAt?.toISOString() ?? null,
      diagnosis,
      checks: checks.filter((item) => item.status !== "not_checked"),
      measurements,
      result,
      technicianName: session?.user.name,
      technicianSignatureSvg,
      customerSignatureSvg,
      customerSignerName,
      signedAt: technicianSignatureSvg || customerSignatureSvg ? new Date().toISOString() : null,
    };

    Alert.alert(
      "Finalizar Manutenção:",
      "Você deseja finalizar essa manutenção? Após finalizada não será possível alterar os valores da mesma!",
      [
        {
          text: "Não",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Sim",
          onPress: async () => {
            if (!session) return;
            const scope = { userId: session.user.id, organizationId: session.organization.id };
            const form: OfflineMaintenanceForm = {
              ...newRepair, customer: selectedCustomer, device: selectedDevice,
              notification, reminderDays, increment, discount,
            };
            try {
              await saveOfflineMaintenance({
                localId: localIdRef.current, ...scope, status: "pending", form,
              });
              setLocalStatus("syncing");
              const workOrder = await createRepairIdempotent(localIdRef.current, newRepair);
              await removeOfflineMaintenance(localIdRef.current, scope);
              if (notification && reminderDueAt) {
                try {
                  await scheduleMaintenanceReminder({
                    device: selectedDevice,
                    dueDate: reminderDueAt,
                    workOrderId: workOrder.id,
                  });
                } catch {
                  Alert.alert(
                    "Lembrete salvo",
                    "O lembrete aparecerá na tela inicial, mas a notificação do aparelho não pôde ser agendada. Verifique a permissão de notificações."
                  );
                }
              }
              navigation.navigate("FinishedServices");
            } catch (error) {
              if (isNetworkError(error)) {
                setLocalStatus("pending");
                try {
                  await saveOfflineMaintenance({ localId: localIdRef.current, ...scope, status: "pending", form });
                } catch {
                  Alert.alert("Falha ao salvar localmente", "A manutenção não foi enviada e o dispositivo não conseguiu atualizar o rascunho. Não feche esta tela e tente novamente.");
                  return;
                }
                Alert.alert(
                  "Salvo neste dispositivo",
                  "A manutenção foi concluída localmente e aguarda sincronização. Seus dados continuam seguros neste aparelho.",
                  [{ text: "OK", onPress: () => navigation.navigate("FinishedServices") }]
                );
              } else {
                setLocalStatus("error");
                try {
                  await saveOfflineMaintenance({
                    localId: localIdRef.current, ...scope, status: "error", form,
                    lastError: error instanceof Error ? error.message : "Falha no envio",
                  });
                } catch {
                  Alert.alert("Falha ao salvar localmente", "O envio falhou e o dispositivo não conseguiu atualizar o rascunho. Não feche esta tela e tente novamente.");
                  return;
                }
                Alert.alert("Manutenção não enviada", "O rascunho continua salvo neste dispositivo. Verifique os dados e tente novamente.");
              }
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleQRcode = async (data: string): Promise<void> => {
    try {
      const { data: device } = await API.post("devices/reference", {
        reference: data,
      });
      setSelectedCustomer(device.Customer);
      setSelectedDevice(device);
    } catch (error) {
      Alert.alert(
        "Erro interno:",
        "Não foi possível encontrar o equipamento verifique se o mesmo encontra-se cadastrado!"
      );
    }
  };
  return (
    <Container>
      <Header title={"Cadastro de Manutenções"} icons={true} />
      <ContentArea ref={contentRef} automaticallyAdjustKeyboardInsets={true} scrollEnabled={!isSigning}>
        <ScanArea>
          <ScanHeader>
            <ScanTitle>Identifique o equipamento</ScanTitle>
            <ButtonScan accessibilityRole="button" accessibilityLabel="Ler código do equipamento" onPress={() => setModal(true)}>
              <QrCode size={22} color={theme.colors.primary} />
            </ButtonScan>
          </ScanHeader>
          <ScanDescription>Leia o QR Code ou escolha primeiro o cliente e depois um equipamento cadastrado.</ScanDescription>
          <SelectCustomers selected={selectedCustomer} setSelected={setSelectedCustomer} />
          <SelectDevices customerId={selectedCustomer.id} selected={selectedDevice} setSelected={setSelectedDevice} />
        </ScanArea>
        <CollapsibleSection {...sectionProps("diagnosis")} title="Diagnóstico" state={diagnosis.reportedProblem || diagnosis.foundCondition || diagnosis.technicalDiagnosis ? "complete" : "pending"}>
          <FormField label="Problema relatado" value={diagnosis.reportedProblem ?? ""} onChangeText={(reportedProblem) => setDiagnosis((value) => ({ ...value, reportedProblem }))} multiline placeholder="Relato curto do cliente" />
          <FormField label="Condição encontrada" value={diagnosis.foundCondition ?? ""} onChangeText={(foundCondition) => setDiagnosis((value) => ({ ...value, foundCondition }))} multiline placeholder="O que foi encontrado" />
          <FormField label="Diagnóstico técnico" value={diagnosis.technicalDiagnosis ?? ""} onChangeText={(technicalDiagnosis) => setDiagnosis((value) => ({ ...value, technicalDiagnosis }))} multiline placeholder="Conclusão técnica" />
        </CollapsibleSection>
        <CollapsibleSection {...sectionProps("services")} title="Serviços executados" state={services.length ? "complete" : "pending"}>
          <SelectItens itens={services} setItens={setServices} dataTable="services" selectorLabel="Serviços realizados:" modalTitle="Serviços" />
        </CollapsibleSection>
        <CollapsibleSection {...sectionProps("checks")} title="Verificações técnicas" state={checks.some((item) => item.status === "attention" || item.status === "non_conforming") ? "attention" : checks.some((item) => item.status !== "not_checked") ? "complete" : "pending"}>
          <TechnicalChecksEditor checks={checks} onChange={setChecks} />
        </CollapsibleSection>
        <CollapsibleSection {...sectionProps("measurements")} title="Medições" state={measurements.length ? "complete" : "pending"}>
          <MeasurementsEditor measurements={measurements} onChange={(items) => setMeasurements(withCalculatedDeltaT(items))} />
        </CollapsibleSection>
        <CollapsibleSection {...sectionProps("parts")} title="Peças e materiais" state={parts.length ? "complete" : "pending"}>
          <SelectItens itens={parts} setItens={setParts} dataTable="parts" selectorLabel="Materiais utilizados:" modalTitle="Peças e materiais" />
        </CollapsibleSection>
        <CollapsibleSection {...sectionProps("result")} title="Resultado" state={result.equipmentStatus ? result.equipmentStatus === "operational_with_notes" || result.equipmentStatus === "requires_repair" || result.equipmentStatus === "out_of_service" ? "attention" : "complete" : "pending"}>
          <InfoText>Status do equipamento</InfoText>
          <ChoiceChips value={result.equipmentStatus} onChange={(equipmentStatus) => setResult((value) => ({ ...value, equipmentStatus }))} options={[{ value: "operational", label: "✓ Operacional" }, { value: "operational_with_notes", label: "⚠ Com ressalvas", tone: "warning" }, { value: "requires_repair", label: "✕ Requer reparo", tone: "danger" }, { value: "out_of_service", label: "✕ Fora de operação", tone: "danger" }]} />
          <InfoText>Problema resolvido</InfoText>
          <ChoiceChips value={result.problemResolved} onChange={(problemResolved) => setResult((value) => ({ ...value, problemResolved }))} options={[{ value: "yes", label: "Sim" }, { value: "partial", label: "Parcialmente", tone: "warning" }, { value: "no", label: "Não", tone: "danger" }]} />
          <InfoText>Retorno necessário</InfoText>
          <ChoiceChips value={result.returnRequired === undefined ? undefined : result.returnRequired ? "yes" : "no"} onChange={(value) => setResult((current) => ({ ...current, returnRequired: value === "yes", returnReason: value === "no" ? "" : current.returnReason }))} options={[{ value: "no", label: "Não" }, { value: "yes", label: "Sim", tone: "warning" }]} />
          {result.returnRequired ? <FormField label="Motivo do retorno" value={result.returnReason ?? ""} onChangeText={(returnReason) => setResult((value) => ({ ...value, returnReason }))} multiline /> : null}
          <FormField label="Recomendação ao cliente (opcional)" value={result.customerRecommendation ?? ""} onChangeText={(customerRecommendation) => setResult((value) => ({ ...value, customerRecommendation }))} multiline />
          {result.customerRecommendation ? <><InfoText>Prioridade</InfoText><ChoiceChips value={result.recommendationPriority} onChange={(recommendationPriority) => setResult((value) => ({ ...value, recommendationPriority }))} options={[{ value: "low", label: "Baixa" }, { value: "normal", label: "Normal" }, { value: "high", label: "Alta", tone: "warning" }, { value: "urgent", label: "Urgente", tone: "danger" }]} /></> : null}
        </CollapsibleSection>
        <CollapsibleSection {...sectionProps("comments")} title="Observações técnicas" state={comments ? "complete" : "pending"}>
          <TextArea multiline numberOfLines={4} onChangeText={setComments} value={comments} placeholder="Opcional" />
        </CollapsibleSection>
        <CollapsibleSection {...sectionProps("values")} title="Valores e próxima manutenção" state="complete">
          <EntriesArea><Side><Input value={discount} label="Descontos:" placeholder="R$ 0,00" keyboardType="numeric" onChangeText={setDiscount} type="money" rawValue={discountRaw} /></Side><Side><Input value={increment} label="Acréscimos" placeholder="R$ 0,00" keyboardType="numeric" onChangeText={setIncrement} type="money" rawValue={incrementRaw} /></Side></EntriesArea>
          <CheckBox title="Recomendar próxima manutenção" checked={notification} setChecked={setNotification} />
          {notification ? <FormField label="Prazo para a próxima manutenção (dias)" value={reminderDays} onChangeText={(value) => { setReminderDays(value.replace(/\D/g, "")); setReminderError(""); }} keyboardType="number-pad" placeholder="30, 60, 90, 180..." error={reminderError} required /> : null}
        </CollapsibleSection>
        <CollapsibleSection {...sectionProps("signatures")} title="Assinaturas" state={technicianSignatureSvg || customerSignatureSvg ? "complete" : "pending"}>
          <SignaturePad label={`Responsável técnico${session?.user.name ? `: ${session.user.name}` : ""}`} value={technicianSignatureSvg} onChange={setTechnicianSignatureSvg} onDrawingChange={setIsSigning} />
          <FormField label="Nome do cliente / responsável" value={customerSignerName} onChangeText={setCustomerSignerName} placeholder="Opcional" />
          <SignaturePad label="Cliente / responsável" value={customerSignatureSvg} onChange={setCustomerSignatureSvg} onDrawingChange={setIsSigning} />
        </CollapsibleSection>
        <TotalArea>
          <TotalLabel>TOTAL:</TotalLabel>
          <TotalValue>R$ {total.toFixed(2).replace(".", ",")}</TotalValue>
        </TotalArea>
        {localSaveError ? <InfoText accessibilityLiveRegion="polite">{localSaveError}</InfoText> : null}
        <ButtonsArea>
          <Button
            type="cancel"
            title={"Voltar"}
            onPress={() => navigation.navigate("Home")}
          />
          <Button
            type="save"
            title={"Salvar"}
            onPress={() => handlerRegister()}
          />
        </ButtonsArea>
      </ContentArea>
      <Modal visible={modal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setModal(false)}>
        <ScannerQR closeModal={setModal} handleQRcode={handleQRcode} />
      </Modal>
    </Container>
  );
};

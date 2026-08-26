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
  ReferenceCode,
  Label,
  InfoArea,
  CustomerName,
} from "./styles";
import { Alert, Modal } from "react-native";
import { defaultCustomer, defaultDevice } from "../../utils/dafaultValues";
import API from "../../services/API";
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

export const Repair = () => {
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
  const [customerSignerName, setCustomerSignerName] = useState("");
  const [total, setTotal] = useState(0);
  const navigation = useNavigation<any>();
  const [modal, setModal] = useState(false);
  const { session } = useAuth();

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

  const handlerRegister = async () => {
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
      date: completedAt,
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
            try {
              const { data: workOrder } = await API.post("/repairs/add", newRepair);
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
              console.log(error);
              Alert.alert(
                "Informação do Sistema",
                "Não foi possível salvar, tente novamente."
              );
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
      <ContentArea automaticallyAdjustKeyboardInsets={true}>
        <ScanArea>
          <InfoArea>
            <Label>Referência do Equipamento:</Label>
            <ReferenceCode>{selectedDevice.reference || "Leia o código do equipamento"}</ReferenceCode>
            <Label>Cliente:</Label>
            <CustomerName>{selectedCustomer.name || "Nenhum cliente identificado"}</CustomerName>
          </InfoArea>
          <ButtonScan accessibilityRole="button" accessibilityLabel="Ler código do equipamento" onPress={() => setModal(true)}>
            <QrCode size={22} color={theme.colors.primary} />
          </ButtonScan>
        </ScanArea>
        <CollapsibleSection title="Diagnóstico" state={diagnosis.reportedProblem || diagnosis.foundCondition || diagnosis.technicalDiagnosis ? "complete" : "pending"}>
          <FormField label="Problema relatado" value={diagnosis.reportedProblem ?? ""} onChangeText={(reportedProblem) => setDiagnosis((value) => ({ ...value, reportedProblem }))} multiline placeholder="Relato curto do cliente" />
          <FormField label="Condição encontrada" value={diagnosis.foundCondition ?? ""} onChangeText={(foundCondition) => setDiagnosis((value) => ({ ...value, foundCondition }))} multiline placeholder="O que foi encontrado" />
          <FormField label="Diagnóstico técnico" value={diagnosis.technicalDiagnosis ?? ""} onChangeText={(technicalDiagnosis) => setDiagnosis((value) => ({ ...value, technicalDiagnosis }))} multiline placeholder="Conclusão técnica" />
        </CollapsibleSection>
        <CollapsibleSection title="Serviços executados" state={services.length ? "complete" : "pending"} initiallyOpen>
          <SelectItens itens={services} setItens={setServices} dataTable="services" selectorLabel="Serviços realizados:" modalTitle="Serviços" />
        </CollapsibleSection>
        <CollapsibleSection title="Verificações técnicas" state={checks.some((item) => item.status === "attention" || item.status === "non_conforming") ? "attention" : checks.some((item) => item.status !== "not_checked") ? "complete" : "pending"}>
          <TechnicalChecksEditor checks={checks} onChange={setChecks} />
        </CollapsibleSection>
        <CollapsibleSection title="Medições" state={measurements.length ? "complete" : "pending"}>
          <MeasurementsEditor measurements={measurements} onChange={(items) => setMeasurements(withCalculatedDeltaT(items))} />
        </CollapsibleSection>
        <CollapsibleSection title="Peças e materiais" state={parts.length ? "complete" : "pending"}>
          <SelectItens itens={parts} setItens={setParts} dataTable="parts" selectorLabel="Materiais utilizados:" modalTitle="Peças e materiais" />
        </CollapsibleSection>
        <CollapsibleSection title="Resultado" state={result.equipmentStatus ? result.equipmentStatus === "operational_with_notes" || result.equipmentStatus === "requires_repair" || result.equipmentStatus === "out_of_service" ? "attention" : "complete" : "pending"}>
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
        <CollapsibleSection title="Observações técnicas" state={comments ? "complete" : "pending"}>
          <TextArea multiline numberOfLines={4} onChangeText={setComments} value={comments} placeholder="Opcional" />
        </CollapsibleSection>
        <CollapsibleSection title="Valores e próxima manutenção" state="complete">
          <EntriesArea><Side><Input value={discount} label="Descontos:" placeholder="R$ 0,00" keyboardType="numeric" onChangeText={setDiscount} type="money" rawValue={discountRaw} /></Side><Side><Input value={increment} label="Acréscimos" placeholder="R$ 0,00" keyboardType="numeric" onChangeText={setIncrement} type="money" rawValue={incrementRaw} /></Side></EntriesArea>
          <CheckBox title="Recomendar próxima manutenção" checked={notification} setChecked={setNotification} />
          {notification ? <FormField label="Prazo para a próxima manutenção (dias)" value={reminderDays} onChangeText={(value) => { setReminderDays(value.replace(/\D/g, "")); setReminderError(""); }} keyboardType="number-pad" placeholder="30, 60, 90, 180..." error={reminderError} required /> : null}
        </CollapsibleSection>
        <CollapsibleSection title="Assinaturas" state={technicianSignatureSvg || customerSignatureSvg ? "complete" : "pending"}>
          <SignaturePad label={`Responsável técnico${session?.user.name ? `: ${session.user.name}` : ""}`} value={technicianSignatureSvg} onChange={setTechnicianSignatureSvg} />
          <FormField label="Nome do cliente / responsável" value={customerSignerName} onChangeText={setCustomerSignerName} placeholder="Opcional" />
          <SignaturePad label="Cliente / responsável" value={customerSignatureSvg} onChange={setCustomerSignatureSvg} />
        </CollapsibleSection>
        <TotalArea>
          <TotalLabel>TOTAL:</TotalLabel>
          <TotalValue>R$ {total.toFixed(2).replace(".", ",")}</TotalValue>
        </TotalArea>
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

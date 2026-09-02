import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, View } from "react-native";
import { ArrowLeft, ArrowRight, Building2, Check, QrCode, Wrench, X } from "lucide-react-native";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { Button, Card, FormField } from "../../design-system";
import { useAuth } from "../../auth/AuthContext";
import { supabase } from "../../services/supabase";
import { finishOnboarding } from "../../services/onboarding";
import { invalidateQueries } from "../../services/queryCache";
import { Container, Content, Dots, Dot, Eyebrow, Hero, IconWrap, Intro, Nav, NavButton, PageTitle, Progress, ProgressFill, Skip, SmallText, StepTitle } from "./styles";

const steps = [
  { title: "Organize sua operação técnica com o FIXAR", text: "Clientes, equipamentos, manutenções, QR Codes e histórico em um só lugar.", Icon: Wrench },
  { title: "Seus clientes e equipamentos organizados", text: "Cadastre clientes, acompanhe equipamentos e encontre rapidamente o histórico de cada atendimento.", Icon: Building2 },
  { title: "Identifique qualquer equipamento pelo QR Code", text: "Crie etiquetas, fixe nos equipamentos e acesse a ficha correta com uma leitura.", Icon: QrCode },
  { title: "Registre tudo durante o atendimento", text: "Diagnóstico, checklist, medições, serviços, materiais, observações e assinaturas ficam organizados na manutenção.", Icon: Check },
  { title: "Não perca seu trabalho quando a conexão falhar", text: "A manutenção individual pode ser salva localmente e sincronizada depois.", Icon: Wrench },
  { title: "Transforme cada atendimento em histórico", text: "Gere relatórios, programe a próxima manutenção e mantenha o relacionamento com o cliente organizado.", Icon: Check },
];

export function Onboarding() {
  const { session } = useAuth();
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState(session?.organization.name ?? "");
  const [phone, setPhone] = useState(session?.organization.phone ?? "");
  const [saving, setSaving] = useState(false);
  const presentation = step < steps.length;
  const finish = async () => {
    if (!session) return;
    try {
      setSaving(true);
      if (!companyName.trim()) throw new Error("Informe o nome da empresa.");
      const { error } = await supabase.from("organizations").update({ name: companyName.trim(), phone: phone.trim() || null }).eq("id", session.organization.id);
      if (error) throw error;
      invalidateQueries(`report-company:${session.organization.id}`);
      await finishOnboarding(session.user.id, session.organization.id);
      navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
    } catch (error) { Alert.alert("Não foi possível concluir", error instanceof Error ? error.message : "Tente novamente."); }
    finally { setSaving(false); }
  };
  if (!presentation) return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Container><Content>
    <Eyebrow>CONFIGURAÇÃO INICIAL</Eyebrow><PageTitle>Deixe sua empresa pronta para começar</PageTitle><Intro>Esses dados podem ser preenchidos depois. A logo também é opcional.</Intro>
    <Card><FormField label="Nome da empresa" required value={companyName} onChangeText={setCompanyName} placeholder="Minha assistência técnica" /><FormField label="Telefone/WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /><SmallText>Você pode adicionar a logo depois em Dados da empresa.</SmallText></Card>
    <Button label="Ir para a Home" loading={saving} onPress={finish} /><Button label="Pular por enquanto" variant="ghost" disabled={saving} onPress={finish} />
  </Content></Container></KeyboardAvoidingView>;
  const current = steps[step];
  return <Container><Content>
    <Nav><Skip onPress={() => setStep(steps.length)} accessibilityRole="button">Pular</Skip><Dots>{steps.map((_, index) => <Dot key={index} active={index === step} />)}</Dots><View style={{ width: 48 }} /></Nav>
    <Hero><IconWrap><current.Icon size={46} color={theme.colors.primary} strokeWidth={1.8} /></IconWrap><StepTitle>{current.title}</StepTitle><Intro>{current.text}</Intro></Hero>
    <Progress><ProgressFill width={(step + 1) / steps.length} /></Progress>
    <Nav><NavButton disabled={step === 0} onPress={() => setStep(Math.max(0, step - 1))}><ArrowLeft size={19} color={step === 0 ? theme.colors.muted : theme.colors.primary} /><SmallText>Voltar</SmallText></NavButton><NavButton onPress={() => setStep(step + 1)}><SmallText>{step === steps.length - 1 ? "Continuar" : "Próximo"}</SmallText><ArrowRight size={19} color={theme.colors.primary} /></NavButton></Nav>
  </Content></Container>;
}

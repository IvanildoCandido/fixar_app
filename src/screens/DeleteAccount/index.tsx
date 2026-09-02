import { useState } from "react";
import { Alert, Linking, TextInput, View } from "react-native";
import { useTheme } from "styled-components/native";
import { Header } from "../../components/Header";
import { Button, Card } from "../../design-system";
import { useAuth } from "../../auth/AuthContext";
import { supabase } from "../../services/supabase";
import { clearOfflineMaintenances } from "../../services/offlineMaintenance";
import { clearQueryCache } from "../../services/queryCache";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Body, Container, Content, DangerTitle, Heading, Label, Note } from "./styles";

export function DeleteAccount() {
  const theme = useTheme();
  const { session, signOut } = useAuth();
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  async function clearLocalData() {
    if (!session) return;
    await clearOfflineMaintenances({ userId: session.user.id, organizationId: session.organization.id });
    const keys = await AsyncStorage.getAllKeys();
    const privateKeys = keys.filter((key) => key.startsWith("fixar:") || key.startsWith("@fixar:"));
    if (privateKeys.length) await AsyncStorage.multiRemove(privateKeys);
    clearQueryCache();
  }
  async function submit() {
    if (confirmation.trim().toUpperCase() !== "EXCLUIR") { Alert.alert("Confirmação necessária", "Digite EXCLUIR para continuar."); return; }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("account-delete", { body: { confirmation: "EXCLUIR" } });
    if (error) { setLoading(false); Alert.alert("Não foi possível excluir", "Sua conta continua ativa. Tente novamente quando houver conexão."); return; }
    await clearLocalData();
    setLoading(false);
    if (data?.status === "pending") { Alert.alert("Solicitação registrada", data.message); return; }
    await signOut();
    Alert.alert("Conta excluída", "Sua sessão e os dados locais foram removidos.");
  }
  return <Container><Header title="Excluir minha conta" icons /><Content contentContainerStyle={{ padding: 16, gap: 16 }}><Card><View style={{ gap: 12 }}><DangerTitle>Esta ação é permanente</DangerTitle><Heading>O que acontece</Heading><Body>Você perderá o acesso à conta. Dados pessoais e preferências locais serão removidos. Clientes, equipamentos, QR Codes, manutenções e relatórios da empresa não são apagados quando pertencem à organização.</Body><Body>Se você é proprietário, a conta não será excluída automaticamente: uma solicitação segura será registrada para preservar ou encerrar a organização corretamente.</Body><Body>Assinaturas da Google Play ou App Store não são canceladas por este fluxo. Gerencie ou cancele a cobrança na loja correspondente.</Body></View></Card><Card><Label>Digite EXCLUIR para confirmar</Label><TextInput accessibilityLabel="Confirmação de exclusão" value={confirmation} onChangeText={setConfirmation} autoCapitalize="characters" style={{ height: 46, marginTop: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, color: theme.colors.foreground }} placeholder="EXCLUIR" /><Button label="EXCLUIR MINHA CONTA" variant="destructive" loading={loading} onPress={submit} /></Card><Note>Precisa entender o processo antes de confirmar? <Body onPress={() => Linking.openURL("https://fixar.systechsolucoes.com.br/excluir-conta")}>Leia a página pública de exclusão.</Body></Note></Content></Container>;
}

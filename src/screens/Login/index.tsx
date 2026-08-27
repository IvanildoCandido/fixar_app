import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Wrench } from "lucide-react-native";
import { useTheme } from "styled-components/native";

import { useAuth } from "../../auth/AuthContext";
import {
  Brand,
  BrandMark,
  BrandSubtitle,
  Button,
  ButtonLabel,
  Card,
  Container,
  Field,
  FieldLabel,
  Input,
  Title,
} from "./styles";

export function Login() {
  const { signIn, signUp, resendConfirmation } = useAuth();
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const theme = useTheme();

  async function handleSignIn() {
    try {
      setSubmitting(true);
      await signIn(email, password);
    } catch (error) {
      Alert.alert(
        "Não foi possível entrar",
        error instanceof Error ? error.message : "Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignUp() {
    try {
      setSubmitting(true);
      const signedIn = await signUp(name, email, password);
      if (!signedIn) {
        Alert.alert("Confirme seu e-mail", "Enviamos um link de confirmação antes do primeiro acesso.");
        setCreatingAccount(false);
      }
    } catch (error) {
      Alert.alert("Não foi possível criar a conta", error instanceof Error ? error.message : "Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    try {
      setSubmitting(true);
      await resendConfirmation(email);
      Alert.alert("Confirmação reenviada", "Abra o novo link recebido no seu e-mail.");
    } catch (error) {
      Alert.alert("Não foi possível reenviar", error instanceof Error ? error.message : "Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Container>
        <BrandMark>
          <Wrench size={32} color={theme.colors.primaryForeground} />
        </BrandMark>
        <Brand>fixar</Brand>
        <BrandSubtitle>Gestão de serviços para equipes que resolvem.</BrandSubtitle>

        <Card>
          <Title>{creatingAccount ? "Crie sua conta" : "Acesse sua empresa"}</Title>
          {creatingAccount && (
            <Field>
              <FieldLabel>Seu nome</FieldLabel>
              <Input value={name} onChangeText={setName} placeholder="Nome completo" />
            </Field>
          )}
          <Field>
            <FieldLabel>E-mail</FieldLabel>
            <Input
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="voce@empresa.com"
            />
          </Field>
          <Field>
            <FieldLabel>Senha</FieldLabel>
            <Input
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Sua senha"
            />
          </Field>
          <Button variant="primary" onPress={creatingAccount ? handleSignUp : handleSignIn} disabled={submitting}>
            <ButtonLabel>{submitting ? "Aguarde..." : creatingAccount ? "Criar conta" : "Entrar"}</ButtonLabel>
          </Button>
          <Button variant="secondary" onPress={() => setCreatingAccount(!creatingAccount)} disabled={submitting}>
            <ButtonLabel variant="secondary">{creatingAccount ? "Já tenho uma conta" : "Criar uma conta"}</ButtonLabel>
          </Button>
          {!creatingAccount && (
            <Button variant="ghost" onPress={handleResendConfirmation} disabled={submitting}>
              <ButtonLabel variant="ghost">Reenviar confirmação</ButtonLabel>
            </Button>
          )}
        </Card>
      </Container>
    </KeyboardAvoidingView>
  );
}

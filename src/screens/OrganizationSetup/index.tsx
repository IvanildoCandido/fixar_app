import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../../auth/AuthContext";
import { Button, ButtonLabel, Card, Container, Field, FieldLabel, Footer, Input, Title } from "../Login/styles";

export function OrganizationSetup() {
  const { createOrganization, signOut } = useAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function handleCreate() {
    try {
      setSubmitting(true);
      await createOrganization(name);
    } catch (error) {
      Alert.alert("Não foi possível criar a empresa", error instanceof Error ? error.message : "Tente novamente.");
    } finally { setSubmitting(false); }
  }
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Container>
        <Card>
          <Title>Configure sua empresa</Title>
          <Field>
            <FieldLabel>Nome da empresa</FieldLabel>
            <Input value={name} onChangeText={setName} placeholder="Minha assistência técnica" />
          </Field>
          <Button onPress={handleCreate} disabled={submitting}>
            <ButtonLabel>{submitting ? "Criando..." : "Começar"}</ButtonLabel>
          </Button>
          <Button onPress={signOut} disabled={submitting}><ButtonLabel>Sair</ButtonLabel></Button>
          <Footer>Você será o proprietário desta organização.</Footer>
        </Card>
      </Container>
    </KeyboardAvoidingView>
  );
}

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Header } from "../../components/Header";
import { Modal } from "react-native";

import { Container, PartsList } from "./styles";
import { AddPart } from "../../components/AddPart";
import { PartItem } from "../../components/PartItem";
import API from "../../services/API";
import { Part } from "../../types/data";
import { defaultPart } from "../../utils/dafaultValues";
import { Loading } from "../../components/Loading";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState, ErrorState, SearchInput } from "../../design-system";
import { invalidateQueries } from "../../services/queryCache";

export const Parts = () => {
  const listRef = useRef<any>(null);
  const [partsModal, setPartsModal] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [dataEdit, setDataEdit] = useState(defaultPart);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const handleModalOpen = () => {
    setPartsModal(true);
    setDataEdit(defaultPart);
  };

  const loadParts = async () => {
    setError("");
    try {
      const { data } = await API.get("/parts/list");
      setParts(data);
    } catch (error) {
      console.log(error);
      setError("Não foi possível carregar a lista de peças.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      loadParts();
      return () => {};
    }, [partsModal])
  );
  const refreshParts = () => {
    invalidateQueries("catalog:part:");
    setRefreshing(true);
    loadParts();
  };
  const filtered = useMemo(() => parts.filter((item) => !query.trim() || item.name.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"))), [parts, query]);
  return (
    <Container>
      <Header title="Catálogo de peças" onPress={handleModalOpen} />
      <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar peças" />
      {loading ? (
        <Loading />
      ) : error ? <ErrorState description={error} /> : (
        <PartsList
          ref={listRef}
          data={filtered}
          refreshing={refreshing}
          onRefresh={refreshParts}
          renderItem={({ item }: { item: Part }) => (
            <PartItem
              id={item.id}
              name={item.name}
              price={item.price}
              setParts={setParts}
              setPartsModal={setPartsModal}
              setDataEdit={setDataEdit}
              setLoading={setLoading}
            />
          )}
          keyExtractor={(item: Part) => item.id}
          ListEmptyComponent={<EmptyState title={query ? "Peça não encontrada" : "Nenhuma peça cadastrada"} />}
        />
      )}
      <Modal visible={partsModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setPartsModal(false)}>
        <AddPart closeModal={setPartsModal} dataEdit={dataEdit} />
      </Modal>
    </Container>
  );
};

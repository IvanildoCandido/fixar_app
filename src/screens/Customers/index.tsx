import React, { useCallback, useMemo, useRef, useState } from "react";
import { Header } from "../../components/Header";
import { Modal } from "react-native";

import { Container, CustomersList } from "./styles";
import { AddCustomer } from "../../components/AddCustomer";
import { CustomerItem } from "../../components/CustomerItem";

import API from "../../services/API";
import { Customer, CustomerDevices, CustomerStats } from "../../types/data";
import { Loading } from "../../components/Loading";
import { useFocusEffect } from "@react-navigation/native";
import { EmptyState, ErrorState, SearchInput } from "../../design-system";
import { invalidateQueries } from "../../services/queryCache";

export const defaultData = {
  id: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  document: "",
};

export const Customers = () => {
  const listRef = useRef<any>(null);
  const [customerModal, setCustomerModal] = useState(false);
  const [customers, setCustomers] = useState<CustomerStats[]>([]);
  const [dataEdit, setDataEdit] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const handleModalOpen = () => {
    setCustomerModal(true);
    setDataEdit(defaultData);
  };

  const loadCustomers = async () => {
    setError("");
    try {
      const { data } = await API.get("/customers/list");
      setCustomers(data);
    } catch (error) {
      console.log(error);
      setError("Não foi possível carregar a lista de clientes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      loadCustomers();
      return () => {};
    }, [customerModal])
  );
  const refreshCustomers = () => {
    invalidateQueries("customers:");
    setRefreshing(true);
    loadCustomers();
  };
  const filteredCustomers = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    if (!term) return customers;
    return customers.filter((customer) => `${customer.name} ${customer.phone} ${customer.email} ${customer.document}`.toLocaleLowerCase("pt-BR").includes(term));
  }, [customers, query]);

  return (
    <Container>
      <Header title="Clientes" onPress={handleModalOpen} />
      <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar clientes" />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState description={error} onRetry={loadCustomers} />
      ) : (
        <CustomersList
          ref={listRef}
          data={filteredCustomers}
          refreshing={refreshing}
          onRefresh={refreshCustomers}
          renderItem={({ item }: { item: CustomerStats }) => (
            <CustomerItem
              id={item.id}
              name={item.name}
              phone={item.phone}
              devicesCount={item.devicesQuantity?.toString()}
              setCustomers={setCustomers}
              setCustomerModal={setCustomerModal}
              setDataEdit={setDataEdit}
              setLoading={setLoading}
            />
          )}
          keyExtractor={(item: Customer) => item.id}
          ListEmptyComponent={<EmptyState title={query ? "Cliente não encontrado" : "Nenhum cliente cadastrado ainda"} description={query ? "Revise o termo pesquisado." : "Cadastre o primeiro cliente para iniciar sua operação."} actionLabel={!query ? "Cadastrar primeiro cliente" : undefined} onAction={!query ? handleModalOpen : undefined} />}
        />
      )}
      <Modal visible={customerModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setCustomerModal(false)}>
        <AddCustomer closeModal={setCustomerModal} dataEdit={dataEdit} />
      </Modal>
    </Container>
  );
};

import React, { useCallback, useMemo, useState } from "react";
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

export const defaultData = {
  id: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  document: "",
};

export const Customers = () => {
  const [customerModal, setCustomerModal] = useState(false);
  const [customers, setCustomers] = useState<CustomerStats[]>([]);
  const [dataEdit, setDataEdit] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const handleModalOpen = () => {
    setCustomerModal(true);
    setDataEdit(defaultData);
  };

  const loadCustomers = async () => {
    setError("");
    try {
      const { data } = await API.get("/customers/list");
      setCustomers(data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setError("Não foi possível carregar a lista de clientes.");
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadCustomers();
      return () => {};
    }, [customerModal])
  );
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
        <ErrorState description={error} />
      ) : (
        <CustomersList
          data={filteredCustomers}
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
          ListEmptyComponent={<EmptyState title={query ? "Cliente não encontrado" : "Nenhum cliente cadastrado"} description={query ? "Revise o termo pesquisado." : "Use o botão adicionar para cadastrar o primeiro cliente."} />}
        />
      )}
      <Modal visible={customerModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setCustomerModal(false)}>
        <AddCustomer closeModal={setCustomerModal} dataEdit={dataEdit} />
      </Modal>
    </Container>
  );
};

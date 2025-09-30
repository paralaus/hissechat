import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./App.css";
import Navigation from "./navigation";
import { theme } from "./styles/theme";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <Navigation />
      </QueryClientProvider>
    </ChakraProvider>
  );
};

export default App;

import { Box } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import Footer from "../common/Footer";

const AuthLayout = () => {
  return (
    <Box display={"flex"} flexDirection={"column"} flex={1}>
      <Outlet />
      <Footer />
    </Box>
  );
};

export default AuthLayout;

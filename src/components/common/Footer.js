import { Box, Text } from "@chakra-ui/react";

const Footer = () => {
  return (
    <Box
      as="footer"
      width={"100%"}
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
    >
      <Text color="gray.400" fontSize="small" py={"1"}>
        © Admin | Tüm Hakları Saklıdır.
      </Text>
    </Box>
  );
};

export default Footer;

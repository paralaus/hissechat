import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Avatar,
  Box,
  Badge,
  Textarea,
} from '@chakra-ui/react';
import {format} from 'date-fns';
import {tr} from 'date-fns/locale';
import {FiStar} from 'react-icons/fi';

const RatingDetailModal = ({isOpen, onClose, rating}) => {
  if (!rating) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Değerlendirme Detayı</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* User Info */}
            <HStack spacing={4} p={4} bg="gray.50" borderRadius="md">
              <Avatar
                size="md"
                name={rating.user?.name}
                src={rating.user?.profileImage}
              />
              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  {rating.user?.name || 'Anonim'}
                </Text>
                <Text color="gray.500">{rating.user?.email}</Text>
                <Text fontSize="xs" color="gray.400" mt={1}>
                  IP: {rating.ipAddress}
                </Text>
              </Box>
            </HStack>

            {/* Rating */}
            <HStack spacing={2} align="center">
              <Text fontWeight="semibold">Puan:</Text>
              <HStack spacing={1}>
                {Array(5)
                  .fill('')
                  .map((_, i) => (
                    <FiStar
                      key={i}
                      fill={i < rating.rating ? 'gold' : 'none'}
                      color={i < rating.rating ? 'gold' : 'gray'}
                    />
                  ))}
              </HStack>
              <Badge colorScheme={rating.rating >= 4 ? 'green' : rating.rating >= 3 ? 'yellow' : 'red'}>
                {rating.rating} / 5
              </Badge>
            </HStack>

            {/* Date */}
            <HStack>
              <Text fontWeight="semibold">Tarih:</Text>
              <Text>
                {format(new Date(rating.createdAt), 'dd MMMM yyyy HH:mm', {
                  locale: tr,
                })}
              </Text>
            </HStack>

            {/* Comment */}
            <Box>
              <Text fontWeight="semibold" mb={2}>
                Yorum:
              </Text>
              <Box
                p={4}
                border="1px"
                borderColor="gray.200"
                borderRadius="md"
                bg="white"
                minH="100px"
                maxH="300px"
                overflowY="auto"
              >
                <Text whiteSpace="pre-wrap">
                  {rating.comment || 'Yorum yapılmamış.'}
                </Text>
              </Box>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" onClick={onClose}>
            Kapat
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RatingDetailModal;

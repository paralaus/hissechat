import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  AlertIcon,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';

const formatNumber = value => Number(value || 0).toLocaleString('tr-TR');

const parseTypedCount = value => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? Number(digits) : null;
};

/**
 * Second step of a wide broadcast (every user / every channel): shows the
 * recipient count from the preview endpoint and enables sending only after
 * the admin types that number.
 */
const BroadcastConfirmModal = ({isOpen, preview, onConfirm, onCancel}) => {
  const [typed, setTyped] = useState('');
  const expected = Number(preview?.estimatedRecipients || 0);
  const matches = parseTypedCount(typed) === expected;

  useEffect(() => {
    if (isOpen) setTyped('');
  }, [isOpen]);

  const expiresAt = preview?.expiresAt
    ? new Date(preview.expiresAt).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} isCentered closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Geniş kapsamlı gönderimi onaylayın</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              Bu gönderim geri alınamaz; push bildirimleri cihazlara ulaştıktan sonra silinemez.
            </Alert>
            <Text fontSize="3xl" fontWeight="bold">
              {formatNumber(expected)} alıcı
            </Text>
            {typeof preview?.totalChannels === 'number' && (
              <Text color="gray.500">{formatNumber(preview.totalChannels)} kanal</Text>
            )}
            <FormControl>
              <FormLabel>Onaylamak için alıcı sayısını yazın</FormLabel>
              <Input
                value={typed}
                onChange={event => setTyped(event.target.value)}
                inputMode="numeric"
                autoComplete="off"
                autoFocus
              />
              {expiresAt && <FormHelperText>Onay {expiresAt} saatine kadar geçerli.</FormHelperText>}
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onCancel}>
            Vazgeç
          </Button>
          <Button colorScheme="red" isDisabled={!matches} onClick={() => onConfirm(expected)}>
            Gönder
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

/**
 * `ensureConfirmed(fetchPreview)` calls the preview endpoint; for a wide
 * target it opens the modal and resolves with the fields the send request
 * must carry ({confirmToken, confirmRecipientCount}), `{}` when no
 * confirmation is needed, or `null` when the admin cancelled.
 * Render `modal` once in the page.
 */
export const useBroadcastConfirmation = () => {
  const [pending, setPending] = useState(null);

  const ensureConfirmed = useCallback(async fetchPreview => {
    const {data} = await fetchPreview();
    if (!data?.requiresConfirmation) return {};
    const typedCount = await new Promise(resolve => setPending({preview: data, resolve}));
    if (typedCount === null) return null;
    return {
      confirmToken: data.confirmationToken,
      confirmRecipientCount: typedCount,
    };
  }, []);

  const finish = value => {
    if (pending) pending.resolve(value);
    setPending(null);
  };

  const modal = (
    <BroadcastConfirmModal
      isOpen={Boolean(pending)}
      preview={pending?.preview}
      onConfirm={count => finish(count)}
      onCancel={() => finish(null)}
    />
  );

  return {ensureConfirmed, modal};
};

export default BroadcastConfirmModal;

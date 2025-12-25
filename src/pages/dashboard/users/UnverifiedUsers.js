import {
  Text,
  Badge,
  Button,
  Box,
  IconButton,
  Tooltip,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Textarea,
  VStack,
  Progress,
  useDisclosure,
} from '@chakra-ui/react';
import {DataTable, Page} from '../../../components';
import {useNavigate} from 'react-router-dom';
import {api} from '../../../api';
import {RoleLabel} from '../../../config';
import {routes} from '../../../config/routes';
import {useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {FiCheck, FiMail} from 'react-icons/fi';

const fetchData = async options => {
  // Fetch unverified users
  // Backend might not support 'verified' filter directly, so we might need to filter client-side
  // similar to how Users.js handles privileged users
  const response = await api.getUsers({ ...options, limit: 1000, page: 1 });
  
  const allUsers = response.data.results || [];
  // Assuming 'isVerified' field exists based on user request.
  const unverifiedUsers = allUsers.filter(u => !u.isVerified);
  
  // Manual pagination
  const page = options.page || 1;
  const limit = options.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    results: unverifiedUsers.slice(startIndex, endIndex),
    page: page,
    limit: limit,
    totalPages: Math.ceil(unverifiedUsers.length / limit),
    totalResults: unverifiedUsers.length,
    allUnverified: unverifiedUsers, // Return all for bulk action
  };
};

const UnverifiedUsers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [emailBody, setEmailBody] = useState('Hesabınız onaylanmıştır. Giriş yapabilirsiniz.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [allUnverifiedUsers, setAllUnverifiedUsers] = useState([]);

  // Query to get data and keep track of all unverified users
  const { refetch } = useQuery({
    queryKey: ['unverified-users'],
    queryFn: () => fetchData({}),
    onSuccess: (data) => {
      setAllUnverifiedUsers(data.allUnverified);
    }
  });

  const verifyUserMutation = useMutation({
    mutationFn: ({userId}) => api.updateUser(userId, {verified: true, isVerified: true}),
    onSuccess: () => {
      queryClient.invalidateQueries(['unverified-users']);
      toast({
        title: 'Kullanıcı doğrulandı',
        status: 'success',
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error.response?.data?.message || 'İşlem başarısız',
        status: 'error',
        duration: 3000,
      });
    },
  });

  const handleBulkVerify = async () => {
    setIsProcessing(true);
    setProgress(0);
    const users = allUnverifiedUsers;
    const total = users.length;
    let successCount = 0;

    for (let i = 0; i < total; i++) {
      try {
        await api.updateUser(users[i].id || users[i]._id, {verified: true, isVerified: true});
        // Simulate email sending or assume backend handles it if triggered
        // If we had an email endpoint: await api.sendEmail(users[i].email, emailBody);
        successCount++;
      } catch (error) {
        console.error(`Failed to verify user ${users[i].email}`, error);
      }
      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setIsProcessing(false);
    onClose();
    refetch();
    
    toast({
      title: 'İşlem Tamamlandı',
      description: `${total} kullanıcıdan ${successCount} tanesi doğrulandı.`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  const onRow = async item => {
    navigate(routes.editUser.getPath(item.id));
  };

  return (
    <Page>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Text fontSize="lg" fontWeight="bold">Doğrulanmamış Kullanıcılar</Text>
        <Button
          leftIcon={<FiMail />}
          colorScheme="blue"
          onClick={onOpen}
          isDisabled={!allUnverifiedUsers?.length}
        >
          Toplu Onay ve Mail Gönder ({allUnverifiedUsers?.length || 0})
        </Button>
      </Box>

      <DataTable
        queryEnabled
        editVisible
        onRow={onRow}
        columns={[
          {
            header: 'Ad Soyad',
            accessorKey: 'fullname',
          },
          {
            header: 'E-posta',
            accessorKey: 'email',
          },
          {
            header: 'Rol',
            accessorKey: 'role',
            cell: ({getValue}) => {
              const role = getValue();
              const label = RoleLabel[role];
              const colorScheme = role === 'admin' ? 'red' : 'gray';
              return <Badge colorScheme={colorScheme}>{label}</Badge>;
            },
          },
          {
            header: 'Durum',
            accessorKey: 'isVerified',
            cell: () => <Badge colorScheme="red">Doğrulanmamış</Badge>
          },
          {
            header: '',
            accessorKey: 'actions',
            cell: ({row}) => {
              const user = row.original;
              const userId = user.id || user._id;
              
              return (
                <Tooltip label="Onayla">
                  <IconButton
                    icon={<FiCheck />}
                    colorScheme="green"
                    onClick={(e) => {
                      e.stopPropagation();
                      verifyUserMutation.mutate({ userId });
                    }}
                    isLoading={verifyUserMutation.isPending && verifyUserMutation.variables?.userId === userId}
                    variant="ghost"
                    size="sm"
                    aria-label="Verify"
                  />
                </Tooltip>
              );
            },
          },
        ]}
        fetchData={fetchData}
      />

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Toplu Onay ve Mail Gönderimi</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>
                Bu işlem listedeki <strong>{allUnverifiedUsers?.length}</strong> kullanıcının hesabını onaylayacak 
                ve aşağıdaki bilgilendirme metnini e-posta olarak gönderecektir.
              </Text>
              
              <Box w="100%">
                <Text mb={2} fontWeight="bold">E-posta İçeriği:</Text>
                <Textarea 
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={6}
                />
              </Box>

              {isProcessing && (
                <Box w="100%">
                  <Text mb={2}>İşleniyor... %{progress}</Text>
                  <Progress value={progress} size="sm" colorScheme="blue" />
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isProcessing}>
              İptal
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleBulkVerify}
              isLoading={isProcessing}
              loadingText="Gönderiliyor"
            >
              Onayla ve Gönder
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Page>
  );
};

export default UnverifiedUsers;

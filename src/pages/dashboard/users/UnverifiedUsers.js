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
  Alert,
  AlertIcon,
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
  // Check if this is a "fetch all" call (for bulk actions) or a pagination call
  const isBulkFetch = !options.page && !options.limit;

  // Backend "isVerified" filtresini desteklemediği için tüm kullanıcıları çekip client-side filtreleme yapıyoruz
  try {
    // Toplu işlem için veya normal listeleme için önce veriyi çekelim
    // Not: Bu işlem limiti 1000 kullanıcı ile sınırlıdır.
    const response = await api.getUsers({
      limit: 1000,
      sortBy: 'createdAt:desc',
    });

    const allUsers = response.data.results || [];
    // isVerified false olanları filtrele
    const unverifiedUsers = allUsers.filter(u => !u.isVerified);

    if (isBulkFetch) {
      return {
        results: [],
        allUnverified: unverifiedUsers,
        totalResults: unverifiedUsers.length,
      };
    }

    // Regular pagination fetch for the DataTable (Client-side pagination)
    const page = options.page || 1;
    const limit = options.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedUsers = unverifiedUsers.slice(startIndex, endIndex);

    // Map to the format expected by the columns
    const formattedUsers = paginatedUsers.map(u => ({
      ...u,
      mongoUserExists: true,
      pbVerified: u.isVerified, // Should be false
    }));

    return {
      results: formattedUsers,
      page: page,
      limit: limit,
      totalPages: Math.ceil(unverifiedUsers.length / limit),
      totalResults: unverifiedUsers.length,
      allUnverified: [], // Not needed here
    };
  } catch (error) {
    console.error('Fetch error:', error);
    return {
      results: [],
      page: 1,
      limit: 10,
      totalPages: 0,
      totalResults: 0,
      allUnverified: [],
    };
  }
};

const UnverifiedUsers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [emailBody, setEmailBody] = useState(
    'Hesabınız onaylanmıştır. Giriş yapabilirsiniz.',
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [allUnverifiedUsers, setAllUnverifiedUsers] = useState([]);

  // Query to get data and keep track of all unverified users
  const {refetch, error: queryError} = useQuery({
    queryKey: ['unverified-users'],
    queryFn: () => fetchData({}),
    onSuccess: data => {
      setAllUnverifiedUsers(data.allUnverified);
    },
  });

  const verifyUserMutation = useMutation({
    mutationFn: async ({user}) => {
      // Use backend endpoint to approve and send email
      await api.approveUsers([user.email], emailBody);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['unverified-users']);
      toast({
        title: 'Kullanıcı doğrulandı',
        status: 'success',
        duration: 2000,
      });
    },
    onError: error => {
      toast({
        title: 'Hata',
        description:
          error.response?.data?.message || error.message || 'İşlem başarısız',
        status: 'error',
        duration: 3000,
      });
    },
  });

  const handleBulkVerify = async () => {
    setIsProcessing(true);
    setProgress(50); // Indeterminate state or starting

    try {
      const emails = allUnverifiedUsers.map(u => u.email);
      await api.approveUsers(emails, emailBody);

      toast({
        title: 'İşlem Başarılı',
        description: `${emails.length} kullanıcı onaylandı ve bilgilendirildi.`,
        status: 'success',
        duration: 5000,
      });

      onClose();
      refetch();
    } catch (error) {
      toast({
        title: 'Hata',
        description:
          error.response?.data?.message || error.message || 'İşlem başarısız',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const onRow = async item => {
    if (item.id) {
      navigate(routes.editUser.getPath(item.id));
    }
  };

  return (
    <Page>
      <Box
        mb={4}
        display="flex"
        justifyContent="space-between"
        alignItems="center">
        <Text fontSize="lg" fontWeight="bold">
          Doğrulanmamış Kullanıcılar (PocketBase)
        </Text>
        <Button
          leftIcon={<FiMail />}
          colorScheme="blue"
          onClick={onOpen}
          isDisabled={!allUnverifiedUsers?.length}>
          Toplu Onay ve Mail Gönder ({allUnverifiedUsers?.length || 0})
        </Button>
      </Box>

      {!allUnverifiedUsers?.length && !queryError && (
        <Alert status="info" mb={4}>
          <AlertIcon />
          PocketBase'de doğrulanmamış kullanıcı bulunamadı.
        </Alert>
      )}

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
              const label = RoleLabel[role] || role;
              const colorScheme = role === 'admin' ? 'red' : 'gray';
              return <Badge colorScheme={colorScheme}>{label}</Badge>;
            },
          },
          {
            header: 'PB Durum',
            accessorKey: 'pbVerified',
            cell: ({getValue}) => (
              <Badge colorScheme={getValue() ? 'green' : 'red'}>
                {getValue() ? 'Doğrulanmış' : 'Doğrulanmamış'}
              </Badge>
            ),
          },
          {
            header: 'MongoDB Durum',
            accessorKey: 'mongoUserExists',
            cell: ({getValue}) => (
              <Badge colorScheme={getValue() ? 'green' : 'orange'}>
                {getValue() ? 'Eşleşti' : 'Bulunamadı'}
              </Badge>
            ),
          },
          {
            header: '',
            accessorKey: 'actions',
            cell: ({row}) => {
              const user = row.original;

              return (
                <Tooltip label="Onayla">
                  <IconButton
                    icon={<FiCheck />}
                    colorScheme="green"
                    onClick={e => {
                      e.stopPropagation();
                      verifyUserMutation.mutate({user});
                    }}
                    isLoading={
                      verifyUserMutation.isPending &&
                      verifyUserMutation.variables?.user?.email === user.email
                    }
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
                Bu işlem PocketBase üzerindeki{' '}
                <strong>{allUnverifiedUsers?.length}</strong> kullanıcının
                hesabını onaylayacak ve aşağıdaki bilgilendirme metnini e-posta
                olarak gönderecektir.
              </Text>

              <Box w="100%">
                <Text mb={2} fontWeight="bold">
                  E-posta İçeriği:
                </Text>
                <Textarea
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
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
            <Button
              variant="ghost"
              mr={3}
              onClick={onClose}
              isDisabled={isProcessing}>
              İptal
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleBulkVerify}
              isLoading={isProcessing}
              loadingText="Gönderiliyor">
              Onayla ve Gönder
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Page>
  );
};

export default UnverifiedUsers;

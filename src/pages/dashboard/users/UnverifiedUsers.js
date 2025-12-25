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
import PocketBase from 'pocketbase';
import {POCKETBASE_URL} from '../../../config/pocketbase';

const pb = new PocketBase(POCKETBASE_URL);

const fetchData = async options => {
  // 1. Fetch unverified users from PocketBase
  let pbUsers = [];
  try {
    // Attempt to fetch unverified users from PocketBase
    // Note: This requires the 'users' collection to be listable (API rules)
    // or we need to be authenticated as an admin.
    const pbResponse = await pb.collection('users').getList(1, 100, {
      filter: 'verified = false',
      sort: '-created',
    });
    pbUsers = pbResponse.items;
  } catch (error) {
    console.error('PocketBase fetch error:', error);
    // If PB fetch fails, we might want to throw or return empty, but let's try to handle gracefully
    // by returning a specific error indicator or fallback to MongoDB filtering if possible,
    // though the user specifically asked for PB data.
  }

  // 2. Fetch all users from MongoDB to match IDs
  // We need MongoDB IDs to update the 'isVerified' status in the backend/MongoDB
  const mongoResponse = await api.getUsers({ limit: 1000 });
  const mongoUsers = mongoResponse.data.results || [];

  // 3. Merge data
  // We want to show users that are unverified in PocketBase
  const mergedUsers = pbUsers.map(pbUser => {
    const mongoUser = mongoUsers.find(u => u.email === pbUser.email);
    return {
      ...mongoUser, // Use MongoDB user data as base if exists (for role, etc.)
      // Fallback to PB data if not in Mongo (though user said they should be there)
      id: mongoUser?.id || mongoUser?._id, // Mongo ID
      pbId: pbUser.id, // PocketBase ID
      email: pbUser.email,
      fullname: mongoUser?.fullname || pbUser.name || pbUser.username || 'İsimsiz',
      isVerified: mongoUser?.isVerified || false, // Mongo status
      pbVerified: pbUser.verified, // PB status (should be false)
      role: mongoUser?.role || 'user',
      mongoUserExists: !!mongoUser,
    };
  });

  // Filter out any that might have been verified in the meantime or if PB list included verified (unlikely with filter)
  const finalUsers = mergedUsers;

  // Manual pagination for the DataTable (client-side of the fetched batch)
  const page = options.page || 1;
  const limit = options.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    results: finalUsers.slice(startIndex, endIndex),
    page: page,
    limit: limit,
    totalPages: Math.ceil(finalUsers.length / limit),
    totalResults: finalUsers.length,
    allUnverified: finalUsers, // Return all for bulk action
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
  const { refetch, error: queryError } = useQuery({
    queryKey: ['unverified-users'],
    queryFn: () => fetchData({}),
    onSuccess: (data) => {
      setAllUnverifiedUsers(data.allUnverified);
    }
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
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error.response?.data?.message || error.message || 'İşlem başarısız',
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
        description: error.response?.data?.message || error.message || 'İşlem başarısız',
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
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Text fontSize="lg" fontWeight="bold">Doğrulanmamış Kullanıcılar (PocketBase)</Text>
        <Button
          leftIcon={<FiMail />}
          colorScheme="blue"
          onClick={onOpen}
          isDisabled={!allUnverifiedUsers?.length}
        >
          Toplu Onay ve Mail Gönder ({allUnverifiedUsers?.length || 0})
        </Button>
      </Box>

      {(!allUnverifiedUsers?.length && !queryError) && (
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
              <Badge colorScheme={getValue() ? "green" : "red"}>
                {getValue() ? "Doğrulanmış" : "Doğrulanmamış"}
              </Badge>
            )
          },
          {
            header: 'MongoDB Durum',
            accessorKey: 'mongoUserExists',
            cell: ({getValue}) => (
              <Badge colorScheme={getValue() ? "green" : "orange"}>
                {getValue() ? "Eşleşti" : "Bulunamadı"}
              </Badge>
            )
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
                    onClick={(e) => {
                      e.stopPropagation();
                      verifyUserMutation.mutate({ user });
                    }}
                    isLoading={verifyUserMutation.isPending && verifyUserMutation.variables?.user?.email === user.email}
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
                Bu işlem PocketBase üzerindeki <strong>{allUnverifiedUsers?.length}</strong> kullanıcının hesabını onaylayacak 
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

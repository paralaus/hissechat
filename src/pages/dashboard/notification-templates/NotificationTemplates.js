import React, {useEffect, useState, useCallback} from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Textarea,
  Select,
  Switch,
  FormControl,
  FormLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  Badge,
  Text,
  useColorModeValue,
  Card,
  CardBody,
  Tag,
  Code,
  Spinner,
} from '@chakra-ui/react';
import {FiEdit, FiTrash2, FiPlus, FiEye} from 'react-icons/fi';
import Page from '../../../components/common/Page';
import {
  getNotificationTemplates,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
  previewNotificationTemplate,
} from '../../../api/api';

const emptyForm = {
  name: '',
  description: '',
  category: 'general',
  title: '',
  body: '',
  receiverType: 'all',
  variables: '',
  defaultData: '{}',
  isActive: true,
};

const NotificationTemplates = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const editor = useDisclosure();
  const previewModal = useDisclosure();
  const [preview, setPreview] = useState(null);
  const [previewVars, setPreviewVars] = useState('{}');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTplId, setPreviewTplId] = useState(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const {data} = await getNotificationTemplates({limit: 200});
      setList(data.results || data || []);
    } catch (e) {
      toast({status: 'error', title: 'Şablonlar yüklenemedi'});
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    editor.onOpen();
  };

  const openEdit = (tpl) => {
    setEditing(tpl);
    setForm({
      name: tpl.name || '',
      description: tpl.description || '',
      category: tpl.category || 'general',
      title: tpl.title || '',
      body: tpl.body || '',
      receiverType: tpl.receiverType || 'all',
      variables: (tpl.variables || []).join(', '),
      defaultData: JSON.stringify(tpl.defaultData || {}, null, 2),
      isActive: tpl.isActive !== false,
    });
    editor.onOpen();
  };

  const handleSave = async () => {
    let defaultData = {};
    try {
      defaultData = form.defaultData ? JSON.parse(form.defaultData) : {};
    } catch (e) {
      toast({status: 'error', title: 'defaultData geçerli JSON değil'});
      return;
    }
    const body = {
      name: form.name.trim(),
      description: form.description,
      category: form.category,
      title: form.title,
      body: form.body,
      receiverType: form.receiverType,
      variables: form.variables
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      defaultData,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await updateNotificationTemplate(editing.id, body);
        toast({status: 'success', title: 'Güncellendi'});
      } else {
        await createNotificationTemplate(body);
        toast({status: 'success', title: 'Oluşturuldu'});
      }
      editor.onClose();
      fetchList();
    } catch (e) {
      toast({status: 'error', title: 'Kayıt başarısız', description: e?.response?.data?.message});
    }
  };

  const handleDelete = async (tpl) => {
    if (!window.confirm(`"${tpl.name}" şablonunu sil?`)) return;
    try {
      await deleteNotificationTemplate(tpl.id);
      toast({status: 'success', title: 'Silindi'});
      fetchList();
    } catch (e) {
      toast({status: 'error', title: 'Silme başarısız'});
    }
  };

  const openPreview = (tpl) => {
    setPreviewTplId(tpl.id);
    setPreview(null);
    setPreviewVars(JSON.stringify(tpl.defaultData || {}, null, 2));
    previewModal.onOpen();
  };

  const runPreview = async () => {
    setPreviewLoading(true);
    try {
      const vars = previewVars ? JSON.parse(previewVars) : {};
      const {data} = await previewNotificationTemplate(previewTplId, vars);
      setPreview(data);
    } catch (e) {
      toast({status: 'error', title: 'Önizleme başarısız', description: e?.response?.data?.message || e.message});
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <Page title="Bildirim Şablonları">
      <Flex justify="flex-end" mb={4}>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={openCreate}>
          Yeni Şablon
        </Button>
      </Flex>

      <Card bg={cardBg}>
        <CardBody>
          {loading ? (
            <Flex justify="center" p={8}>
              <Spinner />
            </Flex>
          ) : (
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>İsim</Th>
                  <Th>Kategori</Th>
                  <Th>Başlık</Th>
                  <Th>Alıcı</Th>
                  <Th>Değişkenler</Th>
                  <Th>Aktif</Th>
                  <Th>İşlemler</Th>
                </Tr>
              </Thead>
              <Tbody>
                {list.map((tpl) => (
                  <Tr key={tpl.id}>
                    <Td>
                      <Code fontSize="xs">{tpl.name}</Code>
                    </Td>
                    <Td>
                      <Tag size="sm">{tpl.category}</Tag>
                    </Td>
                    <Td maxW="300px" isTruncated title={tpl.title}>
                      {tpl.title}
                    </Td>
                    <Td>{tpl.receiverType}</Td>
                    <Td>
                      <HStack spacing={1}>
                        {(tpl.variables || []).map((v) => (
                          <Tag key={v} size="sm" colorScheme="purple">
                            {v}
                          </Tag>
                        ))}
                      </HStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={tpl.isActive ? 'green' : 'gray'}>
                        {tpl.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack>
                        <IconButton size="sm" aria-label="preview" icon={<FiEye />} onClick={() => openPreview(tpl)} />
                        <IconButton size="sm" aria-label="edit" icon={<FiEdit />} onClick={() => openEdit(tpl)} />
                        <IconButton
                          size="sm"
                          aria-label="delete"
                          icon={<FiTrash2 />}
                          colorScheme="red"
                          onClick={() => handleDelete(tpl)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
                {list.length === 0 && (
                  <Tr>
                    <Td colSpan={7} textAlign="center" color="gray.500">
                      Şablon yok
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Editor Modal */}
      <Modal isOpen={editor.isOpen} onClose={editor.onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'Şablonu Düzenle' : 'Yeni Şablon'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <FormControl isRequired>
                <FormLabel>İsim (kod)</FormLabel>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({...p, name: e.target.value}))}
                  placeholder="price_alert_triggered"
                  isDisabled={!!editing}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Açıklama</FormLabel>
                <Input value={form.description} onChange={(e) => setForm((p) => ({...p, description: e.target.value}))} />
              </FormControl>
              <HStack>
                <FormControl>
                  <FormLabel>Kategori</FormLabel>
                  <Input value={form.category} onChange={(e) => setForm((p) => ({...p, category: e.target.value}))} />
                </FormControl>
                <FormControl>
                  <FormLabel>Alıcı tipi</FormLabel>
                  <Select value={form.receiverType} onChange={(e) => setForm((p) => ({...p, receiverType: e.target.value}))}>
                    <option value="all">Tümü</option>
                    <option value="channel">Kanal</option>
                    <option value="user">Kullanıcı</option>
                  </Select>
                </FormControl>
              </HStack>
              <FormControl isRequired>
                <FormLabel>Başlık (title)</FormLabel>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({...p, title: e.target.value}))}
                  placeholder="{{symbol}} {{direction}} ulaştı"
                />
              </FormControl>
              <FormControl>
                <FormLabel>İçerik (body)</FormLabel>
                <Textarea
                  rows={3}
                  value={form.body}
                  onChange={(e) => setForm((p) => ({...p, body: e.target.value}))}
                  placeholder="Hedef fiyat: {{price}} TL"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Değişkenler (virgülle)</FormLabel>
                <Input
                  value={form.variables}
                  onChange={(e) => setForm((p) => ({...p, variables: e.target.value}))}
                  placeholder="symbol, price, direction"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Varsayılan veri (JSON)</FormLabel>
                <Textarea
                  rows={4}
                  fontFamily="mono"
                  value={form.defaultData}
                  onChange={(e) => setForm((p) => ({...p, defaultData: e.target.value}))}
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Aktif</FormLabel>
                <Switch isChecked={form.isActive} onChange={(e) => setForm((p) => ({...p, isActive: e.target.checked}))} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={2} onClick={editor.onClose}>
              İptal
            </Button>
            <Button colorScheme="blue" onClick={handleSave}>
              Kaydet
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={previewModal.isOpen} onClose={previewModal.onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Önizleme</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel>Değişkenler (JSON)</FormLabel>
                <Textarea rows={5} fontFamily="mono" value={previewVars} onChange={(e) => setPreviewVars(e.target.value)} />
              </FormControl>
              <Button onClick={runPreview} isLoading={previewLoading} colorScheme="blue">
                Önizle
              </Button>
              {preview && (
                <Box p={3} borderWidth={1} borderRadius="md">
                  <Text fontSize="sm" color="gray.500">
                    Başlık
                  </Text>
                  <Text fontWeight="bold" mb={2}>
                    {preview.title}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    İçerik
                  </Text>
                  <Text mb={2}>{preview.body}</Text>
                  <Text fontSize="sm" color="gray.500">
                    Veri
                  </Text>
                  <Code display="block" whiteSpace="pre" p={2}>
                    {JSON.stringify(preview.data, null, 2)}
                  </Code>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={previewModal.onClose}>Kapat</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Page>
  );
};

export default NotificationTemplates;

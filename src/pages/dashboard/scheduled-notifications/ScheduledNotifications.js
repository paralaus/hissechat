import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
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
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Spinner,
  Tag,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Code,
} from '@chakra-ui/react';
import {
  FiTrash2,
  FiPlus,
  FiSend,
  FiSlash,
  FiMoreVertical,
} from 'react-icons/fi';
import Page from '../../../components/common/Page';
import {
  getScheduledNotifications,
  createScheduledNotification,
  updateScheduledNotification,
  deleteScheduledNotification,
  cancelScheduledNotification,
  dispatchScheduledNotification,
  getNotificationTemplates,
} from '../../../api/api';

const statusColor = {
  pending: 'yellow',
  processing: 'blue',
  sent: 'green',
  failed: 'red',
  canceled: 'gray',
};

const cronPresets = [
  {label: 'Her gün 09:00', value: '0 9 * * *'},
  {label: 'Her gün 12:00', value: '0 12 * * *'},
  {label: 'Hafta içi 09:00', value: '0 9 * * 1-5'},
  {label: 'Her pazartesi 10:00', value: '0 10 * * 1'},
  {label: 'Her saatin başında', value: '0 * * * *'},
];

const toLocalDt = d => {
  if (!d) return '';
  const dt = new Date(d);
  const pad = n => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(
    dt.getDate(),
  )}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const emptyForm = {
  name: '',
  template: '',
  title: '',
  body: '',
  receiverType: 'all',
  channel: '',
  topic: '',
  scheduledAt: toLocalDt(new Date(Date.now() + 5 * 60 * 1000)),
  recurrence: '',
  timezone: 'Europe/Istanbul',
  isImportant: false,
  shouldCreateNotification: true,
  data: '{}',
  variables: '{}',
};

const ScheduledNotifications = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [filter, setFilter] = useState({
    status: '',
    receiverType: '',
    search: '',
  });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const editor = useDisclosure();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = {limit: 200};
      if (filter.status) params.status = filter.status;
      if (filter.receiverType) params.receiverType = filter.receiverType;
      if (filter.search) params.search = filter.search;
      const {data} = await getScheduledNotifications(params);
      setList(data.results || data || []);
    } catch (e) {
      toast({status: 'error', title: 'Liste yüklenemedi'});
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  const fetchTemplates = useCallback(async () => {
    try {
      const {data} = await getNotificationTemplates({
        limit: 200,
        isActive: true,
      });
      setTemplates(data.results || data || []);
    } catch (e) {
      // optional
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const stats = useMemo(() => {
    const s = {pending: 0, processing: 0, sent: 0, failed: 0, canceled: 0};
    list.forEach(x => {
      if (s[x.status] !== undefined) s[x.status] += 1;
    });
    return s;
  }, [list]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    editor.onOpen();
  };

  const openEdit = doc => {
    setEditing(doc);
    setForm({
      name: doc.name || '',
      template: doc.template?.id || doc.template || '',
      title: doc.title || '',
      body: doc.body || '',
      receiverType: doc.receiverType || 'all',
      channel: doc.channel?.id || doc.channel || '',
      topic: doc.topic || '',
      scheduledAt: toLocalDt(doc.scheduledAt),
      recurrence: doc.recurrence || '',
      timezone: doc.timezone || 'Europe/Istanbul',
      isImportant: !!doc.isImportant,
      shouldCreateNotification: doc.shouldCreateNotification !== false,
      data: JSON.stringify(doc.data || {}, null, 2),
      variables: JSON.stringify(doc.variables || {}, null, 2),
    });
    editor.onOpen();
  };

  const handleSave = async () => {
    let data;
    let variables;
    try {
      data = form.data ? JSON.parse(form.data) : {};
      variables = form.variables ? JSON.parse(form.variables) : {};
    } catch (e) {
      toast({status: 'error', title: 'data/variables geçerli JSON değil'});
      return;
    }
    if (form.receiverType === 'channel' && !form.channel) {
      toast({status: 'error', title: 'Kanal hedefi için Kanal ID zorunlu'});
      return;
    }
    if (form.receiverType === 'user' && !form.topic) {
      toast({status: 'error', title: 'Topic hedefi için Topic zorunlu'});
      return;
    }
    const body = {
      name: form.name,
      template: form.template || undefined,
      title: form.title,
      body: form.body,
      receiverType: form.receiverType,
      channel:
        form.receiverType === 'channel' && form.channel
          ? form.channel
          : undefined,
      topic: form.topic || undefined,
      scheduledAt: form.scheduledAt
        ? new Date(form.scheduledAt).toISOString()
        : new Date().toISOString(),
      recurrence: form.recurrence || '',
      timezone: form.timezone || 'Europe/Istanbul',
      isImportant: form.isImportant,
      shouldCreateNotification:
        form.receiverType === 'user' ? false : form.shouldCreateNotification,
      data,
      variables,
    };
    try {
      if (editing) {
        await updateScheduledNotification(editing.id, body);
        toast({status: 'success', title: 'Güncellendi'});
      } else {
        await createScheduledNotification(body);
        toast({status: 'success', title: 'Oluşturuldu'});
      }
      editor.onClose();
      fetchList();
    } catch (e) {
      toast({
        status: 'error',
        title: 'Kayıt başarısız',
        description: e?.response?.data?.message,
      });
    }
  };

  const handleDelete = async doc => {
    if (!window.confirm('Silmek istediğinize emin misiniz?')) return;
    try {
      await deleteScheduledNotification(doc.id);
      toast({status: 'success', title: 'Silindi'});
      fetchList();
    } catch (e) {
      toast({status: 'error', title: 'Silme başarısız'});
    }
  };

  const handleCancel = async doc => {
    try {
      await cancelScheduledNotification(doc.id);
      toast({status: 'success', title: 'İptal edildi'});
      fetchList();
    } catch (e) {
      toast({status: 'error', title: 'İptal başarısız'});
    }
  };

  const handleDispatch = async doc => {
    if (!window.confirm('Şimdi gönderilsin mi?')) return;
    try {
      await dispatchScheduledNotification(doc.id);
      toast({status: 'success', title: 'Gönderildi'});
      fetchList();
    } catch (e) {
      toast({
        status: 'error',
        title: 'Gönderim başarısız',
        description: e?.response?.data?.message,
      });
    }
  };

  return (
    <Page title="Zamanlanmış Bildirimler">
      <SimpleGrid columns={{base: 2, md: 5}} spacing={3} mb={4}>
        {Object.entries(stats).map(([k, v]) => (
          <Card key={k} bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel textTransform="capitalize">{k}</StatLabel>
                <StatNumber color={`${statusColor[k]}.500`}>{v}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      <Card bg={cardBg} mb={4}>
        <CardBody>
          <HStack>
            <Select
              placeholder="Tüm durumlar"
              value={filter.status}
              onChange={e => setFilter(p => ({...p, status: e.target.value}))}
              maxW="200px">
              <option value="pending">pending</option>
              <option value="processing">processing</option>
              <option value="sent">sent</option>
              <option value="failed">failed</option>
              <option value="canceled">canceled</option>
            </Select>
            <Select
              placeholder="Tüm alıcılar"
              value={filter.receiverType}
              onChange={e =>
                setFilter(p => ({...p, receiverType: e.target.value}))
              }
              maxW="200px">
              <option value="all">all</option>
              <option value="channel">channel</option>
              <option value="user">user</option>
            </Select>
            <Input
              placeholder="Başlık ara"
              value={filter.search}
              onChange={e => setFilter(p => ({...p, search: e.target.value}))}
            />
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={openCreate}>
              Yeni
            </Button>
          </HStack>
        </CardBody>
      </Card>

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
                  <Th>İsim/Başlık</Th>
                  <Th>Alıcı</Th>
                  <Th>Zaman</Th>
                  <Th>Tekrar</Th>
                  <Th>Durum</Th>
                  <Th>Gönderim</Th>
                  <Th>İşlemler</Th>
                </Tr>
              </Thead>
              <Tbody>
                {list.map(doc => (
                  <Tr key={doc.id}>
                    <Td maxW="250px">
                      <Text fontWeight="medium" isTruncated>
                        {doc.name || doc.title}
                      </Text>
                      <Text fontSize="xs" color="gray.500" isTruncated>
                        {doc.title}
                      </Text>
                    </Td>
                    <Td>
                      <Tag size="sm">{doc.receiverType}</Tag>
                    </Td>
                    <Td>
                      <Text fontSize="xs">
                        {doc.scheduledAt
                          ? new Date(doc.scheduledAt).toLocaleString('tr-TR')
                          : '-'}
                      </Text>
                      {doc.nextRunAt && (
                        <Text fontSize="xs" color="blue.500">
                          → {new Date(doc.nextRunAt).toLocaleString('tr-TR')}
                        </Text>
                      )}
                    </Td>
                    <Td>
                      {doc.recurrence ? (
                        <Code fontSize="xs">{doc.recurrence}</Code>
                      ) : (
                        '-'
                      )}
                    </Td>
                    <Td>
                      <Badge colorScheme={statusColor[doc.status] || 'gray'}>
                        {doc.status}
                      </Badge>
                      {doc.lastError && (
                        <Text
                          fontSize="xs"
                          color="red.400"
                          title={doc.lastError}
                          isTruncated
                          maxW="180px">
                          {doc.lastError}
                        </Text>
                      )}
                    </Td>
                    <Td>{doc.sentCount || 0}</Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          size="sm"
                          icon={<FiMoreVertical />}
                          aria-label="actions"
                        />
                        <MenuList>
                          <MenuItem onClick={() => openEdit(doc)}>
                            Düzenle
                          </MenuItem>
                          <MenuItem
                            icon={<FiSend />}
                            onClick={() => handleDispatch(doc)}>
                            Şimdi gönder
                          </MenuItem>
                          {doc.status === 'pending' && (
                            <MenuItem
                              icon={<FiSlash />}
                              onClick={() => handleCancel(doc)}>
                              İptal et
                            </MenuItem>
                          )}
                          <MenuItem
                            icon={<FiTrash2 />}
                            color="red.500"
                            onClick={() => handleDelete(doc)}>
                            Sil
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
                {list.length === 0 && (
                  <Tr>
                    <Td colSpan={7} textAlign="center" color="gray.500">
                      Kayıt yok
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Editor */}
      <Modal isOpen={editor.isOpen} onClose={editor.onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editing
              ? 'Zamanlanmış Bildirimi Düzenle'
              : 'Yeni Zamanlanmış Bildirim'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel>İsim (opsiyonel)</FormLabel>
                <Input
                  value={form.name}
                  onChange={e => setForm(p => ({...p, name: e.target.value}))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Şablon (opsiyonel)</FormLabel>
                <Select
                  placeholder="Şablon seçin"
                  value={form.template}
                  onChange={e =>
                    setForm(p => ({...p, template: e.target.value}))
                  }>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.title}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Başlık (override)</FormLabel>
                <Input
                  value={form.title}
                  onChange={e => setForm(p => ({...p, title: e.target.value}))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>İçerik (override)</FormLabel>
                <Textarea
                  rows={2}
                  value={form.body}
                  onChange={e => setForm(p => ({...p, body: e.target.value}))}
                />
              </FormControl>
              <HStack>
                <FormControl>
                  <FormLabel>Alıcı tipi</FormLabel>
                  <Select
                    value={form.receiverType}
                    onChange={e =>
                      setForm(p => ({...p, receiverType: e.target.value}))
                    }>
                    <option value="all">Tümü</option>
                    <option value="channel">Kanal</option>
                    <option value="user">Kullanıcı (topic)</option>
                  </Select>
                </FormControl>
                {form.receiverType === 'channel' && (
                  <FormControl>
                    <FormLabel>Kanal ID</FormLabel>
                    <Input
                      value={form.channel}
                      onChange={e =>
                        setForm(p => ({...p, channel: e.target.value}))
                      }
                    />
                  </FormControl>
                )}
                {form.receiverType !== 'all' &&
                  form.receiverType !== 'channel' && (
                    <FormControl>
                      <FormLabel>Topic</FormLabel>
                      <Input
                        value={form.topic}
                        onChange={e =>
                          setForm(p => ({...p, topic: e.target.value}))
                        }
                      />
                    </FormControl>
                  )}
              </HStack>
              <HStack>
                <FormControl isRequired>
                  <FormLabel>Zamanı</FormLabel>
                  <Input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={e =>
                      setForm(p => ({...p, scheduledAt: e.target.value}))
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Saat dilimi</FormLabel>
                  <Input
                    value={form.timezone}
                    onChange={e =>
                      setForm(p => ({...p, timezone: e.target.value}))
                    }
                  />
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel>Tekrar (cron)</FormLabel>
                <HStack>
                  <Input
                    value={form.recurrence}
                    onChange={e =>
                      setForm(p => ({...p, recurrence: e.target.value}))
                    }
                    placeholder="0 9 * * *  (boş = tek seferlik)"
                  />
                  <Menu>
                    <MenuButton as={Button} size="sm">
                      Hazır
                    </MenuButton>
                    <MenuList>
                      {cronPresets.map(c => (
                        <MenuItem
                          key={c.value}
                          onClick={() =>
                            setForm(p => ({...p, recurrence: c.value}))
                          }>
                          {c.label} — <Code ml={2}>{c.value}</Code>
                        </MenuItem>
                      ))}
                      <MenuItem
                        onClick={() => setForm(p => ({...p, recurrence: ''}))}>
                        Temizle
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              </FormControl>
              <HStack>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0}>Önemli</FormLabel>
                  <Switch
                    isChecked={form.isImportant}
                    onChange={e =>
                      setForm(p => ({...p, isImportant: e.target.checked}))
                    }
                  />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0}>Bildirim kaydı oluştur</FormLabel>
                  <Switch
                    isChecked={
                      form.receiverType === 'user'
                        ? false
                        : form.shouldCreateNotification
                    }
                    isDisabled={form.receiverType === 'user'}
                    onChange={e =>
                      setForm(p => ({
                        ...p,
                        shouldCreateNotification: e.target.checked,
                      }))
                    }
                  />
                </FormControl>
              </HStack>
              {form.receiverType === 'user' && (
                <Text fontSize="sm" color="orange.400">
                  Topic hedefli zamanlanmış bildirimlerde uygulama içi bildirim
                  kaydı oluşturulmaz.
                </Text>
              )}
              <FormControl>
                <FormLabel>Değişkenler (JSON, şablon doldurma için)</FormLabel>
                <Textarea
                  rows={3}
                  fontFamily="mono"
                  value={form.variables}
                  onChange={e =>
                    setForm(p => ({...p, variables: e.target.value}))
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Ekstra veri (JSON, payload'a eklenir)</FormLabel>
                <Textarea
                  rows={3}
                  fontFamily="mono"
                  value={form.data}
                  onChange={e => setForm(p => ({...p, data: e.target.value}))}
                />
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
    </Page>
  );
};

export default ScheduledNotifications;

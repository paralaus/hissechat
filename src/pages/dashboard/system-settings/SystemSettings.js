import React, {useEffect, useState, useCallback} from 'react';
import {
  SimpleGrid,
  Text,
  Button,
  Flex,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Badge,
  useToast,
  HStack,
  VStack,
  Heading,
  Input,
  Spinner,
  Switch,
  FormControl,
  FormLabel,
  Divider,
  Box,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';
import {FiRefreshCw, FiSave, FiSend, FiCheckCircle, FiXCircle} from 'react-icons/fi';
import Page from '../../../components/common/Page';
import {
  getSettingsSnapshot,
  upsertSetting,
  deleteSetting,
  sendTestEmail,
} from '../../../api/api';

const Row = ({label, value, mono}) => (
  <Flex justify="space-between" py={1} gap={4}>
    <Text fontSize="sm" color="gray.500" minW="140px">
      {label}
    </Text>
    <Text fontSize="sm" fontFamily={mono ? 'mono' : undefined} textAlign="right" wordBreak="break-all">
      {value === undefined || value === null || value === '' ? (
        <Text as="span" color="gray.400" fontStyle="italic">
          (boş)
        </Text>
      ) : (
        String(value)
      )}
    </Text>
  </Flex>
);

const ConfiguredBadge = ({ok}) => (
  <Badge colorScheme={ok ? 'green' : 'red'} fontSize="xs">
    {ok ? 'Yapılandırılmış' : 'Eksik'}
  </Badge>
);

const SystemSettings = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [testTo, setTestTo] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const [edits, setEdits] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const {data: d} = await getSettingsSnapshot();
      setData(d);
      const init = {};
      Object.keys(d.editableKeys || {}).forEach((k) => {
        init[k] = d.overrides[k];
      });
      setEdits(init);
    } catch (e) {
      toast({status: 'error', title: 'Ayarlar yüklenemedi'});
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (key) => {
    setSaving((p) => ({...p, [key]: true}));
    try {
      await upsertSetting(key, edits[key]);
      toast({status: 'success', title: `${key} kaydedildi`});
      fetchData();
    } catch (e) {
      toast({status: 'error', title: 'Kayıt başarısız', description: e?.response?.data?.message});
    } finally {
      setSaving((p) => ({...p, [key]: false}));
    }
  };

  const handleReset = async (key) => {
    if (!window.confirm(`${key} override sıfırlansın mı?`)) return;
    try {
      await deleteSetting(key);
      toast({status: 'success', title: 'Sıfırlandı'});
      fetchData();
    } catch (e) {
      toast({status: 'error', title: 'Sıfırlama başarısız'});
    }
  };

  const handleTestEmail = async () => {
    if (!testTo) {
      toast({status: 'warning', title: 'Email adresi girin'});
      return;
    }
    setSendingTest(true);
    try {
      await sendTestEmail(testTo);
      toast({status: 'success', title: 'Test email gönderildi'});
    } catch (e) {
      toast({status: 'error', title: 'Test email başarısız', description: e?.response?.data?.message});
    } finally {
      setSendingTest(false);
    }
  };

  if (loading && !data) {
    return (
      <Page title="Sistem Ayarları">
        <Flex justify="center" p={8}>
          <Spinner />
        </Flex>
      </Page>
    );
  }

  if (!data) return <Page title="Sistem Ayarları"><Text>Veri yok</Text></Page>;

  const {snapshot, editableKeys, overrides} = data;

  const renderEditableField = (key) => {
    const meta = editableKeys[key];
    if (!meta) return null;
    const hasOverride = overrides[key] !== undefined;
    const value = edits[key];

    return (
      <Box key={key} py={2}>
        <Flex justify="space-between" align="center" mb={1} gap={2}>
          <VStack align="start" spacing={0} flex={1}>
            <HStack>
              <Text fontSize="sm" fontWeight="semibold" fontFamily="mono">
                {key}
              </Text>
              {hasOverride && (
                <Badge colorScheme="purple" fontSize="xs">
                  DB Override
                </Badge>
              )}
            </HStack>
            <Text fontSize="xs" color="gray.500">
              {meta.description}
            </Text>
          </VStack>
          <HStack>
            <Button
              size="xs"
              colorScheme="blue"
              leftIcon={<FiSave />}
              isLoading={saving[key]}
              onClick={() => handleSave(key)}>
              Kaydet
            </Button>
            {hasOverride && (
              <Button size="xs" variant="outline" onClick={() => handleReset(key)}>
                Sıfırla
              </Button>
            )}
          </HStack>
        </Flex>
        {meta.type === 'boolean' ? (
          <FormControl display="flex" alignItems="center">
            <Switch
              isChecked={value === true || value === 'true'}
              onChange={(e) => setEdits((p) => ({...p, [key]: e.target.checked}))}
            />
            <FormLabel ml={2} mb={0} fontSize="sm">
              {value === true || value === 'true' ? 'Açık' : 'Kapalı'}
            </FormLabel>
          </FormControl>
        ) : (
          <Input
            size="sm"
            type={meta.type === 'number' ? 'number' : 'text'}
            value={value ?? ''}
            onChange={(e) => setEdits((p) => ({...p, [key]: e.target.value}))}
          />
        )}
      </Box>
    );
  };

  const editableByCategory = {};
  Object.entries(editableKeys).forEach(([k, m]) => {
    if (!editableByCategory[m.category]) editableByCategory[m.category] = [];
    editableByCategory[m.category].push(k);
  });

  return (
    <Page title="Sistem Ayarları">
      <Flex justify="flex-end" mb={4}>
        <Button leftIcon={<FiRefreshCw />} size="sm" onClick={fetchData}>
          Yenile
        </Button>
      </Flex>

      <SimpleGrid columns={{base: 1, md: 3, lg: 4}} spacing={4} mb={6}>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Ortam</StatLabel>
              <StatNumber fontSize="lg">{snapshot.system.env}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Bakım Modu</StatLabel>
              <StatNumber fontSize="lg">
                {snapshot.system.maintenanceMode ? (
                  <Badge colorScheme="red">Açık</Badge>
                ) : (
                  <Badge colorScheme="green">Kapalı</Badge>
                )}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>RTDB Push</StatLabel>
              <StatNumber fontSize="lg">
                {snapshot.rtdb.disabled ? (
                  <Badge colorScheme="red">Devre dışı</Badge>
                ) : (
                  <Badge colorScheme="green">Aktif</Badge>
                )}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Redis</StatLabel>
              <StatNumber fontSize="lg">
                {snapshot.redis.enabled ? (
                  <Badge colorScheme="green">Aktif</Badge>
                ) : (
                  <Badge colorScheme="gray">Pasif</Badge>
                )}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{base: 1, lg: 2}} spacing={4}>
        {/* Editable runtime settings */}
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="sm">Çalışma Zamanı Ayarları (DB)</Heading>
            <Text fontSize="xs" color="gray.500" mt={1}>
              Bu ayarlar veritabanında saklanır ve .env üzerinden geçersiz kılınır.
            </Text>
          </CardHeader>
          <CardBody pt={0}>
            {Object.entries(editableByCategory).map(([cat, keys]) => (
              <Box key={cat} mb={4}>
                <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={2}>
                  {cat}
                </Text>
                <VStack align="stretch" spacing={1} divider={<Divider />}>
                  {keys.map((k) => renderEditableField(k))}
                </VStack>
              </Box>
            ))}
          </CardBody>
        </Card>

        {/* Read-only env config */}
        <VStack align="stretch" spacing={4}>
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="sm">Sistem</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Row label="Ortam" value={snapshot.system.env} />
              <Row label="Port" value={snapshot.system.port} />
              <Row label="Base URL" value={snapshot.system.baseUrl} />
              <Row label="Socket Port" value={snapshot.system.socketPort} />
              <Row label="Conference Port" value={snapshot.system.conferencePort} />
              <Row label="Swagger" value={snapshot.system.swaggerEnabled ? 'Aktif' : 'Pasif'} />
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="sm">Email (SMTP)</Heading>
                <HStack>
                  <Input
                    size="xs"
                    placeholder="test@example.com"
                    value={testTo}
                    onChange={(e) => setTestTo(e.target.value)}
                    w="200px"
                  />
                  <Button
                    size="xs"
                    leftIcon={<FiSend />}
                    colorScheme="blue"
                    isLoading={sendingTest}
                    onClick={handleTestEmail}>
                    Test Gönder
                  </Button>
                </HStack>
              </Flex>
            </CardHeader>
            <CardBody pt={0}>
              <Row label="Gönderici" value={snapshot.email.from} />
              <Divider my={2} />
              <HStack>
                <Text fontSize="sm" fontWeight="semibold">
                  Brevo
                </Text>
                <ConfiguredBadge ok={snapshot.email.brevo.configured} />
              </HStack>
              <Row label="Host" value={snapshot.email.brevo.host} />
              <Row label="Port" value={snapshot.email.brevo.port} />
              <Row label="User" value={snapshot.email.brevo.user} />
              <Row label="Pass" value={snapshot.email.brevo.pass} mono />
              <Divider my={2} />
              <HStack>
                <Text fontSize="sm" fontWeight="semibold">
                  Gmail
                </Text>
                <ConfiguredBadge ok={snapshot.email.gmail.configured} />
              </HStack>
              <Row label="User" value={snapshot.email.gmail.user} />
              <Row label="Limit" value={snapshot.email.gmail.dailyLimit} />
              <Divider my={2} />
              <HStack>
                <Text fontSize="sm" fontWeight="semibold">
                  Gmail 2
                </Text>
                <ConfiguredBadge ok={snapshot.email.gmail2.configured} />
              </HStack>
              <Row label="User" value={snapshot.email.gmail2.user} />
              <Row label="Limit" value={snapshot.email.gmail2.dailyLimit} />
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardHeader>
              <HStack>
                <Heading size="sm">DigitalOcean Spaces</Heading>
                <ConfiguredBadge ok={snapshot.storage.configured} />
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <Row label="Endpoint" value={snapshot.storage.endpoint} />
              <Row label="Bucket" value={snapshot.storage.bucket} />
              <Row label="Region" value={snapshot.storage.region} />
              <Row label="Key" value={snapshot.storage.key} mono />
              <Row label="Secret" value={snapshot.storage.secret} mono />
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardHeader>
              <HStack>
                <Heading size="sm">OpenAI</Heading>
                <ConfiguredBadge ok={snapshot.openai.configured} />
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <Row label="API Key" value={snapshot.openai.apiKey} mono />
              <Row label="Model" value={snapshot.openai.model} />
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="sm">PocketBase</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Row label="URL" value={snapshot.pocketbase.url} />
              <Row label="Admin" value={snapshot.pocketbase.adminEmail} />
              <Row label="Şifre" value={snapshot.pocketbase.adminPassword} mono />
              <Row label="Devre dışı" value={snapshot.pocketbase.disabled ? 'Evet' : 'Hayır'} />
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="sm">TURN Server</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Row label="URL" value={snapshot.turn.url} />
              <Row label="Username" value={snapshot.turn.username} />
              <Row label="Credential" value={snapshot.turn.credential} mono />
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="sm">Sosyal Login & App Store</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Row label="Google Client ID" value={snapshot.google.clientId} />
              <Row label="Apple Client ID" value={snapshot.apple.clientId} />
              <Row label="App Store Secret" value={snapshot.appStore.sharedSecret} mono />
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="sm">Redis & Rate Limit</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Row label="Redis URL" value={snapshot.redis.url} mono />
              <Row label="Redis Prefix" value={snapshot.redis.prefix} />
              <Row label="Redis Aktif" value={snapshot.redis.enabled ? 'Evet' : 'Hayır'} />
              <Divider my={2} />
              <Row label="Auth Max (15dk)" value={snapshot.rateLimit.authMax} />
              <Row label="API Max (15dk)" value={snapshot.rateLimit.apiMax} />
            </CardBody>
          </Card>
        </VStack>
      </SimpleGrid>
    </Page>
  );
};

export default SystemSettings;

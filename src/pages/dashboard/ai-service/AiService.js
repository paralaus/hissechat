import React, {useEffect, useState, useCallback} from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  Button,
  Flex,
  Heading,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Textarea,
  FormControl,
  FormLabel,
  Select,
  Skeleton,
  HStack,
  Divider,
  Code,
  Spinner,
  Tag,
  Input,
  Tooltip,
} from '@chakra-ui/react';
import {FiRefreshCw, FiTrash2, FiPlay, FiCpu, FiDatabase, FiActivity} from 'react-icons/fi';
import Page from '../../../components/common/Page';
import {
  getAiServiceStatus,
  clearAiCache,
  testAiChat,
} from '../../../api/api';

const StatusBadge = ({on, labelOn = 'Aktif', labelOff = 'Kapalı'}) => (
  <Badge colorScheme={on ? 'green' : 'gray'}>{on ? labelOn : labelOff}</Badge>
);

const InfoRow = ({label, value, mono}) => (
  <Flex justify="space-between" align="center" gap={3} py={1}>
    <Text fontSize="sm" color="gray.500">{label}</Text>
    <Text fontSize="sm" fontFamily={mono ? 'mono' : undefined} textAlign="right">
      {value ?? '-'}
    </Text>
  </Flex>
);

const AiService = () => {
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const codeBg = useColorModeValue('gray.50', 'gray.900');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [clearPrefix, setClearPrefix] = useState('');

  // Test chat state
  const [question, setQuestion] = useState('BIST 100 hakkında kısa bilgi ver.');
  const [detailLevel, setDetailLevel] = useState('standard');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAiServiceStatus();
      setData(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'AI servisinin durumu alınamadı.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      const res = await clearAiCache(clearPrefix?.trim() || null);
      toast({
        title: 'Cache temizlendi',
        description: `${res.data?.deleted ?? 0} kayıt silindi (${res.data?.backend || 'memory'}).`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      fetchStatus();
    } catch (err) {
      toast({
        title: 'Cache temizlenemedi',
        description:
          err?.response?.data?.error || err?.message || 'Bilinmeyen hata',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setClearing(false);
    }
  };

  const handleTest = async () => {
    if (!question.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testAiChat({question: question.trim(), detailLevel});
      setTestResult(res.data);
    } catch (err) {
      setTestResult({
        error:
          err?.response?.data?.error || err?.message || 'Test başarısız oldu.',
      });
    } finally {
      setTesting(false);
    }
  };

  const llm = data?.llm_router;
  const modules = data?.modules || {};
  const cache = data?.cache || {};
  const rag = data?.rag_stats;
  const rates = data?.rate_limits || {};
  const env = data?.env || {};

  // tensorflow_api LlmRouter.status() shape:
  // { order, enabled, circuit_open, streaming, models, detail_routes, detail_routes_resolved }
  const llmOrder = Array.isArray(llm?.order) ? llm.order : [];
  const llmEnabled = llm?.enabled || {};
  const llmCircuit = llm?.circuit_open || {};
  const llmStreaming = llm?.streaming || {};
  const llmModels = llm?.models || {};
  const llmResolved = llm?.detail_routes_resolved || {};
  // Birincil = sırasıyla aktif (enabled, circuit kapalı değil) ilk sağlayıcı
  const llmPrimaryProvider = llmOrder.find(
    (p) => llmEnabled[p] && !llmCircuit[p],
  );
  const llmFallbackProvider = llmOrder.find(
    (p) => p !== llmPrimaryProvider && llmEnabled[p] && !llmCircuit[p],
  );

  return (
    <Page title="AI Servisi" subtitle="tensorflow_api yönetim paneli">
      <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
        <HStack>
          <FiCpu size={22} />
          <Heading size="md">AI Servisi (tensorflow_api)</Heading>
          {data?.version && <Tag colorScheme="purple">v{data.version}</Tag>}
        </HStack>
        <Button
          leftIcon={<FiRefreshCw />}
          onClick={fetchStatus}
          isLoading={loading}
          size="sm"
          colorScheme="blue"
          variant="outline">
          Yenile
        </Button>
      </Flex>

      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Servise ulaşılamadı</AlertTitle>
            <AlertDescription fontSize="sm">{error}</AlertDescription>
          </Box>
        </Alert>
      )}

      {loading && !data ? (
        <Stack spacing={3}>
          <Skeleton height="120px" />
          <Skeleton height="160px" />
          <Skeleton height="160px" />
        </Stack>
      ) : (
        <>
          {/* Top - overview cards */}
          <SimpleGrid columns={{base: 1, md: 2, lg: 4}} spacing={4} mb={4}>
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>LLM Sağlayıcı</StatLabel>
                  <StatNumber fontSize="lg" textTransform="capitalize">
                    {llmPrimaryProvider || '-'}
                  </StatNumber>
                  <StatHelpText>
                    {llmPrimaryProvider
                      ? llmModels[llmPrimaryProvider] || '-'
                      : 'Anahtar tanımlı değil'}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Cache Backend</StatLabel>
                  <StatNumber fontSize="lg" textTransform="capitalize">
                    {cache.backend || '-'}
                  </StatNumber>
                  <StatHelpText>
                    {cache.size != null ? `${cache.size} kayıt` : '—'}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>RAG</StatLabel>
                  <StatNumber fontSize="lg">
                    <StatusBadge on={modules.rag} />
                  </StatNumber>
                  <StatHelpText>
                    {rag?.documents != null
                      ? `${rag.documents} doküman`
                      : modules.rag
                      ? 'Aktif'
                      : 'Kapalı'}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Auth / Rate Limit</StatLabel>
                  <StatNumber fontSize="lg">
                    <HStack>
                      <StatusBadge
                        on={modules.auth_enabled}
                        labelOn="Auth"
                        labelOff="Açık"
                      />
                      <StatusBadge
                        on={modules.rate_limiter}
                        labelOn="RL"
                        labelOff="Yok"
                      />
                    </HStack>
                  </StatNumber>
                  <StatHelpText>{rates.chat || '-'}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          <SimpleGrid columns={{base: 1, lg: 2}} spacing={4} mb={4}>
            {/* LLM Router */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardHeader pb={1}>
                <HStack>
                  <FiActivity />
                  <Heading size="sm">LLM Router</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={2}>
                {llm ? (
                  <Stack spacing={3}>
                    {/* Birincil / Yedek özeti */}
                    <Stack spacing={1}>
                      <InfoRow
                        label="Birincil sağlayıcı"
                        value={
                          llmPrimaryProvider ? (
                            <HStack spacing={2} justify="flex-end">
                              <Text fontSize="sm" textTransform="capitalize">
                                {llmPrimaryProvider}
                              </Text>
                              {llmStreaming[llmPrimaryProvider] && (
                                <Badge colorScheme="blue" fontSize="0.65rem">
                                  stream
                                </Badge>
                              )}
                            </HStack>
                          ) : (
                            '-'
                          )
                        }
                      />
                      <InfoRow
                        label="Birincil model"
                        value={
                          llmPrimaryProvider
                            ? llmModels[llmPrimaryProvider]
                            : '-'
                        }
                        mono
                      />
                      <InfoRow
                        label="Yedek sağlayıcı"
                        value={
                          llmFallbackProvider ? (
                            <Text
                              fontSize="sm"
                              textTransform="capitalize"
                              textAlign="right">
                              {llmFallbackProvider}
                            </Text>
                          ) : (
                            '-'
                          )
                        }
                      />
                      <InfoRow
                        label="Yedek model"
                        value={
                          llmFallbackProvider
                            ? llmModels[llmFallbackProvider]
                            : '-'
                        }
                        mono
                      />
                    </Stack>

                    <Divider />

                    {/* Sağlayıcı sırası ve durumları */}
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={2}>
                        Sağlayıcı sırası (öncelik soldan sağa)
                      </Text>
                      <Stack spacing={1}>
                        {llmOrder.map((p) => {
                          const isEnabled = !!llmEnabled[p];
                          const isOpen = !!llmCircuit[p];
                          const canStream = !!llmStreaming[p];
                          let color = 'gray';
                          let label = 'Anahtar yok';
                          if (isEnabled && !isOpen) {
                            color = 'green';
                            label = 'Hazır';
                          } else if (isEnabled && isOpen) {
                            color = 'orange';
                            label = 'Devre kesik';
                          }
                          return (
                            <Flex
                              key={p}
                              justify="space-between"
                              align="center"
                              gap={2}
                              py={1}>
                              <HStack>
                                <Text
                                  fontSize="sm"
                                  textTransform="capitalize">
                                  {p}
                                </Text>
                                <Code fontSize="xs" bg={codeBg}>
                                  {llmModels[p] || '-'}
                                </Code>
                              </HStack>
                              <HStack spacing={1}>
                                {canStream && (
                                  <Tooltip label="Streaming destekli">
                                    <Badge
                                      colorScheme="blue"
                                      fontSize="0.65rem">
                                      stream
                                    </Badge>
                                  </Tooltip>
                                )}
                                <Badge colorScheme={color} fontSize="0.65rem">
                                  {label}
                                </Badge>
                              </HStack>
                            </Flex>
                          );
                        })}
                      </Stack>
                    </Box>

                    {/* detailLevel route'ları */}
                    {Object.keys(llmResolved).length > 0 && (
                      <>
                        <Divider />
                        <Box>
                          <Text fontSize="xs" color="gray.500" mb={2}>
                            Detay seviyesi yönlendirme
                          </Text>
                          <Stack spacing={1}>
                            {['brief', 'standard', 'deep'].map((lvl) => {
                              const r = llmResolved[lvl];
                              if (!r) return null;
                              return (
                                <Flex
                                  key={lvl}
                                  justify="space-between"
                                  align="center"
                                  gap={2}
                                  py={1}>
                                  <Text
                                    fontSize="sm"
                                    textTransform="capitalize">
                                    {lvl}
                                  </Text>
                                  <HStack spacing={2}>
                                    <Text
                                      fontSize="sm"
                                      textTransform="capitalize"
                                      color="gray.600">
                                      {r.provider || '-'}
                                    </Text>
                                    <Code fontSize="xs" bg={codeBg}>
                                      {r.model || '-'}
                                    </Code>
                                    <Badge
                                      colorScheme={
                                        r.enabled && !r.circuit_open
                                          ? 'green'
                                          : r.circuit_open
                                          ? 'orange'
                                          : 'gray'
                                      }
                                      fontSize="0.65rem">
                                      {r.enabled && !r.circuit_open
                                        ? 'Hazır'
                                        : r.circuit_open
                                        ? 'Devre kesik'
                                        : 'Pasif'}
                                    </Badge>
                                  </HStack>
                                </Flex>
                              );
                            })}
                          </Stack>
                        </Box>
                      </>
                    )}
                  </Stack>
                ) : (
                  <Text fontSize="sm" color="gray.500">
                    LLM router bilgisi yok.
                  </Text>
                )}
              </CardBody>
            </Card>

            {/* Modules */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardHeader pb={1}>
                <Heading size="sm">Modüller</Heading>
              </CardHeader>
              <CardBody pt={2}>
                <Stack spacing={1}>
                  <InfoRow
                    label="Piyasa Verisi (market_data)"
                    value={<StatusBadge on={modules.market_data} />}
                  />
                  <InfoRow
                    label="RAG"
                    value={<StatusBadge on={modules.rag} />}
                  />
                  <InfoRow
                    label="Intent (niyet tespiti)"
                    value={<StatusBadge on={modules.intent} />}
                  />
                  <InfoRow
                    label="Sentry"
                    value={<StatusBadge on={modules.sentry} />}
                  />
                  <InfoRow
                    label="Rate Limiter"
                    value={<StatusBadge on={modules.rate_limiter} />}
                  />
                  <InfoRow
                    label="Auth (API Key)"
                    value={<StatusBadge on={modules.auth_enabled} />}
                  />
                </Stack>
              </CardBody>
            </Card>

            {/* Cache */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardHeader pb={1}>
                <HStack>
                  <FiDatabase />
                  <Heading size="sm">Cache</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={2}>
                <Stack spacing={1} mb={3}>
                  <InfoRow label="Backend" value={cache.backend} />
                  <InfoRow label="Kayıt sayısı" value={cache.size} />
                  <InfoRow label="TTL (sn)" value={cache.ttl} />
                  <InfoRow label="Negatif TTL (sn)" value={cache.negative_ttl} />
                  <InfoRow label="SWR (sn)" value={cache.swr_ttl} />
                </Stack>
                <Divider mb={3} />
                <FormControl mb={2}>
                  <FormLabel fontSize="xs" color="gray.500">
                    Prefix (opsiyonel) — boş bırakılırsa tüm AI cache temizlenir
                  </FormLabel>
                  <Input
                    size="sm"
                    placeholder="ör. aichat:"
                    value={clearPrefix}
                    onChange={(e) => setClearPrefix(e.target.value)}
                  />
                </FormControl>
                <Button
                  size="sm"
                  colorScheme="red"
                  leftIcon={<FiTrash2 />}
                  onClick={handleClearCache}
                  isLoading={clearing}>
                  Cache Temizle
                </Button>
              </CardBody>
            </Card>

            {/* RAG / Rate Limits / Env */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardHeader pb={1}>
                <Heading size="sm">RAG · Limitler · Ortam</Heading>
              </CardHeader>
              <CardBody pt={2}>
                <Stack spacing={1}>
                  <InfoRow
                    label="RAG dokümanlar"
                    value={rag?.documents ?? (modules.rag ? '0' : 'kapalı')}
                  />
                  <InfoRow
                    label="RAG koleksiyonlar"
                    value={rag?.collections ?? '-'}
                  />
                  <InfoRow label="RAG top_k" value={rag?.top_k ?? '-'} />
                  <Divider my={2} />
                  <InfoRow label="Chat limit" value={rates.chat} mono />
                  <InfoRow label="Predict limit" value={rates.predict} mono />
                  <InfoRow label="Summary limit" value={rates.summary} mono />
                  <InfoRow label="Default limit" value={rates.default} mono />
                  <InfoRow
                    label="Maks. soru uzunluğu"
                    value={rates.max_question_len}
                  />
                  <Divider my={2} />
                  <InfoRow
                    label="Redis yapılandırıldı"
                    value={<StatusBadge on={env.redis_configured} />}
                  />
                  <InfoRow label="CORS origins" value={env.cors_origins} mono />
                  <InfoRow
                    label="İstek timeout (sn)"
                    value={env.request_timeout}
                  />
                  <InfoRow label="Maks. yeni token" value={env.max_new_tokens} />
                </Stack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Test chat */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={6}>
            <CardHeader pb={1}>
              <HStack>
                <FiPlay />
                <Heading size="sm">Test Sohbeti</Heading>
                <Tooltip label="Cache atlanır, rate-limit uygulanmaz. Sadece admin için.">
                  <Tag size="sm" colorScheme="orange">
                    cache bypass
                  </Tag>
                </Tooltip>
              </HStack>
            </CardHeader>
            <CardBody pt={2}>
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm">Soru</FormLabel>
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={3}
                  />
                </FormControl>
                <HStack>
                  <FormControl maxW="220px">
                    <FormLabel fontSize="sm">Detay seviyesi</FormLabel>
                    <Select
                      value={detailLevel}
                      onChange={(e) => setDetailLevel(e.target.value)}
                      size="sm">
                      <option value="brief">Kısa</option>
                      <option value="standard">Standart</option>
                      <option value="deep">Derin</option>
                    </Select>
                  </FormControl>
                  <Button
                    mt={6}
                    colorScheme="purple"
                    leftIcon={<FiPlay />}
                    onClick={handleTest}
                    isLoading={testing}
                    isDisabled={!question.trim()}>
                    Test Et
                  </Button>
                </HStack>

                {testing && (
                  <HStack>
                    <Spinner size="sm" />
                    <Text fontSize="sm" color="gray.500">
                      Yanıt bekleniyor…
                    </Text>
                  </HStack>
                )}

                {testResult && testResult.error && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">{testResult.error}</Text>
                  </Alert>
                )}

                {testResult && !testResult.error && (
                  <Box>
                    <HStack mb={2} spacing={2} flexWrap="wrap">
                      {testResult.provider && (
                        <Tag colorScheme="blue">{testResult.provider}</Tag>
                      )}
                      {testResult.model && (
                        <Tag colorScheme="purple">{testResult.model}</Tag>
                      )}
                      {testResult.detailLevel && (
                        <Tag colorScheme="gray">
                          detay: {testResult.detailLevel}
                        </Tag>
                      )}
                      {testResult.tokens && (
                        <Tag colorScheme="orange">
                          tokens: {JSON.stringify(testResult.tokens)}
                        </Tag>
                      )}
                    </HStack>
                    <Box
                      p={3}
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor={borderColor}
                      bg={codeBg}
                      whiteSpace="pre-wrap"
                      fontSize="sm">
                      {testResult.answer || (
                        <Code>{JSON.stringify(testResult, null, 2)}</Code>
                      )}
                    </Box>
                  </Box>
                )}
              </Stack>
            </CardBody>
          </Card>
        </>
      )}
    </Page>
  );
};

export default AiService;

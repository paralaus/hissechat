import React, {useMemo, useState} from 'react';
import {Badge, Box, Button, HStack, Link, Select, Text, useToast} from '@chakra-ui/react';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import {DataTable, Page} from '../../../components';
import {routes} from '../../../config/routes';
import {api} from '../../../api';
import {
  BlacklistScopeLabel,
  BlacklistValueLabel,
  BlacklistValueType,
  blacklistScopes,
  blacklistValueTypes,
} from '../../../config';
import {formatDate} from '../../../utils/date';
import {getErrorMessage} from '../../../utils/string';

const fetchData = async options => {
  const response = await api.getBlacklists(options);
  return response.data;
};

const isExpired = item =>
  !!item.expiresAt && new Date(item.expiresAt).getTime() <= Date.now();

const Blacklist = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [scope, setScope] = useState('');
  const [type, setType] = useState('');
  const [isActive, setIsActive] = useState('true');

  const filters = useMemo(() => {
    const next = {};
    if (scope) next.scope = scope;
    if (type) next.type = type;
    if (isActive) next.isActive = isActive;
    return next;
  }, [scope, type, isActive]);

  const onRow = async item => {
    navigate(routes.editBlacklist.getPath(item.id));
  };

  const onDelete = async item => {
    try {
      await api.deleteBlacklist(item.id);
      toast({
        title: 'Kayıt silindi.',
        description: 'Değişiklik en geç 1 dakika içinde etkili olur.',
        status: 'success',
        position: 'top',
      });
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  return (
    <Page>
      <HStack mb="4" spacing="3" flexWrap="wrap" justifyContent="space-between">
        <HStack spacing="3" flexWrap="wrap">
          <Select
            size="sm"
            maxW="220px"
            bg="white"
            placeholder="Tüm kapsamlar"
            value={scope}
            onChange={e => setScope(e.target.value)}>
            {blacklistScopes.map(item => (
              <option key={item} value={item}>
                {BlacklistScopeLabel[item] || item}
              </option>
            ))}
          </Select>
          <Select
            size="sm"
            maxW="180px"
            bg="white"
            placeholder="Tüm değer tipleri"
            value={type}
            onChange={e => setType(e.target.value)}>
            {blacklistValueTypes.map(item => (
              <option key={item} value={item}>
                {BlacklistValueLabel[item] || item}
              </option>
            ))}
          </Select>
          <Select
            size="sm"
            maxW="140px"
            bg="white"
            value={isActive}
            onChange={e => setIsActive(e.target.value)}>
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
            <option value="">Tümü</option>
          </Select>
        </HStack>
        <Button
          size="sm"
          colorScheme="primary"
          onClick={() => navigate(routes.editBlacklist.getPath('new'))}>
          Yeni Ekle
        </Button>
      </HStack>
      <DataTable
        key={JSON.stringify(filters)}
        queryEnabled
        searchPlaceholder="Değer, kapsam veya kaynak ara..."
        filters={filters}
        onRow={onRow}
        deleteVisible
        onDelete={onDelete}
        columns={[
          {
            header: 'Kapsam',
            accessorKey: 'scope',
            cell: ({getValue}) => {
              return <Text>{BlacklistScopeLabel[getValue()] || getValue()}</Text>;
            },
          },
          {
            header: 'Değer Tipi',
            accessorKey: 'type',
            cell: ({getValue}) => {
              return <Text>{BlacklistValueLabel[getValue()] || getValue()}</Text>;
            },
          },
          {
            header: 'Değer',
            accessorKey: 'value',
            cell: ({getValue, row}) => {
              const value = getValue();
              if (row.original.type === BlacklistValueType.UserId) {
                return (
                  <Link
                    as={RouterLink}
                    to={routes.editUser.getPath(value)}
                    color="primary.500"
                    onClick={e => e.stopPropagation()}>
                    {value}
                  </Link>
                );
              }
              return (
                <Text wordBreak="break-all" maxW="320px">
                  {value}
                </Text>
              );
            },
          },
          {
            header: 'Kaynak',
            accessorKey: 'resource',
            cell: ({getValue}) => {
              return <Text>{getValue() || '-'}</Text>;
            },
          },
          {
            header: 'Durum',
            accessorKey: 'isActive',
            cell: ({getValue, row}) => {
              if (!getValue()) return <Badge>Pasif</Badge>;
              if (isExpired(row.original)) {
                return <Badge colorScheme="yellow">Süresi Dolmuş</Badge>;
              }
              return <Badge colorScheme="red">Aktif</Badge>;
            },
          },
          {
            header: 'Bitiş',
            accessorKey: 'expiresAt',
            cell: ({getValue}) => {
              return <Text>{getValue() ? formatDate(getValue()) : 'Süresiz'}</Text>;
            },
          },
          {
            header: 'Eklenme',
            accessorKey: 'createdAt',
            cell: ({getValue}) => {
              return <Text>{formatDate(getValue())}</Text>;
            },
          },
        ]}
        fetchData={fetchData}
      />
      <Box mt="2">
        <Text fontSize="xs" color="gray.500">
          Satıra tıklayarak kaydı düzenleyebilir veya pasife alabilirsiniz.
          Değişiklikler en geç 1 dakika içinde etkili olur.
        </Text>
      </Box>
    </Page>
  );
};

export default Blacklist;

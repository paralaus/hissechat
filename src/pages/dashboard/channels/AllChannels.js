import {Avatar, Text} from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom';
import {getChannelThumbnail} from '../../../utils/image';
import {DataTable, Page} from '../../../components';
import {routes} from '../../../config/routes';
import {api} from '../../../api';
import {ChannelType} from '../../../config';
import React, {useCallback} from 'react';

const ALL_MARKET_TYPES = ['stock', 'crypto', 'viop', 'commodity'];
const FUND_SORT_FIELDS = new Set([
  'dailyReturn',
  'weeklyReturn',
  'monthlyReturn',
  'yearlyReturn',
  'totalValue',
  'name',
]);

const buildFundParams = rawParams => {
  const marketParams = {...rawParams};

  if (marketParams.query === '') {
    delete marketParams.query;
  }

  if (marketParams.sortBy && typeof marketParams.sortBy === 'string') {
    const [field, order] = marketParams.sortBy.split(':');

    if (FUND_SORT_FIELDS.has(field)) {
      marketParams.sortBy = field;
      marketParams.sortOrder = order || 'desc';
    } else {
      marketParams.sortBy = 'dailyReturn';
      marketParams.sortOrder = 'desc';
    }
  }

  return marketParams;
};

const buildVirtualChannel = ({item, isFund}) => ({
  ...item,
  id: null,
  _id: null,
  name: item.name,
  marketCode: !isFund ? item.code : undefined,
  fundCode: isFund ? item.code : undefined,
  type: isFund ? 'fund' : 'market',
  thumbnail: item.logo || null,
  messageCount: 0,
  memberCount: 0,
  isVirtual: true,
});

const getChannelKey = channel =>
  String(channel?.fundCode || channel?.marketCode || '').trim().toUpperCase();

const sortCombinedResults = (items, sortBy) => {
  if (!sortBy || typeof sortBy !== 'string') {
    return items;
  }

  const [field, order = 'desc'] = sortBy.split(':');
  const direction = order === 'asc' ? 1 : -1;

  const sorted = [...items].sort((a, b) => {
    const aValue = a?.[field];
    const bValue = b?.[field];

    if (field === 'name') {
      return String(aValue || '').localeCompare(String(bValue || ''), 'tr') * direction;
    }

    if (typeof aValue === 'number' || typeof bValue === 'number') {
      return ((Number(aValue) || 0) - (Number(bValue) || 0)) * direction;
    }

    const aDate = aValue ? new Date(aValue).getTime() : 0;
    const bDate = bValue ? new Date(bValue).getTime() : 0;
    return (aDate - bDate) * direction;
  });

  return sorted;
};

const AllChannels = ({category, isRestricted, onlyAdminCanPost, type, types}) => {
  const navigate = useNavigate();

  const fetchData = useCallback(
    async options => {
      const params = {...options};

      // Map category to market type
      let marketType = null;
      if (category === 'borsa') marketType = 'stock';
      else if (category === 'kripto') marketType = 'crypto';
      else if (category === 'viop') marketType = 'viop';
      else if (category === 'emtia') marketType = 'commodity';

      const isFund = category === 'fon';

      if (marketType || isFund) {
        // 1. Fetch Markets/Funds (Pagination Source)
        let marketsRes;
        const marketParams = {...params, type: marketType};
        // Clean up params that might not be needed for markets API if strict
        delete marketParams.category;

        if (isFund) {
          // Fix for Fund API Validation parameters
          if (marketParams.query === '') {
            delete marketParams.query;
          }

          // Handle sortBy (DataTable sends "field:desc", Fund API expects sortBy and sortOrder separately)
          if (marketParams.sortBy && typeof marketParams.sortBy === 'string') {
            const [field, order] = marketParams.sortBy.split(':');
            const allowedSortFields = [
              'dailyReturn',
              'weeklyReturn',
              'monthlyReturn',
              'yearlyReturn',
              'totalValue',
              'name',
            ];

            if (allowedSortFields.includes(field)) {
              marketParams.sortBy = field;
              marketParams.sortOrder = order || 'desc';
            } else {
              // Fallback for fields not in allowed list (like createdAt)
              marketParams.sortBy = 'dailyReturn';
              marketParams.sortOrder = 'desc';
            }
          }

          marketsRes = await api.getFunds(marketParams);
        } else {
          marketsRes = await api.getMarkets(marketParams);
        }

        // 2. Fetch Active Channels for this category to merge
        // We fetch a larger list to find matches. Ideally backend should support this,
        // but for now we follow messaging logic.
        const channelsRes = await api.getAllChannels({category, limit: 1000});
        const activeChannels = channelsRes.data.results || [];

        // 3. Merge
        const mergedResults = (marketsRes.data.results || []).map(item => {
          const code = item.code;
          const existingChannel = activeChannels.find(
            c => c.marketCode === code || c.fundCode === code,
          );

          if (existingChannel) return existingChannel;

          // Create virtual channel object
          return {
            // Preserve other market data if needed
            ...item,
            // Ensure ID is null so we know it's virtual
            id: null,
            _id: null,

            name: item.name,
            marketCode: !isFund ? code : undefined,
            fundCode: isFund ? code : undefined,
            type: isFund ? 'fund' : 'market',
            thumbnail: item.logo || null,
            messageCount: 0,
            memberCount: 0,
            isVirtual: true,
          };
        });

        return {
          results: mergedResults,
          totalResults:
            marketsRes.data.totalResults || marketsRes.data.total || 0,
        };
      }

      const requestedTypes = String(types || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      const isAggregatedAllView =
        !category &&
        !type &&
        requestedTypes.length > 0 &&
        requestedTypes.every(item => ['market', 'fund', 'normal'].includes(item));

      if (isAggregatedAllView) {
        const currentPage = Number(params.page || 1);
        const currentLimit = Number(params.limit || 10);
        const actualChannelsParams = {
          query: params.query,
          types,
          isRestricted,
          includeInactive: params.includeInactive,
          limit: 5000,
          page: 1,
        };

        const actualChannelsRes = await api.getAllChannels(actualChannelsParams);
        const actualChannels = (actualChannelsRes?.data?.results || []).filter(
          c => !!(c?.name || c?.label),
        );
        const marketOrFundChannelMap = new Map(
          actualChannels
            .filter(channel => channel.type === 'market' || channel.type === 'fund')
            .map(channel => [getChannelKey(channel), channel]),
        );

        const combinedResults = [];

        if (requestedTypes.includes('market')) {
          const marketResponses = await Promise.all(
            ALL_MARKET_TYPES.map(marketApiType =>
              api.getMarkets({
                type: marketApiType,
                limit: 1000,
                query: params.query,
              }),
            ),
          );

          marketResponses.forEach(response => {
            (response?.data?.results || []).forEach(item => {
              const existingChannel = marketOrFundChannelMap.get(
                String(item?.code || '').trim().toUpperCase(),
              );

              if (existingChannel) {
                combinedResults.push(existingChannel);
              } else if (isRestricted !== true) {
                combinedResults.push(
                  buildVirtualChannel({
                    item,
                    isFund: false,
                  }),
                );
              }
            });
          });
        }

        if (requestedTypes.includes('fund')) {
          const fundsResponse = await api.getFunds(
            buildFundParams({
              limit: 2000,
              query: params.query,
              sortBy: params.sortBy,
            }),
          );

          (fundsResponse?.data?.results || []).forEach(item => {
            const existingChannel = marketOrFundChannelMap.get(
              String(item?.code || '').trim().toUpperCase(),
            );

            if (existingChannel) {
              combinedResults.push(existingChannel);
            } else if (isRestricted !== true) {
              combinedResults.push(
                buildVirtualChannel({
                  item,
                  isFund: true,
                }),
              );
            }
          });
        }

        if (requestedTypes.includes('normal')) {
          combinedResults.push(
            ...actualChannels.filter(channel => channel.type === 'normal'),
          );
        }

        const sortedResults = sortCombinedResults(combinedResults, params.sortBy);
        const paginatedResults = sortedResults.slice(
          (currentPage - 1) * currentLimit,
          currentPage * currentLimit,
        );

        return {
          results: paginatedResults,
          page: currentPage,
          limit: currentLimit,
          totalPages: Math.ceil(sortedResults.length / currentLimit) || 1,
          totalResults: sortedResults.length,
        };
      }

      // Default behavior for other categories or 'all'
      if (category) {
        params.category = category;
      }
      if (typeof isRestricted !== 'undefined') {
        params.isRestricted = isRestricted;
      }
      if (typeof onlyAdminCanPost !== 'undefined') {
        params.onlyAdminCanPost = onlyAdminCanPost;
      }
      if (type) {
        params.type = type;
      }
      if (types) {
        params.types = types;
      }
      const response = await api.getAllChannels(params);
      if (response.data && response.data.results) {
        response.data.results = response.data.results.filter(
          c => !!(c.name || c.label),
        );
      }
      return response.data;
    },
    [category, isRestricted, onlyAdminCanPost, type, types],
  );

  const onRow = async item => {
    if (item.id) {
      navigate(routes.editChannel.getPath(item.id));
    } else {
      // Handle virtual channel click - maybe initiate or show info
      // For now, prevent navigation to undefined ID
      console.log('Clicked virtual channel:', item);
    }
  };

  return (
    <Page>
      <DataTable
        key={`${category}-${isRestricted}-${onlyAdminCanPost}-${type}-${types}`}
        queryEnabled
        deleteVisible={false}
        onRow={onRow}
        columns={[
          {
            header: 'Logo',
            accessorKey: 'thumbnail',
            cell: ({getValue, row}) => (
              <Avatar
                name={row?.original?.name}
                src={getChannelThumbnail(row.original)}
                size={'sm'}
              />
            ),
          },
          {
            header: 'İsim',
            accessorKey: 'name',
          },

          {
            header: 'Üye Sayısı',
            accessorKey: 'memberCount',
          },
          {
            header: 'Vip',
            accessorKey: 'type',
            cell: ({getValue}) => {
              return (
                <Text>{getValue() === ChannelType.Vip ? 'Evet' : 'Hayır'}</Text>
              );
            },
          },
        ]}
        fetchData={fetchData}
        filters={{category, isRestricted, onlyAdminCanPost, type, types}}
      />
    </Page>
  );
};

export default AllChannels;

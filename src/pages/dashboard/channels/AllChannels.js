import {Avatar, Text} from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom';
import {getChannelThumbnail} from '../../../utils/image';
import {DataTable, Page} from '../../../components';
import {routes} from '../../../config/routes';
import {api} from '../../../api';
import {ChannelType} from '../../../config';
import React, {useCallback} from 'react';

const AllChannels = ({category}) => {
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
        const marketParams = { ...params, type: marketType };
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
            const allowedSortFields = ['dailyReturn', 'weeklyReturn', 'monthlyReturn', 'yearlyReturn', 'totalValue', 'name'];
            
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
        const channelsRes = await api.getAllChannels({ category, limit: 1000 });
        const activeChannels = channelsRes.data.results || [];

        // 3. Merge
        const mergedResults = (marketsRes.data.results || []).map(item => {
          const code = item.code;
          const existingChannel = activeChannels.find(c => 
            (c.marketCode === code) || (c.fundCode === code)
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
          totalResults: marketsRes.data.totalResults || marketsRes.data.total || 0,
        };
      }

      // Default behavior for other categories or 'all'
      if (category) {
        params.category = category;
      }
      const response = await api.getAllChannels(params);
      return response.data;
    },
    [category],
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
        key={category}
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
        filters={{ category }}
      />
    </Page>
  );
};

export default AllChannels;

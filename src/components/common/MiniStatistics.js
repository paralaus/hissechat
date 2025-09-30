import React from 'react';
import {
  Box,
  Flex,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  useColorModeValue,
} from '@chakra-ui/react';
import Condition from './Condition';
import {isValue} from '../../utils/string';

const MiniStatistics = ({title, amount, percentage, icon}) => {
  const iconTeal = useColorModeValue('primary.300', 'primary.300');
  const textColor = useColorModeValue('gray.700', 'white');
  const bg = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('gray.700', 'gray.200');

  return (
    <Box
      minH="83px"
      backgroundColor={bg}
      color={color}
      borderRadius={'md'}
      display={'flex'}
      flexDirection={'column'}
      justifyContent={'center'}
      boxShadow={'md'}
      p={'3'}>
      <Box>
        <Flex flexDirection="row" align="center" justify="center" w="100%">
          <Stat me="auto">
            <Condition condition={title}>
              <StatLabel
                color="gray.400"
                fontWeight="bold"
                py=".1rem"
                fontSize={'md'}>
                {title}
              </StatLabel>
            </Condition>
            <Flex>
              <Condition condition={isValue(amount)}>
                <StatNumber fontSize="xl" color={textColor}>
                  {amount}
                </StatNumber>
              </Condition>
              <Condition condition={isValue(percentage)}>
                <StatHelpText
                  alignSelf="flex-end"
                  justifySelf="flex-end"
                  m="0px"
                  color={percentage > 0 ? 'green.400' : 'red.400'}
                  fontWeight="bold"
                  ps="3px"
                  py=".4rem"
                  fontSize="md">
                  {percentage > 0 ? `+${percentage}%` : `${percentage}%`}
                </StatHelpText>
              </Condition>
            </Flex>
          </Stat>
          <Condition condition={icon}>
            <Box
              h={'54px'}
              w={'54px'}
              bg={iconTeal}
              display={'flex'}
              borderRadius={'full'}
              justifyContent={'center'}
              alignItems={'center'}>
              {icon}
            </Box>
          </Condition>
        </Flex>
      </Box>
    </Box>
  );
};

export default MiniStatistics;

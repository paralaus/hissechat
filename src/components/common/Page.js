import {Box, Heading, Text, Flex} from '@chakra-ui/react';
import {motion} from 'framer-motion';

// Animasyonlu container
const MotionBox = motion(Box);

// Animasyon varyantları
const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -10,
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.2,
};

/**
 * Ana sayfa wrapper bileşeni
 * @param {Object} props
 * @param {React.ReactNode} props.children - Sayfa içeriği
 * @param {string} props.title - Sayfa başlığı
 * @param {string} props.subtitle - Sayfa alt başlığı
 * @param {React.ReactNode} props.action - Sağ üst köşedeki aksiyon butonu
 * @param {React.ReactNode} props.breadcrumb - Breadcrumb bileşeni
 * @param {boolean} props.animate - Animasyon açık/kapalı (varsayılan: true)
 */
const Page = ({
  children,
  title,
  subtitle,
  action,
  breadcrumb,
  animate = true,
}) => {
  const content = (
    <Box>
      {/* Header */}
      {(title || action) && (
        <Flex
          justify="space-between"
          align="flex-start"
          mb="6"
          flexWrap="wrap"
          gap="4">
          <Box>
            {breadcrumb}
            {title && (
              <Heading
                as="h1"
                size="lg"
                color="gray.800"
                fontWeight="bold"
                letterSpacing="-0.5px">
                {title}
              </Heading>
            )}
            {subtitle && (
              <Text color="gray.500" fontSize="sm" mt="1">
                {subtitle}
              </Text>
            )}
          </Box>
          {action && <Box>{action}</Box>}
        </Flex>
      )}

      {/* Content */}
      {children}
    </Box>
  );

  if (!animate) {
    return content;
  }

  return (
    <MotionBox
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}>
      {content}
    </MotionBox>
  );
};

/**
 * Kart içeriği için wrapper
 */
export const PageCard = ({children, title, subtitle, action, ...props}) => {
  return (
    <Box
      bg="white"
      borderRadius="xl"
      border="1px"
      borderColor="gray.100"
      boxShadow="card"
      p="6"
      {...props}>
      {(title || action) && (
        <Flex justify="space-between" align="center" mb="4">
          <Box>
            {title && (
              <Heading as="h3" size="md" color="gray.800">
                {title}
              </Heading>
            )}
            {subtitle && (
              <Text color="gray.500" fontSize="sm" mt="0.5">
                {subtitle}
              </Text>
            )}
          </Box>
          {action}
        </Flex>
      )}
      {children}
    </Box>
  );
};

/**
 * Sayfa bölümü için wrapper
 */
export const PageSection = ({children, title, subtitle, action, mb = '6'}) => {
  return (
    <Box mb={mb}>
      {(title || action) && (
        <Flex justify="space-between" align="center" mb="4">
          <Box>
            {title && (
              <Heading as="h2" size="md" color="gray.800">
                {title}
              </Heading>
            )}
            {subtitle && (
              <Text color="gray.500" fontSize="sm" mt="0.5">
                {subtitle}
              </Text>
            )}
          </Box>
          {action}
        </Flex>
      )}
      {children}
    </Box>
  );
};

/**
 * İki sütunlu form layout
 */
export const PageFormLayout = ({children, sidebar}) => {
  return (
    <Flex gap="6" flexDirection={{base: 'column', lg: 'row'}}>
      <Box flex="2">{children}</Box>
      {sidebar && (
        <Box flex="1" minW={{lg: '300px'}} maxW={{lg: '400px'}}>
          {sidebar}
        </Box>
      )}
    </Flex>
  );
};

export default Page;

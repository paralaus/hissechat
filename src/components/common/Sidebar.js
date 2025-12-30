import React from 'react';
import {
  IconButton,
  Box,
  CloseButton,
  Flex,
  HStack,
  VStack,
  Icon,
  useColorModeValue,
  Link,
  Drawer,
  DrawerContent,
  Text,
  useDisclosure,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  useToast,
  Avatar,
  Badge,
  Spinner,
  Button,
} from '@chakra-ui/react';
import { FiMenu, FiChevronDown, FiLogOut, FiSettings, FiBell } from 'react-icons/fi';
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';

import { meta } from '../../config/meta';
import { sidebarRoutes } from '../../config/sidebar';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { trim } from '../../utils/string';
import { useUserStore } from '../../store';
import Cookies from 'js-cookie';
import Breadcrumbs from './Breadcrumbs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../api/api';
import useBrowserNotification from '../../hooks/useBrowserNotification';
import { useEffect, useRef } from 'react';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { tr } from 'date-fns/locale';

const SIDEBAR_WIDTH = '260px';

const getIsActive = (link, location) => {
  return link.exact
    ? trim(location.pathname, '/') === trim(link.path, '/')
    : location.pathname.includes(link.path);
};

export default function SidebarWithHeader({ children }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" bg="gray.50">
      <SidebarContent
        onClose={() => onClose}
        display={{ base: 'none', md: 'block' }}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      <MobileNav onOpen={onOpen} />
      <Box ml={{ base: 0, md: SIDEBAR_WIDTH }} p="6">
        {children}
      </Box>
    </Box>
  );
}

const SidebarContent = ({ onClose, ...rest }) => {
  const bgColor = useColorModeValue('gray.900', 'gray.900');
  
  return (
    <Box
      overflowY="auto"
      overflowX="hidden"
      transition="0.3s ease"
      bg={bgColor}
      w={{ base: 'full', md: SIDEBAR_WIDTH }}
      position="fixed"
      h="full"
      css={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.6) 0%, rgba(139, 92, 246, 0.6) 100%)',
          borderRadius: '4px',
          border: '2px solid rgba(255,255,255,0.1)',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%)',
        },
      }}
      {...rest}
    >
      {/* Logo */}
      <Flex
        h="16"
        alignItems="center"
        px="6"
        borderBottom="1px"
        borderColor="whiteAlpha.100"
        justifyContent="space-between"
      >
        <NavLink to="/dashboard">
          <HStack spacing="3">
            <Box
              w="8"
              h="8"
              bgGradient="linear(to-br, brand.400, brand.600)"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="white" fontWeight="bold" fontSize="sm">
                {meta.name.charAt(0)}
              </Text>
            </Box>
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="white"
              letterSpacing="-0.5px"
            >
              {meta.name}
            </Text>
          </HStack>
        </NavLink>
        <CloseButton 
          display={{ base: 'flex', md: 'none' }} 
          onClick={onClose}
          color="white"
          _hover={{ bg: 'whiteAlpha.100' }}
        />
      </Flex>

      {/* Navigation Links */}
      <VStack spacing="1" align="stretch" p="4">
        <Links />
      </VStack>
    </Box>
  );
};

const Links = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState({});

  // Grupları bul
  const groups = {};
  sidebarRoutes.forEach(route => {
    const group = route.group || 'Genel';
    if (!groups[group]) groups[group] = [];
    groups[group].push(route);
  });

  return (
    <>
      {Object.entries(groups).map(([groupName, routes]) => (
        <Box key={groupName} mb="4">
          <Text
            fontSize="xs"
            color="whiteAlpha.500"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="wider"
            px="3"
            mb="2"
          >
            {groupName}
          </Text>
          {routes.map(link => {
            if (link.private) return null;
            
            if (link.children) {
              return (
                <Box key={link.name}>
                  <NavItem
                    icon={link.icon}
                    isActive={false}
                    isParent={true}
                    onClick={() =>
                      setCollapsed({
                        ...collapsed,
                        [link.name]: !collapsed[link.name],
                      })
                    }
                    collapsed={collapsed[link.name]}
                  >
                    {link.name}
                  </NavItem>
                  <VStack
                    spacing="1"
                    align="stretch"
                    pl="4"
                    display={collapsed[link.name] ? 'flex' : 'none'}
                    mt="1"
                  >
                    {link.children.map(child => {
                      if (child.private) return null;
                      return (
                        <NavItem
                          key={child.name}
                          path={child.path}
                          isActive={getIsActive(child, location)}
                          icon={child.icon}
                        >
                          {child.name}
                        </NavItem>
                      );
                    })}
                  </VStack>
                </Box>
              );
            }

            return (
              <NavItem
                key={link.name}
                icon={link.icon}
                path={link.path}
                isActive={getIsActive(link, location)}
              >
                {link.name}
              </NavItem>
            );
          })}
        </Box>
      ))}
    </>
  );
};

const NavItem = ({
  icon,
  children,
  path,
  isActive,
  isParent,
  collapsed,
  onClick,
  ...rest
}) => {
  const content = (
    <Flex
      align="center"
      px="3"
      py="2.5"
      borderRadius="lg"
      cursor="pointer"
      transition="all 0.2s"
      bg={isActive ? 'brand.500' : 'transparent'}
      color={isActive ? 'white' : 'whiteAlpha.700'}
      _hover={{
        bg: isActive ? 'brand.600' : 'whiteAlpha.100',
        color: 'white',
      }}
      fontWeight={isActive ? '600' : '500'}
      fontSize="sm"
      onClick={onClick}
      {...rest}
    >
      {icon && (
        <Icon
          as={icon}
          mr="3"
          fontSize="lg"
          color={isActive ? 'white' : 'whiteAlpha.600'}
          _groupHover={{ color: 'white' }}
        />
      )}
      <Text flex="1">{children}</Text>
      {isParent && (
        <Icon
          as={collapsed ? MdKeyboardArrowUp : MdKeyboardArrowDown}
          fontSize="xl"
          color="whiteAlpha.600"
        />
      )}
    </Flex>
  );

  if (isParent) {
    return <Box role="group">{content}</Box>;
  }

  return (
    <Link
      as={NavLink}
      to={path}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
      role="group"
    >
      {content}
    </Link>
  );
};

const MobileNav = ({ onOpen, ...rest }) => {
  const { user, setUser } = useUserStore();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { showNotification } = useBrowserNotification();
  const lastNotificationIdRef = useRef(null);

  // Notifications Query
  const { data: notificationsData, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications({ limit: 10, page: 1 }),
    refetchInterval: 10000, // Check every 10 seconds
    refetchIntervalInBackground: true,
  });

  // Mark Read Mutation
  const markReadMutation = useMutation({
    mutationFn: api.markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast({
        title: 'Tüm bildirimler okundu',
        status: 'success',
        duration: 2000,
      });
    },
  });

  const notifications = notificationsData?.data?.results || [];
  const unreadCount = notifications.filter(n => !n.readAt).length;

  // Browser Notification Effect
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const latestNotification = notifications[0];
    const latestId = latestNotification.id || latestNotification._id;

    // Initial load - sadece ilk yüklemede en son ID'yi kaydet, bildirim gösterme
    if (!lastNotificationIdRef.current) {
      lastNotificationIdRef.current = latestId;
      return;
    }

    // New notification check
    if (latestId !== lastNotificationIdRef.current) {
      // Find all new notifications
      // Bildirim listesi tarihe göre sıralı varsayılıyor (en yeni en üstte)
      const newNotifications = [];
      
      for (const notification of notifications) {
        const id = notification.id || notification._id;
        if (id === lastNotificationIdRef.current) break; // Son görülen bildirime geldik
        newNotifications.push(notification);
      }

      // Update last seen ID immediately to prevent duplicate processing
      lastNotificationIdRef.current = latestId;
      
      // Process new notifications (reverse to show oldest new first, or just show latest)
      // Çok fazla bildirim varsa sadece en yenisini göster veya özet geç
      // Amaç ses çalmak ve browser notification göstermek
      
      if (newNotifications.length > 0) {
        // En az bir yeni bildirim var
        const soundEnabled = localStorage.getItem('notification_sound_enabled') === 'true';
        let playedSound = false;

        newNotifications.forEach(notification => {
          if (!notification.readAt) {
             showNotification(notification.title || 'Yeni Bildirim', {
              body: notification.body || notification.message || 'Yeni bir bildiriminiz var.',
              icon: '/logo192.png',
              tag: `notification-${notification.id || notification._id}`
            });

            // Play sound only once per batch to avoid noise
            if (soundEnabled && !playedSound) {
              playNotificationSound();
              playedSound = true;
            }
          }
        });
      }
    }
  }, [notifications, showNotification]);

  const onLogout = () => {
    setUser(null);
    Cookies.remove('token');
    toast({
      title: 'Çıkış Yapıldı',
      status: 'success',
      position: 'top',
      duration: 2000,
    });
    navigate('/auth/login');
  };

  return (
    <Flex
      ml={{ base: 0, md: SIDEBAR_WIDTH }}
      px={{ base: 4, md: 6 }}
      height="16"
      alignItems="center"
      bg={bgColor}
      borderBottomWidth="1px"
      borderBottomColor={borderColor}
      justifyContent={{ base: 'space-between', md: 'space-between' }}
      boxShadow="xs"
      {...rest}
    >
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="ghost"
        aria-label="open menu"
        icon={<FiMenu />}
        size="sm"
      />

      <Breadcrumbs />

      <NavLink to="/dashboard">
        <Text
          display={{ base: 'flex', md: 'none' }}
          fontSize="lg"
          fontWeight="bold"
          color="brand.500"
        >
          {meta.name}
        </Text>
      </NavLink>

      <HStack spacing="3">
        {/* Notifications */}
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Bildirimler"
            icon={
              <Box position="relative">
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <Badge
                    position="absolute"
                    top="-2px"
                    right="-2px"
                    colorScheme="red"
                    borderRadius="full"
                    boxSize="4"
                    fontSize="xs"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Box>
            }
            variant="ghost"
            size="md"
          />
          <MenuList
            bg={bgColor}
            borderColor={borderColor}
            boxShadow="lg"
            maxH="400px"
            overflowY="auto"
            w="350px"
            p={0}
          >
            <Box p={3} borderBottomWidth="1px" borderColor={borderColor} display="flex" justifyContent="space-between" alignItems="center">
              <Text fontWeight="bold" fontSize="sm">Bildirimler</Text>
              {unreadCount > 0 && (
                <Button 
                  size="xs" 
                  variant="ghost" 
                  colorScheme="brand" 
                  onClick={() => markReadMutation.mutate()}
                  isLoading={markReadMutation.isLoading}
                >
                  Tümünü Okundu Say
                </Button>
              )}
            </Box>
            
            {isLoadingNotifications ? (
              <Box p={4} textAlign="center">
                <Spinner size="sm" />
              </Box>
            ) : notifications.length === 0 ? (
              <Box p={4} textAlign="center">
                <Text fontSize="sm" color="gray.500">Hiç bildirim yok.</Text>
              </Box>
            ) : (
              notifications.map((notification) => (
                <MenuItem
                  key={notification.id || notification._id}
                  _hover={{ bg: 'gray.50' }}
                  p={3}
                  borderBottomWidth="1px"
                  borderColor="gray.100"
                >
                  <VStack align="start" spacing={1} w="full">
                    <HStack justify="space-between" w="full">
                      <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                        {notification.title}
                      </Text>
                      {!notification.readAt && (
                        <Badge colorScheme="green" variant="solid" boxSize={2} borderRadius="full" />
                      )}
                    </HStack>
                    <Text fontSize="xs" color="gray.600" noOfLines={2}>
                      {notification.body || notification.message}
                    </Text>
                    <Text fontSize="10px" color="gray.400" alignSelf="flex-end">
                      {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })}
                    </Text>
                  </VStack>
                </MenuItem>
              ))
            )}
          </MenuList>
        </Menu>

        <Flex alignItems="center">
          <Menu>
            <MenuButton
              py={2}
              transition="all 0.2s"
              borderRadius="lg"
              _hover={{ bg: 'gray.100' }}
              _focus={{ boxShadow: 'none' }}
            >
              <HStack spacing="3" px="2">
                <Avatar
                  size="sm"
                  name={user?.fullname}
                  src={user?.thumbnail}
                  bg="brand.500"
                  color="white"
                />
                <VStack
                  display={{ base: 'none', md: 'flex' }}
                  alignItems="flex-start"
                  spacing="0"
                >
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {user?.fullname}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {user?.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                  </Text>
                </VStack>
                <Box display={{ base: 'none', md: 'flex' }}>
                  <FiChevronDown color="gray.500" />
                </Box>
              </HStack>
            </MenuButton>
            <MenuList
              bg={bgColor}
              borderColor={borderColor}
              boxShadow="lg"
              py="2"
            >
              <MenuItem
                as={NavLink}
                to="/dashboard/settings"
                icon={<FiSettings />}
                fontSize="sm"
                _hover={{ bg: 'gray.100' }}
              >
                Ayarlar
              </MenuItem>
              <MenuDivider />
              <MenuItem
                onClick={onLogout}
                icon={<FiLogOut />}
                fontSize="sm"
                color="red.500"
                _hover={{ bg: 'red.50' }}
              >
                Çıkış Yap
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  );
};

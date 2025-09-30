import React, {useMemo} from 'react';
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
} from '@chakra-ui/react';
import {FiMenu, FiChevronDown} from 'react-icons/fi';
import {MdKeyboardArrowDown, MdKeyboardArrowUp} from 'react-icons/md';

import {meta} from '../../config/meta';
import {sidebarRoutes} from '../../config/sidebar';
import {useLocation, NavLink, useNavigate} from 'react-router-dom';
import {trim} from '../../utils/string';
import {useUserStore} from '../../store';
import Cookies from 'js-cookie';
import Breadcrumbs from './Breadcrumbs';

const panelWidth = '240px';

const getIsActive = (link, location) => {
  return link.exact
    ? trim(location.pathname, '/') === trim(link.path, '/')
    : location.pathname.includes(link.path);
};

export default function SidebarWithHeader({children}) {
  const {isOpen, onOpen, onClose} = useDisclosure();

  return (
    <Box minH="100vh">
      <SidebarContent
        onClose={() => onClose}
        display={{base: 'none', md: 'block'}}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full">
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* mobilenav */}
      <MobileNav onOpen={onOpen} />
      <Box ml={{base: 0, md: 60}} p="4">
        {children}
      </Box>
    </Box>
  );
}

const SidebarContent = ({onClose, ...rest}) => {
  return (
    <Box
      overflow={'scroll'}
      transition="3s ease"
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{base: 'full', md: panelWidth}}
      position="fixed"
      h="full"
      {...rest}>
      <Flex
        h="20"
        alignItems="center"
        mx="8"
        justifyContent={{
          base: 'space-between',
          md: 'center',
        }}
        flexDirection={{
          base: 'row',
          md: 'column',
        }}>
        <NavLink to="/dashboard">
          <Text
            fontSize="2xl"
            fontFamily="monospace"
            fontWeight="bold"
            textAlign={'center'}>
            {meta.name}
          </Text>
        </NavLink>
        <CloseButton display={{base: 'flex', md: 'none'}} onClick={onClose} />
      </Flex>
      <Links routes={sidebarRoutes} />
    </Box>
  );
};

const Links = ({routes}) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState({});

  return sidebarRoutes.map(link => {
    if (link.private) return <Box key={link.name}></Box>;
    if (link.children) {
      return (
        <Box key={link.name} display={'flex'} flexDirection={'column'}>
          <Flex>
            <NavItem
              icon={link.icon}
              path={link.path}
              isActive={false}
              isParent={true}
              onClick={() =>
                setCollapsed({
                  ...collapsed,
                  [link.name]: !collapsed[link.name],
                })
              }
              collapsed={collapsed[link.name]}>
              {link.name}
            </NavItem>
          </Flex>
          <Flex
            flexDirection={'column'}
            pl="4"
            display={collapsed[link.name] ? 'flex' : 'none'}>
            {link.children.map(child => {
              if (child.private) return null;
              return (
                <NavItem
                  key={child.name}
                  path={child.path}
                  isActive={getIsActive(child, location)}
                  icon={child.icon}>
                  {child.name}
                </NavItem>
              );
            })}
          </Flex>
        </Box>
      );
    }

    return (
      <Box key={link.name}>
        <NavItem
          key={link.name}
          icon={link.icon}
          path={link.path}
          isActive={getIsActive(link, location)}>
          {link.name}
        </NavItem>
      </Box>
    );
  });
};

const NavItem = ({
  icon,
  children,
  path,
  isActive,
  isParent,
  collapsed,
  ...rest
}) => {
  const style = {
    color: isActive ? 'white' : 'inherit',
    bg: isActive ? 'primary.400' : 'inherit',
    _hover: isActive
      ? {
          bg: 'primary.700',
          color: 'white',
        }
      : {
          bg: 'gray.100',
          // color: "main",
        },
  };

  const iconStyle = {
    _groupHover: isActive
      ? {
          color: 'white',
        }
      : {
          // color: "main",
        },
  };
  return (
    <Link
      as={!isParent ? NavLink : 'button'}
      to={path}
      style={{textDecoration: 'none'}}
      _focus={{boxShadow: 'none'}}
      display="flex"
      flex={1}>
      <Flex
        flex={1}
        align="center"
        px="4"
        height={'height'}
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        alignItems={'center'}
        flexDirection={'row'}
        // borderWidth={0.5}
        // borderColor={"gray.100"}
        my="1"
        {...rest}
        {...style}>
        {icon && <Icon mr="4" fontSize="16" {...iconStyle} as={icon} />}
        {children}
        {isParent ? (
          <Box ml="auto">
            {collapsed ? (
              <MdKeyboardArrowUp size={24} />
            ) : (
              <MdKeyboardArrowDown size={24} />
            )}
          </Box>
        ) : null}
      </Flex>
    </Link>
  );
};

const MobileNav = ({onOpen, ...rest}) => {
  const {user, setUser} = useUserStore();
  const navigate = useNavigate();
  const toast = useToast();

  const location = useLocation();

  const breadcrumb = useMemo(() => {
    const routes = [];

    for (let i = 0; i < sidebarRoutes.length; i++) {
      const route = sidebarRoutes[i];
      if (trim(location.pathname, '/') === trim(route.path, '/')) {
        routes.push(route);
        break;
      }
      if (route.children) {
        for (let j = 0; j < route.children.length; j++) {
          const child = route.children[j];

          if (trim(location.pathname, '/') === trim(child.path, '/')) {
            routes.push(route);
            routes.push(child);
            break;
          }
        }
      }
    }
    return routes;
  }, [location]);

  const onLogout = () => {
    setUser(null);
    Cookies.remove('token');
    toast({
      title: 'Çıkış Yapıldı',
      status: 'success',
      position: 'top',
    });
    navigate('/auth/login');
  };

  return (
    <Flex
      ml={{base: 0, md: panelWidth}}
      px={{base: 4, md: 4}}
      height="20"
      alignItems="center"
      bg={useColorModeValue('white', 'gray.900')}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      justifyContent={{base: 'space-between', md: 'flex-end'}}
      {...rest}>
      <IconButton
        display={{base: 'flex', md: 'none'}}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />
      <Breadcrumbs />
      <NavLink to="/dashboard">
        <Text
          display={{base: 'flex', md: 'none'}}
          fontSize="2xl"
          fontFamily="monospace"
          fontWeight="bold">
          {meta.name}
        </Text>
      </NavLink>

      <HStack spacing={{base: '0', md: '6'}}>
        {/* <IconButton
          size="lg"
          variant="ghost"
          aria-label="open menu"
          icon={<FiBell />}
        /> */}

        <Flex alignItems={'center'}>
          <Menu>
            <MenuButton
              py={2}
              transition="all 0.3s"
              _focus={{boxShadow: 'none'}}>
              <HStack>
                <Avatar
                  size={'sm'}
                  name={user?.fullname}
                  src={user?.thumbnail}
                />
                <VStack
                  display={{base: 'none', md: 'flex'}}
                  alignItems="flex-start"
                  spacing="1px"
                  ml="2">
                  <Text fontSize="sm">{user?.fullname}</Text>
                  <Text fontSize="xs" color="gray.600" textAlign={'center'}>
                    {user?.email}
                  </Text>
                </VStack>
                <Box display={{base: 'none', md: 'flex'}}>
                  <FiChevronDown />
                </Box>
              </HStack>
            </MenuButton>
            <MenuList
              bg={useColorModeValue('white', 'gray.900')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}>
              <MenuItem as={NavLink} to="/dashboard/settings">
                Ayarlar
              </MenuItem>
              <MenuDivider />
              <MenuItem onClick={onLogout}>Çıkış Yap</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  );
};

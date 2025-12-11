import React, { useRef, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { FiTrash2, FiEdit2, FiSearch, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { GoTriangleDown, GoTriangleUp } from 'react-icons/go';
import useDisclosure from '../../hooks/useDisclosure';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import Condition from './Condition';
import {
  Table,
  Th,
  Thead,
  Tr,
  Tbody,
  Td,
  Box,
  useColorModeValue,
  Button,
  Input,
  AlertDialogFooter,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialog,
  AlertDialogHeader,
  AlertDialogBody,
  Spinner,
  InputGroup,
  InputLeftElement,
  HStack,
  Text,
  Select,
  IconButton,
  Flex,
  ButtonGroup,
  Badge,
} from '@chakra-ui/react';

const DataTable = ({
  columns,
  fetchData,
  onDelete = async () => {},
  onEdit = () => {},
  deleteVisible = false,
  editVisible = false,
  isDeleting,
  onRow = () => {},
  defaultSortBy = 'createdAt:desc',
  queryEnabled = false,
  shadow = true,
  emptyMessage = 'Kayıt bulunamadı',
}) => {
  const { value, setValue, debouncedValue } = useDebouncedValue('');
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const cancelRef = useRef();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const [selectedItem, setSelectedItem] = useState(null);
  const deleteModal = useDisclosure();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const dataQuery = useQuery({
    queryKey: [
      'data',
      pagination,
      ...(queryEnabled ? [debouncedValue] : []),
      sortBy,
    ],
    queryFn: () =>
      fetchData({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        sortBy,
        ...(queryEnabled ? { query: debouncedValue } : {}),
      }),
  });

  const table = useReactTable({
    data: dataQuery.data?.results ?? [],
    columns,
    pageCount: dataQuery.data?.totalPages ?? -1,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
  });

  const onDeletePress = async () => {
    await onDelete(selectedItem);
    deleteModal.close();
    await dataQuery.refetch();
  };

  const toggleSort = (header) => {
    if (sortBy === header + ':desc') {
      setSortBy(header + ':asc');
    } else if (sortBy === header + ':asc') {
      setSortBy(defaultSortBy);
    } else {
      setSortBy(header + ':desc');
    }
  };

  const hasData = table.getRowModel().rows.length > 0;
  const isLoading = dataQuery.isLoading;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();

  return (
    <>
      <Box
        bg={bgColor}
        borderRadius="xl"
        border="1px"
        borderColor={borderColor}
        boxShadow={shadow ? 'card' : 'none'}
        overflow="hidden"
      >
        {/* Search Bar */}
        <Condition condition={queryEnabled}>
          <Box p="4" borderBottom="1px" borderColor={borderColor}>
            <InputGroup size="md" maxW="400px">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray" />
              </InputLeftElement>
              <Input
                placeholder="Ara..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                bg={useColorModeValue('gray.50', 'gray.900')}
                border="none"
                _focus={{
                  bg: useColorModeValue('white', 'gray.800'),
                  boxShadow: 'sm',
                }}
              />
            </InputGroup>
          </Box>
        </Condition>

        {/* Table */}
        <Box overflowX="auto">
          <Table>
            <Thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Tr key={headerGroup.id} bg={headerBg}>
                  {headerGroup.headers.map((header) => (
                    <Th
                      key={header.id}
                      cursor="pointer"
                      py="4"
                      px="6"
                      fontSize="xs"
                      fontWeight="semibold"
                      color="gray.600"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      borderBottom="2px"
                      borderColor={borderColor}
                      onClick={() => toggleSort(header.column.id)}
                      _hover={{ color: 'gray.800' }}
                      transition="color 0.2s"
                    >
                      <HStack spacing="2">
                        <Text>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </Text>
                        <Condition condition={sortBy === header.column.id + ':desc'}>
                          <GoTriangleDown />
                        </Condition>
                        <Condition condition={sortBy === header.column.id + ':asc'}>
                          <GoTriangleUp />
                        </Condition>
                      </HStack>
                    </Th>
                  ))}
                  <Condition condition={editVisible || deleteVisible}>
                    <Th
                      py="4"
                      px="6"
                      fontSize="xs"
                      fontWeight="semibold"
                      color="gray.600"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      borderBottom="2px"
                      borderColor={borderColor}
                      textAlign="right"
                    >
                      İşlemler
                    </Th>
                  </Condition>
                </Tr>
              ))}
            </Thead>
            <Tbody>
              {isLoading ? (
                <Tr>
                  <Td
                    colSpan={columns.length + (editVisible || deleteVisible ? 1 : 0)}
                    py="16"
                    textAlign="center"
                  >
                    <Spinner size="lg" color="brand.500" />
                  </Td>
                </Tr>
              ) : !hasData ? (
                <Tr>
                  <Td
                    colSpan={columns.length + (editVisible || deleteVisible ? 1 : 0)}
                    py="16"
                    textAlign="center"
                  >
                    <Text color="gray.500" fontSize="sm">
                      {emptyMessage}
                    </Text>
                  </Td>
                </Tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <Tr
                    key={row.id}
                    _hover={{ bg: hoverBg }}
                    onClick={() => onRow(row.original)}
                    cursor="pointer"
                    transition="background 0.15s"
                    borderBottom="1px"
                    borderColor={borderColor}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <Td
                        key={cell.id}
                        py="4"
                        px="6"
                        fontSize="sm"
                        color="gray.700"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Td>
                    ))}
                    <Condition condition={editVisible || deleteVisible}>
                      <Td py="4" px="6" textAlign="right">
                        <HStack spacing="2" justify="flex-end">
                          <Condition condition={editVisible}>
                            <IconButton
                              size="sm"
                              variant="ghost"
                              colorScheme="gray"
                              icon={<FiEdit2 />}
                              aria-label="Düzenle"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(row.original);
                              }}
                              _hover={{ bg: 'blue.50', color: 'blue.500' }}
                            />
                          </Condition>
                          <Condition condition={deleteVisible}>
                            <IconButton
                              size="sm"
                              variant="ghost"
                              colorScheme="gray"
                              icon={<FiTrash2 />}
                              aria-label="Sil"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(row.original);
                                deleteModal.open();
                              }}
                              _hover={{ bg: 'red.50', color: 'red.500' }}
                            />
                          </Condition>
                        </HStack>
                      </Td>
                    </Condition>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>

        {/* Pagination */}
        <Flex
          p="4"
          borderTop="1px"
          borderColor={borderColor}
          justify="space-between"
          align="center"
          flexWrap="wrap"
          gap="3"
        >
          <HStack spacing="4">
            <Text fontSize="sm" color="gray.500">
              Toplam <Badge colorScheme="brand">{dataQuery.data?.totalResults || 0}</Badge> sonuç
            </Text>
            <Select
              size="sm"
              w="auto"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              borderRadius="lg"
            >
              {[10, 20, 30, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} / sayfa
                </option>
              ))}
            </Select>
          </HStack>

          <HStack spacing="2">
            <ButtonGroup size="sm" variant="ghost" spacing="1">
              <IconButton
                icon={<FiChevronsLeft />}
                onClick={() => table.firstPage()}
                isDisabled={!table.getCanPreviousPage()}
                aria-label="İlk sayfa"
              />
              <IconButton
                icon={<FiChevronLeft />}
                onClick={() => table.previousPage()}
                isDisabled={!table.getCanPreviousPage()}
                aria-label="Önceki sayfa"
              />
            </ButtonGroup>

            <HStack spacing="1" px="2">
              <Text fontSize="sm" color="gray.600">
                Sayfa
              </Text>
              <Input
                size="sm"
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0;
                  table.setPageIndex(page);
                }}
                w="50px"
                textAlign="center"
                borderRadius="lg"
              />
              <Text fontSize="sm" color="gray.600">
                / {totalPages || 1}
              </Text>
            </HStack>

            <ButtonGroup size="sm" variant="ghost" spacing="1">
              <IconButton
                icon={<FiChevronRight />}
                onClick={() => table.nextPage()}
                isDisabled={!table.getCanNextPage()}
                aria-label="Sonraki sayfa"
              />
              <IconButton
                icon={<FiChevronsRight />}
                onClick={() => table.lastPage()}
                isDisabled={!table.getCanNextPage()}
                aria-label="Son sayfa"
              />
            </ButtonGroup>

            {dataQuery.isFetching && <Spinner size="sm" color="brand.500" />}
          </HStack>
        </Flex>
      </Box>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        closeOnOverlayClick
        closeOnEsc
        leastDestructiveRef={cancelRef}
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl" mx="4">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" pb="2">
              Silme Onayı
            </AlertDialogHeader>
            <AlertDialogBody color="gray.600">
              Bu öğeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogBody>
            <AlertDialogFooter pt="4">
              <Button
                ref={cancelRef}
                onClick={deleteModal.close}
                variant="ghost"
              >
                Vazgeç
              </Button>
              <Button
                colorScheme="red"
                onClick={onDeletePress}
                ml={3}
                isLoading={isDeleting}
                disabled={isDeleting}
              >
                Sil
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default DataTable;

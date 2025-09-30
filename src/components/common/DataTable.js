import React, {useRef, useState} from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {useQuery} from '@tanstack/react-query';
import {FaTrashAlt} from 'react-icons/fa';
import {
  MdOutlineEdit,
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from 'react-icons/md';
import {GrFormPrevious, GrFormNext} from 'react-icons/gr';
import useDisclosure from '../../hooks/useDisclosure';
import {
  Table,
  Th,
  Thead,
  Tr,
  Tbody,
  Td,
  Box,
  useColorModeValue,
  Icon,
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
  chakra,
} from '@chakra-ui/react';
import Condition from './Condition';
import {FiSearch} from 'react-icons/fi';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import {GoTriangleDown, GoTriangleUp} from 'react-icons/go';

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
}) => {
  const {value, setValue, debouncedValue} = useDebouncedValue('');
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const cancelRef = useRef();
  const bg = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('gray.700', 'gray.200');
  const [selectedItem, setSelectedItem] = React.useState(null);
  const deleteModal = useDisclosure();
  const [pagination, setPagination] = React.useState({
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
        ...(queryEnabled ? {query: debouncedValue} : {}),
      }),
    // placeholderData: false, // don't have 0 rows flash while changing pages/loading next page
  });

  const table = useReactTable({
    data: dataQuery.data?.results ?? [],
    columns,
    pageCount: dataQuery.data?.totalPages ?? -1, //you can now pass in `rowCount` instead of pageCount and `pageCount` will be calculated internally (new in v8.13.0)
    // rowCount: dataQuery.data?.totalResults, // new in v8.13.0 - alternatively, just pass in `pageCount` directly
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, //we're doing manual "server-side" pagination
    // getPaginationRowModel: getPaginationRowModel(), // If only doing manual pagination, you don't need this
    // debugTable: true,
    manualFiltering: true,
    manualSorting: true,
  });

  const onDeletePress = async () => {
    await onDelete(selectedItem);
    deleteModal.close();
    await dataQuery.refetch();
  };

  const toggleSort = header => {
    if (sortBy === header + ':desc') {
      setSortBy(header + ':asc');
    } else if (sortBy === header + ':asc') {
      setSortBy(defaultSortBy);
    } else {
      setSortBy(header + ':desc');
    }
  };

  return (
    <>
      <Box
        backgroundColor={bg}
        overflow={'scroll'}
        color={color}
        borderRadius={'md'}
        display={'flex'}
        flexDirection={'column'}
        boxShadow={shadow ? 'md' : undefined}
        p={'2'}>
        <Condition condition={queryEnabled}>
          <InputGroup borderRadius={'md'} size="md" mb={'2'}>
            <InputLeftElement
              pointerEvents="none"
              children={<FiSearch color="gray.600" />}
            />
            <Input
              type="text"
              placeholder="Ara..."
              width={{base: '100%', md: '50%'}}
              value={value}
              onChange={e => setValue(e.target.value)}
            />
          </InputGroup>
        </Condition>
        <Table>
          <Thead>
            {table.getHeaderGroups().map(headerGroup => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <Th
                      cursor={'pointer'}
                      key={header.id}
                      scope="col"
                      pr={'3'}
                      py={'3'}
                      colSpan={header.colSpan}
                      onClick={() => toggleSort(header.column.id)}>
                      {header.isPlaceholder ? null : (
                        <Box display={'flex'}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <chakra.span pl="4">
                            <Condition
                              condition={sortBy === header.column.id + ':desc'}>
                              <GoTriangleDown aria-label="sorted descending" />
                            </Condition>
                            <Condition
                              condition={sortBy === header.column.id + ':asc'}>
                              <GoTriangleUp aria-label="sorted ascending" />
                            </Condition>
                          </chakra.span>
                        </Box>
                      )}
                    </Th>
                  );
                })}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {table.getRowModel().rows.map(row => {
              return (
                <Tr
                  _hover={{bg: 'gray.100'}}
                  key={row.id}
                  onClick={() => onRow(row.original)}
                  cursor={'pointer'}>
                  {row.getVisibleCells().map(cell => {
                    return (
                      <Td px={'6'} py="4" key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </Td>
                    );
                  })}
                  <Condition condition={editVisible}>
                    <Td>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onEdit(row.original);
                        }}>
                        <Icon as={MdOutlineEdit} />
                      </button>
                    </Td>
                  </Condition>
                  <Condition condition={deleteVisible}>
                    <Td>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedItem(row.original);
                          deleteModal.open();
                        }}>
                        <FaTrashAlt className={'text-md text-red'} />
                      </button>
                    </Td>
                  </Condition>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
        <Box h="2" />
        <Box display={'flex'} alignItems={'center'} gap={'2'} p="2">
          <Button
            borderRadius={'lg'}
            p={'1'}
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}>
            <MdKeyboardDoubleArrowLeft />
          </Button>
          <Button
            borderRadius={'lg'}
            p={'1'}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}>
            <GrFormPrevious />
          </Button>
          <Button
            borderRadius={'lg'}
            p={'1'}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}>
            <GrFormNext />
          </Button>
          <Button
            borderRadius={'lg'}
            p={'1'}
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}>
            <MdKeyboardDoubleArrowRight />
          </Button>
          <Box as={'span'} display={'flex'} alignItems={'center'} gap={'1'}>
            <div>Sayfa</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} /{' '}
              {table.getPageCount().toLocaleString()}
            </strong>
          </Box>
          <Box as={'span'} display={'flex'} alignItems={'center'} gap={'1'}>
            | Sayfaya Git:
            <Input
              type="number"
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={e => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page);
              }}
              w={'12'}
              borderRadius={'lg'}
              px={'1'}
              py={'0.5'}
              className="w-12 rounded border bg-white p-0.5 px-1 dark:bg-boxdark "
            />
          </Box>
          <Box as={'span'} display={'flex'} alignItems={'center'} gap={'1'}>
            Toplam Sonuç: <strong>{dataQuery.data?.totalResults}</strong>
          </Box>
          <select
            className={'rounded bg-white p-0.5 px-1 dark:bg-boxdark '}
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value));
            }}>
            {[10, 20, 30, 40, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Göster {pageSize}
              </option>
            ))}
          </select>
          {dataQuery.isFetching ? <Spinner /> : null}
        </Box>
      </Box>
      <AlertDialog
        closeOnOverlayClick
        closeOnEsc
        leastDestructiveRef={cancelRef}
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Sil
            </AlertDialogHeader>
            <AlertDialogBody>Silmek istediğinize emin misiniz?</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={deleteModal.close}>
                Vazgeç
              </Button>
              <Button
                colorScheme="red"
                onClick={onDeletePress}
                ml={3}
                isLoading={isDeleting}
                disabled={isDeleting}>
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

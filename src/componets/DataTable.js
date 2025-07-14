import {
    Box,
    Button,
    CardContent,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    TextField,
    Toolbar,
    Tooltip,
    Typography
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

// icon
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

// custom component
import MainCard from 'componets/MainCard';

// theme

const DataTable = ({ data, headers, tableTitle, addButton, actions, fileUpload, fontFamily }) => {
    const [rows, setRows] = useState([]);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState(headers?.[0]?.id);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [search, setSearch] = useState('');
    const [searchKeys, setSearchKeys] = useState([]);
    const [selected, setSelected] = React.useState([]);

    // headers
    function EnhancedTableHead({ onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort, selected }) {
        const createSortHandler = (property) => (event) => {
            onRequestSort(event, property);
        };

        return (
            <TableHead>
                <TableRow>
                    {/* <TableCell padding="checkbox" sx={{ pl: 3 }}>
                        <Checkbox
                            color="primary"
                            indeterminate={numSelected > 0 && numSelected < rowCount}
                            checked={rowCount > 0 && numSelected === rowCount}
                            onChange={onSelectAllClick}
                            inputProps={{
                                'aria-label': 'select all desserts'
                            }}
                        />
                    </TableCell> */}
                    {numSelected > 0 && (
                        <TableCell padding="none" colSpan={6}>
                            <EnhancedTableToolbar numSelected={selected?.length} />
                        </TableCell>
                    )}
                    {numSelected <= 0 &&
                        headers.map((headers) => (
                            <TableCell
                                sx={{
                                    background: '#d7ddde'
                                }}
                                key={headers.id}
                                align={headers.align}
                                padding={headers.disablePadding ? 'none' : 'normal'}
                                sortDirection={orderBy === headers.id ? order : false}
                            >
                                <TableSortLabel
                                    active={orderBy === headers.id}
                                    direction={orderBy === headers.id ? order : 'asc'}
                                    onClick={createSortHandler(headers.id)}
                                    style={{ fontWeight: 'bolder', fontFamily: fontFamily }}
                                >
                                    {headers.label}
                                    {orderBy === headers.id ? (
                                        <Box component="span" sx={visuallyHidden}>
                                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                        </Box>
                                    ) : null}
                                </TableSortLabel>
                            </TableCell>
                        ))}
                    {numSelected <= 0 && actions && (
                        <TableCell
                            sortDirection={false}
                            align="center"
                            sx={{ pr: 3, fontWeight: 'bolder', background: '#d7ddde', fontFamily: fontFamily }}
                        >
                            ACTION
                        </TableCell>
                    )}
                </TableRow>
            </TableHead>
        );
    }

    EnhancedTableHead.propTypes = {
        selected: PropTypes.array,
        numSelected: PropTypes.number.isRequired,
        onRequestSort: PropTypes.func.isRequired,
        onSelectAllClick: PropTypes.func.isRequired,
        order: PropTypes.oneOf(['asc', 'desc']).isRequired,
        orderBy: PropTypes.string.isRequired,
        rowCount: PropTypes.number.isRequired
    };

    // ==============================|| TABLE HEADER TOOLBAR ||============================== //

    const EnhancedTableToolbar = ({ numSelected }) => (
        <Toolbar
            sx={{
                p: 0,
                pl: 1,
                pr: 1,
                ...(numSelected > 0 && {
                    color: (theme) => theme.palette.secondary.main
                })
            }}
        >
            {numSelected > 0 ? (
                <Typography color="inherit" variant="h4">
                    {numSelected} Selected
                </Typography>
            ) : (
                <Typography variant="h6" id="tableTitle">
                    Nutrition
                </Typography>
            )}
            <Box sx={{ flexGrow: 1 }} />
            {numSelected > 0 && (
                <Tooltip title="Delete">
                    <IconButton size="large">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Toolbar>
    );

    // search

    const getValueByPath = (obj, path) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const handleSearch = (event) => {
        const newString = event?.target.value;
        setSearch(newString || '');

        if (newString) {
            const newRows = data.filter((row) =>
                searchKeys.some((key) => (getValueByPath(row, key) + '').toLowerCase().includes(newString.toLowerCase()))
            );
            setRows(newRows);
        } else {
            setRows(data);
        }
    };

    // Sorting Functions
    const descendingComparator = (a, b, orderBy) => {
        if (b[orderBy] < a[orderBy]) {
            return -1;
        }
        if (b[orderBy] > a[orderBy]) {
            return 1;
        }
        return 0;
    };

    const getComparator = (order, orderBy) =>
        order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);

    const stableSort = (array, comparator) => {
        const stabilizedThis = array.map((el, index) => [el, index]);
        stabilizedThis.sort((a, b) => {
            const order = comparator(a[0], b[0]);
            if (order !== 0) return order;
            return a[1] - b[1];
        });
        return stabilizedThis.map((el) => el[0]);
    };

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // select

    // const handleClick = (event, name) => {
    //     console.log(selected);
    //     const selectedIndex = selected.indexOf(name);
    //     let newSelected = [];

    //     if (selectedIndex === -1) {
    //         newSelected = newSelected.concat(selected, name);
    //     } else if (selectedIndex === 0) {
    //         newSelected = newSelected.concat(selected.slice(1));
    //     } else if (selectedIndex === selected.length - 1) {
    //         newSelected = newSelected.concat(selected.slice(0, -1));
    //     } else if (selectedIndex > 0) {
    //         newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    //     }

    //     setSelected(newSelected);
    // };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            if (selected?.length > 0) {
                setSelected([]);
            } else {
                const newSelectedId = rows.map((n) => n._id);
                setSelected(newSelectedId);
            }
            return;
        }
        setSelected([]);
    };

    // const isSelected = (name) => selected.indexOf(name) !== -1;

    React.useEffect(() => {
        const searchKeys = headers.map((head) => head.id);
        setSearchKeys(searchKeys);
    }, [headers]);

    React.useEffect(() => {
        if (data?.length) {
            setRows(data);
        } else {
            setRows([]);
        }
    }, [data]);

    return (
        <MainCard
            border={true}
            title={
                <Typography variant="h5" color="white" fontWeight="bold" fontFamily={fontFamily}>
                    {tableTitle}
                </Typography>
            }
        >
            <CardContent style={{ paddingLeft: '0px' }}>
                <Grid container alignItems="center" justifyContent="space-between">
                    {/* Search Field */}
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                                sx: {
                                    '&::placeholder': {
                                        fontFamily: fontFamily,
                                        fontSize: '16px'
                                    }
                                }
                            }}
                            inputProps={{
                                style: {
                                    fontFamily: fontFamily
                                }
                            }}
                            onChange={handleSearch}
                            placeholder="Search"
                            value={search}
                            size="small"
                            fullWidth
                        />
                    </Grid>
                    {/* Add Button */}
                    <Grid item xs="auto">
                        {addButton && (
                            <Button
                                color="primary"
                                variant="contained"
                                onClick={addButton}
                                style={{ fontFamily: fontFamily, marginRight: '5px' }}
                            >
                                Add
                            </Button>
                        )}
                        {fileUpload && (
                            <Button color="primary" variant="contained" onClick={fileUpload} style={{ fontFamily: fontFamily }}>
                                Upload Excel
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </CardContent>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
                    <EnhancedTableHead
                        numSelected={selected?.length}
                        order={order}
                        orderBy={orderBy}
                        onSelectAllClick={handleSelectAllClick}
                        onRequestSort={handleRequestSort}
                        rowCount={rows?.length}
                        selected={selected}
                    />
                    <TableBody>
                        {rows?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={headers?.length + 1} align="center">
                                    <Typography variant="subtitle1" fontFamily={fontFamily}>
                                        NO DATA AVAILABLE IN TABLE
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            stableSort(rows, getComparator(order, orderBy))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => {
                                    // const isItemSelected = isSelected(row?._id);
                                    // const labelId = `enhanced-table-checkbox-${index}`;
                                    return (
                                        <TableRow hover role="checkbox" tabIndex={-1} key={index}>
                                            {/* <TableCell
                                                padding="checkbox"
                                                sx={{ pl: 3, padding: '3px' }}
                                                onClick={(event) => handleClick(event, row._id)}
                                                align="center"
                                            >
                                                <Checkbox
                                                    color="primary"
                                                    checked={isItemSelected}
                                                    inputProps={{
                                                        'aria-labelledby': labelId
                                                    }}
                                                />
                                            </TableCell> */}
                                            {headers.map((header) => (
                                                <TableCell
                                                    key={header.id}
                                                    align={header.align}
                                                    sx={{
                                                        padding: '10px 16px',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500,
                                                        color: 'text.primary',
                                                        whiteSpace: 'nowrap',
                                                        fontFamily: { fontFamily }
                                                    }}
                                                >
                                                    {header.render ? header.render(row) : row[header.id]}
                                                </TableCell>
                                            ))}
                                            <TableCell
                                                align="center"
                                                sx={{ padding: '10px 16px', display: 'flex', justifyContent: 'center' }}
                                            >
                                                <Stack direction="row" alignItems="center">
                                                    {actions?.map((action, actionIndex) => (
                                                        <Tooltip key={actionIndex} title={action.title}>
                                                            {action.property && action.isSwitch ? (
                                                                <Switch
                                                                    checked={row[action.property]}
                                                                    onChange={() => action.handler(row)}
                                                                    size="small"
                                                                />
                                                            ) : (
                                                                <Button
                                                                    onClick={() => action.handler(row)}
                                                                    size="small"
                                                                    sx={{
                                                                        minWidth: 32,
                                                                        color: action.color,
                                                                        '&:hover': {
                                                                            backgroundColor: 'transparent',
                                                                            color: action.color
                                                                        }
                                                                    }}
                                                                >
                                                                    {action.icon}
                                                                </Button>
                                                            )}
                                                        </Tooltip>
                                                    ))}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={rows?.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                        fontFamily: fontFamily,
                        fontSize: '14px'
                    },
                    '& .MuiTablePagination-select': {
                        fontFamily: fontFamily
                    },
                    '& .MuiTablePagination-actions button': {
                        fontFamily: fontFamily
                    }
                }}
            />
        </MainCard>
    );
};

export default DataTable;

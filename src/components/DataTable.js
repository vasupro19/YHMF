import { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Card,
    IconButton,
    InputAdornment,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    TextField,
    Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import EmptyState from './EmptyState';

const valueOf = (col, row) => (col.value ? col.value(row) : row[col.id]);

const compare = (a, b) => {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
};

const toCsv = (columns, rows) => {
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = columns.map((c) => cell(c.label)).join(',');
    const body = rows.map((r) => columns.map((c) => cell(valueOf(c, r))).join(',')).join('\n');
    return `${head}\n${body}`;
};

/**
 * columns: [{ id, label, value?(row) -> sortable/searchable/exportable value, render?(row) -> node, align?, sortable? }]
 * actions: [{ title, icon, onClick(row), hidden?(row) }]
 */
const DataTable = ({ columns, rows, loading, actions = [], onAdd, addLabel = 'Add new', searchPlaceholder = 'Search…', toolbarExtra, emptyText, exportName, rowKey = 'id', onRowClick }) => {
    const [query, setQuery] = useState('');
    const [orderBy, setOrderBy] = useState(null);
    const [order, setOrder] = useState('asc');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = rows || [];
        if (q) list = list.filter((row) => columns.some((c) => String(valueOf(c, row) ?? '').toLowerCase().includes(q)));
        if (orderBy) {
            const col = columns.find((c) => c.id === orderBy);
            list = [...list].sort((a, b) => (order === 'asc' ? 1 : -1) * compare(valueOf(col, a), valueOf(col, b)));
        }
        return list;
    }, [rows, query, orderBy, order, columns]);

    const maxPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
    const safePage = Math.min(page, maxPage);
    const visible = filtered.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage);

    const sortBy = (id) => {
        setOrder(orderBy === id && order === 'asc' ? 'desc' : 'asc');
        setOrderBy(id);
    };

    const exportCsv = () => {
        const blob = new Blob([toCsv(columns, filtered)], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${exportName || 'export'}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <Card>
            <Box sx={{ p: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(0);
                    }}
                    placeholder={searchPlaceholder}
                    inputProps={{ 'aria-label': 'Search' }}
                    sx={{ maxWidth: 320, flex: '1 1 220px' }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        )
                    }}
                />
                {toolbarExtra}
                <Box sx={{ flexGrow: 1 }} />
                {exportName && (
                    <Tooltip title="Download as CSV">
                        <span>
                            <Button variant="outlined" color="inherit" startIcon={<DownloadIcon />} onClick={exportCsv} disabled={!filtered.length}>
                                Export
                            </Button>
                        </span>
                    </Tooltip>
                )}
                {onAdd && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
                        {addLabel}
                    </Button>
                )}
            </Box>

            <TableContainer>
                <Table size="medium">
                    <TableHead>
                        <TableRow>
                            {columns.map((c) => (
                                <TableCell key={c.id} align={c.align || 'left'} sortDirection={orderBy === c.id ? order : false}>
                                    {c.sortable === false ? (
                                        c.label
                                    ) : (
                                        <TableSortLabel active={orderBy === c.id} direction={orderBy === c.id ? order : 'asc'} onClick={() => sortBy(c.id)}>
                                            {c.label}
                                        </TableSortLabel>
                                    )}
                                </TableCell>
                            ))}
                            {actions.length > 0 && <TableCell align="right">Actions</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading &&
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    {[...columns, ...(actions.length ? [{}] : [])].map((_c, j) => (
                                        <TableCell key={j}>
                                            <Skeleton />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        {!loading &&
                            visible.map((row) => (
                                <TableRow key={row[rowKey]} hover onClick={onRowClick ? () => onRowClick(row) : undefined} sx={onRowClick ? { cursor: 'pointer' } : undefined}>
                                    {columns.map((c) => (
                                        <TableCell key={c.id} align={c.align || 'left'}>
                                            {c.render ? c.render(row) : (valueOf(c, row) ?? '-')}
                                        </TableCell>
                                    ))}
                                    {actions.length > 0 && (
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                            {actions
                                                .filter((a) => !a.hidden?.(row))
                                                .map((a) => (
                                                    <Tooltip key={a.title} title={typeof a.title === 'function' ? a.title(row) : a.title}>
                                                        <IconButton size="small" aria-label={typeof a.title === 'function' ? a.title(row) : a.title} onClick={(e) => { e.stopPropagation(); a.onClick(row); }}>
                                                            {typeof a.icon === 'function' ? a.icon(row) : a.icon}
                                                        </IconButton>
                                                    </Tooltip>
                                                ))}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {!loading && filtered.length === 0 && (
                <EmptyState
                    icon={<InboxOutlinedIcon fontSize="large" />}
                    title={query ? 'No matches' : 'Nothing here yet'}
                    text={query ? `No results for "${query}".` : emptyText || 'Records you add will show up here.'}
                />
            )}

            {filtered.length > 0 && (
                <TablePagination
                    component="div"
                    count={filtered.length}
                    page={safePage}
                    onPageChange={(_, p) => setPage(p)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[10, 25, 50]}
                    labelRowsPerPage="Rows"
                />
            )}
        </Card>
    );
};

export default DataTable;

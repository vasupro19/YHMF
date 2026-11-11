import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, IconButton, InputAdornment, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, TextField, Tooltip, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import CloseIcon from '@mui/icons-material/Close';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import EmptyState from './EmptyState';
import { T } from './Theme';

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
 * columns: [{ id, label, value?(row) -> sortable/searchable/exportable value, render?(row) -> node, align?, sortable?, width? }]
 * actions: [{ title, icon, onClick(row), hidden?(row) }]
 * header: optional node shown above the toolbar inside the panel (e.g. view tabs)
 */
const DataTable = ({ columns, rows, loading, actions = [], onAdd, addLabel = 'Add new', searchPlaceholder = 'Search…', toolbarExtra, emptyText, exportName, rowKey = 'id', onRowClick, initialQuery = '', header, defaultRowsPerPage = 25 }) => {
    const [query, setQuery] = useState(initialQuery);
    const [orderBy, setOrderBy] = useState(null);
    const [order, setOrder] = useState('asc');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

    useEffect(() => {
        setQuery(initialQuery);
        setPage(0);
    }, [initialQuery]);

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
            {header && <Box sx={{ px: 1.5, borderBottom: `1px solid ${T.line}` }}>{header}</Box>}
            <Box sx={{ px: 1.5, py: 1.25, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', borderBottom: `1px solid ${T.line}` }}>
                <TextField
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(0);
                    }}
                    placeholder={searchPlaceholder}
                    inputProps={{ 'aria-label': 'Search' }}
                    sx={{ maxWidth: 300, flex: '1 1 220px', '& .MuiOutlinedInput-root': { height: 32 } }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 18, color: T.ink3 }} />
                            </InputAdornment>
                        ),
                        endAdornment: query ? (
                            <InputAdornment position="end">
                                <IconButton size="small" aria-label="Clear search" onClick={() => setQuery('')}>
                                    <CloseIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </InputAdornment>
                        ) : null
                    }}
                />
                {toolbarExtra}
                <Box sx={{ flexGrow: 1 }} />
                {!loading && (
                    <Typography sx={{ fontSize: 12.5, color: T.ink3, mr: 0.5 }} className="num">
                        {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
                    </Typography>
                )}
                {exportName && (
                    <Tooltip title="Download as CSV">
                        <span>
                            <Button variant="outlined" color="inherit" startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv} disabled={!filtered.length}>
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
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {columns.map((c) => (
                                <TableCell key={c.id} align={c.align || 'left'} sortDirection={orderBy === c.id ? order : false} sx={{ width: c.width }}>
                                    {c.sortable === false ? (
                                        c.label
                                    ) : (
                                        <TableSortLabel active={orderBy === c.id} direction={orderBy === c.id ? order : 'asc'} onClick={() => sortBy(c.id)}>
                                            {c.label}
                                        </TableSortLabel>
                                    )}
                                </TableCell>
                            ))}
                            {actions.length > 0 && <TableCell align="right" sx={{ width: 1 }} />}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading &&
                            [...Array(6)].map((_, i) => (
                                <TableRow key={i}>
                                    {[...columns, ...(actions.length ? [{}] : [])].map((_c, j) => (
                                        <TableCell key={j} sx={{ height: 40 }}>
                                            <Skeleton width={j === 0 ? 80 : '70%'} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        {!loading &&
                            visible.map((row) => (
                                <TableRow key={row[rowKey]} hover onClick={onRowClick ? () => onRowClick(row) : undefined} sx={{ cursor: onRowClick ? 'pointer' : undefined, '& td': { height: 40 } }}>
                                    {columns.map((c) => (
                                        <TableCell key={c.id} align={c.align || 'left'}>
                                            {c.render ? c.render(row) : (valueOf(c, row) ?? <Box component="span" sx={{ color: T.ink3 }}>—</Box>)}
                                        </TableCell>
                                    ))}
                                    {actions.length > 0 && (
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', py: 0 }}>
                                            {actions
                                                .filter((a) => !a.hidden?.(row))
                                                .map((a) => {
                                                    const title = typeof a.title === 'function' ? a.title(row) : a.title;
                                                    return (
                                                        <Tooltip key={title} title={title}>
                                                            <IconButton size="small" aria-label={title} onClick={(e) => { e.stopPropagation(); a.onClick(row); }} sx={{ color: T.ink3, '&:hover': { color: T.ink, bgcolor: 'rgba(28,26,25,0.06)' }, '& svg': { fontSize: 18 } }}>
                                                                {typeof a.icon === 'function' ? a.icon(row) : a.icon}
                                                            </IconButton>
                                                        </Tooltip>
                                                    );
                                                })}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {!loading && filtered.length === 0 && (
                <EmptyState
                    icon={<InboxOutlinedIcon />}
                    title={query ? 'No matching records' : 'No records yet'}
                    text={query ? `Nothing matches "${query}". Check the spelling or clear the search.` : emptyText || 'Records you add will show up here.'}
                    action={query ? <Button variant="outlined" color="inherit" onClick={() => setQuery('')}>Clear search</Button> : null}
                />
            )}

            {filtered.length > rowsPerPage || (filtered.length > 0 && rowsPerPage !== defaultRowsPerPage) ? (
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
                    rowsPerPageOptions={[25, 50, 100]}
                    labelRowsPerPage="Rows per page"
                />
            ) : null}
        </Card>
    );
};

export default DataTable;

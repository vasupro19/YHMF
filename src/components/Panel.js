import { Box, Card, Typography } from '@mui/material';
import { T } from './Theme';

// flat bordered section with a title bar; the building block of every screen
const Panel = ({ title, subtitle, action, children, padded = true, sx, bodySx }) => (
    <Card sx={{ display: 'flex', flexDirection: 'column', ...sx }}>
        {(title || action) && (
            <Box sx={{ px: 2, minHeight: 46, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, borderBottom: `1px solid ${T.line}` }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography component="h2" sx={{ fontSize: 13.5, fontWeight: 650 }}>{title}</Typography>
                    {subtitle && <Typography sx={{ fontSize: 12, color: T.ink3 }}>{subtitle}</Typography>}
                </Box>
                {action && <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>{action}</Box>}
            </Box>
        )}
        <Box sx={{ flex: 1, ...(padded ? { p: 2 } : {}), ...bodySx }}>{children}</Box>
    </Card>
);

// a horizontal strip of key figures separated by thin rules
export const KpiStrip = ({ items, loading }) => (
    <Card sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: `repeat(${items.length}, 1fr)` } }}>
        {items.map((k, i) => {
            return (
                <Box
                    key={k.label}
                    role={k.onClick ? 'button' : undefined}
                    tabIndex={k.onClick ? 0 : undefined}
                    onKeyDown={k.onClick ? (e) => e.key === 'Enter' && k.onClick() : undefined}
                    onClick={k.onClick}
                    sx={{
                        px: 2,
                        py: 1.75,
                        borderLeft: { lg: i ? `1px solid ${T.line}` : 0 },
                        borderTop: { xs: i > 1 ? `1px solid ${T.line}` : 0, sm: i > 2 ? `1px solid ${T.line}` : 0, lg: 0 },
                        cursor: k.onClick ? 'pointer' : 'default',
                        '&:hover': k.onClick ? { bgcolor: T.subtle } : undefined
                    }}
                >
                    <Typography sx={{ fontSize: 12, color: T.ink2, fontWeight: 500 }}>{k.label}</Typography>
                    <Typography className="num" sx={{ fontSize: 24, fontWeight: 650, letterSpacing: '-0.02em', lineHeight: 1.25, mt: 0.25, color: k.color || T.ink }}>
                        {loading ? '–' : k.value}
                    </Typography>
                    {k.sub && <Typography sx={{ fontSize: 12, color: T.ink3 }}>{loading ? '' : k.sub}</Typography>}
                </Box>
            );
        })}
    </Card>
);

export default Panel;

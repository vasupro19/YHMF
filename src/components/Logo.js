import { Box, Typography } from '@mui/material';
import { T } from './Theme';

// The YHM mark: a solid "Y" standing on a brass threshold line, inside a maroon tile.
// tone="inverse" draws a white tile with a maroon Y, for use on maroon backgrounds.
export const LogoMark = ({ size = 32, tone = 'default' }) => {
    const tile = tone === 'inverse' ? '#fff' : T.brand;
    const glyph = tone === 'inverse' ? T.brand : '#fff';
    return (
        <Box component="svg" viewBox="0 0 40 40" width={size} height={size} aria-hidden sx={{ flexShrink: 0, display: 'block' }}>
            <rect width="40" height="40" rx="8" fill={tile} />
            <path d="M9.5 9h5.1l5.4 7.9L25.4 9h5.1l-8.1 11.6V29h-4.8v-8.4z" fill={glyph} />
            <rect x="12" y="31.6" width="16" height="2" rx="1" fill="#C9A35A" />
        </Box>
    );
};

// mark + wordmark. On dark/maroon backgrounds pass tone="inverse".
const Logo = ({ size = 32, showText = false, tone = 'default', sub = 'Hotel Manager' }) => {
    if (!showText) return <LogoMark size={size} tone={tone} />;
    const inverse = tone === 'inverse';
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            <LogoMark size={size} tone={tone} />
            <Box sx={{ lineHeight: 1, minWidth: 0 }}>
                <Typography component="div" sx={{ fontWeight: 750, fontSize: size * 0.56, letterSpacing: '0.06em', lineHeight: 1, color: inverse ? '#fff' : T.ink }}>
                    YHM
                </Typography>
                {sub && (
                    <Typography component="div" sx={{ fontSize: Math.max(9.5, size * 0.3), fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', mt: 0.4, color: inverse ? 'rgba(255,255,255,.7)' : T.ink3, whiteSpace: 'nowrap' }}>
                        {sub}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default Logo;

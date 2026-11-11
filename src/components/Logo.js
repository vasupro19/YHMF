import { Box, Typography } from '@mui/material';
import { T } from './Theme';

// The YHM mark: a hotel doorway (arch) with a "Y" inside, standing on a brass threshold.
// tone="inverse" draws a white tile with a maroon doorway, for use on maroon backgrounds.
export const LogoMark = ({ size = 32, tone = 'default' }) => {
    const tile = tone === 'inverse' ? '#fff' : T.brand;
    const door = tone === 'inverse' ? T.brand : '#fff';
    const glyph = tone === 'inverse' ? '#fff' : T.brand;
    return (
        <Box component="svg" viewBox="0 0 40 40" width={size} height={size} aria-hidden sx={{ flexShrink: 0, display: 'block' }}>
            <rect width="40" height="40" rx="9" fill={tile} />
            <path d="M10.5 33V18.5a9.5 9.5 0 0 1 19 0V33z" fill={door} />
            <path d="M15.6 15.2 20 21l4.4-5.8M20 21v8.6" stroke={glyph} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <rect x="7.5" y="33" width="25" height="2.2" rx="1.1" fill="#C9A35A" />
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

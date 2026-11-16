// Opens a WhatsApp chat with the message typed in, ready to send.
// On a computer it goes straight to WhatsApp Web (re-using one tab); on a phone it opens the WhatsApp app.
const isPhone = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');

export const whatsappUrl = (phone, text) => {
    const digits = String(phone || '').replace(/\D/g, '');
    const t = encodeURIComponent(text || '');
    return isPhone() ? `https://wa.me/${digits}?text=${t}` : `https://web.whatsapp.com/send?phone=${digits}&text=${t}`;
};

export const openWhatsApp = (phone, text) => window.open(whatsappUrl(phone, text), 'yhm-whatsapp');

// call while handling the click (before any await) so the browser doesn't block the new tab,
// then point it at the chat once the message is ready
export const reserveWhatsAppTab = () => {
    const w = window.open('', 'yhm-whatsapp');
    return {
        go: (phone, text) => {
            if (w && !w.closed) w.location.href = whatsappUrl(phone, text);
            else openWhatsApp(phone, text);
        },
        cancel: () => {
            try {
                if (w && !w.closed && w.location.href === 'about:blank') w.close();
            } catch (e) {
                /* tab already moved to WhatsApp */
            }
        }
    };
};

// phone photos are often 4–12 MB: shrink to a sharp, readable JPEG before uploading
export const shrinkPhoto = (file, max = 1800, quality = 0.85) =>
    new Promise((resolve) => {
        if (!file || !/^image\//.test(file.type)) return resolve(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => resolve(blob ? new File([blob], 'id.jpg', { type: 'image/jpeg' }) : file), 'image/jpeg', quality);
        };
        img.onerror = () => resolve(file);
        img.src = URL.createObjectURL(file);
    });

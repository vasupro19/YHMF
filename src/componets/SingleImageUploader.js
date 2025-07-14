import { Box, Button } from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

const SingleImageUploader = ({ name, value, onChange, fontFamily }) => {
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onloadend = () => {
            const base64 = reader.result;
            setPreview(base64);
            onChange(name, base64);
        };

        if (file) reader.readAsDataURL(file);
    };

    useEffect(() => {
        if (value) {
            setPreview(value);
        }
    }, [value]);

    return (
        <Box>
            <Button variant="outlined" component="label" sx={{ fontFamily }}>
                Upload Image
                <input hidden accept="image/*" type="file" onChange={handleFileChange} />
            </Button>

            {preview && (
                <Box mt={2}>
                    <img
                        src={preview}
                        alt="Uploaded Preview"
                        style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: 6,
                            border: '1px solid #ccc'
                        }}
                    />
                </Box>
            )}
        </Box>
    );
};

SingleImageUploader.propTypes = {
    name: PropTypes.string.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    fontFamily: PropTypes.string
};

export default SingleImageUploader;

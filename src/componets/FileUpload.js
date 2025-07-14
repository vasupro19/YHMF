import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { useState } from 'react';

const FileUpload = ({ handleSubmit, fontFamily, onClose }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && (file.type === 'text/csv' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            setSelectedFile(file);
            setMessage('');
        } else {
            setMessage('Please upload a valid CSV or Excel file.');
            setSelectedFile(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setMessage('No file selected.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            setUploading(true);
            handleSubmit(formData);
        } catch (error) {
            setMessage('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box
            sx={{
                p: 4,
                textAlign: 'center',
                position: 'relative'
            }}
        >
            {/* Cross button */}
            {onClose && (
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 1,
                        color: 'grey.600'
                    }}
                    aria-label="close"
                >
                    <CloseIcon />
                </IconButton>
            )}

            <Typography variant="h6" gutterBottom fontFamily={fontFamily} color={'primary.main'} fontWeight={'bolder'}>
                Upload CSV or Excel File
            </Typography>

            <Box sx={{ mb: 2 }}>
                <input
                    type="file"
                    accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    style={{ display: 'none' }}
                    id="file-upload"
                    onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                    <Button variant="outlined" component="span" sx={{ fontFamily: fontFamily }}>
                        Choose File
                    </Button>
                </label>
            </Box>

            {selectedFile && <Typography sx={{ mb: 2, wordBreak: 'break-word' }}>{selectedFile.name}</Typography>}

            <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                sx={{ mb: 2, minWidth: 120, fontFamily: fontFamily }}
            >
                {uploading ? 'Uploading...' : 'Upload'}
            </Button>

            {message && (
                <Typography sx={{ mt: 1 }} color="error">
                    {message}
                </Typography>
            )}
        </Box>
    );
};

export default FileUpload;

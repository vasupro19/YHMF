import { Button, Grid, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import useSnackbarAlert from 'customHook/alert';
import React, { useRef, useState } from 'react';

// icons
import ImageIcon from '@mui/icons-material/Image';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

// apis
import { deleteFile, getFileLink, uploadFile } from 'api/fileUploadAndDelete/fileUploadAndDeleteApi';

const fileTableHeader = [{ link: '' }];

const MultipleImageUploader = ({ attachments, handleFileTable, preview, documentType, fontFamily }) => {
    const { openTostar, SnackbarComponent } = useSnackbarAlert();
    const fileInputRef = useRef(null);

    const [selectedRowIndex, setSelectedRowIndex] = useState(null);
    const [inputRowDetail, setInputRowDetail] = useState(fileTableHeader);
    const [fileTableDetail, setFileTableDetail] = useState([]);
    const [fileDataInString, setFileDataInString] = useState('');

    const handlePreviewAttachment = async (fileName) => {
        try {
            console.log(fileName);
            const response = await getFileLink(fileName);
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                window.open(response.url, '_blank');
            }
        } catch (error) {
            console.log(error);
        }
    };

    // ======================== File Upload Table =====================================

    const convertBase64 = (file) =>
        new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => resolve(fileReader.result);
            fileReader.onerror = (error) => reject(error);
        });

    const clearFileInput = () => {
        const inputElement = fileInputRef.current;
        if (inputElement) {
            inputElement.value = '';
        }
    };

    const handleInputChangeOfFileInput = async (e, index) => {
        const { name, value } = e.target;
        if (name === 'link') {
            const file = e.target.files[0];
            const pdfString = await convertBase64(file);
            setFileDataInString(pdfString);
            const updatedInputRowDetail = [...inputRowDetail];
            updatedInputRowDetail[index] = { ...updatedInputRowDetail[index], [name]: value };
            const currentInputRowDetail = updatedInputRowDetail[index];
            updatedInputRowDetail[index] = {
                ...currentInputRowDetail
            };
            setInputRowDetail(updatedInputRowDetail);
        }
    };

    const handleAddRowInFileTable = async () => {
        if (inputRowDetail[0].link) {
            if (selectedRowIndex !== null) {
                // update
                const updatedTableDetail = [...fileTableDetail];
                updatedTableDetail[selectedRowIndex] = { ...inputRowDetail[0] };
                setFileTableDetail(updatedTableDetail);
                setSelectedRowIndex(null);
            } else {
                // add
                const data = {
                    file: fileDataInString,
                    documentName: documentType
                };
                const response = await uploadFile(data);
                if (typeof response === 'string') {
                    openTostar(response, 'error');
                } else {
                    inputRowDetail[0].link = response.data.data;
                    openTostar(response.data.message, 'success');
                    setFileTableDetail((prevDetail) => [...prevDetail, inputRowDetail[0]]);
                }
                clearFileInput();
            }
            setInputRowDetail(fileTableHeader);
        } else {
            openTostar('Field Should Not Be Empty Of Attachment Table', 'error');
        }
    };

    const handleDeleteRowFileTable = async (index, fileName) => {
        if (!preview) {
            const response = await deleteFile(fileName);
            if (typeof response === 'string') {
                openTostar(response, 'error');
            } else {
                openTostar(response.data.message, 'success');
                setFileTableDetail((prevDimensions) => prevDimensions.filter((_, i) => i !== index));
            }
        } else {
            openTostar('This is preview mode, You can not delete the file', 'error');
        }
    };

    // =============================== End ==================================================

    React.useEffect(() => {
        if (attachments?.length) {
            setFileTableDetail(attachments);
        }
    }, [attachments]);

    React.useEffect(() => {
        handleFileTable(fileTableDetail);
    }, [fileTableDetail]);

    return (
        <Grid container>
            <SnackbarComponent />
            <Grid item xs={12}>
                <TableContainer sx={{ borderRadius: '5px' }}>
                    <Table
                        sx={{
                            borderRadius: '5px',
                            background: '#f8fafd',
                            '& td, & th': {
                                padding: '8px 12px',
                                fontSize: '0.875rem'
                            },
                            '& .MuiTableCell-head': {
                                backgroundColor: '#43aed8',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                textAlign: 'left',
                                padding: '8px'
                            },
                            '& th': {
                                color: '#2878b6',
                                fontWeight: 600,
                                backgroundColor: '#43aed8'
                            }
                        }}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <Typography sx={{ color: 'white', fontWeight: 'bolder', fontFamily: fontFamily }}>FILE</Typography>
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {fileTableDetail?.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <IconButton
                                            color="primary"
                                            size="small"
                                            aria-label="view"
                                            onClick={() => handlePreviewAttachment(row.link)}
                                            sx={{ p: 0.5 }}
                                        >
                                            <ImageIcon sx={{ fontSize: '1.3rem' }} />
                                        </IconButton>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            color="error"
                                            onClick={() => handleDeleteRowFileTable(index, row.link)}
                                            sx={{ minWidth: 0, p: 0.5 }}
                                        >
                                            <RemoveCircleIcon sx={{ fontSize: '1.3rem' }} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!preview &&
                                inputRowDetail?.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <input
                                                type="file"
                                                name="link"
                                                ref={fileInputRef}
                                                accept="application/*, image/*"
                                                onChange={(e) => handleInputChangeOfFileInput(e, index)}
                                                style={{ width: '100%', fontFamily: fontFamily }} // Full width input
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                onClick={handleAddRowInFileTable}
                                                variant="outlined"
                                                size="small"
                                                sx={{
                                                    textTransform: 'none',
                                                    fontSize: '0.75rem',
                                                    boxShadow: 'none',
                                                    fontFamily: fontFamily
                                                }}
                                            >
                                                Add
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* <Grid item xs={12}>
                    <Stack spacing={2} alignItems="center" sx={{ m: 1 }}>
                        <Button type="button" variant="outlined" color="error" onClick={handleClose} sx={{ fontSize: '0.7rem' }}>
                            CANCEL
                        </Button>
                    </Stack>
                </Grid> */}
            </Grid>
        </Grid>
    );
};

export default MultipleImageUploader;

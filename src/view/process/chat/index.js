import React, { useState } from 'react';
import { Box, List, ListItem, ListItemText, TextField, Typography, Button, Divider, Paper } from '@mui/material';

// constants
import { fontFamily } from 'constant/constant';

const mockUsers = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' }
];

const mockMessages = {
    1: [
        { sender: 'Alice', text: 'Hi there!' },
        { sender: 'You', text: 'Hello!' }
    ],
    2: [{ sender: 'Bob', text: 'Are we meeting?' }],
    3: [{ sender: 'Charlie', text: 'Good morning!' }]
};

const Chat = () => {
    const [selectedUserId, setSelectedUserId] = useState(1);
    const [newMessage, setNewMessage] = useState('');
    const [messages, setMessages] = useState(mockMessages);

    const selectedMessages = messages[selectedUserId] || [];

    const sendMessage = () => {
        if (!newMessage.trim()) return;
        const updatedMessages = {
            ...messages,
            [selectedUserId]: [...selectedMessages, { sender: 'You', text: newMessage }]
        };
        setMessages(updatedMessages);
        setNewMessage('');
    };

    return (
        <Box display="flex" height="80vh">
            {/* Chat List */}
            <Paper elevation={3} sx={{ width: '25%', overflowY: 'auto' }}>
                <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #ccc', fontFamily: fontFamily }}>
                    Chats
                </Typography>
                <List>
                    {mockUsers.map((user) => (
                        <ListItem key={user.id} button selected={user.id === selectedUserId} onClick={() => setSelectedUserId(user.id)}>
                            <ListItemText primary={user.name} />
                        </ListItem>
                    ))}
                </List>
            </Paper>

            {/* Chat Window */}
            <Box flex={1} display="flex" flexDirection="column">
                <Box p={2} borderBottom="1px solid #ccc">
                    <Typography variant="h6" fontFamily={fontFamily}>
                        Chat with {mockUsers.find((u) => u.id === selectedUserId)?.name}
                    </Typography>
                </Box>

                <Box flex={1} p={2} overflow="auto">
                    {selectedMessages.map((msg, index) => (
                        <Box key={index} display="flex" justifyContent={msg.sender === 'You' ? 'flex-end' : 'flex-start'} mb={1}>
                            <Box
                                px={2}
                                py={1}
                                bgcolor={msg.sender === 'You' ? 'primary.main' : 'grey.300'}
                                color={msg.sender === 'You' ? 'white' : 'black'}
                                borderRadius={2}
                                maxWidth="60%"
                            >
                                <Typography variant="body2">
                                    {msg.sender}: {msg.text}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>

                <Divider />

                <Box display="flex" p={2} gap={2}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Type a message"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button variant="contained" onClick={sendMessage} sx={{ fontFamily: fontFamily }}>
                        Send
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default Chat;

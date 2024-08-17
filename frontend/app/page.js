'use client'
import { Box, TextField, Stack, Button } from "@mui/material";
import SendRoundedIcon from '@mui/icons-material/SendRounded';

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState('');

  const fetchContents = async () => {
    const response = await fetch('http://localhost:8080/api/contents');
    const data = await response.json();
    return data;
  };
  
  // Next.js API call to submit content
  const submitContent = async (content) => {
    const response = await fetch('http://localhost:8080/api/contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
  
    if (response.status === 201) {
      console.log('Content submitted successfully');
    } else {
      console.error('Failed to submit content');
    }
  };

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080/ws');
  
    socket.onmessage = (event) => {
      setNotifications((prev) => [...prev, event.data]);
    };
  
    return () => socket.close();
  }, []);
  

  return (
    <Box
      width='100vw'
      height='100vh'
      display='flex'
      flexDirection='column'
      justifyContent='center'
      alignItems='center'
      margin='0'
      padding='0'>
        <Stack direction={'row'} spacing={2}>
          <TextField
            label='Your message'
            fullWidth
            multiline
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            InputLabelProps={{
              style: { top: '-7px', fontSize: '0.75rem'  },
            }}
            sx={{
              height: '30px', 
              '& .MuiInputBase-root': {height: '100%'}
            }}
            onKeyDown={(k) => {
              if (k.key === 'Enter') {
                event.preventDefault();
                // sendMessage(message);
              }
            }}
          />
          <Button variant="contained" 
            // onClick={() => sendMessage(message)}
          >
            <SendRoundedIcon />
          </Button>
        </Stack>
    </Box>
  );
}

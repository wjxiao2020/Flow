'use client'
import * as React from 'react';
import { Box, TextField, Stack, Button } from "@mui/material";
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import AppAppBar from './components/AppAppBar';

import { useState, useEffect } from "react";
import { useUser } from '@clerk/nextjs'

export default function Home() {
  const [message, setMessage] = useState('');
  const [mode, setMode] = React.useState('light');
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const { user, isSignedIn } = useUser();

  const toggleColorMode = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const fetchContents = async () => {
    const response = await fetch('http://localhost:8080/api/contents');
    const data = await response.json();
    return data;
  };

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080/ws');
  
    socket.onmessage = (event) => {
      setNotifications((prev) => [...prev, event.data]);
    };
  
    return () => socket.close();
  }, []);
  
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const authId = user ? user.id : null;
      const response = await fetch('/api/retrieve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: authId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        console.error('Failed to fetch posts');
      }
      setLoading(false);
    };

    fetchPosts();
  }, [isSignedIn, user]);

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
        <AppAppBar mode={mode} toggleColorMode={toggleColorMode} />
    </Box>
  );
}

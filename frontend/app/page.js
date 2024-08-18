'use client'
import * as React from 'react';
import { Box } from "@mui/material";
import AppAppBar from './components/AppAppBar';
import MainContent from './components/MainContent';

import { useState, useEffect } from "react";

export default function Home() {
  const [message, setMessage] = useState('');
  const [mode, setMode] = React.useState('light');
  const [openLogIn, setOpenLogIn] = useState(false);

  const handleOpenLogIn = () => setOpenLogIn(true);
  const handleCloseLogIn = () => setOpenLogIn(false);

  const toggleColorMode = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // const fetchContents = async () => {
  //   const response = await fetch('http://localhost:8080/api/contents');
  //   const data = await response.json();
  //   return data;
  // };

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080/ws');

    socket.onopen = () => {
      console.log('WebSocket connection opened');
    };

    socket.onmessage = (event) => {
      console.log('Message from server:', event.data);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
  
    socket.onmessage = (event) => {
      setNotifications((prev) => [...prev, event.data]);
    };
  
    return () => {
      console.log('Cleaning up WebSocket connection');
      socket.close()
    };
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
        <AppAppBar mode={mode} toggleColorMode={toggleColorMode} openLogIn={openLogIn} handleOpenLogIn={handleOpenLogIn} handleCloseLogIn={handleCloseLogIn} />
        <MainContent mode={mode} handleOpenLogIn={handleOpenLogIn} />
    </Box>
  );
}

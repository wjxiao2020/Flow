'use client'
import * as React from 'react';
import { Box } from "@mui/material";
import AppAppBar from './components/AppAppBar';
import MainContent from './components/MainContent';

import { useState, useEffect } from "react";

export default function Home() {
  const [loading, setLoading] = useState('true'); 
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
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);
  
  useEffect(() => {
    const fetchContents = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/contents');
        const data = await response.json();
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setLoading(false); 
      }
    };

    fetchContents();

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

  if (loading) {
    return (
      <Box
        width='100vw'
        height='100vh'
        display='flex'
        justifyContent='center'
        alignItems='center'
      >
        <div className="loader"></div>
      </Box>
    );
  }

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

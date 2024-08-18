'use client'
import * as React from 'react';
import { Box } from "@mui/material";
import AppAppBar from './components/AppAppBar';
import MainContent from './components/MainContent';

import { useState, useEffect } from "react";

export default function Home() {
  const [loading, setLoading] = useState('true'); 
  const [mode, setMode] = React.useState('light');

  const toggleColorMode = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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
  
    socket.onmessage = (event) => {
      setNotifications((prev) => [...prev, event.data]);
    };
  
    return () => socket.close();
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
        <AppAppBar mode={mode} toggleColorMode={toggleColorMode} />
        <MainContent mode={mode} />
    </Box>
  );
}

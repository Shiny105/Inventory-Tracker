import React from 'react';
import { Container } from '@mui/material';

const Layout = ({ children }) => {
  return (
    <Container maxWidth="lg" sx={{ minHeight: '100vh', position: 'relative' }}>
      {children}
    </Container>
  );
};

export default Layout;
import * as React from 'react';
import { styled, alpha, createTheme, ThemeProvider } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';
import Switch from '@mui/material/Switch';
import { CssBaseline, useMediaQuery, Modal, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '50px',
  border: '1px solid #ddd',
  backgroundColor: theme.palette.background.default,
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.default, 0.9),
  },
  marginRight: theme.spacing(2),
  marginLeft: theme.spacing(3),
  width: '100%',
  maxWidth: '600px', 
  flexGrow: 1, 
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.5, 1, 1.5, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
  },
}));

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: '8px',
  boxShadow: 24,
  p: 4,
};

export default function AppAppBar({ mode, toggleColorMode }) {
  const [open, setOpen] = React.useState(false);

  const theme = createTheme({
    palette: {
      mode: mode,
      primary: {
        main: '#ff2d55',
      },
    },
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, width: '100vw', margin: 0 }}>
        <AppBar position="static" sx={{ backgroundColor: theme.palette.background.default, color: theme.palette.text.primary, boxShadow: 'none', borderBottom: '1px solid #ddd' }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={mode === 'dark' ? "flow-dark-bg.png" : "flow-light-bg.png"}
                alt="flow-logo"
                style={{ height: '40px', marginRight: '16px'}}
              />
            </Box>
            
            {!isSmallScreen && (
              <Search>
                <SearchIconWrapper>
                  <SearchIcon />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder="Search"
                  inputProps={{ 'aria-label': 'search' }}
                />
              </Search>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Button variant="contained" sx={{ backgroundColor: '#ff2d55', color: '#fff', textTransform: 'none', borderRadius: '4px', padding: '6px 16px', marginRight: '8px' }}>
                Log in
              </Button>
              <IconButton size="large" edge="end" color="inherit">
                <Switch checked={mode === 'dark'} onChange={toggleColorMode} />
              </IconButton>
              <IconButton size="large" edge="end" color="inherit" onClick={handleOpen}>
                <AddIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
      </Box>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
            Create New Post
          </Typography>
          <TextField
            fullWidth
            label="Title"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Content"
            variant="outlined"
            multiline
            rows={4}
          />
          <Box sx={{ mt: 3, textAlign: 'right' }}>
            <Button variant="contained" color="primary" onClick={handleClose}>
              Post
            </Button>
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

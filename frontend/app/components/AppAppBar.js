import { useState } from 'react';
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
import { CssBaseline, useMediaQuery, Modal, TextField, Popover, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { SignedIn, SignedOut, UserButton, SignIn, useUser } from '@clerk/nextjs';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import MenuItem from '@mui/material/MenuItem';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '50px',
  border: '1px solid #ddd',
  backgroundColor: theme.palette.background.default,
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.default, 0.9),
    borderColor: theme.palette.primary.main, 
  },
  marginRight: theme.spacing(2),
  marginLeft: theme.spacing(3),
  width: '100%',
  maxWidth: '600px',
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center',
  height: '40px', 
  paddingRight: theme.spacing(1), 
}));

const SearchIconWrapper = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(1),
  height: '100%',
  position: 'absolute',
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
  cursor: 'pointer',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
  width: '100%',
  paddingRight: theme.spacing(6), 
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 2),
    paddingLeft: `calc(1em + ${theme.spacing(1)})`,
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

export default function AppAppBar({ mode, toggleColorMode, openLogIn, handleOpenLogIn, handleCloseLogIn }) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [tags, setTags] = useState([]);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const {isLoaded, isSignedIn, user} = useUser()
  const titleMaxLength = 255;         // MAX: 255
  const contentMaxLength = 65535;     // MAX: 65535

  const theme = createTheme({
    palette: {
      mode: mode,
      primary: {
        main: '#ff2d55',
      },
    },
  });

  const handleTextSelect = (event) => {
    const selectedStr = window.getSelection().toString().trim();
    if (selectedStr.length > 0) {
      setAnchorEl(event.target);
      setSelectedText(selectedStr);
    }
  };

  const addTag = (newTag) => {
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setAnchorEl(null);
  };

  const handleDeleteTag = (tagToDelete) => () => {
    setTags((tags) => tags.filter((tag) => tag !== tagToDelete));
  };

  const handleOpen = () => {
    if (user) {
      setOpen(true);
    } else {
      handleOpenLogIn();
    }
  };

  const handleClose = () => setOpen(false);
  const handlePost = () => {
    if (!user) {
      // Handle the case where the user is not signed in
      handleOpenLogIn();
    }
    console.log("in handlePost NOW")
    submitContent(user.id);

    handleClose();
  };

  const submitContent = async(userId) => {
    console.log("in submitContent NOW")
    console.log("in submitContent : title = " + title +" content = "+ content + " tags = "+ tags + " userId = " + userId)
    const response = await fetch('http://localhost:8080/api/contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: title, content: content, tags: tags, auth_id: userId }),
    });

    if (response.status === 201) {
      console.log('Content submitted successfully');
    } else {
      console.error('Failed to submit content');
    }
  };

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, width: '100vw', margin: 0 }}>
        <AppBar position="static" sx={{ backgroundColor: theme.palette.background.default, color: theme.palette.text.primary, boxShadow: 'none', borderBottom: '1px solid #ddd' }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={mode === 'dark' ? 'flow-dark-bg.png' : 'flow-light-bg.png'}
                alt="flow-logo"
                style={{ height: '40px', marginRight: '16px' }}
              />
            </Box>
            {!isSmallScreen && (
              <Search>
                <StyledInputBase placeholder="Search" inputProps={{ 'aria-label': 'search' }} />
                <SearchIconWrapper onClick={() => console.log('Search icon clicked')}>
                  <SearchIcon />
                </SearchIconWrapper>
              </Search>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <SignedOut>
                <Button variant="contained" onClick={handleOpenLogIn} sx={{ backgroundColor: '#ff2d55', color: '#fff', textTransform: 'none', borderRadius: '4px', padding: '6px 16px', marginRight: '8px' }}>
                  Log in
                </Button>
              </SignedOut>
              <Modal open={openLogIn} onClose={handleCloseLogIn}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <SignIn routing="hash" />
                </Box>
              </Modal>
              <IconButton size="large" edge="end" color="gray" onClick={handleOpen} >
                <AddIcon />
              </IconButton>
              <MenuItem>
                <IconButton
                  size="large"
                  aria-label="show 17 new notifications"
                  color="gray"
                >
                  <Badge badgeContent={17} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </MenuItem>
              <IconButton size="large" edge="end" color="inherit" sx={{ marginRight: "5px" }}>
                <Switch 
                  checked={mode === 'dark'} 
                  onChange={toggleColorMode} 
                  sx={{
                    '& .MuiSwitch-switchBase': {
                      color: mode === 'light' ? 'rgb(116,240,237)' : undefined,
                    },
                    '& .MuiSwitch-thumb': {
                      color: mode === 'light' ? 'rgb(116,240,237)' : undefined,
                    },
                  }}
                  />
              </IconButton>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </Box>
          </Toolbar>
        </AppBar>
      </Box>

      <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
        <Box sx={modalStyle}>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
            Create New Post
          </Typography>
          <TextField
            fullWidth
            label="Title"
            variant="outlined"
            sx={{ mb: 2 }}
            value={title}
            onChange={(e) => {setTitle(e.target.value)}}
            onSelect={handleTextSelect}
            inputProps={{ maxLength: titleMaxLength }}
            helperText={`${title.length}/${titleMaxLength}`}
          />
          <TextField
            fullWidth
            label="Content"
            variant="outlined"
            multiline
            rows={4}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
            }}
            onSelect={handleTextSelect}
            inputProps={{ maxLength: contentMaxLength }}
            helperText={`${content.length}/${contentMaxLength}`}
          />
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            disableAutoFocus
            disableEnforceFocus
            disableRestoreFocus
          >
            <Button onClick={() => addTag(selectedText)}>Add Tag</Button>
          </Popover>
          {tags.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {tags.map((tag, index) => (
                <Chip key={index} variant="outlined" label={tag} onDelete={handleDeleteTag(tag)} />
              ))}
            </Box>)
          }
            <Box sx={{ mt: 3, textAlign: 'right' }}>
            <Button variant="contained" color="primary" onClick={handlePost} disabled={title.length == 0 || content.length == 0}>
              Post
            </Button>
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
}
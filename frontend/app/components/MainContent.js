import React, { useState } from 'react';
import { Box, Typography, IconButton, Avatar } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Divder from '@mui/material/Divider';

const MainContent = ({ mode }) => {
  const [likedPosts, setLikedPosts] = useState({});

  const toggleLike = (id) => {
    setLikedPosts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const posts = [
    {
      id: 1,
      username: 'User1',
      handle: '@user1handle',
      time: '11h',
      title: 'Title1',
      content: "Ipm sum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.",
      profileImg: 'https://i.pravatar.cc/50?img=1',
    },
    {
      id: 2,
      username: 'User2',
      handle: '@user2handle',
      time: '5h',
      title: 'Title2',
      content: 'Ipm sum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.',
      profileImg: 'https://i.pravatar.cc/50?img=2',
    },
    {
      id: 3,
      username: 'User3',
      handle: '@user3handle',
      time: '8h',
      title: 'Title3',
      content: 'Ipm sum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.',
      profileImg: 'https://i.pravatar.cc/50?img=3',
    },
    {
      id: 4,
      username: 'User4',
      handle: '@user4handle',
      time: '1d',
      title: 'Title4',
      content: 'Ipm sum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.',
      profileImg: 'https://i.pravatar.cc/50?img=4',
    },
    {
      id: 5,
      username: 'User5',
      handle: '@user5handle',
      time: '2d',
      title: 'Title5',
      content: 'Ipm sum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.',
      profileImg: 'https://i.pravatar.cc/50?img=5',
    },
  ];

  return (
    <Box
      sx={{
        width: '800px',
        height: '100vh',
        overflowY: 'auto',
        margin: '0 auto',
        padding: 2,
        mt: 2,
        backgroundColor: mode === 'dark' ? '#333' : '#fff',
        color: mode === 'dark' ? '#fff' : '#000',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        '-ms-overflow-style': 'none',  
        'scrollbar-width': 'none',    
      }}
    >
      {posts.map((post, index) => (
        <React.Fragment key={post.id}>
        <Box
          key={post.id}
          sx={{
            mb: 2,
            padding: 2,
            borderRadius: 3,
            backgroundColor: mode === 'dark' ? '#444' : 'background.paper',
            '&:hover': {
              backgroundColor: mode === 'dark' ? '#555' : 'grey.100',
            },
            display: 'flex',
            alignItems: 'start',
          }}
        >
          <Avatar
            src={post.profileImg}
            alt="Profile"
            sx={{
              width: 50,
              height: 50,
              marginRight: 2,
            }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body1" component="div" sx={{ fontWeight: 'bold', marginRight: 1, fontSize: '1.15rem'}}>
                {post.username}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  marginRight: 1,
                  color: mode === 'dark' ? '#ccc' : 'text.secondary',
                }}
              >
                {post.handle}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? '#ccc' : 'text.secondary',
                }}
              >
                · {post.time}
              </Typography>
            </Box>
            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {post.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {post.content}
            </Typography>
          </Box>
          <IconButton
            onClick={() => toggleLike(post.id)}
            sx={{
              color: likedPosts[post.id] ? 'red' : 'grey',
              '&:hover': {
                color: likedPosts[post.id] ? 'darkred' : 'pink',
              },
            }}
          >
            <FavoriteIcon />
          </IconButton>
        </Box>
        {index < posts.length - 1 && <Divder sx={{my: 2}} />}
        </React.Fragment>
      ))}
    </Box>
  );
};
export default MainContent;

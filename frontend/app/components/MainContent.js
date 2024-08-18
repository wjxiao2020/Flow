import { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Stack, Avatar } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useUser } from '@clerk/nextjs'

const { users } = require('@clerk/clerk-sdk-node');

async function getUserProfilePhoto(auth_id) {
  try {
    const user = await users.getUser(auth_id);
    return user.profileImageUrl; // This is the URL to the user's profile photo
  } catch (error) {
    console.error("Error fetching user's profile photo:", error);
    return null;
  }
}

const MainContent = ({ mode, handleOpenLogIn }) => {
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { user, isSignedIn } = useUser();
  const [authId, setAuthId] = useState(null);

  const toggleLike = async(contentId) => {
    if (!user) {
      handleOpenLogIn()
    } else {
      setLikedPosts((prev) => ({
        ...prev,
        [contentId]: !prev[contentId],
      }));
    }

    try {
      // Send a request to the backend to toggle like
      await fetch(`http://localhost:8080/api/posts/${contentId}/${authId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      });

      // Update the local state
      setLikeCount((prev) => isLiked ? prev - 1 : prev + 1);
      onLikeUpdate(contentId, !isLiked); // Update the parent component state
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };
  

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setAuthId(user ? user.id : null)
      const response = await fetch('http://localhost:8080/api/retrieve', {
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
        console.log(response)
        console.error('Failed to fetch posts');
      }
      setLoading(false);
    };

    fetchPosts();
  }, [isSignedIn, user]);

  // const posts = [
  //   {
  //     id: 1,
  //     username: 'User1',
  //     handle: '@user1handle',
  //     time: '11h',
  //     title: 'Title1',
  //     content: "Ipm sum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.",
  //     profileImg: 'https://i.pravatar.cc/50?img=1',
  //   },
  //   {
  //     id: 2,
  //     username: 'User2',
  //     handle: '@user2handle',
  //     time: '5h',
  //     title: 'Title2',
  //     content: 'Ipm sum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.',
  //     profileImg: 'https://i.pravatar.cc/50?img=2',
  //   },
  //   {
  //     id: 3,
  //     username: 'User3',
  //     handle: '@user3handle',
  //     time: '8h',
  //     title: 'Title3',
  //     content: 'Ipm sum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.',
  //     profileImg: 'https://i.pravatar.cc/50?img=3',
  //   },
  //   {
  //     id: 4,
  //     username: 'User4',
  //     handle: '@user4handle',
  //     time: '1d',
  //     title: 'Title4',
  //     content: 'Ipm sum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.',
  //     profileImg: 'https://i.pravatar.cc/50?img=4',
  //   },
  //   {
  //     id: 5,
  //     username: 'User5',
  //     handle: '@user5handle',
  //     time: '2d',
  //     title: 'Title5',
  //     content: 'Ipm sum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.',
  //     profileImg: 'https://i.pravatar.cc/50?img=5',
  //   },
  // ];



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
        // '-ms-overflow-style': 'none', 
         'msOverflowStyle': 'none', 
        // 'scrollbar-width': 'none',    
        'scrollbarWidth': 'none',    
      }}
    >
      {posts.map((post) => (
        // console.log(post)
        <Box
          key={post.content_id}
          sx={{
            mb: 2,
            padding: 2,
            borderRadius: 1,
            backgroundColor: mode === 'dark' ? '#444' : 'background.paper',
            '&:hover': {
              backgroundColor: mode === 'dark' ? '#555' : 'grey.100',
            },
            display: 'flex',
            alignItems: 'start',
          }}
        >
          <Avatar
            src={getUserProfilePhoto(post.authId)}
            alt="User"
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
                {'@ ' + post.user_id}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? '#ccc' : 'text.secondary',
                }}
              >
                · {post.created_at}
              </Typography>
            </Box>
            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {post.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {post.content}
            </Typography>
          </Box>
          <Stack direction="column" alignItems="center">
            <IconButton
              onClick={() => toggleLike(post.content_id)}
              sx={{
                color: likedPosts[post.content_id] ? 'red' : 'inherit',
                '&:hover': {
                  color: likedPosts[post.content_id] ? 'darkred' : 'grey.500',
                },
              }}
            >
              <FavoriteIcon />
            </IconButton>
            <Typography variant="caption">{post.likes}</Typography>
          </Stack>
        </Box>
      ))}
    </Box>
  );
};
export default MainContent;

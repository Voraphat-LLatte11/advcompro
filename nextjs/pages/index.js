// pages/index.js
import { Button, Box, Typography } from '@mui/material';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  return (
    <Box sx={{ textAlign: 'center', marginTop: '20vh' }}>
      <Typography variant="h4">Welcome to Product Comparison</Typography>
      <Button variant="contained" onClick={() => router.push('/signin')}>
        Start
      </Button>
    </Box>
  );
}
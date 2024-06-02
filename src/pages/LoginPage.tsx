import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Paper, Modal, IconButton } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import axiosClient from '../axiosClient';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // react-router-dom을 사용한 라우팅

const LoginPage: React.FC = () => {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // 이전 오류 메시지 초기화

        try {
            const response = await axiosClient.post('/user/login', {
                loginId: loginId,
                password: password
            });

            const { token, role } = response.data;
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('role', role);

            // Project 페이지로 리디렉션
            navigate('/main');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                // 알려진 오류 응답 처리
                setError(err.response.data.message || 'Login failed');
            } else {
                // 알 수 없는 오류 처리
                setError('An unknown error occurred. Please try again.');
            }
            setIsModalOpen(true);
            console.error('Login error:', err);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper
                elevation={3}
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 3,
                }}
            >
                <Typography component="h1" variant="h5">
                    로그인
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                        label="아이디"
                        type="text"
                        fullWidth
                        margin="normal"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        required
                    />
                    <TextField
                        label="비밀번호"
                        type="password"
                        fullWidth
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                        로그인
                    </Button>
                </Box>
            </Paper>

            <Modal
                open={isModalOpen}
                onClose={handleCloseModal}
                aria-labelledby="error-modal-title"
                aria-describedby="error-modal-description"
            >
                <Paper
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseModal}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <ErrorIcon color="error" sx={{ fontSize: 50 }} />
                    <Typography id="error-modal-title" variant="h6" component="h2" sx={{ mt: 2 }}>
                        로그인 실패
                    </Typography>
                    <Typography id="error-modal-description" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                </Paper>
            </Modal>
        </Container>
    );
};

export default LoginPage;

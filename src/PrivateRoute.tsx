import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Modal, Box, Typography, Button, IconButton } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';

const isAuthenticated = () => {
    // 사용자가 인증되었는지 확인하는 로직 구현
    return !!sessionStorage.getItem('user'); // sessionStorage를 사용하는 예
};

const PrivateRoute: React.FC = () => {
    const [open, setOpen] = useState(true);

    const handleClose = () => {
        setOpen(false);
    };

    if (isAuthenticated()) {
        return <Outlet />;
    } else {
        return (
            <>
                <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <Box sx={{
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
                    }}>
                        <IconButton
                            aria-label="close"
                            onClick={handleClose}
                            sx={{ position: 'absolute', right: 8, top: 8 }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <ErrorIcon color="error" sx={{ fontSize: 50 }} />
                        <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ mt: 2 }}>
                            접근할 수 없음
                        </Typography>
                        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                            이 페이지에 접근할 수 있는 권한이 없습니다. 로그인 해주세요.
                        </Typography>
                        <Button
                            onClick={handleClose}
                            variant="contained"
                            sx={{ mt: 2 }}
                        >
                            닫기
                        </Button>
                    </Box>
                </Modal>
                {!open && <Navigate to="/" />}
            </>
        );
    }
};

export default PrivateRoute;

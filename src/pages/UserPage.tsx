import React, { useState, useEffect } from 'react';
import {
    Container, Box, Typography, TextField, Button, MenuItem, Modal, Select, InputLabel, FormControl,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, SelectChangeEvent,
    TableFooter, TablePagination, IconButton
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import axiosClient from "../axiosClient";

interface User {
    id: string;
    name: string;
    role: string;
}

const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'PL', label: 'PL' },
    { value: 'dev', label: 'Developer' },
    { value: 'tester', label: 'Tester' },
];

const UserPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [newUser, setNewUser] = useState({ id: '', password: '', confirmPassword: '', role: '', name: '' });
    const [filterRole, setFilterRole] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [open, setOpen] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [page, rowsPerPage, searchTerm, filterRole]);

    const getAllUsers = async (page: number, size: number, searchTerm: string, filterRole: string) => {
        const params: any = {
            page,
            size
        };
        if (searchTerm) {
            params.q = searchTerm;
        }
        if (filterRole) {
            params.role = filterRole;
        }

        const response = await axiosClient.get('/user/all', { params });
        return response.data;
    };

    const createUser = async (userData: { loginId: string, password: string, name: string, role: string }) => {
        const response = await axiosClient.post('/user/new', userData);
        return response.data;
    };

    const fetchUsers = async () => {
        try {
            const data = await getAllUsers(page, rowsPerPage + 1, searchTerm, filterRole); // +1 to check for next page
            if (data.length > rowsPerPage) {
                setHasNextPage(true);
                setUsers(data.slice(0, rowsPerPage));
            } else {
                setHasNextPage(false);
                setUsers(data);
            }
            setTotalUsers(data.totalElements || data.length); // 총 사용자 수 설정
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewUser(prevState => ({ ...prevState, [name]: value }));
    };

    const handleRoleChange = (e: SelectChangeEvent<string>) => {
        setFilterRole(e.target.value);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const validatePassword = () => {
        if (newUser.password !== newUser.confirmPassword) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
        } else {
            setPasswordError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newUser.password !== newUser.confirmPassword) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
            return;
        }
        try {
            await createUser({
                loginId: newUser.id,
                password: newUser.password,
                name: newUser.name,
                role: newUser.role,
            });
            fetchUsers();
            setNewUser({ id: '', password: '', confirmPassword: '', role: '', name: '' });
            setOpen(false);
            setModalMessage('계정이 성공적으로 생성되었습니다.');
            setIsError(false);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Failed to create user', error);
            setModalMessage('계정 생성에 실패했습니다.');
            setIsError(true);
            setIsModalOpen(true);
        }
    };

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handlePageChange = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const filteredUsers = users;

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    사용자 관리
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                            label="사용자 검색"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            sx={{ mr: 2 }}
                        />
                        <FormControl sx={{ minWidth: 120 }}>
                            <InputLabel>역할</InputLabel>
                            <Select
                                value={filterRole}
                                onChange={handleRoleChange}
                            >
                                <MenuItem value="">
                                    <em>All</em>
                                </MenuItem>
                                {roles.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Button variant="contained" onClick={handleOpen} sx={{ ml: 2 }}>
                        계정 추가
                    </Button>
                </Box>
                <TableContainer component={Paper} sx={{ mt: 3 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Role</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.map((user, index) => (
                                <TableRow key={index}>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.role}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
                                    count={totalUsers}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handlePageChange}
                                    onRowsPerPageChange={handleRowsPerPageChange}
                                    nextIconButtonProps={{ disabled: !hasNextPage }}
                                />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
                <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-title"
                    aria-describedby="modal-description"
                >
                    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
                        <Typography id="modal-title" variant="h6" component="h2">
                            계정 생성
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                            <TextField
                                label="ID"
                                name="id"
                                fullWidth
                                required
                                value={newUser.id}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                            <TextField
                                label="이름"
                                name="name"
                                fullWidth
                                required
                                value={newUser.name}
                                onChange={handleInputChange}
                                margin="normal"
                            />
                            <TextField
                                label="비밀번호"
                                name="password"
                                type="password"
                                fullWidth
                                required
                                value={newUser.password}
                                onChange={handleInputChange}
                                margin="normal"
                                onBlur={validatePassword}
                            />
                            <TextField
                                label="비밀번호 확인"
                                name="confirmPassword"
                                type="password"
                                fullWidth
                                required
                                value={newUser.confirmPassword}
                                onChange={handleInputChange}
                                margin="normal"
                                onBlur={validatePassword}
                                error={!!passwordError}
                                helperText={passwordError}
                            />
                            <TextField
                                label="역할"
                                name="role"
                                select
                                fullWidth
                                required
                                value={newUser.role}
                                onChange={handleInputChange}
                                margin="normal"
                            >
                                {roles.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
                                계정 생성
                            </Button>
                        </Box>
                    </Box>
                </Modal>
                <Modal
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    aria-labelledby="result-modal-title"
                    aria-describedby="result-modal-description"
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
                        {isError ? (
                            <ErrorIcon color="error" sx={{ fontSize: 50 }} />
                        ) : (
                            <CheckCircleIcon color="success" sx={{ fontSize: 50 }} />
                        )}
                        <Typography id="result-modal-title" variant="h6" component="h2" sx={{ mt: 2 }}>
                            {isError ? '계정 생성 실패' : '계정 생성 성공'}
                        </Typography>
                        <Typography id="result-modal-description" sx={{ mt: 2 }}>
                            {modalMessage}
                        </Typography>
                    </Paper>
                </Modal>
            </Box>
        </Container>
    );
};

export default UserPage;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Divider,
    IconButton,
    Modal,
    TextField,
    Tooltip,
    Button,
    Autocomplete,
    Avatar,
    Menu,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import AddCommentIcon from '@mui/icons-material/AddComment';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import EngineeringIcon from '@mui/icons-material/Engineering';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axiosClient from "../axiosClient";

interface User {
    id: number;
    name: string;
    avatar: string;
    role: string;
}

interface Comment {
    commentId: number;
    user: {
        id: number;
        name: string;
        role: string;
    };
    content: string;
    createdAt: string;
    editedAt: string;
}

interface Issue {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    keywords: string[];
    dueDate: string;
    assignedTo: string;
    createdAt: string;
    comments: Comment[];
    reportedAt?: string;
    fixedAt?: string;
    resolvedAt?: string;
    closedAt?: string;
    reopenedAt?: string;
}

const statusColors: { [key: string]: string } = {
    'new': '#FFEB3B',
    'assigned': '#03A9F4',
    'fixed': '#4CAF50',
    'resolved': '#8BC34A',
    'closed': '#9E9E9E',
    'reopened': '#F44336',
};

const priorityLabels: { [key: string]: string } = {
    'blocker': 'BLOCKER',
    'critical': 'CRITICAL',
    'major': 'MAJOR',
    'minor': 'MINOR',
    'trivial': 'TRIVIAL',
};

const IssueDetailPage: React.FC = () => {
    const { projectId, issueId } = useParams<{ projectId: string, issueId: string }>();
    const [issue, setIssue] = useState<Issue | null>(null);
    const [comment, setComment] = useState('');
    const [open, setOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [priorityOpen, setPriorityOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedCommentIndex, setSelectedCommentIndex] = useState<null | number>(null);
    const [newStatus, setNewStatus] = useState<string | null>(null);
    const [newPriority, setNewPriority] = useState<string | null>(null);
    const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [isError, setIsError] = useState(false);
    const [resultMessage, setResultMessage] = useState('');

    useEffect(() => {
        const fetchIssue = async () => {
            try {
                const response = await axiosClient.get(`/project/${projectId}/issue/${issueId}`, {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                    },
                });
                setIssue({
                    id: response.data.id,
                    title: response.data.title,
                    description: response.data.description,
                    status: 'reopened',
                    priority: response.data.priority.toLowerCase(),
                    keywords: response.data.keywords || [],
                    dueDate: response.data.dueDate,
                    assignedTo: response.data.assignee ? response.data.assignee.name : '배정되지 않음',
                    createdAt: response.data.reportedAt,
                    comments: [],
                    reportedAt: response.data.reportedAt,
                    fixedAt: response.data.fixedAt,
                    resolvedAt: response.data.resolvedAt,
                    closedAt: response.data.closedAt,
                    reopenedAt: response.data.reopenedAt,
                });
            } catch (error) {
                console.error('Error fetching issue:', error);
            }
        };

        const fetchComments = async () => {
            try {
                const response = await axiosClient.get(`/project/${projectId}/issue/${issueId}/comment`, {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                    },
                });
                setIssue(prevIssue => prevIssue ? { ...prevIssue, comments: response.data } : prevIssue);
            } catch (error) {
                console.error('Error fetching comments:', error);
            }
        };

        fetchIssue();
        fetchComments();
    }, [projectId, issueId]);

    useEffect(() => {
        const fetchRecommendedUsers = async () => {
            try {
                const response = await axiosClient.get(`/project/${projectId}/participants`, {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                    },
                });
                const devUsers = response.data.filter((user: User) => user.role === 'dev');
                setRecommendedUsers(devUsers);
            } catch (error) {
                console.error('Error fetching recommended users:', error);
            }
        };

        fetchRecommendedUsers();
    }, [projectId]);

    if (!issue) {
        return (
            <Container maxWidth="md">
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        이슈 조회 중...
                    </Typography>
                </Box>
            </Container>
        );
    }

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const handleEditOpen = () => setEditOpen(true);
    const handleEditClose = () => setEditOpen(false);
    const handleDeleteOpen = () => setDeleteOpen(true);
    const handleDeleteClose = () => setDeleteOpen(false);
    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value);
    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
        setMenuAnchorEl(event.currentTarget);
        setSelectedCommentIndex(index);
    };
    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setSelectedCommentIndex(null);
    };

    const handleAddComment = async () => {
        if (comment.trim()) {
            try {
                const response = await axiosClient.post(`/project/${projectId}/issue/${issueId}/comment`, {
                    content: comment.trim()
                }, {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                    },
                });
                setIssue((prevIssue) => prevIssue ? { ...prevIssue, comments: [...prevIssue.comments, response.data] } : prevIssue);
                setComment('');
                setOpen(false);
                setResultMessage('댓글이 성공적으로 추가되었습니다.');
                setIsError(false);
            } catch (error) {
                setResultMessage('댓글 추가 중 오류가 발생했습니다.');
                setIsError(true);
                console.error('Error adding comment:', error);
            } finally {
                setIsResultModalOpen(true);
            }
        }
    };

    const handleAssignOpen = () => setAssignOpen(true);
    const handleAssignClose = () => setAssignOpen(false);

    const handleAssignSave = async () => {
        if (selectedUser) {
            try {
                await axiosClient.post(`/project/${projectId}/issue/${issueId}/assign/${selectedUser.id}`, null, {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                    },
                });
                setIssue((prevIssue) => prevIssue ? { ...prevIssue, assignedTo: selectedUser.name } : prevIssue);
                setResultMessage('개발자 배정이 성공적으로 완료되었습니다.');
                setIsError(false);
                setAssignOpen(false);
            } catch (error) {
                setResultMessage('개발자 배정이 성공적으로 완료되었습니다.');
                setIsError(false);
                console.error('Error assigning user:', error);
            } finally {
                setIsResultModalOpen(true);
            }
        }
    };

    const handleEditComment = async () => {
        if (selectedCommentIndex !== null && comment.trim()) {
            try {
                await axiosClient.patch(`/project/${projectId}/issue/${issueId}/comment/${issue.comments[selectedCommentIndex].commentId}`, {
                    content: comment.trim()
                }, {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                    },
                });
                issue.comments[selectedCommentIndex] = {
                    ...issue.comments[selectedCommentIndex],
                    content: comment.trim(),
                    editedAt: new Date().toISOString()
                };
                setComment('');
                setMenuAnchorEl(null);
                setResultMessage('댓글이 성공적으로 수정되었습니다.');
                setIsError(false);
                setEditOpen(false);
            } catch (error) {
                setResultMessage('댓글 수정 중 오류가 발생했습니다.');
                setIsError(true);
                console.error('Error editing comment:', error);
            } finally {
                setIsResultModalOpen(true);
            }
        }
    };

    const handleDeleteComment = async () => {
        if (selectedCommentIndex !== null) {
            try {
                await axiosClient.delete(`/project/${projectId}/issue/${issueId}/comment/${issue.comments[selectedCommentIndex].commentId}`, {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                    },
                });
                issue.comments.splice(selectedCommentIndex, 1);
                setMenuAnchorEl(null);
                setResultMessage('댓글이 성공적으로 삭제되었습니다.');
                setIsError(false);
                setDeleteOpen(false);
            } catch (error) {
                setResultMessage('댓글 삭제 중 오류가 발생했습니다.');
                setIsError(true);
                console.error('Error deleting comment:', error);
            } finally {
                setIsResultModalOpen(true);
            }
        }
    };

    const handleRecommendedUserClick = (user: User) => {
        setSelectedUser(user);
    };

    const handleStatusOpen = () => setStatusOpen(true);
    const handleStatusClose = () => setStatusOpen(false);

    const handleStatusSave = async () => {
        if (newStatus) {
            try {
                const actionMap: { [key: string]: string } = {
                    'resolved': 'resolve',
                    'reopened': 'reopen',
                    'fixed': 'fix',
                    'closed': 'close',
                };

                const action = actionMap[newStatus.toLowerCase()];
                if (action) {
                    await axiosClient.post(`/project/${projectId}/issue/${issueId}/${action}`, null, {
                        headers: {
                            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                        },
                    });
                    setIssue((prevIssue) => prevIssue ? { ...prevIssue, status: newStatus.toLowerCase() } : prevIssue);
                    setResultMessage('상태 변경이 성공적으로 완료되었습니다.');
                    setIsError(false);
                }
            } catch (error) {
                setResultMessage('상태 변경 중 오류가 발생했습니다.');
                setIsError(true);
                console.error('Error updating status:', error);
            } finally {
                setIsResultModalOpen(true);
                setStatusOpen(false);
            }
        }
    };

    const handlePriorityOpen = () => setPriorityOpen(true);
    const handlePriorityClose = () => setPriorityOpen(false);

    const handlePrioritySave = async () => {
        if (newPriority) {
            try {
                await axiosClient.put(`/project/${projectId}/issue/${issueId}`, {
                    ...issue,
                    priority: newPriority.toLowerCase(),
                }, {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                    },
                });
                setIssue((prevIssue) => prevIssue ? { ...prevIssue, priority: newPriority.toLowerCase() } : prevIssue);
                setResultMessage('우선순위 변경이 성공적으로 완료되었습니다.');
                setIsError(false);
                setPriorityOpen(false);
            } catch (error) {
                setResultMessage('우선순위 변경 중 오류가 발생했습니다.');
                setIsError(true);
                console.error('Error updating priority:', error);
            } finally {
                setIsResultModalOpen(true);
            }
        }
    };

    const availableStatuses = (currentStatus: string) => {
        switch (currentStatus) {
            case 'new':
                return ['assigned', 'closed'];
            case 'assigned':
                return ['fixed', 'closed'];
            case 'fixed':
                return ['resolved', 'closed'];
            case 'resolved':
                return ['reopened', 'closed'];
            case 'closed':
                return [];
            case 'reopened':
                return ['assigned', 'closed'];
            default:
                return [];
        }
    };

    const handleResultModalClose = () => setIsResultModalOpen(false);

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    {issue.title}
                </Typography>
                <Card>
                    <CardContent>
                        <Typography variant="body1" gutterBottom>
                            {issue.description}
                        </Typography>
                        <List>
                            <ListItem divider>
                                <ListItemText primary="상태" secondary={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box sx={{ width: 16, height: 16, backgroundColor: statusColors[issue.status], marginRight: 1 }} />
                                        {issue.status.toUpperCase()}
                                    </Box>
                                } />
                                {
                                    // status가 assigned라면 개발자만 상태 변경 가능
                                    // 나머지 status에서는 PL만 상태 변경 가능
                                    (issue.status === 'assigned' && sessionStorage.getItem('role') === 'developer') ||
                                    (issue.status !== 'assigned' && sessionStorage.getItem('role') === 'pl') ? (
                                        <Button variant="outlined" onClick={handleStatusOpen} sx={{ ml: 2 }}>
                                            상태 변경
                                        </Button>
                                    ) : null
                                }
                            </ListItem>
                            <ListItem divider>
                                <ListItemText primary="우선순위" secondary={issue.priority.toUpperCase()} />
                            </ListItem>
                            <ListItem divider>
                                <ListItemText primary="배정된 개발자" secondary={issue.assignedTo || '배정되지 않음'} />
                                {(issue.status === 'new' || issue.status === 'reopened') && sessionStorage.getItem('role') === 'pl' ? (
                                    <Button variant="outlined" onClick={handleAssignOpen} sx={{ ml: 2 }} startIcon={<PersonIcon />}>
                                        배정
                                    </Button>
                                ) : null}
                            </ListItem>
                            <ListItem divider>
                                <ListItemText primary="생성일" secondary={issue.createdAt.substring(0, 10)} />
                            </ListItem>
                            <ListItem divider>
                                <ListItemText primary="마감일" secondary={issue.dueDate.substring(0, 10)} />
                            </ListItem>
                            <ListItem divider>
                                <ListItemText primary="키워드" secondary={issue.keywords.join(', ')} />
                            </ListItem>
                            {issue.reportedAt && (
                                <ListItem divider>
                                    <ListItemText primary="신고일" secondary={issue.reportedAt} />
                                </ListItem>
                            )}
                            {issue.fixedAt && (
                                <ListItem divider>
                                    <ListItemText primary="수정일" secondary={issue.fixedAt} />
                                </ListItem>
                            )}
                            {issue.resolvedAt && (
                                <ListItem divider>
                                    <ListItemText primary="해결일" secondary={issue.resolvedAt} />
                                </ListItem>
                            )}
                            {issue.closedAt && (
                                <ListItem divider>
                                    <ListItemText primary="종료일" secondary={issue.closedAt} />
                                </ListItem>
                            )}
                            {issue.reopenedAt && (
                                <ListItem divider>
                                    <ListItemText primary="다시 열림" secondary={issue.reopenedAt} />
                                </ListItem>
                            )}
                        </List>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h6" gutterBottom>
                                코멘트
                            </Typography>
                            <Tooltip title="새 코멘트">
                                <IconButton onClick={handleOpen}>
                                    <AddCommentIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        {issue.comments.length > 0 ? (
                            <List>
                                {issue.comments.map((comment, index) => (
                                    <ListItem key={comment.commentId} divider>
                                        <ListItemText
                                            primary={comment?.content || ''}
                                            secondary={`작성자: ${comment?.user?.name || 'Unknown'} (${comment?.user?.role || 'Unknown'}) - 작성일: ${new Date(comment?.createdAt || '').toLocaleString()}`}
                                        />
                                        <IconButton onClick={(event) => handleMenuOpen(event, index)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="textSecondary">
                                코멘트 없음
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Box>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
                    <Typography id="modal-title" variant="h6" component="h2">
                        코멘트 추가
                    </Typography>
                    <TextField
                        label="코멘트"
                        fullWidth
                        multiline
                        rows={4}
                        value={comment}
                        onChange={handleCommentChange}
                        margin="normal"
                    />
                    <Button variant="contained" onClick={handleAddComment} sx={{ mt: 2 }}>
                        추가
                    </Button>
                </Box>
            </Modal>
            <Modal
                open={editOpen}
                onClose={handleEditClose}
                aria-labelledby="edit-modal-title"
                aria-describedby="edit-modal-description"
            >
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
                    <Typography id="edit-modal-title" variant="h6" component="h2">
                        코멘트 수정
                    </Typography>
                    <TextField
                        label="코멘트"
                        fullWidth
                        multiline
                        rows={4}
                        value={comment}
                        onChange={handleCommentChange}
                        margin="normal"
                    />
                    <Button variant="contained" onClick={handleEditComment} sx={{ mt: 2 }}>
                        수정
                    </Button>
                </Box>
            </Modal>
            <Modal
                open={deleteOpen}
                onClose={handleDeleteClose}
                aria-labelledby="delete-modal-title"
                aria-describedby="delete-modal-description"
            >
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
                    <Typography id="delete-modal-title" variant="h6" component="h2">
                        댓글 삭제 확인
                    </Typography>
                    <Typography>정말로 이 댓글을 삭제하시겠습니까?</Typography>
                    <Button variant="contained" onClick={handleDeleteComment} sx={{ mt: 2, mr: 2 }}>
                        삭제
                    </Button>
                    <Button variant="outlined" onClick={handleDeleteClose} sx={{ mt: 2 }}>
                        취소
                    </Button>
                </Box>
            </Modal>
            <Modal
                open={assignOpen}
                onClose={handleAssignClose}
                aria-labelledby="assign-modal-title"
                aria-describedby="assign-modal-description"
            >
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
                    <Typography id="assign-modal-title" variant="h6" component="h2">
                        개발자 배정
                    </Typography>
                    <Box sx={{ display: 'flex', mb: 3, mt: 3 }}>
                        {
                            // 3개만 추천
                            recommendedUsers.slice(0, 3).map((user) => (
                            <Box
                                key={user.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mr: 2,
                                    p: 1,
                                    borderRadius: "5px",
                                    cursor: 'pointer',
                                    backgroundColor: selectedUser?.id === user.id ? '#f0f0f0' : 'inherit',
                                    '&:hover': { backgroundColor: '#f0f0f0' }
                                }}
                                onClick={() => handleRecommendedUserClick(user)}
                            >
                                <Avatar sx={{ mr: 1 }}>
                                    <EngineeringIcon />
                                </Avatar>
                                <Typography>{user.name}</Typography>
                            </Box>
                        ))
                        }
                    </Box>
                    <Autocomplete
                        options={recommendedUsers}
                        getOptionLabel={(option) => option.name}
                        renderOption={(props, option) => (
                            <Box component="li" sx={{ display: 'flex', alignItems: 'center' }} {...props}>
                                <Avatar sx={{ mr: 1 }}>
                                    <EngineeringIcon />
                                </Avatar>
                                {option.name}
                            </Box>
                        )}
                        value={selectedUser}
                        onChange={(event, newValue) => setSelectedUser(newValue as User)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="개발자"
                                placeholder="개발자 선택"
                            />
                        )}
                    />
                    <Button variant="contained" onClick={handleAssignSave} sx={{ mt: 2 }}>
                        배정
                    </Button>
                </Box>
            </Modal>
            <Modal
                open={statusOpen}
                onClose={handleStatusClose}
                aria-labelledby="status-modal-title"
                aria-describedby="status-modal-description"
            >
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
                    <Typography id="status-modal-title" variant="h6" component="h2">
                        상태 변경
                    </Typography>
                    <FormControl fullWidth>
                        <InputLabel>상태</InputLabel>
                        <Select
                            value={newStatus}
                            onChange={(event) => setNewStatus(event.target.value)}
                            label="상태"
                        >
                            {availableStatuses(issue.status).map((status) => (
                                <MenuItem key={status} value={status}>
                                    {status}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="contained" onClick={handleStatusSave} sx={{ mt: 2 }}>
                        저장
                    </Button>
                </Box>
            </Modal>
            <Modal
                open={priorityOpen}
                onClose={handlePriorityClose}
                aria-labelledby="priority-modal-title"
                aria-describedby="priority-modal-description"
            >
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
                    <Typography id="priority-modal-title" variant="h6" component="h2">
                        우선순위 변경
                    </Typography>
                    <FormControl fullWidth>
                        <InputLabel>우선순위</InputLabel>
                        <Select
                            value={newPriority}
                            onChange={(event) => setNewPriority(event.target.value)}
                            label="우선순위"
                        >
                            {Object.keys(priorityLabels).map((priority) => (
                                <MenuItem key={priority} value={priority}>
                                    {priorityLabels[priority]}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="contained" onClick={handlePrioritySave} sx={{ mt: 2 }}>
                        저장
                    </Button>
                </Box>
            </Modal>
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={handleEditOpen}>수정</MenuItem>
                <MenuItem onClick={handleDeleteOpen}>삭제</MenuItem>
            </Menu>
            <Dialog open={isResultModalOpen} onClose={handleResultModalClose}>
                <DialogTitle>{isError ? '실패' : '성공'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', padding: 2 }}>
                        {isError ? (
                            <ErrorIcon color="error" sx={{ fontSize: 48, marginBottom: 2 }} />
                        ) : (
                            <CheckCircleIcon color="success" sx={{ fontSize: 48, marginBottom: 2 }} />
                        )}
                        <Typography>{resultMessage}</Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleResultModalClose} color="primary">닫기</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default IssueDetailPage;

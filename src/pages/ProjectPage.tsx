import React, { useEffect, useState } from 'react';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    SelectChangeEvent,
    Button,
    TextField,
    Modal,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useNavigate, useParams } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import axiosClient from "../axiosClient";

interface Participant {
    id: number;
    name: string;
    role: string;
}

interface Project {
    projectId: string;
    title: string;
    description: string;
    participants: Participant[];
}

interface Issue {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    keywords: string[];
    dueDate: string;
    assignedTo?: string;
    reportedAt: string;
    fixedAt?: string;
    resolvedAt?: string;
    closedAt?: string;
    reporter: {
        id: number;
        name: string;
        role: string;
    };
}

const statusColors: { [key: string]: string } = {
    'NEW': '#FFEB3B',
    'ASSIGNED': '#03A9F4',
    'FIXED': '#4CAF50',
    'RESOLVED': '#8BC34A',
    'CLOSED': '#9E9E9E',
    'REOPENED': '#F44336',
    'OPEN': 'green',
};

const ProjectPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [expanded, setExpanded] = useState(false);
    const [orderBy, setOrderBy] = useState('createdAt');
    const [status, setStatus] = useState('all');
    const [showMore, setShowMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [projects, setProjects] = useState<Project>({ projectId: '', title: '', description: '', participants: [] });
    const [issues, setIssues] = useState<Issue[]>([]);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [isError, setIsError] = useState(false);
    const [resultMessage, setResultMessage] = useState('');

    const fetchProjects = async () => {
        try {
            const response = await axiosClient.get(`/project/${projectId}`, {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
            });
            setProjects(response.data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    };

    const fetchIssues = async () => {
        try {
            const response = await axiosClient.get(`/project/${projectId}/issue`, {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
                params: {
                    q: searchQuery,
                    page: 0,
                    size: 20,
                }
            });
            setIssues(response.data);
        } catch (error) {
            console.error('Failed to fetch issues:', error);
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchIssues();
    }, []);

    const [open, setOpen] = useState(false);
    const [newIssue, setNewIssue] = useState({
        title: '',
        description: '',
        priority: 'MINOR',
        keywords: '',
        dueDate: '',
        startDate: '',
    });

    const navigate = useNavigate();

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    const handleOrderByChange = (event: SelectChangeEvent<string>) => {
        setOrderBy(event.target.value as string);
    };

    const handleStatusChange = (event: SelectChangeEvent<string>) => {
        setStatus(event.target.value as string);
    };

    const handleShowMore = () => {
        setShowMore(true);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setNewIssue({ ...newIssue, [name]: value });
    };

    const handleSelectChange = (event: SelectChangeEvent<string>) => {
        const { name, value } = event.target;
        setNewIssue({ ...newIssue, [name]: value });
    };

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleResultModalClose = () => {
        setIsResultModalOpen(false);
    };

    const handleSave = async () => {
        try {
            const newKeywords = newIssue.keywords.split(',').map((keyword) => keyword.trim());
            const response = await axiosClient.post(`/project/${projectId}/issue`, {
                projectId,
                title: newIssue.title,
                description: newIssue.description,
                priority: newIssue.priority,
                startDate: `${newIssue.startDate}T00:00:00`,
                dueDate: `${newIssue.dueDate}T23:59:59`,
                userIds: [],
            }, {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
            });

            const newIssueData: Issue = {
                ...newIssue,
                id: response.data.id,
                status: 'OPEN',
                keywords: newKeywords,
                reportedAt: new Date().toISOString(),
                reporter: {
                    id: 1, // 예시 ID, 실제 값으로 변경 필요
                    name: 'Current User', // 예시 이름, 실제 값으로 변경 필요
                    role: 'Reporter', // 예시 역할, 실제 값으로 변경 필요
                }
            };
            setIssues([...issues, newIssueData]);
            setNewIssue({
                title: '',
                description: '',
                priority: 'MINOR',
                keywords: '',
                dueDate: '',
                startDate: '',
            });
            setIsError(false);
            setResultMessage('이슈가 성공적으로 생성되었습니다.');
        } catch (error) {
            console.error('Failed to create issue:', error);
            setIsError(true);
            setResultMessage('이슈 생성에 실패했습니다.');
        } finally {
            setOpen(false);
            setIsResultModalOpen(true);
        }
    };

    const handleIssueClick = (id: number) => {
        navigate(`/project/${projectId}/issues/${id}`);
    };

    const filteredIssues = issues
        .filter((issue) => status === 'all' || issue.status.toLowerCase() === status.toLowerCase())
        .filter((issue) => issue.title.includes(searchQuery) || issue.description.includes(searchQuery));

    const sortedIssues = filteredIssues.sort((a, b) => {
        return a.id - b.id;
    });

    const initialDisplayCount = 4;
    const displayedIssues = showMore ? sortedIssues : sortedIssues.slice(0, initialDisplayCount);

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    {projects.title}
                </Typography>
                <Card>
                    <CardContent>
                        <Typography variant="body1">
                            {
                                expanded ? projects.description : projects.description.slice(0, 30)
                                    + (projects.description.length > 30 ? '...' : '')
                            }
                        </Typography>
                    </CardContent>
                    <CardActions>
                        <IconButton onClick={handleExpandClick}>
                            {
                                expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
                            }
                        </IconButton>
                    </CardActions>
                </Card>
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        이슈 목록
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                            variant="outlined"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            sx={{ minWidth: 200, marginRight: 1 }}
                        />
                        <FormControl variant="outlined" sx={{ minWidth: 120, marginRight: 1 }}>
                            <InputLabel>Order By</InputLabel>
                            <Select value={orderBy} onChange={handleOrderByChange} label="Order By">
                                <MenuItem value="createdAt">생성일</MenuItem>
                                <MenuItem value="dueDate">종료일</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl variant="outlined" sx={{ minWidth: 120, marginRight: 1 }}>
                            <InputLabel>Status</InputLabel>
                            <Select value={status} onChange={handleStatusChange} label="Status">
                                <MenuItem value="all">전체</MenuItem>
                                <MenuItem value="open">Open</MenuItem>
                                <MenuItem value="assigned">Assigned</MenuItem>
                                <MenuItem value="fixed">Fixed</MenuItem>
                                <MenuItem value="resolved">Resolved</MenuItem>
                                <MenuItem value="reopened">Reopened</MenuItem>
                                <MenuItem value="closed">Closed</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
                <Box sx={{ mt: 4 }}>
                    {displayedIssues.map((issue) => (
                        <Card
                            key={issue.id}
                            sx={{
                                mb: 2,
                                borderLeft: `4px solid ${statusColors[issue.status.toUpperCase()] || 'grey'}`,
                                cursor: 'pointer',
                                '&:hover': {
                                    boxShadow: 6,
                                },
                            }}
                            onClick={() => handleIssueClick(issue.id)}
                        >
                            <CardContent>
                                <Typography variant="h6">{issue.title}</Typography>
                                <Typography variant="body2">{issue.description}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <Chip
                                        icon={<PriorityHighIcon />}
                                        label={`우선순위: ${issue.priority}`}
                                        sx={{ mr: 1 }}
                                    />
                                    {issue.reporter && (
                                        <Chip
                                            icon={<PersonIcon />}
                                            label={`배정: ${issue.reporter.name}`}
                                            sx={{ mr: 1 }}
                                        />
                                    )}
                                    <Chip
                                        icon={<EventIcon />}
                                        label={`마감일: ${issue.dueDate.substring(0, 10)}`}
                                    />
                                </Box>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                    상태: {issue.status}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                            {!showMore && sortedIssues.length > initialDisplayCount && (
                                <Button variant="outlined" onClick={handleShowMore} startIcon={<MoreHorizIcon />}>
                                    더보기
                                </Button>
                            )}
                        </Box>
                        <Button variant="contained" onClick={handleOpen} startIcon={<AddIcon />}>
                            이슈 등록
                        </Button>
                    </Box>
                </Box>
            </Box>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
                    <Typography id="modal-title" variant="h6" component="h2">
                        새 이슈 등록
                    </Typography>
                    <Box component="form" sx={{ mt: 2 }}>
                        <TextField
                            label="이슈 제목"
                            name="title"
                            fullWidth
                            required
                            value={newIssue.title}
                            onChange={handleInputChange}
                            margin="normal"
                        />
                        <TextField
                            label="이슈 설명"
                            name="description"
                            fullWidth
                            required
                            value={newIssue.description}
                            onChange={handleInputChange}
                            margin="normal"
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>우선순위</InputLabel>
                            <Select
                                name="priority"
                                value={newIssue.priority}
                                onChange={handleSelectChange}
                            >
                                <MenuItem value="BLOCKER">Blocker</MenuItem>
                                <MenuItem value="CRITICAL">Critical</MenuItem>
                                <MenuItem value="MAJOR">Major</MenuItem>
                                <MenuItem value="MINOR">Minor</MenuItem>
                                <MenuItem value="TRIVIAL">Trivial</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="키워드"
                            name="keywords"
                            fullWidth
                            required
                            value={newIssue.keywords}
                            onChange={handleInputChange}
                            margin="normal"
                        />
                        <TextField
                            label="시작일"
                            name="startDate"
                            type="date"
                            fullWidth
                            required
                            value={newIssue.startDate}
                            onChange={handleInputChange}
                            margin="normal"
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                        <TextField
                            label="마감일"
                            name="dueDate"
                            type="date"
                            fullWidth
                            required
                            value={newIssue.dueDate}
                            onChange={handleInputChange}
                            margin="normal"
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                        <Button type="button" fullWidth variant="contained" sx={{ mt: 3 }} onClick={handleSave}>
                            저장
                        </Button>
                    </Box>
                </Box>
            </Modal>
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

export default ProjectPage;

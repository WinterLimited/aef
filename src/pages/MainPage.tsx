import React, { useEffect, useRef, useState } from 'react';
import {
    Container, Box, Typography, Grid, Card, CardContent, CardActionArea, Button, IconButton, TextField,
    InputAdornment, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import axiosClient from '../axiosClient';

interface User {
    id: number;
    name: string;
}

interface Project {
    projectId: string;
    title: string;
    color: string;
}

const colors = ['#FF5252', '#FF9800', '#FFEA00', '#69F0AE', '#40C4FF'];

const MainPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [currentProjectId, setCurrentProjectId] = useState<null | string>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [isError, setIsError] = useState(false);
    const [resultMessage, setResultMessage] = useState('');
    const [newProject, setNewProject] = useState({ title: '', description: '', startDate: '', dueDate: '', team: [] as User[] });
    const [users, setUsers] = useState<User[]>([]);

    const fetchProjects = async () => {
        const role = sessionStorage.getItem('role');
        const apiUrl = role === 'admin' ? '/project/all' : '/project';
        try {
            const response = await axiosClient.get(apiUrl, {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
            });
            const projectsWithColors = response.data.map((project: Project, index: number) => ({
                ...project,
                color: colors[index % colors.length]
            }));
            setProjects(projectsWithColors);
            setFilteredProjects(projectsWithColors);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axiosClient.get('/user/all', {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchUsers();
    }, []);

    const handleProjectClick = (projectId: string) => {
        console.log(`Clicked on project ${projectId}`);
        navigate(`/project/${projectId}`);
    };

    const handleAddProject = () => {
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleResultModalClose = () => {
        setIsResultModalOpen(false);
    };

    const handleModalSave = async () => {
        try {
            const projectId = `project${projects.length + 1}`;
            const data = {
                projectId: projectId,
                title: newProject.title,
                description: newProject.description,
                startDate: newProject.startDate,
                dueDate: newProject.dueDate,
                userIds: [],
            };

            // 프로젝트 생성
            const response = await axiosClient.post('/project', data, {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
            });

            // 프로젝트 생성이 성공하면 참여자 추가
            if (response.status === 200) {
                const participantPromises = newProject.team.map(user =>
                    axiosClient.post(`/project/${projectId}/participant/${user.id}`, {}, {
                        headers: {
                            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                        },
                    })
                );

                // 모든 참여자 추가 요청을 병렬로 수행
                await Promise.all(participantPromises);
                setNewProject({ title: '', description: '', startDate: '', dueDate: '', team: [] as User[] })
                setResultMessage('프로젝트가 성공적으로 생성되었습니다.');
                setIsError(false);
            }
            setIsModalOpen(false);
            fetchProjects();
        } catch (error) {
            console.error('Failed to create project:', error);
            setResultMessage('프로젝트 생성에 실패했습니다.');
            setIsError(true);
        } finally {
            setIsResultModalOpen(true);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewProject(prevState => ({ ...prevState, [name]: value }));
    };

    const handleTeamChange = (event: any, value: User[]) => {
        setNewProject(prevState => ({ ...prevState, team: value }));
    };

    const scrollRef = useRef<HTMLDivElement>(null);

    const handleScrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const handleScrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const query = event.target.value;
        setSearchQuery(query);
        if (query === '') {
            setFilteredProjects(projects);
        } else {
            setFilteredProjects(
                projects.filter((project) =>
                    project.title.toLowerCase().includes(query.toLowerCase())
                )
            );
        }
    };

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, projectId: string) => {
        setAnchorEl(event.currentTarget);
        setCurrentProjectId(projectId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setCurrentProjectId(null);
    };

    const handleMenuItemClick = (action: string) => {
        if (action === 'details') {
            navigate(`/project/${currentProjectId}`);
        }
        console.log(`Action "${action}" on project ${currentProjectId}`);
        handleMenuClose();
    };

    return (
        <Container sx={{ height: '100vh', display: 'flex', alignItems: 'center', minWidth: '80%' }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    프로젝트를 선택해주세요
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <IconButton onClick={handleScrollLeft}>
                        <ArrowBackIosIcon />
                    </IconButton>
                    <Box ref={scrollRef} sx={{ overflowX: 'auto', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                        <Grid container spacing={4} sx={{ display: 'flex', flexWrap: 'nowrap' }}>
                            {filteredProjects.map((project) => (
                                <Grid item key={project.projectId} sx={{ flex: '0 0 auto' }}>
                                    <Card
                                        sx={{
                                            height: '300px',
                                            width: '300px',
                                            borderRadius: '16px',
                                            position: 'relative',
                                            backgroundColor: project.color,
                                        }}
                                    >
                                        <CardActionArea
                                            onClick={() => handleProjectClick(project.projectId)}
                                            sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <CardContent sx={{ flexGrow: 1 }}></CardContent>
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                                    padding: '8px',
                                                    borderBottomLeftRadius: '16px',
                                                    borderBottomRightRadius: '16px',
                                                }}
                                            >
                                                <Typography variant="h6" component="div" align="center" sx={{ color: 'white' }}>
                                                    {project.title}
                                                </Typography>
                                            </Box>
                                        </CardActionArea>
                                        <IconButton
                                            aria-label="settings"
                                            onClick={(event) => handleMenuOpen(event, project.projectId)}
                                            sx={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                color: 'white',
                                            }}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </Card>
                                </Grid>
                            ))}
                            {
                                sessionStorage.getItem('role') === 'admin' && (
                                    <Grid item sx={{ flex: '0 0 auto' }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleAddProject}
                                            sx={{
                                                height: '300px',
                                                width: '300px',
                                                borderRadius: '16px',
                                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                                color: 'white',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <AddIcon sx={{ fontSize: 48 }} />
                                                <Typography variant="h6" component="div" align="center" sx={{ mt: 1 }}>
                                                    프로젝트 추가
                                                </Typography>
                                            </Box>
                                        </Button>
                                    </Grid>
                                )
                            }
                        </Grid>
                    </Box>
                    <IconButton onClick={handleScrollRight}>
                        <ArrowForwardIosIcon />
                    </IconButton>
                </Box>
            </Box>
            <Box sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
            }}>
                {
                    sessionStorage.getItem('role') === 'admin' && (
                        <Box sx={{ marginBottom: 2 }}>
                            <IconButton
                                onClick={() => navigate('/user')}
                                sx={{
                                    backgroundColor: '#3f51b5',
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: '#303f9f',
                                    },
                                    transition: 'all 0.3s',
                                    width: '56px',
                                    height: '56px',
                                    fontSize: '2rem',
                                }}
                            >
                                <PersonAddIcon />
                            </IconButton>
                        </Box>
                    )
                }
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'row',  // Inline display
                    transition: 'all 0.3s',
                    width: isSearchOpen ? 'auto' : 'auto',  // Ensures inline layout
                    backgroundColor: isSearchOpen ? 'white' : 'transparent',
                    borderRadius: '24px',
                    boxShadow: isSearchOpen ? '0px 0px 15px rgba(0, 0, 0, 0.2)' : 'none',
                    overflow: 'hidden',
                    padding: isSearchOpen ? '8px' : '0',
                }}>
                    {isSearchOpen && (
                        <TextField
                            variant="outlined"
                            placeholder="프로젝트 검색"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            sx={{ flexGrow: 1, marginRight: 1 }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={toggleSearch}>
                                            <CloseIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                    <IconButton
                        onClick={toggleSearch}
                        sx={{
                            backgroundColor: isSearchOpen ? 'transparent' : '#FF9800',
                            color: isSearchOpen ? '#FF9800' : 'white',
                            '&:hover': {
                                backgroundColor: isSearchOpen ? 'transparent' : '#FF9800',
                                color: isSearchOpen ? '#FF9800' : 'white',
                            },
                            transition: 'all 0.3s',
                            width: '56px',
                            height: '56px',
                            fontSize: '2rem',
                            marginTop: isSearchOpen ? '0' : '0',
                        }}
                    >
                        <SearchIcon />
                    </IconButton>
                </Box>
            </Box>
            {
                sessionStorage.getItem('role') === 'admin' ? (
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={() => handleMenuItemClick('edit')}>수정</MenuItem>
                        <MenuItem onClick={() => handleMenuItemClick('delete')}>삭제</MenuItem>
                        <MenuItem onClick={() => handleMenuItemClick('details')}>상세정보</MenuItem>
                    </Menu>
                ) : (
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={() => handleMenuItemClick('details')}>상세정보</MenuItem>
                    </Menu>
                )
            }
            <Dialog open={isModalOpen} onClose={handleModalClose}>
                <DialogTitle>새 프로젝트 생성</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="title"
                        label="프로젝트 이름"
                        type="text"
                        fullWidth
                        value={newProject.title}
                        onChange={handleInputChange}
                        sx={{ marginBottom: 2 }}
                    />
                    <TextField
                        margin="dense"
                        name="description"
                        label="프로젝트 설명"
                        type="text"
                        fullWidth
                        value={newProject.description}
                        onChange={handleInputChange}
                        sx={{ marginBottom: 2 }}
                    />
                    <TextField
                        margin="dense"
                        name="startDate"
                        label="시작일"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={newProject.startDate}
                        onChange={handleInputChange}
                        sx={{ marginBottom: 2 }}
                    />
                    <TextField
                        margin="dense"
                        name="dueDate"
                        label="종료일"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={newProject.dueDate}
                        onChange={handleInputChange}
                        sx={{ marginBottom: 2 }}
                    />
                    <Autocomplete
                        multiple
                        options={users.filter((user) => user.id !== 1)}
                        getOptionLabel={(option) => option.name}
                        filterSelectedOptions
                        value={newProject.team}
                        onChange={handleTeamChange}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="standard"
                                label="팀원"
                                placeholder="팀원 선택"
                            />
                        )}
                        sx={{ marginBottom: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleModalClose} color="primary">
                        취소
                    </Button>
                    <Button onClick={handleModalSave} color="primary">
                        저장
                    </Button>
                </DialogActions>
            </Dialog>
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

export default MainPage;

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import ProjectPage from './pages/ProjectPage';
import IssuePage from './pages/IssuePage';
import UserPage from './pages/UserPage';
import PrivateRoute from './PrivateRoute';

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route element={<PrivateRoute />}>
                    <Route path="/main" element={<MainPage />} />
                    <Route path="/project/:projectId" element={<ProjectPage />} />
                    <Route path="/project/:projectId/issues/:issueId" element={<IssuePage />} />
                    <Route path="/user" element={<UserPage />} />
                </Route>
            </Routes>
        </Router>
    );
};

export default App;

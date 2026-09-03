import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import JobPostings from './pages/JobPostings';
import Companies from './pages/Companies';
import CoverLetters from './pages/CoverLetters';
import Resumes from './pages/Resumes';
import Schedules from './pages/Schedules';
import Tags from './pages/Tags';
import Search from './pages/Search';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="job-postings" element={<JobPostings />} />
            <Route path="companies" element={<Companies />} />
            <Route path="cover-letters" element={<CoverLetters />} />
            <Route path="resumes" element={<Resumes />} />
            <Route path="schedules" element={<Schedules />} />
            <Route path="tags" element={<Tags />} />
            <Route path="search" element={<Search />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

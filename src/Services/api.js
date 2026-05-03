import axios from 'axios';

const API_URL = 'https://jobportalbackend-celm.onrender.com';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});



export const authAPI = {

    register: (userData) => api.post('/auth/register', userData),

    login: (credentials) => api.post('/auth/login', credentials),


    verify: (token) => api.get(`/auth/verify?token=${token}`)
};




export const userAPI = {

    getOpenJobs: () => api.get('/user/jobs'),


    applyForJob: (jobId) => api.post(`/user/apply/${jobId}`),

    getMyApplications: () => api.get('/user/application')
};




export const adminJobAPI = {

    createJob: (jobData) => api.post('/admin/job/createJob', jobData),


    updateJob: (jobId, jobData) => api.put(`/admin/job/${jobId}`, jobData),


    deleteJob: (jobId) => api.delete(`/admin/job/${jobId}`),


    getAllJobs: () => api.get('/admin/job/alljobs')
};




export const adminAppAPI = {
    // Updates status. Status must be: 'APPLIED', 'APPROVED', 'INPROCESS', or 'REJECTED'
    updateStatus: (applicationId, status) =>
        api.put(`/admin/Application/${applicationId}?status=${status}`),

    // Gets all users who applied to a specific job
    getApplicationsByJob: (jobId) =>
        api.get(`/admin/Application/job/${jobId}`)
};
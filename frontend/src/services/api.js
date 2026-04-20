import axios from 'axios';

export const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const API_BASE_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Notice API
export const noticeAPI = {
    getAllNotices: (page = 1, limit = 10, category = '', priority = '') => {
        return api.get('/notices', {
            params: { page, limit, category, priority }
        });
    },
    getNoticesForMonth: (month = 1, year = 2026) => {
        return api.get(`/notices/month/${month}/${year}`);
    },
    getNoticeById: (id) => api.get(`/notices/${id}`),
    createNotice: (data, files) => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('content', data.content);
        formData.append('category', data.category);
        formData.append('priority', data.priority);
        formData.append('targetRole', data.targetRole);
        if (data.expiryDate) formData.append('expiryDate', data.expiryDate);
        if (data.date) formData.append('date', data.date);
        
        if (files && files.length > 0) {
            files.forEach(file => formData.append('attachments', file));
        }
        
        return api.post('/notices', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    updateNotice: (id, data, files) => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('content', data.content);
        formData.append('category', data.category);
        formData.append('priority', data.priority);
        formData.append('targetRole', data.targetRole);
        if (data.expiryDate) formData.append('expiryDate', data.expiryDate);
        
        if (files && files.length > 0) {
            files.forEach(file => formData.append('attachments', file));
        }
        
        return api.put(`/notices/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    deleteNotice: (id) => api.delete(`/notices/${id}`),
    downloadAttachment: (noticeId, attachmentIndex) => 
        api.get(`/notices/${noticeId}/download/${attachmentIndex}`, {
            responseType: 'blob'
        })
};

// Event API
export const eventAPI = {
    getAllEvents: (month = '', year = '', category = '') => {
        return api.get('/events', {
            params: { month, year, category }
        });
    },
    getEventById: (id) => api.get(`/events/${id}`),
    getEventsForMonth: (month, year) => 
        api.get(`/events/month/${month}/${year}`),
    createEvent: (data) => api.post('/events', data),
    updateEvent: (id, data) => api.put(`/events/${id}`, data),
    deleteEvent: (id) => api.delete(`/events/${id}`),
    registerForEvent: (id) => api.post(`/events/${id}/register`),
    unregisterFromEvent: (id) => api.delete(`/events/${id}/unregister`)
};

// Notification API
export const notificationAPI = {
    getNotifications: (page = 1, limit = 20, unreadOnly = false) => {
        return api.get('/notifications', {
            params: { page, limit, unreadOnly }
        });
    },
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/mark-all-read'),
    deleteNotification: (id) => api.delete(`/notifications/${id}`),
    deleteAllNotifications: () => api.delete('/notifications')
};

export default api;

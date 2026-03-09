import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { notificationAPI } from '../services/api';

export default function NotificationsPanel() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showPanel, setShowPanel] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch notifications
    const fetchNotifications = async (page = 1) => {
        try {
            setLoading(true);
            const response = await notificationAPI.getNotifications(page, 20);
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unreadCount);
            setTotalPages(response.data.pages);
            setCurrentPage(page);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(() => fetchNotifications(), 30000);
        return () => clearInterval(interval);
    }, []);

    // Mark as read
    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationAPI.markAsRead(notificationId);
            fetchNotifications(currentPage);
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    // Mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            fetchNotifications(currentPage);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    // Delete notification
    const handleDeleteNotification = async (notificationId) => {
        try {
            await notificationAPI.deleteNotification(notificationId);
            fetchNotifications(currentPage);
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    // Delete all notifications
    const handleDeleteAll = async () => {
        if (window.confirm('Are you sure you want to delete all notifications?')) {
            try {
                await notificationAPI.deleteAllNotifications();
                fetchNotifications();
            } catch (error) {
                console.error('Failed to delete all notifications:', error);
            }
        }
    };

    // Get icon based on notification type
    const getNotificationIcon = (type) => {
        const icons = {
            notice: '📢',
            event: '📅',
            assignment: '📝',
            attendance: '✅',
            result: '📊',
            general: 'ℹ️'
        };
        return icons[type] || icons.general;
    };

    // Get priority color
    const getPriorityColor = (priority) => {
        const colors = {
            low: 'border-l-4 border-blue-400 bg-blue-50',
            normal: 'border-l-4 border-gray-400 bg-gray-50',
            high: 'border-l-4 border-orange-400 bg-orange-50',
            urgent: 'border-l-4 border-red-400 bg-red-50'
        };
        return colors[priority] || colors.normal;
    };

    return (
        <div className="relative">
            {/* Notification Bell Button */}
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition"
                title="Notifications"
            >
                <Bell className="w-6 h-6 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full w-6 h-6">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {showPanel && (
                <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white flex items-center justify-between sticky top-0">
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            <h3 className="font-bold">Notifications</h3>
                        </div>
                        <button
                            onClick={() => setShowPanel(false)}
                            className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Actions */}
                    {notifications.length > 0 && (
                        <div className="border-b bg-gray-50 p-3 flex gap-2 text-xs">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="flex-1 px-3 py-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded font-semibold transition"
                                >
                                    Mark all read
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    className="flex-1 px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded font-semibold transition"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    )}

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="text-center py-8 text-gray-600">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <p className="text-sm mt-2">Loading...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8 text-gray-600">
                                <Bell className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {notifications.map(notification => (
                                    <div
                                        key={notification._id}
                                        className={`p-4 hover:bg-gray-50 transition cursor-pointer ${getPriorityColor(notification.priority)} ${!notification.isRead ? 'font-semibold' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-xl flex-shrink-0 mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-gray-900">{notification.title}</p>
                                                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                                    </div>
                                                    {!notification.isRead && (
                                                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 mt-2 ml-9">
                                            {!notification.isRead && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsRead(notification._id);
                                                    }}
                                                    className="text-xs px-2 py-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded transition"
                                                >
                                                    Mark read
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteNotification(notification._id);
                                                }}
                                                className="text-xs px-2 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded transition"
                                            >
                                                <Trash2 className="w-3 h-3 inline mr-1" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="border-t bg-gray-50 p-3 flex gap-2 justify-center text-xs">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => fetchNotifications(page)}
                                    className={`px-2 py-1 rounded transition ${
                                        currentPage === page
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

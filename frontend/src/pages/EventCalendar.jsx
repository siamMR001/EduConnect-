import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users, Clock, Plus, X } from 'lucide-react';
import { eventAPI } from '../services/api';

export default function EventCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        endDate: '',
        time: '',
        location: '',
        category: 'academic',
        targetRole: 'all',
        capacity: ''
    });

    const categories = ['academic', 'sports', 'club', 'holiday', 'cultural', 'other'];
    const targetRoles = ['all', 'teacher', 'student_guardian', 'admin'];

    // Fetch events for current month
    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await eventAPI.getEventsForMonth(
                currentDate.getMonth() + 1,
                currentDate.getFullYear()
            );
            setEvents(response.data);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    // Get days in month
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    // Get first day of month (0-6, where 0 is Sunday)
    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    // Get events for a specific date
    const getEventsForDate = (day) => {
        return events.filter(event => {
            const eventDate = new Date(event.date);
            return (
                eventDate.getDate() === day &&
                eventDate.getMonth() === currentDate.getMonth() &&
                eventDate.getFullYear() === currentDate.getFullYear()
            );
        });
    };

    // Handle previous month
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
        setSelectedDate(null);
        setSelectedEvent(null);
    };

    // Handle next month
    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
        setSelectedDate(null);
        setSelectedEvent(null);
    };

    // Handle create event
    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            await eventAPI.createEvent({
                ...formData,
                capacity: formData.capacity ? parseInt(formData.capacity) : null
            });
            setShowCreateForm(false);
            setFormData({
                title: '',
                description: '',
                date: '',
                endDate: '',
                time: '',
                location: '',
                category: 'academic',
                targetRole: 'all',
                capacity: ''
            });
            fetchEvents();
        } catch (error) {
            console.error('Failed to create event:', error);
            alert('Failed to create event');
        }
    };

    // Get color for category
    const getCategoryColor = (category) => {
        const colors = {
            academic: 'bg-blue-500',
            sports: 'bg-green-500',
            club: 'bg-purple-500',
            holiday: 'bg-red-500',
            cultural: 'bg-yellow-500',
            other: 'bg-gray-500'
        };
        return colors[category] || colors.other;
    };

    // Calendar grid
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const calendarDays = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthName = currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });

    // Filter events by category
    const filteredEvents = categoryFilter
        ? events.filter(event => event.category === categoryFilter)
        : events;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-blue-600" />
                        <h1 className="text-4xl font-bold text-gray-900">Event Calendar</h1>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                        <Plus className="w-5 h-5" />
                        New Event
                    </button>
                </div>
            </div>

            {/* Create Event Form */}
            {showCreateForm && (
                <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleCreateEvent} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter event title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                                placeholder="Event description"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Time (HH:MM)</label>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Event location"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Target Role</label>
                                <select
                                    value={formData.targetRole}
                                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {targetRoles.map(role => (
                                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Capacity (Optional)</label>
                            <input
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Maximum participants"
                                min="1"
                            />
                        </div>

                        <div className="flex gap-4 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                            >
                                Create Event
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    {/* Month navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={goToPreviousMonth}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <ChevronLeft className="w-6 h-6 text-gray-600" />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-semibold hover:bg-blue-200 transition"
                            >
                                Today
                            </button>
                            <button
                                onClick={goToNextMonth}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <ChevronRight className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Weekday headers */}
                            <div className="grid grid-cols-7 gap-2 mb-2">
                                {weekDays.map(day => (
                                    <div key={day} className="text-center font-semibold text-gray-600 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays.map((day, idx) => {
                                    if (!day) {
                                        return <div key={`empty-${idx}`} className="h-24 bg-gray-50 rounded-lg"></div>;
                                    }

                                    const dayEvents = getEventsForDate(day);
                                    const isToday =
                                        day === new Date().getDate() &&
                                        currentDate.getMonth() === new Date().getMonth() &&
                                        currentDate.getFullYear() === new Date().getFullYear();

                                    return (
                                        <div
                                            key={day}
                                            onClick={() => setSelectedDate(day)}
                                            className={`h-24 p-2 rounded-lg cursor-pointer transition border-2 ${
                                                selectedDate === day
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : isToday
                                                    ? 'border-blue-400 bg-blue-50'
                                                    : dayEvents.length > 0
                                                    ? 'border-gray-300 bg-gray-50'
                                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className={`text-sm font-bold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                                                {day}
                                            </div>
                                            <div className="space-y-1 overflow-y-auto max-h-16">
                                                {dayEvents.slice(0, 3).map((event, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedEvent(event);
                                                        }}
                                                        className={`text-xs px-2 py-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition ${getCategoryColor(event.category)}`}
                                                    >
                                                        {event.title}
                                                    </div>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <div className="text-xs text-gray-600 px-2">
                                                        +{dayEvents.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Events Sidebar */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 h-fit">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Upcoming Events</h3>

                    {/* Category filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-sm"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                        ))}
                    </select>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredEvents.length === 0 ? (
                            <p className="text-gray-600 text-sm">No events scheduled</p>
                        ) : (
                            filteredEvents.slice(0, 10).map(event => (
                                <div
                                    key={event._id}
                                    onClick={() => setSelectedEvent(event)}
                                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition"
                                >
                                    <div className="flex items-start gap-2">
                                        <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getCategoryColor(event.category)}`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 truncate text-sm">{event.title}</p>
                                            <p className="text-xs text-gray-600">
                                                {new Date(event.date).toLocaleDateString()}
                                            </p>
                                            {event.time && (
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {event.time}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                        <div className={`${getCategoryColor(selectedEvent.category)} p-6 text-white`}>
                            <div className="flex items-start justify-between">
                                <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="text-sm text-gray-600">
                                <span className="font-semibold text-gray-900">{selectedEvent.category.toUpperCase()}</span>
                            </div>

                            {selectedEvent.description && (
                                <div>
                                    <p className="text-gray-700">{selectedEvent.description}</p>
                                </div>
                            )}

                            <div className="border-t pt-4 space-y-2">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
                                    {selectedEvent.endDate && (
                                        <>
                                            <span>to</span>
                                            <span>{new Date(selectedEvent.endDate).toLocaleDateString()}</span>
                                        </>
                                    )}
                                </div>

                                {selectedEvent.time && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Clock className="w-4 h-4" />
                                        <span>{selectedEvent.time}</span>
                                    </div>
                                )}

                                {selectedEvent.location && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <MapPin className="w-4 h-4" />
                                        <span>{selectedEvent.location}</span>
                                    </div>
                                )}

                                {selectedEvent.capacity && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Users className="w-4 h-4" />
                                        <span>{selectedEvent.registeredUsers?.length || 0} / {selectedEvent.capacity} registered</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

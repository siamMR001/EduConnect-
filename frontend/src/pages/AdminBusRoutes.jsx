import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import axios from 'axios';

const AdminBusRoutes = () => {
    const [routes, setRoutes] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        routeName: '', startName: '', startLat: '', startLng: '',
        destName: '', destLat: '', destLng: '', departureTime: '', reachingTime: ''
    });

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/bus-routes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoutes(res.data);
        } catch (err) {
            console.error('Error fetching routes:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/bus-routes`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsAdding(false);
            fetchRoutes();
        } catch (err) {
            console.error('Error adding route:', err);
            alert('Failed to add route');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this route?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/bus-routes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRoutes();
        } catch (err) {
            console.error('Error deleting route:', err);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-8 px-4 animate-fade-in-up">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Manage Bus Routes</h1>
                    <p className="text-slate-400">Fixed routes for drivers to follow</p>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)} 
                    className={isAdding ? "btn-primary flex items-center gap-2 bg-red-500 hover:bg-red-600 shadow-red-500/20" : "btn-primary flex items-center gap-2"}
                >
                    {isAdding ? <X size={20} /> : <Plus size={20} />} 
                    {isAdding ? 'Cancel' : 'Add Route'}
                </button>
            </header>

            {isAdding && (
                <div className="glass-panel p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">Add New Route</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input className="input-field" placeholder="Route Name (e.g. Route A - Uttara to Badda)" value={formData.routeName} onChange={e => setFormData({...formData, routeName: e.target.value})} required />
                        <div className="grid grid-cols-2 gap-2">
                            <input className="input-field" placeholder="Departure Time (07:00 AM)" value={formData.departureTime} onChange={e => setFormData({...formData, departureTime: e.target.value})} required />
                            <input className="input-field" placeholder="Reaching Time (08:15 AM)" value={formData.reachingTime} onChange={e => setFormData({...formData, reachingTime: e.target.value})} required />
                        </div>

                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                            <h3 className="text-sm font-bold text-slate-400">Start Location</h3>
                            <input className="input-field" placeholder="Name (e.g. Uttara)" value={formData.startName} onChange={e => setFormData({...formData, startName: e.target.value})} required />
                            <div className="grid grid-cols-2 gap-2">
                                <input className="input-field" type="number" step="any" placeholder="Latitude" value={formData.startLat} onChange={e => setFormData({...formData, startLat: e.target.value})} required />
                                <input className="input-field" type="number" step="any" placeholder="Longitude" value={formData.startLng} onChange={e => setFormData({...formData, startLng: e.target.value})} required />
                            </div>
                        </div>

                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                            <h3 className="text-sm font-bold text-slate-400">Destination</h3>
                            <input className="input-field" placeholder="Name (e.g. Badda)" value={formData.destName} onChange={e => setFormData({...formData, destName: e.target.value})} required />
                            <div className="grid grid-cols-2 gap-2">
                                <input className="input-field" type="number" step="any" placeholder="Latitude" value={formData.destLat} onChange={e => setFormData({...formData, destLat: e.target.value})} required />
                                <input className="input-field" type="number" step="any" placeholder="Longitude" value={formData.destLng} onChange={e => setFormData({...formData, destLng: e.target.value})} required />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary md:col-span-2 mt-4">Save Route</button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {routes.map(route => (
                    <div key={route._id} className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">{route.routeName}</h3>
                            <p className="text-sm text-slate-400 mb-2">
                                <span className="font-bold text-primary-light">{route.startName}</span> 
                                {' '}→{' '}
                                <span className="font-bold text-primary-light">{route.destName}</span>
                            </p>
                            <p className="text-sm text-slate-400">
                                Departure: <span className="text-white">{route.departureTime}</span> | Arrival: <span className="text-white">{route.reachingTime}</span>
                            </p>
                        </div>
                        <button onClick={() => handleDelete(route._id)} className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
                {routes.length === 0 && <p className="text-center text-slate-400 py-8">No fixed routes defined yet.</p>}
            </div>
        </div>
    );
};

export default AdminBusRoutes;

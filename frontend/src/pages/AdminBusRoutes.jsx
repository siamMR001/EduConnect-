import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, MapPin, Clock, Search, Loader2 } from 'lucide-react';
import axios from 'axios';

// Defined OUTSIDE the parent to prevent re-creation on every render
const LocationSearchField = ({ label, value, onChange, suggestions, loading, onSelect, isPinned, icon }) => (
    <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
        <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
            {icon} {label}
        </h3>
        <div className="relative">
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    className="input-field pl-9 pr-9 w-full"
                    placeholder={`Search ${label} location...`}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    autoComplete="off"
                />
                {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
            </div>
            {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-[#1a1a3a] border border-white/10 rounded-xl mt-1 overflow-hidden shadow-2xl">
                    {suggestions.map((f, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onSelect(f)}
                            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 border-b border-white/5 last:border-0 flex items-start gap-2 transition-colors"
                        >
                            <MapPin size={13} className="text-primary-light shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{f.place_name || f.text}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
        {isPinned && (
            <p className="text-[10px] text-green-400 flex items-center gap-1">
                ✓ Location pinned
            </p>
        )}
    </div>
);

const AdminBusRoutes = () => {
    const [routes, setRoutes] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        routeName: '', startName: '', startLat: '', startLng: '',
        destName: '', destLat: '', destLng: '', departureTime: '', reachingTime: ''
    });
    const [startSearch, setStartSearch] = useState('');
    const [destSearch, setDestSearch] = useState('');
    const [startSuggestions, setStartSuggestions] = useState([]);
    const [destSuggestions, setDestSuggestions] = useState([]);
    const [startLoading, setStartLoading] = useState(false);
    const [destLoading, setDestLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const skipStartSearch = React.useRef(false);
    const skipDestSearch = React.useRef(false);

    const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

    useEffect(() => { fetchRoutes(); }, []);

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

    // Geocode search using MapTiler
    const geocodeSearch = async (query, setSuggestions, setLoading) => {
        if (!query || query.length < 3) { setSuggestions([]); return; }
        setLoading(true);
        try {
            const res = await fetch(
                `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&limit=5&country=bd`
            );
            const data = await res.json();
            setSuggestions(data.features || []);
        } catch (e) {
            console.error('Geocode error:', e);
        } finally {
            setLoading(false);
        }
    };

    // Debounced search for start — skip if a suggestion was just selected
    useEffect(() => {
        if (skipStartSearch.current) { skipStartSearch.current = false; return; }
        const t = setTimeout(() => geocodeSearch(startSearch, setStartSuggestions, setStartLoading), 400);
        return () => clearTimeout(t);
    }, [startSearch]);

    // Debounced search for destination — skip if a suggestion was just selected
    useEffect(() => {
        if (skipDestSearch.current) { skipDestSearch.current = false; return; }
        const t = setTimeout(() => geocodeSearch(destSearch, setDestSuggestions, setDestLoading), 400);
        return () => clearTimeout(t);
    }, [destSearch]);

    const selectStart = (feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const name = feature.place_name || feature.text;
        skipStartSearch.current = true;
        setFormData(f => ({ ...f, startName: name, startLat: lat, startLng: lng }));
        setStartSearch(name);
        setStartSuggestions([]);
    };

    const selectDest = (feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const name = feature.place_name || feature.text;
        skipDestSearch.current = true;
        setFormData(f => ({ ...f, destName: name, destLat: lat, destLng: lng }));
        setDestSearch(name);
        setDestSuggestions([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.startLat || !formData.destLat) {
            alert('Please select a location from the dropdown suggestions for both Start and Destination.');
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/bus-routes`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsAdding(false);
            setFormData({ routeName: '', startName: '', startLat: '', startLng: '', destName: '', destLat: '', destLng: '', departureTime: '', reachingTime: '' });
            setStartSearch(''); setDestSearch('');
            fetchRoutes();
        } catch (err) {
            console.error('Error adding route:', err);
            alert('Failed to add route');
        } finally {
            setSaving(false);
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
                    <p className="text-slate-400">Define fixed routes for bus tracking</p>
                </div>
                <button
                    onClick={() => { setIsAdding(!isAdding); }}
                    className={isAdding ? "btn-primary flex items-center gap-2 bg-red-500 hover:bg-red-600 shadow-red-500/20" : "btn-primary flex items-center gap-2"}
                >
                    {isAdding ? <X size={20} /> : <Plus size={20} />}
                    {isAdding ? 'Cancel' : 'Add Route'}
                </button>
            </header>

            {isAdding && (
                <div className="glass-panel p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-6">Add New Route</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Route Name */}
                        <input
                            className="input-field w-full"
                            placeholder="Route Name (e.g. Route A — Uttara to Badda)"
                            value={formData.routeName}
                            onChange={e => setFormData({ ...formData, routeName: e.target.value })}
                            required
                        />

                        {/* Times */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Clock size={12} /> Departure Time
                                </label>
                                <input
                                    type="time"
                                    className="input-field w-full"
                                    value={formData.departureTime}
                                    onChange={e => setFormData({ ...formData, departureTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Clock size={12} /> Arrival Time
                                </label>
                                <input
                                    type="time"
                                    className="input-field w-full"
                                    value={formData.reachingTime}
                                    onChange={e => setFormData({ ...formData, reachingTime: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <LocationSearchField
                                label="Start Location"
                                value={startSearch}
                                onChange={setStartSearch}
                                suggestions={startSuggestions}
                                loading={startLoading}
                                onSelect={selectStart}
                                isPinned={!!formData.startLat}
                                icon={<MapPin size={13} className="text-green-400" />}
                            />
                            <LocationSearchField
                                label="Destination"
                                value={destSearch}
                                onChange={setDestSearch}
                                suggestions={destSuggestions}
                                loading={destLoading}
                                onSelect={selectDest}
                                isPinned={!!formData.destLat}
                                icon={<MapPin size={13} className="text-red-400" />}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
                        >
                            {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save Route'}
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {routes.map(route => (
                    <div key={route._id} className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">{route.routeName}</h3>
                            <p className="text-sm text-slate-400 mb-2">
                                <span className="font-bold text-green-400">{route.startName}</span>
                                {' '}→{' '}
                                <span className="font-bold text-red-400">{route.destName}</span>
                            </p>
                            <p className="text-sm text-slate-400">
                                Departure: <span className="text-white">{route.departureTime}</span>
                                {' | '}
                                Arrival: <span className="text-white">{route.reachingTime}</span>
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

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
import { Clock, Navigation2, Bus } from 'lucide-react';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Bus Icon
const busIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png', // Free flat icon for bus
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

const BusTrackingMap = () => {
    const [activeBuses, setActiveBuses] = useState({});
    const [arrivalNotifs, setArrivalNotifs] = useState([]);
    const socketRef = useRef(null);

    // Dhaka coordinates as default center
    const defaultCenter = [23.8103, 90.4125];

    // Haversine formula to calculate distance in km
    const getDistanceKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return (R * c).toFixed(2);
    };

    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_API_URL);

        socketRef.current.on("bus-moved", (data) => {
            if (!data.driverId) return; // ignore invalid data
            
            setActiveBuses(prev => ({
                ...prev,
                [data.driverId]: {
                    position: [data.lat, data.lng],
                    speed: data.speed || 0,
                    lastUpdated: new Date(data.timestamp),
                    tripDetails: data.tripDetails,
                    driverName: data.driverName || 'Unknown Driver',
                    routePath: prev[data.driverId]?.routePath ? [...prev[data.driverId].routePath, [data.lat, data.lng]] : [[data.lat, data.lng]]
                }
            }));
        });

        socketRef.current.on("bus-arrived", (data) => {
            // Remove the bus from active buses
            setActiveBuses(prev => {
                const updated = { ...prev };
                delete updated[data.driverId];
                return updated;
            });

            // Show toast notification
            setArrivalNotifs(prev => [...prev, data]);
            
            // Auto remove toast after 10 seconds
            setTimeout(() => {
                setArrivalNotifs(prev => prev.filter(notif => notif.driverId !== data.driverId));
            }, 10000);
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const busList = Object.values(activeBuses);
    const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY;
    const mapUrl = `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${mapTilerKey}`;

    return (
        <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-fade-in-up">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 glass-panel py-4 px-6 border-b border-white/10 gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-light to-white">
                        Live Bus Tracking
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {busList.length > 0 ? `${busList.length} Buses Currently Active on Routes` : 'Track the school bus in real-time'}
                    </p>
                </div>
            </header>

            {/* Arrival Notifications */}
            <div className="fixed top-24 right-8 z-[2000] flex flex-col gap-3">
                {arrivalNotifs.map((notif, idx) => (
                    <div key={idx} className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl shadow-green-900/50 flex items-center gap-3 animate-fade-in-up border border-green-400/50">
                        <div className="bg-white/20 p-2 rounded-full">
                            <Bus size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">Bus Arrived!</h4>
                            <p className="text-xs text-green-100">{notif.driverName} reached {notif.destName}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-panel overflow-hidden border border-white/10 shadow-2xl relative" style={{ height: '600px' }}>
                {busList.length === 0 && (
                    <div className="absolute inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                        <h3 className="text-xl font-bold text-white mb-2">Waiting for Buses...</h3>
                        <p className="text-slate-400">No active drivers are sharing locations right now.</p>
                    </div>
                )}

                <MapContainer 
                    center={busList.length > 0 ? busList[0].position : defaultCenter} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a>'
                        url={mapUrl}
                    />

                    {busList.map((bus, idx) => (
                        <React.Fragment key={idx}>
                            <Marker position={bus.position} icon={busIcon}>
                                <Popup className="custom-popup">
                                    <div className="text-center">
                                        <p className="font-bold text-slate-800 text-sm mb-1">{bus.driverName}</p>
                                        <p className="text-xs text-blue-600 font-bold mb-1">{bus.tripDetails?.routeName}</p>
                                        <div className="text-xs text-slate-600 mb-1">
                                            {bus.tripDetails?.startName} → {bus.tripDetails?.destName}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200">
                                            <div>
                                                <span className="block text-[10px] text-slate-400">Speed</span>
                                                <span className="font-bold">{Math.round(bus.speed * 3.6)} km/h</span>
                                            </div>
                                            {bus.tripDetails?.destLat ? (
                                                <div>
                                                    <span className="block text-[10px] text-slate-400">Distance</span>
                                                    <span className="font-bold text-green-600">
                                                        {getDistanceKm(bus.position[0], bus.position[1], bus.tripDetails.destLat, bus.tripDetails.destLng)} km
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                            {bus.routePath.length > 1 && (
                                <Polyline positions={bus.routePath} color="#3b82f6" weight={4} opacity={0.7} />
                            )}
                        </React.Fragment>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default BusTrackingMap;

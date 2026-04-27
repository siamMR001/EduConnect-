import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { MapPin, Navigation, StopCircle, Radio, Bus } from 'lucide-react';
import axios from 'axios';

const BusDriverPanel = () => {
    const [isSharing, setIsSharing] = useState(false);
    const [status, setStatus] = useState('Idle');
    const [position, setPosition] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const socketRef = useRef(null);
    const watchIdRef = useRef(null);
    const simulationIntervalRef = useRef(null);

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        // Fetch fixed routes from backend
        const fetchRoutes = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/bus-routes`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRoutes(res.data);
                if (res.data.length > 0) setSelectedRoute(res.data[0]);
            } catch (err) {
                console.error('Error fetching routes:', err);
            }
        };
        fetchRoutes();
        // Initialize socket connection
        socketRef.current = io(import.meta.env.VITE_API_URL);

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const startTrip = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setStatus('Locating...');

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, speed } = pos.coords;
                setPosition({ lat: latitude, lng: longitude, speed: speed || 0 });
                setIsSharing(true);
                setStatus('Live Tracking Active');

                // Emit location to server
                if (socketRef.current) {
                    console.log('[BusDriver] Emitting bus-location:', { lat: latitude, lng: longitude });
                    socketRef.current.emit('bus-location', {
                        driverId: user._id,
                        driverName: user.name,
                        lat: latitude,
                        lng: longitude,
                        speed: speed || 0,
                        timestamp: new Date().toISOString(),
                        tripDetails: {
                            routeName: selectedRoute?.routeName || 'Custom Route',
                            startName: selectedRoute?.startName || 'Current Location',
                            destName: selectedRoute?.destName || 'Unknown Destination',
                            destLat: selectedRoute?.destLat || 0,
                            destLng: selectedRoute?.destLng || 0,
                            departureTime: selectedRoute?.departureTime || '--:--',
                            reachingTime: selectedRoute?.reachingTime || '--:--'
                        }
                    });
                }
            },
            (error) => {
                console.error(error);
                setStatus('Error: ' + error.message);
                setIsSharing(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    };

    const stopTrip = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
        setIsSharing(false);
        setStatus('Trip Ended');
        setPosition(null);
    };
    const simulateMovement = () => {
        if (!selectedRoute) {
            alert('Please select a Fixed Route for the simulation.');
            return;
        }

        // Generate a smooth path between the two points
        const steps = 30; // 30 steps to reach destination
        const routePts = [];
        for (let i = 0; i <= steps; i++) {
            routePts.push({
                lat: selectedRoute.startLat + ((selectedRoute.destLat - selectedRoute.startLat) * (i / steps)),
                lng: selectedRoute.startLng + ((selectedRoute.destLng - selectedRoute.startLng) * (i / steps))
            });
        }

        let currentIndex = 0;

        setStatus('Simulating Route...');
        setIsSharing(true);

        simulationIntervalRef.current = setInterval(() => {
            if (currentIndex >= routePts.length) {
                clearInterval(simulationIntervalRef.current);
                setStatus('Arrived at Destination');
                setIsSharing(false);
                
                if (socketRef.current) {
                    socketRef.current.emit('bus-arrived', {
                        driverId: user._id,
                        driverName: user.name,
                        routeName: selectedRoute.routeName,
                        destName: selectedRoute.destName
                    });
                }
                return;
            }

            const currentPos = routePts[currentIndex];
            // Speed varies between 30 to 45 km/h (approx 8.3 to 12.5 m/s)
            const simulatedSpeed = Math.random() * 4.2 + 8.3; 

            setPosition({ lat: currentPos.lat, lng: currentPos.lng, speed: simulatedSpeed });

            if (socketRef.current) {
                console.log('[BusDriver] Simulating bus-location:', { lat: currentPos.lat, lng: currentPos.lng, step: currentIndex });
                socketRef.current.emit('bus-location', {
                    driverId: user._id,
                    driverName: user.name,
                    lat: currentPos.lat,
                    lng: currentPos.lng,
                    speed: simulatedSpeed,
                    timestamp: new Date().toISOString(),
                    tripDetails: {
                        routeName: selectedRoute.routeName,
                        startName: selectedRoute.startName,
                        destName: selectedRoute.destName,
                        destLat: selectedRoute.destLat,
                        destLng: selectedRoute.destLng,
                        departureTime: selectedRoute.departureTime,
                        reachingTime: selectedRoute.reachingTime
                    }
                });
            }

            currentIndex++;
        }, 2500); // Update every 2.5 seconds for smoother tracking
    };

    return (
        <div className="w-full max-w-2xl mx-auto py-12 px-4 animate-fade-in-up">
            <div className="glass-panel p-8 text-center relative overflow-hidden">
                {/* Background glow when active */}
                {isSharing && (
                    <div className="absolute inset-0 bg-green-500/10 animate-pulse pointer-events-none" />
                )}

                <div className="mb-8">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 transition-colors duration-500 ${isSharing ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-slate-800 text-slate-400 border border-white/10'}`}>
                        <Radio size={40} className={isSharing ? 'animate-pulse' : ''} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Driver Tracking Panel</h1>
                    <p className={`font-medium ${isSharing ? 'text-green-400' : 'text-slate-400'}`}>
                        Status: {status}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <MapPin className="text-primary-light mx-auto mb-2" size={24} />
                        <p className="text-sm text-slate-400 mb-1">Current Coordinates</p>
                        <p className="text-white font-mono text-sm">
                            {position ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : '---'}
                        </p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <Navigation className="text-blue-400 mx-auto mb-2" size={24} />
                        <p className="text-sm text-slate-400 mb-1">Current Speed</p>
                        <p className="text-white font-mono font-bold text-lg">
                            {position ? `${Math.round(position.speed * 3.6)} km/h` : '0 km/h'}
                        </p>
                    </div>
                </div>

                {!isSharing && (
                    <div className="bg-black/20 p-6 rounded-xl border border-white/5 mb-8 text-left">
                        <label className="block text-slate-300 font-bold mb-3 flex items-center gap-2">
                            <Bus size={18} className="text-primary-light" /> Select Assigned Route
                        </label>
                        <select 
                            className="input-field w-full text-base py-3"
                            value={selectedRoute?._id || ''}
                            onChange={(e) => setSelectedRoute(routes.find(r => r._id === e.target.value))}
                        >
                            <option value="" disabled>-- Choose a Fixed Route --</option>
                            {routes.map((route) => (
                                <option key={route._id} value={route._id}>
                                    {route.routeName} ({route.departureTime} - {route.reachingTime})
                                </option>
                            ))}
                        </select>

                        {selectedRoute && (
                            <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                                <p className="text-sm text-slate-300">
                                    <span className="font-bold text-white">Start:</span> {selectedRoute.startName}
                                </p>
                                <p className="text-sm text-slate-300 mt-1">
                                    <span className="font-bold text-white">Destination:</span> {selectedRoute.destName}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {isSharing ? (
                    <button
                        onClick={stopTrip}
                        className="btn-primary w-full py-4 flex justify-center items-center gap-2 bg-red-500 hover:bg-red-600 shadow-red-500/20 text-lg font-bold"
                    >
                        <StopCircle size={24} /> Stop Sharing Location
                    </button>
                ) : (
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={startTrip}
                            className="btn-primary w-full py-4 flex justify-center items-center gap-2 bg-green-500 hover:bg-green-600 shadow-green-500/20 text-lg font-bold"
                        >
                            <Navigation size={24} /> Start Real GPS
                        </button>
                        
                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-white/10"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">OR FOR TESTING</span>
                            <div className="flex-grow border-t border-white/10"></div>
                        </div>

                        <button
                            onClick={simulateMovement}
                            className="btn-secondary w-full py-4 flex justify-center items-center gap-2 text-lg font-bold border border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                        >
                            <Navigation size={24} /> Simulate Movement (For PC)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BusDriverPanel;

'use client';

import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    // Get credentials from environment variables
    const EXPECTED_USERNAME = process.env.NEXT_PUBLIC_APP_USERNAME;
    const EXPECTED_PIN = process.env.NEXT_PUBLIC_APP_PIN;

    useEffect(() => {
        const auth = sessionStorage.getItem('is_auth');
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === EXPECTED_USERNAME && pin === EXPECTED_PIN) {
            sessionStorage.setItem('is_auth', 'true');
            setIsAuthenticated(true);
            setError(false);
        } else {
            setError(true);
        }
    };

    if (isAuthenticated) return <>{children}</>;

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 overflow-y-auto py-10">
            <div className="bg-white w-full max-w-md p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl space-y-6 sm:space-y-8 border-2 sm:border-4 border-white">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-2xl sm:rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-blue-200">
                        <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 pt-3 sm:pt-4">RATU MOTOR</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs sm:text-sm">Akses Terbatas</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                    <div className="space-y-1 sm:space-y-2">
                        <label className="text-[10px] sm:text-sm font-black text-slate-400 uppercase ml-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:bg-white transition-all text-lg sm:text-xl font-bold outline-none"
                            placeholder="Masukkan Username"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                        <label className="text-[10px] sm:text-sm font-black text-slate-400 uppercase ml-2">PIN Keamanan</label>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:bg-white transition-all text-lg sm:text-xl font-bold outline-none"
                            placeholder="****"
                            maxLength={8}
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm sm:text-base font-bold text-center animate-shake">
                            Username atau PIN Salah!
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full p-4 sm:p-6 bg-blue-600 text-white rounded-2xl sm:rounded-3xl text-lg sm:text-2xl font-black shadow-xl shadow-blue-100 active:scale-95 transition-all"
                    >
                        MASUK SEKARANG
                    </button>
                </form>
            </div>
        </div>
    );
}

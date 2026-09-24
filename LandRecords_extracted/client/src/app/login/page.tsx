'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiFetcher from '@/utils/fetcher';
import { auth } from '@/utils/auth';

export default function LoginPage() {
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await apiFetcher.login(credentials);

            if (response.success) {
                // Store auth data
                auth.setAuthData(response.token, response.user);

                // Redirect to appropriate dashboard
                const dashboardRoute = auth.getDashboardRoute();
                router.push(dashboardRoute);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Land Registration System
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Sign in to your account
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="sr-only">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Username"
                                value={credentials.username}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={credentials.password}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="text-sm text-red-700">{error}</div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>

                    <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Demo Credentials</h3>
                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                            <div className="bg-gray-50 p-2 rounded">
                                <strong>Org1 (Registration):</strong><br />
                                user_portal / userpw<br />
                                clerk1 / clerkpw
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                                <strong>Org2 (Revenue):</strong><br />
                                survey1 / surveypw<br />
                                mro1 / mropw
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                                <strong>Org3 (Collectorate):</strong><br />
                                collector1 / collectorpw<br />
                                joint_collector1 / jointpw
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
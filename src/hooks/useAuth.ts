'use client';

import { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import type { User } from '@/types';

interface SessionResponse {
    data: { user: User; csrfToken: string } | null;
    error: { code: string; message: string } | null;
}

export function useAuth() {
    const { state, dispatch, addToast } = useAppContext();

    useEffect(() => {
        let cancelled = false;

        async function hydrate() {
            try {
                const res = await fetch('/api/auth/session', { credentials: 'include' });
                if (cancelled) return;

                if (res.ok) {
                    const json: SessionResponse = await res.json();
                    if (json.data) {
                        dispatch({ type: 'AUTH_SUCCESS', payload: json.data });
                    } else {
                        dispatch({ type: 'AUTH_LOGOUT' });
                    }
                } else {
                    dispatch({ type: 'AUTH_LOGOUT' });
                }
            } catch {
                if (!cancelled) dispatch({ type: 'AUTH_LOGOUT' });
            }
        }

        hydrate();
        return () => { cancelled = true; };
    }, [dispatch]);

    async function logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: state.auth.csrfToken
                    ? { 'X-CSRF-Token': state.auth.csrfToken }
                    : {},
            });
        } finally {
            dispatch({ type: 'AUTH_LOGOUT' });
        }
    }

    return {
        user: state.auth.user,
        status: state.auth.status,
        csrfToken: state.auth.csrfToken,
        logout,
        addToast,
    };
}

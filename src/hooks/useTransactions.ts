import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Services } from './useAuth';
import { subscribeToTransactions } from '../services/firestore';
import { Transaction } from '../types/transaction';
import { getSafeDate, parseStrictNumber } from '../utils/validation';

export function useTransactions(user: User | null, services: Services | null): Transaction[] {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        if (!user || !services) return;

        const unsubscribe = subscribeToTransactions(
            services.db,
            user.uid,
            services.appId,
            (docs) => {
                const sanitizedDocs = docs.map(d => ({
                    ...d,
                    date: getSafeDate(d.date),
                    total: parseStrictNumber(d.total),
                    items: Array.isArray(d.items)
                        ? d.items.map(i => ({
                            ...i,
                            price: parseStrictNumber(i.price)
                        }))
                        : []
                }));

                // Sort by date descending
                sanitizedDocs.sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );

                setTransactions(sanitizedDocs);
            }
        );

        return unsubscribe;
    }, [user, services]);

    return transactions;
}

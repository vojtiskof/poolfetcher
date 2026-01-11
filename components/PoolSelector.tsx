'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function PoolSelector() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentPool = searchParams.get('pool') || 'nymburk';
    const isComparing = searchParams.has('compare_with');

    const pools = [
        { id: 'nymburk', name: 'Nymburk' },
        { id: 'mb', name: 'Mladá Boleslav' },
    ];

    const handlePoolChange = (poolId: string) => {
        const params = new URLSearchParams(searchParams);
        const currentCompare = params.get('compare_with');

        // If we are switching TO the pool we are currently comparing WITH,
        // swap the comparison to the pool we are coming FROM (or just the other one).
        if (currentCompare === poolId) {
            const other = pools.find(p => p.id !== poolId)?.id;
            if (other) {
                params.set('compare_with', other);
            } else {
                params.delete('compare_with');
            }
        }

        params.set('pool', poolId);
        router.push(`/?${params.toString()}`);
    };

    const toggleComparison = (e: React.ChangeEvent<HTMLInputElement>) => {
        const params = new URLSearchParams(searchParams);
        if (e.target.checked) {
            // If current is nymburk, compare with mb, and vice versa.
            // Or just allow generic comparison.
            const other = pools.find(p => p.id !== currentPool)?.id || 'mb';
            params.set('compare_with', other);
        } else {
            params.delete('compare_with');
        }
        router.push(`/?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-md">
                {pools.map((pool) => (
                    <button
                        key={pool.id}
                        onClick={() => handlePoolChange(pool.id)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${currentPool === pool.id
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {pool.name}
                    </button>
                ))}
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                    type="checkbox"
                    checked={isComparing}
                    onChange={toggleComparison}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Porovnat bazény
            </label>
        </div>
    );
}

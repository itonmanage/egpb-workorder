export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="w-full">
            {/* Table Header Skeleton */}
            <div className="grid grid-cols-8 gap-4 p-4 bg-green-50 rounded-t-2xl border border-green-100">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                ))}
            </div>

            {/* Table Rows Skeleton */}
            <div className="bg-white rounded-b-2xl border-x border-b border-green-100">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="grid grid-cols-8 gap-4 p-4 border-b border-green-100 last:border-b-0"
                    >
                        {/* Ticket ID */}
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-20" />

                        {/* Area */}
                        <div className="h-6 bg-gray-200 rounded animate-pulse" />

                        {/* Location */}
                        <div className="h-6 bg-gray-200 rounded animate-pulse" />

                        {/* Department */}
                        <div className="h-6 bg-gray-200 rounded animate-pulse" />

                        {/* Type */}
                        <div className="h-6 bg-gray-200 rounded animate-pulse" />

                        {/* Request By */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
                        </div>

                        {/* Date */}
                        <div className="h-6 bg-gray-200 rounded animate-pulse" />

                        {/* Status */}
                        <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                        <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                    </div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-2" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-32" />
                </div>
            ))}
        </div>
    );
}

import { STATUS_CONFIG, TicketStatus } from '@/lib/constants';

interface BadgeProps {
    status: TicketStatus;
    children?: React.ReactNode;
}

export function Badge({ status, children }: BadgeProps) {
    const config = STATUS_CONFIG[status];

    return (
        <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
        >
            {children || config.label}
        </span>
    );
}

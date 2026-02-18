import SessionTimeout from '@/components/SessionTimeout';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <SessionTimeout />
            {children}
        </>
    );
}


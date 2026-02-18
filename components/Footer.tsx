import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-foreground text-green-50 py-12 px-6 md:px-12">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold mb-2">EGPB Ticket Job</h2>
                    <p className="text-green-200/80 text-sm max-w-xs">
                        Efficient repair tracking and management system for seamless operations.
                    </p>
                </div>

                <div className="flex gap-8 text-sm font-medium">
                    <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                    <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                    <Link href="#" className="hover:text-white transition-colors">Contact Support</Link>
                </div>

                <div className="text-xs text-green-200/60">
                    © {new Date().getFullYear()} EGPB. All rights reserved.
                </div>
            </div>
        </footer>
    );
}

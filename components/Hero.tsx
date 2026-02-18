import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative w-full min-h-[80vh] flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-20 overflow-hidden bg-gradient-to-br from-background via-green-50 to-green-100 dark:from-background dark:via-green-950 dark:to-green-900">
            <div className="flex-1 z-10 space-y-8 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-200/50 dark:bg-green-800/50 text-green-800 dark:text-green-200 text-xs font-semibold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Ticket System Live
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                    Seamless Repair <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">
                        Tracking & Support
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                    Report issues, track repair status, and manage your tickets efficiently with our streamlined EGPB platform.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link
                        href="/dashboard/create"
                        className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-foreground rounded-full hover:bg-foreground/90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                    >
                        Report an Issue
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-foreground bg-white border-2 border-green-100 rounded-full hover:bg-green-50 transition-all hover:-translate-y-1"
                    >
                        Track Ticket
                    </Link>
                </div>
            </div>

            <div className="flex-1 relative w-full h-[400px] md:h-[600px] flex items-center justify-center mt-12 md:mt-0">
                {/* Placeholder for 3D illustration - using CSS shapes for now */}
                <div className="relative w-64 h-64 md:w-96 md:h-96 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-[2rem] rotate-12 shadow-2xl shadow-green-500/30 animate-float">
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-[2rem] -rotate-6 scale-90"></div>
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-yellow-400 rounded-full blur-xl opacity-60"></div>
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-400 rounded-full blur-xl opacity-60"></div>
                </div>
            </div>
        </section>
    );
}

import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    colorClass?: string;
}

export default function FeatureCard({ title, description, icon: Icon, colorClass = "bg-green-100 text-green-600" }: FeatureCardProps) {
    return (
        <div className="group p-8 rounded-3xl bg-white dark:bg-green-950/50 border border-green-100 dark:border-green-900 hover:border-green-300 dark:hover:border-green-700 transition-all hover:shadow-xl hover:shadow-green-500/10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    );
}

import { ChevronDown } from 'lucide-react';

interface SelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: readonly string[] | string[];
    placeholder?: string;
    required?: boolean;
    error?: string;
    disabled?: boolean;
}

export function Select({
    label,
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    required = false,
    error,
    disabled = false,
}: SelectProps) {
    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-black mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className={`w-full px-4 py-3 rounded-xl border bg-white text-black focus:outline-none focus:ring-2 transition-all appearance-none [&>option]:bg-white [&>option]:text-black ${error
                            ? 'border-red-300 focus:ring-red-400'
                            : 'border-green-200 focus:ring-green-400'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <option value="">{placeholder}</option>
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    size={20}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}

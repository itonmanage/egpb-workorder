interface InputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'number';
    required?: boolean;
    error?: string;
    maxLength?: number;
    disabled?: boolean;
}

export function Input({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    required = false,
    error,
    maxLength,
    disabled = false,
}: InputProps) {
    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-black mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                disabled={disabled}
                className={`w-full px-4 py-3 rounded-xl border bg-white text-black focus:outline-none focus:ring-2 transition-all ${error
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-green-200 focus:ring-green-400'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <div className="flex justify-between items-center mt-1">
                {error && <p className="text-sm text-red-600">{error}</p>}
                {maxLength && (
                    <p className="text-xs text-gray-500 ml-auto">
                        {value.length}/{maxLength}
                    </p>
                )}
            </div>
        </div>
    );
}

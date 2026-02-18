'use client';

import { useState, useEffect, useRef } from 'react';

interface AssigneeInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: 'IT' | 'Engineer'; // Add type to separate IT and Engineer
}

export function AssigneeInput({ value, onChange, placeholder = 'Type assignee name...', className = '', type = 'IT' }: AssigneeInputProps) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [allAssignees, setAllAssignees] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Fetch all assignees on mount
    useEffect(() => {
        const fetchAssignees = async () => {
            try {
                // Add type parameter to API call
                const response = await fetch(`/api/assignees?type=${type}`);
                if (response.ok) {
                    const data = await response.json();
                    setAllAssignees(data.assignees || []);
                }
            } catch (error) {
                console.error('Error fetching assignees:', error);
            }
        };

        fetchAssignees();
    }, [type]);

    // Filter suggestions based on input
    useEffect(() => {
        if (value && value.trim()) {
            const filtered = allAssignees.filter(assignee =>
                assignee.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filtered);
        } else {
            setSuggestions(allAssignees.slice(0, 10)); // Show top 10 when empty
        }
    }, [value, allAssignees]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    onChange(suggestions[selectedIndex]);
                    setShowSuggestions(false);
                    setSelectedIndex(-1);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;
        }
    };

    const handleSuggestionClick = (assignee: string) => {
        onChange(assignee);
        setShowSuggestions(false);
        setSelectedIndex(-1);
    };

    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
            />

            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                    {suggestions.map((assignee, index) => (
                        <div
                            key={assignee}
                            onClick={() => handleSuggestionClick(assignee)}
                            className={`px-4 py-2 cursor-pointer transition-colors text-gray-900 ${index === selectedIndex
                                ? 'bg-blue-100 text-blue-900'
                                : 'hover:bg-gray-100'
                                }`}
                        >
                            {assignee}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

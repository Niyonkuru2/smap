import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
    rating: number;
    maxStars?: number;
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onRate?: (rating: number) => void;
    showCount?: boolean;
    count?: number;
}

export function RatingStars({ 
    rating, 
    maxStars = 5, 
    size = 'md',
    interactive = false,
    onRate,
    showCount = false,
    count = 0
}: RatingStarsProps) {
    const [hoverRating, setHoverRating] = useState(0);
    
    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-5 h-5',
        lg: 'w-7 h-7'
    };
    
    const handleClick = (starIndex: number) => {
        if (interactive && onRate) {
            onRate(starIndex);
        }
    };
    
    return (
        <div className="flex items-center gap-1">
            <div className="flex">
                {[...Array(maxStars)].map((_, index) => {
                    const starIndex = index + 1;
                    const isFilled = starIndex <= (hoverRating || rating);
                    
                    return (
                        <button
                            key={index}
                            type="button"
                            disabled={!interactive}
                            onClick={() => handleClick(starIndex)}
                            onMouseEnter={() => interactive && setHoverRating(starIndex)}
                            onMouseLeave={() => interactive && setHoverRating(0)}
                            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                        >
                            <Star 
                                className={`${sizeClasses[size]} ${
                                    isFilled 
                                        ? 'fill-green-500 text-green-500' 
                                        : 'fill-gray-200 text-gray-300 dark:fill-gray-600 dark:text-gray-500'
                                }`}
                            />
                        </button>
                    );
                })}
            </div>
            {showCount && count > 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                    ({count})
                </span>
            )}
        </div>
    );
}

interface RatingInputProps {
    value: number;
    onChange: (rating: number) => void;
    label?: string;
}

export function RatingInput({ value, onChange, label }: RatingInputProps) {
    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </label>
            )}
            <RatingStars 
                rating={value} 
                interactive 
                onRate={onChange}
                size="lg"
            />
        </div>
    );
}

export default RatingStars;

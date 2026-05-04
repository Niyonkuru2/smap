import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Star, MessageSquare, ThumbsUp, User, Loader2 } from 'lucide-react';
import { RatingStars, RatingInput } from './RatingStars';
import { toast } from 'sonner';

// Hardcoded production URL for Render deployment
const API_BASE = (() => {
  // For production Render deployment
  if (typeof window !== 'undefined' && window.location.hostname === 'smpmps-test.onrender.com') {
    return 'https://smpmps-test-1.onrender.com';
  }
  // Fall back to env variable or local development
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
})();

interface Review {
    userId: number;
    userName: string;
    rating: number;
    review: string;
    timestamp: string;
    category?: string;
}

interface RatingData {
    averageRating: string;
    totalRatings: number;
    distribution: { [key: number]: number };
    reviews: Review[];
    categoryAverages?: { [key: string]: string };
}

interface RatingsReviewsProps {
    type: 'price' | 'vendor';
    targetId: string;
    targetName?: string;
}

export function RatingsReviews({ type, targetId, targetName }: RatingsReviewsProps) {
    const [ratingData, setRatingData] = useState<RatingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [myRating, setMyRating] = useState(0);
    const [myReview, setMyReview] = useState('');
    const [category, setCategory] = useState('general');

    const fetchRatings = async () => {
        try {
            const response = await fetch(`${API_BASE}/ratings/${type}/${targetId}`);
            if (response.ok) {
                const data = await response.json();
                setRatingData(data);
            }
        } catch (error) {
            console.error('Failed to fetch ratings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRatings();
    }, [type, targetId]);

    const submitRating = async () => {
        if (myRating === 0) {
            toast.error('Please select a rating');
            return;
        }

        const token = localStorage.getItem('auth_session');
        if (!token) {
            toast.error('Please log in to submit a rating');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/ratings/${type}/${targetId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rating: myRating,
                    review: myReview,
                    category: type === 'vendor' ? category : undefined
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || 'Rating submitted!');
                setShowReviewForm(false);
                setMyRating(0);
                setMyReview('');
                fetchRatings();
            } else {
                toast.error(data.error || 'Failed to submit rating');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
        );
    }

    const avgRating = parseFloat(ratingData?.averageRating || '0');
    const totalRatings = ratingData?.totalRatings || 0;

    return (
        <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground dark:text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-green-600" />
                    Ratings & Reviews
                    {targetName && <span className="text-gray-500 font-normal">for {targetName}</span>}
                </h3>
                <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="dark:border-gray-600 dark:text-gray-300"
                >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Write Review
                </Button>
            </div>

            {/* Overall Rating */}
            <div className="flex items-center gap-6 mb-4 p-3 bg-secondary dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                    <div className="text-4xl font-bold text-foreground dark:text-white">{avgRating.toFixed(1)}</div>
                    <RatingStars rating={avgRating} size="md" />
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{totalRatings} ratings</div>
                </div>
                
                {/* Rating Distribution */}
                <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = ratingData?.distribution?.[star] || 0;
                        const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                        return (
                            <div key={star} className="flex items-center gap-2 text-sm">
                                <span className="w-3 text-gray-600 dark:text-gray-400">{star}</span>
                                <Star className="w-3 h-3 text-green-500 fill-green-500" />
                                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-green-500 rounded-full transition-all"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="w-8 text-gray-500 dark:text-gray-400 text-right">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Category Averages (for vendors) */}
            {type === 'vendor' && ratingData?.categoryAverages && Object.keys(ratingData.categoryAverages).length > 0 && (
                <div className="flex gap-4 mb-4 text-sm">
                    {Object.entries(ratingData.categoryAverages).map(([cat, avg]) => (
                        <div key={cat} className="flex items-center gap-1 bg-secondary dark:bg-gray-700 px-2 py-1 rounded">
                            <span className="capitalize text-gray-600 dark:text-gray-400">{cat}:</span>
                            <span className="font-medium text-foreground dark:text-white">{avg}</span>
                            <Star className="w-3 h-3 text-green-500 fill-green-500" />
                        </div>
                    ))}
                </div>
            )}

            {/* Review Form */}
            {showReviewForm && (
                <div className="border-t dark:border-gray-700 pt-4 mb-4 space-y-3">
                    <RatingInput 
                        value={myRating} 
                        onChange={setMyRating}
                        label="Your Rating"
                    />
                    
                    {type === 'vendor' && (
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground dark:text-gray-300 mb-1">
                                Category
                            </label>
                            <select 
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="general">General</option>
                                <option value="accuracy">Price Accuracy</option>
                                <option value="reliability">Reliability</option>
                            </select>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground dark:text-gray-300 mb-1">
                            Your Review (Optional)
                        </label>
                        <Textarea
                            value={myReview}
                            onChange={(e) => setMyReview(e.target.value)}
                            placeholder="Share your experience..."
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            rows={3}
                        />
                    </div>
                    
                    <div className="flex gap-2">
                        <Button 
                            onClick={submitRating}
                            disabled={submitting || myRating === 0}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                            Submit Rating
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => setShowReviewForm(false)}
                            className="dark:border-gray-600 dark:text-gray-300"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            {ratingData?.reviews && ratingData.reviews.length > 0 && (
                <div className="space-y-3 border-t dark:border-gray-700 pt-4">
                    <h4 className="font-medium text-muted-foreground dark:text-gray-300">Recent Reviews</h4>
                    {ratingData.reviews.map((review, index) => (
                        <div key={index} className="bg-secondary dark:bg-gray-700 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="font-medium text-foreground dark:text-white">{review.userName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <RatingStars rating={review.rating} size="sm" />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(review.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            {review.review && (
                                <p className="text-sm text-gray-600 dark:text-gray-300">{review.review}</p>
                            )}
                            {review.category && review.category !== 'general' && (
                                <span className="inline-block mt-1 text-xs bg-green-900 dark:bg-green-900 text-green-100 dark:text-green-100 px-2 py-0.5 rounded">
                                    {review.category}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {(!ratingData?.reviews || ratingData.reviews.length === 0) && !showReviewForm && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    No reviews yet. Be the first to rate!
                </p>
            )}
        </Card>
    );
}

export default RatingsReviews;


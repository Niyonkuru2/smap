import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    ThumbsUp, 
    ThumbsDown, 
    AlertTriangle, 
    CheckCircle, 
    Users,
    Shield
} from 'lucide-react';

interface CommunityVerificationProps {
    priceId: string;
    currentPrice: number;
    productName: string;
    marketName: string;
    onVerificationComplete?: () => void;
}

interface CommunityScore {
    score: number;
    confirmations: number;
    disputes: number;
    status: string;
    confidence: string;
}

interface VerificationBadge {
    icon: string;
    label: string;
    color: string;
    tooltip: string;
}

const DISPUTE_REASONS = [
    { code: 'price_too_high', label: 'Price is higher than actual' },
    { code: 'price_too_low', label: 'Price is lower than actual' },
    { code: 'wrong_product', label: 'Wrong product information' },
    { code: 'wrong_market', label: 'Wrong market location' },
    { code: 'outdated', label: 'Price is outdated' },
    { code: 'fake', label: 'Suspicious/fake submission' },
];

export default function CommunityVerification({ 
    priceId, 
    currentPrice, 
    productName, 
    marketName,
    onVerificationComplete 
}: CommunityVerificationProps) {
    const [loading, setLoading] = useState(false);
    const [showDisputeReasons, setShowDisputeReasons] = useState(false);
    const [communityScore, setCommunityScore] = useState<CommunityScore | null>(null);
    const [badge, setBadge] = useState<VerificationBadge | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async (action: 'confirm' | 'dispute', reason?: string) => {
        setLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please log in to verify prices');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/community/verify/${priceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action, reason })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to verify');
                return;
            }

            setCommunityScore(data.communityScore);
            setBadge(data.badge);
            setMessage(data.message);
            setShowDisputeReasons(false);
            
            if (onVerificationComplete) {
                onVerificationComplete();
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getBadgeColor = (status: string) => {
        switch (status) {
            case 'community_verified': return 'bg-green-600';
            case 'partially_verified': return 'bg-green-500';
            case 'under_review': return 'bg-green-400';
            case 'disputed': return 'bg-green-500';
            default: return 'bg-green-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'community_verified': return <CheckCircle className="w-4 h-4" />;
            case 'partially_verified': return <Shield className="w-4 h-4" />;
            case 'under_review': return <AlertTriangle className="w-4 h-4" />;
            case 'disputed': return <AlertTriangle className="w-4 h-4" />;
            default: return <Users className="w-4 h-4" />;
        }
    };

    return (
        <Card className="mt-4">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Community Verification
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Current Status */}
                {communityScore && (
                    <div className="mb-4 p-3 bg-green-950 rounded-lg">
                        <div className="flex items-center justify-between">
                            <Badge className={`${getBadgeColor(communityScore.status)} text-white`}>
                                {getStatusIcon(communityScore.status)}
                                <span className="ml-1">{badge?.label || communityScore.status}</span>
                            </Badge>
                            <div className="text-sm text-green-300">
                                <span className="text-green-400">✓ {communityScore.confirmations}</span>
                                {' / '}
                                <span className="text-green-300">✗ {communityScore.disputes}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success/Error Messages */}
                {message && (
                    <div className="mb-3 p-2 bg-green-950 text-green-300 rounded text-sm">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="mb-3 p-2 bg-green-950 text-green-300 rounded text-sm">
                        {error}
                    </div>
                )}

                {/* Price Info */}
                <div className="mb-3 text-sm text-green-300">
                    <p><strong>{productName}</strong> at {marketName}</p>
                    <p className="text-lg font-bold text-green-400">{currentPrice.toLocaleString()} RWF</p>
                </div>

                {/* Question */}
                <p className="text-sm mb-3 font-medium">
                    Is this price accurate?
                </p>

                {/* Action Buttons */}
                {!showDisputeReasons ? (
                    <div className="flex gap-2">
                        <Button
                            onClick={() => handleVerify('confirm')}
                            disabled={loading}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            Yes, Confirm
                        </Button>
                        <Button
                            onClick={() => setShowDisputeReasons(true)}
                            disabled={loading}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            <ThumbsDown className="w-4 h-4 mr-2" />
                            No, Dispute
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-green-400">Why is this price wrong?</p>
                        {DISPUTE_REASONS.map((reason) => (
                            <Button
                                key={reason.code}
                                onClick={() => handleVerify('dispute', reason.code)}
                                disabled={loading}
                                variant="outline"
                                className="w-full justify-start text-left text-sm"
                            >
                                {reason.label}
                            </Button>
                        ))}
                        <Button
                            onClick={() => setShowDisputeReasons(false)}
                            variant="ghost"
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </div>
                )}

                {/* Help Text */}
                <p className="mt-3 text-xs text-green-400">
                    🛡️ Your verification helps other shoppers trust this price.
                    {communityScore && communityScore.confirmations >= 3 && (
                        <span className="text-green-300 font-medium"> This price is community verified!</span>
                    )}
                </p>
            </CardContent>
        </Card>
    );
}

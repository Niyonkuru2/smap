import { catchAsync } from '../middleware/errorHandler.js';
import FavoriteRepository from '../repositories/FavoriteRepository.js';

export const getFavorites = catchAsync(async (req, res) => {
    const favorites = await FavoriteRepository.getByUser(req.user.id);
    res.json({ success: true, favorites });
});

export const addFavorite = catchAsync(async (req, res) => {
    const { productId, marketId } = req.body;
    await FavoriteRepository.add(req.user.id, productId, marketId);
    res.json({ success: true, message: 'Added to favorites' });
});

export const removeFavorite = catchAsync(async (req, res) => {
    const { productId, marketId } = req.body;
    await FavoriteRepository.remove(req.user.id, productId, marketId);
    res.json({ success: true, message: 'Removed from favorites' });
});
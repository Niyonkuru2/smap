// src/controllers/productController.js
import ProductService from '../services/productService.js';

export const getAllProducts = async (req, res) => {
    try {
        const products = await ProductService.getAllProducts();
        
        res.json({
            success: true,
            message: 'Products fetched successfully',
            data: products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message
        });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductService.getProductById(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Product fetched successfully',
            data: product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product',
            error: error.message
        });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, category_id, unit, description, image_url } = req.body;
        
        if (!name || !category_id || !unit) {
            return res.status(400).json({
                success: false,
                message: 'Name, category, and unit are required'
            });
        }
        
        const product = await ProductService.createProduct({
            name,
            category_id,
            unit,
            description,
            image_url
        });
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product',
            error: error.message
        });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category_id, unit, description, image_url } = req.body;
        
        const product = await ProductService.updateProduct(id, {
            name, category_id, unit, description, image_url
        });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product',
            error: error.message
        });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductService.deleteProduct(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Product deleted successfully',
            data: product
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product',
            error: error.message
        });
    }
};

export const getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const products = await ProductService.getProductsByCategory(categoryId);
        
        res.json({
            success: true,
            message: 'Products fetched successfully',
            data: products
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message
        });
    }
};

export const getProductStats = async (req, res) => {
    try {
        const stats = await ProductService.getProductStats();
        
        res.json({
            success: true,
            message: 'Product stats fetched successfully',
            data: stats
        });
    } catch (error) {
        console.error('Error fetching product stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product stats',
            error: error.message
        });
    }
};
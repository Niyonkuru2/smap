import BusinessService from '../services/BusinessService.js';
export const createBusiness = async (req, res) => {
  try {
    const business = await BusinessService.createBusiness(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Business user created successfully',
      data: business
    });
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllBusinesses = async (req, res) => {
  try {
    const businesses = await BusinessService.getAllBusinesses();
    
    res.status(200).json({
      success: true,
      message: 'Businesses fetched successfully',
      data: businesses
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getBusinessById = async (req, res) => {
  try {
    const { id } = req.params;
    const business = await BusinessService.getBusinessById(id);
    
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business user not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Business fetched successfully',
      data: business
    });
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    
    const updated = await BusinessService.updateBusiness(id, req.body, userRole);
    
    res.status(200).json({
      success: true,
      message: 'Business updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await BusinessService.deleteBusiness(id);
    
    res.status(200).json({
      success: true,
      message: 'Business deleted successfully',
      data: deleted
    });
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getBusinessStats = async (req, res) => {
  try {
    const stats = await BusinessService.getBusinessStats();
    
    res.status(200).json({
      success: true,
      message: 'Business stats fetched successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error fetching business stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getBusinessMarkets = async (req, res) => {
  try {
    const { id } = req.params;
    const business = await BusinessService.getBusinessById(id);
    
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }
    
    const markets = await BusinessService.getBusinessMarkets(business.businessId);
    
    res.status(200).json({
      success: true,
      message: 'Business markets fetched successfully',
      data: markets
    });
  } catch (error) {
    console.error('Error fetching business markets:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const addBusinessMarket = async (req, res) => {
  try {
    const { id, marketId } = req.params;
    const business = await BusinessService.getBusinessById(id);
    
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }
    
    const result = await BusinessService.addBusinessMarket(business.businessId, marketId);
    
    res.status(200).json({
      success: true,
      message: 'Market added to business successfully',
      data: result
    });
  } catch (error) {
    console.error('Error adding business market:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const removeBusinessMarket = async (req, res) => {
  try {
    const { id, marketId } = req.params;
    const business = await BusinessService.getBusinessById(id);
    
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }
    
    const result = await BusinessService.removeBusinessMarket(business.businessId, marketId);
    
    res.status(200).json({
      success: true,
      message: 'Market removed from business successfully',
      data: result
    });
  } catch (error) {
    console.error('Error removing business market:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
/**
 * Country Controller
 * Handles all country-related operations
 */
const { Country, Region, Municipality } = require('../database/models');
const { ApiError } = require('../middlewares');

/**
 * Get all countries
 */
const getCountries = async (req, res, next) => {
  try {
    const { visible_only = 'true' } = req.query;
    const visibleOnly = visible_only === 'true';

    const whereClause = visibleOnly ? { isVisible: true } : {};

    const countries = await Country.findAll({
      where: whereClause,
      include: [{
        model: Region,
        as: 'regions',
        attributes: ['id'],
        where: visibleOnly ? { isVisible: true } : undefined,
        required: false,
      }],
      order: [['name', 'ASC']],
    });

    const result = countries.map((country) => ({
      id: country.id,
      name: country.name,
      code: country.code,
      is_visible: country.isVisible,
      created_at: country.createdAt,
      region_count: country.regions ? country.regions.length : 0,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single country with regions
 */
const getCountry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const country = await Country.findByPk(id, {
      include: [{
        model: Region,
        as: 'regions',
        where: { isVisible: true },
        required: false,
        include: [{
          model: Municipality,
          as: 'municipalities',
          where: { isVisible: true },
          required: false,
          attributes: ['id'],
        }],
      }],
    });

    if (!country) {
      throw new ApiError(404, `Country with id ${id} not found`);
    }

    const regionsData = country.regions.map((region) => ({
      id: region.id,
      name: region.name,
      country_id: region.countryId,
      is_visible: region.isVisible,
      created_at: region.createdAt,
      municipality_count: region.municipalities ? region.municipalities.length : 0,
    }));

    res.json({
      id: country.id,
      name: country.name,
      code: country.code,
      is_visible: country.isVisible,
      created_at: country.createdAt,
      region_count: regionsData.length,
      regions: regionsData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new country (admin only)
 */
const createCountry = async (req, res, next) => {
  try {
    const { name, code, is_visible = true } = req.body;

    // Check if code already exists
    const existing = await Country.findOne({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      throw new ApiError(400, `Country with code ${code} already exists`);
    }

    const country = await Country.create({
      name,
      code: code.toUpperCase(),
      isVisible: is_visible,
    });

    res.status(201).json({
      id: country.id,
      name: country.name,
      code: country.code,
      is_visible: country.isVisible,
      created_at: country.createdAt,
      region_count: 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a country (admin only)
 */
const updateCountry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, is_visible } = req.body;

    const country = await Country.findByPk(id);

    if (!country) {
      throw new ApiError(404, `Country with id ${id} not found`);
    }

    // Check if new code is unique
    if (code && code.toUpperCase() !== country.code) {
      const existing = await Country.findOne({
        where: { code: code.toUpperCase() },
      });
      if (existing) {
        throw new ApiError(400, `Country with code ${code} already exists`);
      }
    }

    await country.update({
      ...(name !== undefined && { name }),
      ...(code !== undefined && { code: code.toUpperCase() }),
      ...(is_visible !== undefined && { isVisible: is_visible }),
    });

    const regionCount = await Region.count({
      where: { countryId: country.id },
    });

    res.json({
      id: country.id,
      name: country.name,
      code: country.code,
      is_visible: country.isVisible,
      created_at: country.createdAt,
      region_count: regionCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a country (admin only)
 */
const deleteCountry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const country = await Country.findByPk(id);

    if (!country) {
      throw new ApiError(404, `Country with id ${id} not found`);
    }

    const countryName = country.name;
    await country.destroy();

    res.json({
      success: true,
      message: `Country '${countryName}' deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCountries,
  getCountry,
  createCountry,
  updateCountry,
  deleteCountry,
};

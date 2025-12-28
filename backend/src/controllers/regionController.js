/**
 * Region Controller
 * Handles all region-related operations
 */
const { Region, Country, Municipality, Flag } = require('../database/models');
const { ApiError } = require('../middlewares');

/**
 * Get all regions
 */
const getRegions = async (req, res, next) => {
  try {
    const { visible_only = 'true', country_id } = req.query;
    const visibleOnly = visible_only === 'true';

    const whereClause = {
      ...(visibleOnly && { isVisible: true }),
      ...(country_id && { countryId: parseInt(country_id, 10) }),
    };

    const regions = await Region.findAll({
      where: whereClause,
      include: [
        {
          model: Country,
          as: 'country',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Municipality,
          as: 'municipalities',
          attributes: ['id', 'isVisible'],
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });

    // Match original: count municipalities based on visibility filter
    const result = regions.map((region) => {
      const visibleMunicipalities = visibleOnly
        ? (region.municipalities || []).filter((m) => m.isVisible)
        : region.municipalities || [];

      return {
        id: region.id,
        name: region.name,
        country_id: region.countryId,
        is_visible: region.isVisible,
        created_at: region.createdAt,
        municipality_count: visibleMunicipalities.length,
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single region with municipalities
 */
const getRegion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const region = await Region.findByPk(id, {
      include: [
        {
          model: Country,
          as: 'country',
          include: [
            {
              model: Region,
              as: 'regions',
              attributes: ['id'],
              required: false,
            },
          ],
        },
        {
          model: Municipality,
          as: 'municipalities',
          required: false,
          include: [
            {
              model: Flag,
              as: 'flags',
              attributes: ['id'],
              required: false,
            },
          ],
        },
      ],
    });

    if (!region) {
      throw new ApiError(404, `Region with id ${id} not found`);
    }

    // Match original: only include visible municipalities
    const visibleMunicipalities = (region.municipalities || []).filter((m) => m.isVisible);

    const municipalitiesData = visibleMunicipalities.map((mun) => ({
      id: mun.id,
      name: mun.name,
      region_id: mun.regionId,
      latitude: mun.latitude,
      longitude: mun.longitude,
      coordinates: mun.coordinates,
      is_visible: mun.isVisible,
      created_at: mun.createdAt,
      flag_count: mun.flags ? mun.flags.length : 0,
    }));

    // Build country response with region_count
    const countryData = region.country
      ? {
          id: region.country.id,
          name: region.country.name,
          code: region.country.code,
          is_visible: region.country.isVisible,
          created_at: region.country.createdAt,
          region_count: region.country.regions ? region.country.regions.length : 0,
        }
      : null;

    res.json({
      id: region.id,
      name: region.name,
      country_id: region.countryId,
      is_visible: region.isVisible,
      created_at: region.createdAt,
      municipality_count: municipalitiesData.length,
      country: countryData,
      municipalities: municipalitiesData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new region (admin only)
 */
const createRegion = async (req, res, next) => {
  try {
    const { name, country_id, is_visible = true } = req.body;

    // Verify country exists
    const country = await Country.findByPk(country_id);
    if (!country) {
      throw new ApiError(400, `Country with id ${country_id} not found`);
    }

    const region = await Region.create({
      name,
      countryId: country_id,
      isVisible: is_visible,
    });

    res.status(201).json({
      id: region.id,
      name: region.name,
      country_id: region.countryId,
      is_visible: region.isVisible,
      created_at: region.createdAt,
      municipality_count: 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a region (admin only)
 */
const updateRegion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, country_id, is_visible } = req.body;

    const region = await Region.findByPk(id);

    if (!region) {
      throw new ApiError(404, `Region with id ${id} not found`);
    }

    // Verify new country exists if provided
    if (country_id) {
      const country = await Country.findByPk(country_id);
      if (!country) {
        throw new ApiError(400, `Country with id ${country_id} not found`);
      }
    }

    await region.update({
      ...(name !== undefined && { name }),
      ...(country_id !== undefined && { countryId: country_id }),
      ...(is_visible !== undefined && { isVisible: is_visible }),
    });

    const municipalityCount = await Municipality.count({
      where: { regionId: region.id },
    });

    res.json({
      id: region.id,
      name: region.name,
      country_id: region.countryId,
      is_visible: region.isVisible,
      created_at: region.createdAt,
      municipality_count: municipalityCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a region (admin only)
 */
const deleteRegion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const region = await Region.findByPk(id);

    if (!region) {
      throw new ApiError(404, `Region with id ${id} not found`);
    }

    const regionName = region.name;
    await region.destroy();

    res.json({
      success: true,
      message: `Region '${regionName}' deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRegions,
  getRegion,
  createRegion,
  updateRegion,
  deleteRegion,
};

const pool = require("../../../config/db");
const { responseSender } = require("../../../utilities/responseHandlers");
const { pagination } = require('../../../utilities/pagination');

const validUnits = {
    mass: ['kg', 'g', 'mg', 'lb', 'oz', 'tonne', 'stone'],
    volume: ['l', 'ml', 'cm³', 'gal', 'qt', 'pt', 'cup', 'fl oz'],
    quantity: ['dozen', 'gross', 'ream', 'score', 'mol', 'each']
};

const createUnits = async (req, res, next) => {
    const { category, unit } = req.body;

    // Validate category and unit
    if (!validUnits[category]) {
        return responseSender(res, 422, false, "Invalid category, Category can be only mass, volume and quantity");
    }

    if (!validUnits[category].includes(unit)) {
        return responseSender(res, 422, false, "Invalid unit");
    }

    try {
        const result = await pool.query('INSERT INTO units (category, unit) VALUES ($1, $2) RETURNING *', [category, unit]);
        return responseSender(res, 201, true, "Unit Added", result.rows[0]);
    } catch (error) {
        next(error);
    }

};

const unitsList = async (req, res, next) => {
    try {
        // Fetch all units
        const result = await pool.query('SELECT * FROM units');

        // Organize units by category
        const unitsByCategory = {}; 

        for (const unit of result.rows) {
            if (!unitsByCategory[unit.category]) {
                unitsByCategory[unit.category] = [];
            }
            unitsByCategory[unit.category].push(unit);
            // });
        }

        // Count total units
        const totalUnits = result.rows.length;

        return responseSender(res, 200, true, "Units fetched", {
            count: totalUnits,
            unitsByCategory: unitsByCategory
        });
    } catch (error) {
        next(error);
    }
};

const getUnitsByCategory = async (req, res, next) => {
    const { category } = req.query;
    const perPage = Number.parseInt(req.query.perPage) || 10;
    const currentPage = Number.parseInt(req.query.currentPage) || 1;

    // Validate category
    if (!validUnits[category]) {
        return responseSender(res, 422, false, "Invalid category, Category can be only mass, volume and quantity");
    }

    try {
        // Fetch total count of items for the given category
        const countResult = await pool.query('SELECT COUNT(*) FROM units WHERE category = $1', [category]);
        const totalItems = Number.parseInt(countResult.rows[0].count);

        // Calculate offset for pagination
        const offset = (currentPage - 1) * perPage;

        // Fetch paginated data
        const result = await pool.query('SELECT * FROM units WHERE category = $1 LIMIT $2 OFFSET $3', [category, perPage, offset]);

        // Generate pagination info
        const paginationInfo = pagination(totalItems, perPage, currentPage);

        return responseSender(res, 200, true, "Units fetched", { count: paginationInfo.totalItems, units: result.rows });
    } catch (error) {
        next(error);
    }
};

const updateUnit = async (req, res, next) => {
    const { id, unit } = req.body;

    try {
        // Validate unit ID
        const unitResult = await pool.query('SELECT * FROM units WHERE id = $1', [id]);
        if (unitResult.rowCount === 0) {
            return responseSender(res, 404, false, "Unit not found");
        }

        // Update the unit
        const result = await pool.query('UPDATE units SET unit = $1 WHERE id = $2 RETURNING *', [unit, id]);
        return responseSender(res, 200, true, "Unit Updated", result.rows[0]);
    } catch (error) {
        next(error);
    }
};

const deleteUnit = async (req, res, next) => {
    const { id } = req.query;

    try {
        // Validate unit ID
        const unitResult = await pool.query('SELECT * FROM units WHERE id = $1', [id]);
        if (unitResult.rowCount === 0) {
            return responseSender(res, 404, false, "Unit not found");
        }

        // Delete the unit
        await pool.query('DELETE FROM units WHERE id = $1', [id]);

        return responseSender(res, 200, true, "Unit deleted successfully");
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createUnits,
    unitsList,
    getUnitsByCategory,
    updateUnit,
    deleteUnit
};

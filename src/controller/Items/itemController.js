const { v4: uuidv4 } = require('uuid');
const pool = require("../../config/db");
const { responseSender } = require("../../utilities/responseHandlers");
const { pagination } = require('../../utilities/pagination');

const createItem = async (req, res, next) => {
    const { type, name, product_category, product_units, product_catalog, usage_unit, image, vendor_id, description } = req.body;

    if (type !== 'PRODUCT' && type !== 'SERVICE') {
        return responseSender(res, 422, false, "Invalid type. Must be PRODUCT or SERVICE.");
    }

    if (type === 'PRODUCT') {
        if (!name || !product_category || !product_units || !product_catalog || !usage_unit || !image || !vendor_id) {
            return responseSender(res, 422, false, "Missing required product attributes.");
        }
        // Check if there are any extra attributes present
        const extraAttributes = Object.keys(req.body).filter(attr =>
            !['type', 'name', 'product_category', 'product_units', 'usage_unit', 'product_catalog', 'image', 'vendor_id'].includes(attr)
        );
        if (extraAttributes.length > 0) {
            return responseSender(res, 422, false, "Invalid attributes for PRODUCT type.");
        }
    } else if (type === 'SERVICE') {
        if (!name || !vendor_id || !description) {
            return responseSender(res, 422, false, "Missing required service attributes.");
        }
        // Check if there are any extra attributes present
        const extraAttributes = Object.keys(req.body).filter(attr =>
            !['type', 'name', 'vendor_id', 'description'].includes(attr)
        );
        if (extraAttributes.length > 0) {
            return responseSender(res, 422, false, "Invalid attributes for SERVICE type.");
        }
    }

    try {
        const id = uuidv4();

        await pool.query(
            `INSERT INTO item (id, type, name, product_category, product_units, usage_unit, product_catalog, image, description) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [id, type, name, product_category, product_units, usage_unit, product_catalog, image, description]
        );

        await pool.query(
            'INSERT INTO item_preferred_vendor (item_id, vendor_id) VALUES ($1, $2)',
            [id, vendor_id]
        );

        const itemDetails = await pool.query(
            `SELECT 
                i.id,
                i.type,
                i.name AS name,
                i.product_catalog,
                i.description,
                i.image, 
                pc.name AS product_category,
                u1.unit AS product_units,
                u2.unit AS usage_unit,
                json_agg(v.*) AS vendors,
                i.created_at,
                i.updated_at
            FROM item i
            LEFT JOIN product_category pc ON i.product_category = pc.id
            LEFT JOIN units u1 ON i.product_units = u1.id
            LEFT JOIN units u2 ON i.usage_unit = u2.id
            LEFT JOIN item_preferred_vendor ipv ON i.id = ipv.item_id
            LEFT JOIN vendor v ON ipv.vendor_id = v.id
            WHERE i.id = $1
            GROUP BY i.id, pc.name, u1.unit, u2.unit`,
            [id]
        );

        return responseSender(res, 201, true, "Item Added", itemDetails.rows[0]);
    } catch (error) {
        next(error);
    }
};

const itemList = async (req, res, next) => {
    const perPage = Number.parseInt(req.query.perPage) || 10;
    const currentPage = Number.parseInt(req.query.currentPage) || 1;
    const searchName = req.query.name || '';

    try {
        // Construct the base query
        let countQuery = 'SELECT COUNT(*) FROM item';
        let fetchQuery = `SELECT 
                            i.id,
                            i.type,
                            i.name AS name,
                            i.product_catalog,
                            i.description,
                            i.image, 
                            pc.name AS product_category,
                            u1.unit AS product_units,
                            u2.unit AS usage_unit,
                            json_agg(v.*) AS vendors,
                            i.created_at,
                            i.updated_at
                        FROM item i
                        LEFT JOIN product_category pc ON i.product_category = pc.id
                        LEFT JOIN units u1 ON i.product_units = u1.id
                        LEFT JOIN units u2 ON i.usage_unit = u2.id
                        LEFT JOIN item_preferred_vendor ipv ON i.id = ipv.item_id
                        LEFT JOIN vendor v ON ipv.vendor_id = v.id`;

        // Add search condition if name is provided
        const queryParams = [];
        if (searchName) {
            countQuery += ' WHERE i.name ILIKE $1';
            fetchQuery += ' WHERE i.name ILIKE $1';
            queryParams.push(searchName + '%');
        }

        const countResult = await pool.query(countQuery, queryParams);
        const totalItems = Number.parseInt(countResult.rows[0].count);

        // Calculate offset for pagination
        const offset = (currentPage - 1) * perPage;

        // Fetch paginated data
        let result;
        if (searchName) {
            result = await pool.query(fetchQuery + ' GROUP BY i.id, pc.name, u1.unit, u2.unit LIMIT $2 OFFSET $3', [...queryParams, perPage, offset]);
        } else {
            result = await pool.query(fetchQuery + ' GROUP BY i.id, pc.name, u1.unit, u2.unit LIMIT $1 OFFSET $2', [perPage, offset]);
        }

        // Generate pagination info
        const paginationInfo = pagination(totalItems, perPage, currentPage);

        return responseSender(res, 200, true, "Item List fetched", { count: paginationInfo.totalItems, items: result.rows });
    } catch (error) {
        next(error);
    }
};

const specifiItem = async (req, res, next) => {
    const itemId = req.query.id;

    if (!itemId) {
        return responseSender(res, 400, false, "Item ID is required");
    }

    try {
        const item = await pool.query(
            `SELECT 
                i.id,
                i.type,
                i.name AS name,
                i.product_catalog,
                i.description,
                i.image, 
                pc.name AS product_category,
                u1.unit AS product_units,
                u2.unit AS usage_unit,
                json_agg(v.*) AS vendors,
                i.created_at,
                i.updated_at
            FROM item i
            LEFT JOIN product_category pc ON i.product_category = pc.id
            LEFT JOIN units u1 ON i.product_units = u1.id
            LEFT JOIN units u2 ON i.usage_unit = u2.id
            LEFT JOIN item_preferred_vendor ipv ON i.id = ipv.item_id
            LEFT JOIN vendor v ON ipv.vendor_id = v.id
            WHERE i.id = $1
            GROUP BY i.id, pc.name, u1.unit, u2.unit`,
            [itemId]
        );

        if (item.rows.length === 0) {
            return responseSender(res, 404, false, "Item not found");
        }

        return responseSender(res, 200, true, "Item fetched", item.rows[0]);
    } catch (error) {
        next(error);
    }
};

const updateItem = async (req, res, next) => {
    const itemId = req.query.id; // Assuming the item ID is provided as a query parameter
    const { type, name, product_category, product_units, product_catalog, usage_unit, image, vendor_id, description } = req.body;

    try {
        // Fetch existing item to check if it exists
        const existingItem = await pool.query(
            `SELECT * FROM item WHERE id = $1`,
            [itemId]
        );

        if (existingItem.rows.length === 0) {
            return responseSender(res, 404, false, "Item not found");
        }

        if (type && type !== 'PRODUCT' && type !== 'SERVICE') {
            return responseSender(res, 422, false, "Invalid type. Must be PRODUCT or SERVICE.");
        }

        // Construct the update query dynamically
        let updateQuery = 'UPDATE item SET ';
        let queryParams = [];
        let index = 1;

        // Build update query based on provided fields
        if (type) {
            updateQuery += `type = $${index}, `;
            queryParams.push(type);
            index++;
        }
        if (name) {
            updateQuery += `name = $${index}, `;
            queryParams.push(name);
            index++;
        }
        if (product_category) {
            updateQuery += `product_category = $${index}, `;
            queryParams.push(product_category);
            index++;
        }
        if (product_units) {
            updateQuery += `product_units = $${index}, `;
            queryParams.push(product_units);
            index++;
        }
        if (usage_unit) {
            updateQuery += `usage_unit = $${index}, `;
            queryParams.push(usage_unit);
            index++;
        }
        if (product_catalog) {
            updateQuery += `product_catalog = $${index}, `;
            queryParams.push(product_catalog);
            index++;
        }
        if (image) {
            updateQuery += `image = $${index}, `;
            queryParams.push(image);
            index++;
        }
        if (description) {
            updateQuery += `description = $${index}, `;
            queryParams.push(description);
            index++;
        }

        // Remove trailing comma and space from the query
        updateQuery = updateQuery.slice(0, -2);

        // Add WHERE clause for the item ID
        updateQuery += ' WHERE id = $' + index;
        queryParams.push(itemId);

        // Perform the update operation
        await pool.query(updateQuery, queryParams);

        // Update the preferred vendor if vendor_id is provided
        if (vendor_id) {
            await pool.query(
                'UPDATE item_preferred_vendor SET vendor_id = $1 WHERE item_id = $2',
                [vendor_id, itemId]
            );
        }

        // Fetch updated item details
        const updatedItemDetails = await pool.query(
            `SELECT 
                i.id,
                i.type,
                i.name AS name,
                i.product_catalog,
                i.description,
                i.image, 
                pc.name AS product_category,
                u1.unit AS product_units,
                u2.unit AS usage_unit,
                json_agg(v.*) AS vendors,
                i.created_at,
                i.updated_at
            FROM item i
            LEFT JOIN product_category pc ON i.product_category = pc.id
            LEFT JOIN units u1 ON i.product_units = u1.id
            LEFT JOIN units u2 ON i.usage_unit = u2.id
            LEFT JOIN item_preferred_vendor ipv ON i.id = ipv.item_id
            LEFT JOIN vendor v ON ipv.vendor_id = v.id
            WHERE i.id = $1
            GROUP BY i.id, pc.name, u1.unit, u2.unit`,
            [itemId]
        );

        return responseSender(res, 200, true, "Item Updated", updatedItemDetails.rows[0]);
    } catch (error) {
        next(error);
    }
}

const deleteItem = async (req, res, next) => {
    const itemId = req.query.id;

    try {
        // Check if the item exists
        const existingItem = await pool.query(
            `SELECT * FROM item WHERE id = $1`,
            [itemId]
        );

        if (existingItem.rows.length === 0) {
            return responseSender(res, 404, false, "Item not found");
        }

        // Delete related records in item_preferred_vendor table
        await pool.query(
            `DELETE FROM item_preferred_vendor WHERE item_id = $1`,
            [itemId]
        );

        // Delete the item
        await pool.query(
            `DELETE FROM item WHERE id = $1`,
            [itemId]
        );

        return responseSender(res, 200, true, "Item deleted successfully");
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createItem,
    itemList,
    specifiItem,
    updateItem,
    deleteItem
};
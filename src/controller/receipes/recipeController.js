const { v4: uuidv4 } = require('uuid');
const pool = require("../../config/db");
const { responseSender } = require("../../utilities/responseHandlers");
const { pagination } = require('../../utilities/pagination');

const createRecipe = async (req, res, next) => {

    const {
        recipe_name,
        category,
        difficulty_level,
        added_by,
        price,
        cooking_time,
        selected_item,
        nutritional_info,
        allergen_info,
        presentation_instructions,
        equipment_needed,
        side_order,
        image,
        preparation_instructions
    } = req.body;

    if (!recipe_name,
        !category,
        !difficulty_level,
        !added_by,
        !price,
        !cooking_time,
        !selected_item,
        !nutritional_info,
        !allergen_info,
        // !presentation_instructions,
        // !equipment_needed,
        // !side_order,
        // !preparation_instructions,
        !image
    ) {
        return responseSender(res, 422, false, "Invalid data. Missing attributes");
    }

    if (difficulty_level !== 'HIGH' && difficulty_level !== 'MEDIUM' && difficulty_level !== 'LOW') {
        return responseSender(res, 422, false, "Invalid difficulty_level. Must be HIGH, MEDIUM or LOW.");
    }

    try {
        // Insert the product category into the database
        const result = await pool.query(
            'INSERT INTO recipes (recipe_name, category, difficulty_level, added_by, price, cooking_time, selected_item, nutritional_info, allergen_info, presentation_instructions, equipment_needed, side_order, image, preparation_instructions) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
            [
                recipe_name,
                category,
                difficulty_level,
                added_by,
                price,
                cooking_time,
                selected_item,
                nutritional_info,
                allergen_info,
                presentation_instructions,
                equipment_needed,
                side_order,
                image,
                preparation_instructions,
            ]
        );

        return responseSender(res, 201, true, "Recipe created successfully", result.rows[0]);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRecipe
};
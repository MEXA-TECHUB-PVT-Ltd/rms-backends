const { Router } = require("express");
const {
    createRecipe, 
} = require("../../controller/receipes/recipeController"); 

const router = Router();


router.route("/create").post(createRecipe); 

module.exports = router;
const express = require("express")
const router = express.Router()
const skillsControllers = require("../../controllers/Skills/skills.controller")
const authMiddleware = require("../../middlewares/authMiddleware")

router.post("/create-skill", skillsControllers.createSkill)
router.post("/generate-skills", skillsControllers.generateSkillsBasedOnCategoryAndSubCategory)
router.post("/get-skills",skillsControllers.getSkillsBasedOnCategoryAndSubCategory);
router.post("/admin/get-skills", skillsControllers.getSkillsForAdmin)
router.put("/update-skill/:id",  skillsControllers.updateSkill);
router.delete("/delete-skill/:id",skillsControllers.deleteSkill);

router.post("/generate-new-skills", skillsControllers.generateNewSkillsUsingAi)

module.exports = router
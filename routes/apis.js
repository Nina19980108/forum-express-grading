const express = require('express')
const router = express.Router()

const multer = require('multer')
const upload = multer({ dest: 'temp/' })

const adminController = require('../controllers/api/adminController.js')

router.get('/admin/restaurants', adminController.getRestaurants)
router.get('/admin/restaurants/:id', adminController.getRestaurant)
router.get('/admin/categories', adminController.getCategories)
router.delete('/admin/restaurants/:id', adminController.deleteRestaurant)

router.put('/admin/restaurants/:id', upload.single('image'), adminController.putRestaurant)
router.post('/admin/categories', adminController.postCategory)
router.put('/admin/categories/:id', adminController.putCategory)
router.delete('/admin/categories/:id', adminController.deleteCategory)

module.exports = router
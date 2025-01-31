const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category
const User = db.User
const Comment = db.Comment

const pageLimit = 10

const restController = {
  getRestaurants: (req, res) => {
    let offset = 0
    const whereQuery = {}
    let categoryId = ''
    if (req.query.page) {
      offset = (req.query.page - 1) * pageLimit
    }
    if (req.query.categoryId) {
      categoryId = Number(req.query.categoryId)
      whereQuery.categoryId = categoryId
    }
    Restaurant.findAndCountAll({
      include: Category,
      where: whereQuery,
      offset: offset,
      limit: pageLimit
    }).then(result => {
      const page = Number(req.query.page) || 1
      const pages = Math.ceil(result.count / pageLimit)
      const totalPage = Array.from({ length: pages }).map((item, index) => index + 1)
      const prev = page - 1 < 1 ? 1 : page - 1
      const next = page + 1 > pages ? pages : page + 1
      const data = result.rows.map(r => ({
        ...r.dataValues,
        description: r.dataValues.description.substring(0, 50),
        categoryName: r.dataValues.Category.name,
        isFavorited: req.user.FavoritedRestaurants.map(d => d.id).includes(r.id),
        isLiked: req.user.LikedRestaurants.map(d => d.id).includes(r.id)
      }))
      Category.findAll({ raw: true, nest: true })
        .then(categories => {
          return res.render('restaurants', {
            restaurants: data,
            categories,
            categoryId,
            page,
            totalPage,
            prev,
            next
          })
        })
    })
  },

  getRestaurant: (req, res) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' },
        { model: Comment, include: [User] }
      ]
    })
      .then(restaurant => {
        const isFavorited = restaurant.FavoritedUsers.map(d => d.id).includes(req.user.id)
        const isLiked = restaurant.LikedUsers.map(d => d.id).includes(req.user.id)
        return restaurant.increment('viewCounts', { by: 1 })
          .then(() => {
            return res.render('restaurant', {
              restaurant: restaurant.toJSON(),
              isFavorited,
              isLiked
            })
          })
      })
  },

  getFeeds: (req, res) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        raw: true,
        nest: true,
        order: [['createdAt', 'Desc']],
        include: [Category]
      }),
      Comment.findAll({
        limit: 10,
        raw: true,
        nest: true,
        order: [['createdAt', 'Desc']],
        include: [User, Restaurant]
      })
    ]).then(([restaurants, comments]) => {
      return res.render('feeds', {
        restaurants,
        comments
      })
    })
  },

  getRestaurantData: (req, res) => {
    Restaurant.findByPk(req.params.id, {
      include: [Category]
    })
      .then(restaurant => {
        return Comment.findAndCountAll({
          where: { RestaurantId: restaurant.id },
          raw: true,
          nest: true
        }).then(comments => {
          return res.render('restaurantData', {
            restaurant: restaurant.toJSON(),
            count: comments.count
          })
        })
      })
  },

  getTopRestaurant: (req, res) => {
    return Restaurant.findAll({
      include: [
        { model: User, as: 'FavoritedUsers' }
      ]
    }).then(restaurants => {
      restaurants = restaurants.map(restaurant => ({
        ...restaurant.dataValues,
        FavoritedCount: restaurant.FavoritedUsers.length,
        isFavorited: req.user.FavoritedRestaurants.map(d => d.id).includes(restaurant.id)
      }))
      return restaurants = restaurants.sort((a, b) => b.FavoritedCount - a.FavoritedCount)
    }).then(restaurants => {
      restaurants = restaurants.slice(0, 10)
      return res.render('topRestaurant', { restaurants })
    })
  }
}
module.exports = restController
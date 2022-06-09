const { url } = require("inspector");
const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (!foundDish) {
    next({ status: 404, message: `${dishId} does not exist.` });
  }
  res.locals.dish = foundDish;
  next();
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Dish must include a ${propertyName}`,
    });
  };
}

const bodyDataHasName = bodyDataHas("name");
const bodyDataHasDescription = bodyDataHas("description");
const bodyDataHasImageUrl = bodyDataHas("image_url");
const bodyDataHasPrice = bodyDataHas("price");

function priceValidation(req, res, next) {
  const {
    data: { price },
  } = req.body;

  if (!Number.isInteger(price) || Number(price) < 0 || !price) {
    next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }
  next();
}

function dishIdMatches(req, res, next) {
  const dishIdFromUrl = req.params.dishId;
  const dishIdFromBody = req.body.data.id;

  if (!dishIdFromBody) {
    next();
  }

  if (dishIdFromUrl !== dishIdFromBody) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${dishIdFromBody} Route: ${dishIdFromUrl}`,
    });
  }
  next();
}

function list(req, res) {
  res.json({ data: dishes });
}

function read(req, res) {
  const foundDish = res.locals.dish;
  res.json({ data: foundDish });
}

function create(req, res) {
  const { data: { name, description, image_url, price } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    image_url: image_url,
    price: price,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function update(req, res) {
  const foundDish = res.locals.dish;
  const { data: { name, description, image_url, price } = {} } = req.body;

  foundDish.name = name;
  foundDish.description = description;
  foundDish.image_url = image_url;
  foundDish.price = price;

  res.json({ data: foundDish });
}

module.exports = {
  list,
  read: [dishExists, read],
  create: [
    bodyDataHasName,
    bodyDataHasDescription,
    bodyDataHasImageUrl,
    bodyDataHasPrice,
    priceValidation,
    create,
  ],
  update: [
    dishExists,
    dishIdMatches,
    bodyDataHasName,
    bodyDataHasDescription,
    bodyDataHasImageUrl,
    bodyDataHasPrice,
    priceValidation,
    update,
  ],
};

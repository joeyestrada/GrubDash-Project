const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => orderId === order.id);
  if (!foundOrder) {
    next({ status: 404, message: `Cannot find order: ${orderId}` });
  }
  res.locals.foundOrder = foundOrder;
  next();
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (!data[propertyName]) {
      next({ status: 400, message: `Order must include a ${propertyName}` });
    }
    next();
  };
}

function dishesCheck(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!Array.isArray(dishes) || !dishes.length) {
    next({ status: 400, message: `Order must include at least one dish` });
  }
  dishes.forEach((dish) => {
    if (!dish.quantity || !Number.isInteger(dish.quantity)) {
      next({
        status: 400,
        message: `Dish ${dish.id} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

function checkPending(req, res, next) {
  const { foundOrder: { status } = {} } = res.locals;
  if (status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

function orderIdCheck(req, res, next) {
  const { foundOrder } = res.locals;
  const {
    data: { id },
  } = req.body;

  if (!id) {
    next();
  }
  if (foundOrder.id !== id) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id} Route: ${foundOrder.id}`,
    });
  }
  next();
}

function statusCheck(req, res, next) {
  const {
    data: { status },
  } = req.body;

  if (
    status !== ("pending" || "preparing" || "out-for-delivery" || "delivered")
  ) {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, or delivered.",
    });
  }
  if (status === "delivered") {
    next({ status: 400, message: "A delivered order cannot be changed" });
  }
  next();
}

function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  const { foundOrder } = res.locals;
  res.json({ data: foundOrder });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: "",
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const { foundOrder } = res.locals;

  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;
  foundOrder.dishes = dishes;

  res.json({ data: foundOrder });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === Number(orderId));
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesCheck,
    create,
  ],
  delete: [orderExists, checkPending, destroy],
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    bodyDataHas("dishes"),
    dishesCheck,
    orderIdCheck,
    statusCheck,
    update,
  ],
};

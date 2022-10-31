const { authJwt } = require("../middlewares");
const controller = require("../controllers/cart.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/cart/view", [authJwt.verifyToken], controller.view);
  
  app.post("/api/cart/add_item", [authJwt.verifyToken], controller.add_item);

  app.post("/api/cart/remove_item", [authJwt.verifyToken], controller.remove_item);

  app.post("/api/cart/update_prices", [authJwt.verifyToken, authJwt.isAdmin], controller.update_prices);

};

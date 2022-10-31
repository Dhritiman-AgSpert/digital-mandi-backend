const { authJwt } = require("../middlewares");
const controller = require("../controllers/product.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/product/create", [authJwt.verifyToken, authJwt.isAdmin], controller.create);

  app.get("/api/product/all", [authJwt.verifyToken], controller.all);

  app.post("/api/product/del_one", [authJwt.verifyToken, authJwt.isAdmin], controller.del_one);

  app.post("/api/product/del_all", [authJwt.verifyToken, authJwt.isAdmin], controller.del_all);

  app.get("/api/product/categories", [authJwt.verifyToken], controller.categories);

  app.post("/api/product/categorised", [authJwt.verifyToken], controller.categorised);

  app.get("/api/product/units", [authJwt.verifyToken], controller.units);

  app.get("/api/product/one", [authJwt.verifyToken, authJwt.isAdmin], controller.one);

  app.put("/api/product/edit", [authJwt.verifyToken, authJwt.isAdmin], controller.edit);
  
  app.put("/api/product/toggle_in_stock", [authJwt.verifyToken, authJwt.isAdmin], controller.toggle_in_stock);

  app.post("/api/product/create_from_json", [authJwt.verifyToken, authJwt.isAdmin], controller.create_from_json);

};

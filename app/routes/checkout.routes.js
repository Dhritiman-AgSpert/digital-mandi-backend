const { authJwt } = require("../middlewares");
const controller = require("../controllers/checkout.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/order/all_pending", [authJwt.verifyToken, authJwt.isAdmin], controller.all_pending);
 
  app.post("/api/order/per_client_pending", [authJwt.verifyToken, authJwt.isAdmin], controller.per_client_pending);
 
  app.get("/api/order/all_complete", [authJwt.verifyToken, authJwt.isAdmin], controller.all_complete);
 
  app.post("/api/order/per_client_complete", [authJwt.verifyToken, authJwt.isAdmin], controller.per_client_complete);
 
  app.post("/api/order/toggle_complete_placed", [authJwt.verifyToken, authJwt.isAdmin], controller.toggle_complete_placed);

  app.post("/api/order/toggle_paid", [authJwt.verifyToken, authJwt.isAdmin], controller.toggle_paid);
 
  app.post("/api/order/remove_item", [authJwt.verifyToken, authJwt.isAdmin], controller.remove_item);

  app.post("/api/order/add_item", [authJwt.verifyToken, authJwt.isAdmin], controller.add_item);

  app.post("/api/order/del_one", [authJwt.verifyToken, authJwt.isAdmin], controller.del_one);

  app.post("/api/order/del_all", [authJwt.verifyToken, authJwt.isAdmin], controller.del_all);

  app.post("/api/order/admin_create", [authJwt.verifyToken, authJwt.isAdmin], controller.admin_create);

  app.post("/api/order/create", [authJwt.verifyToken], controller.create);

  app.get("/api/order/my", [authJwt.verifyToken], controller.my);

  app.get("/api/order/my_pending", [authJwt.verifyToken], controller.my_pending);


  
  app.get("/api/order/deliverers", [authJwt.verifyToken, authJwt.isAdmin], controller.deliverers);
  // app.get("/api/order/deliverers", [authJwt.verifyToken, authJwt.isFulfillment], controller.deliverers);

  app.post("/api/order/assign", [authJwt.verifyToken, authJwt.isAdmin], controller.assign);
  // app.post("/api/order/assign", [authJwt.verifyToken, authJwt.isFulfillment], controller.assign);

  app.get("/api/order/deliveries", [authJwt.verifyToken, authJwt.isAdmin], controller.deliveries);
 
  app.get("/api/order/complete_deliveries", [authJwt.verifyToken, authJwt.isAdmin], controller.complete_deliveries);
 
  app.get("/api/order/all_hstrcl", [authJwt.verifyToken, authJwt.isAdmin], controller.all_hstrcl);
 
};

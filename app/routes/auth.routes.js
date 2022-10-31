const { verifySignUp, authJwt } = require("../middlewares");
const controller = require("../controllers/auth.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted
    ],
    controller.signup
  );

  app.post("/api/auth/signin", controller.signin);

  app.post("/api/auth/admin_signup", controller.admin_signup);

  app.post("/api/auth/admin_signin", controller.admin_signin);

  app.post("/api/auth/phone", controller.phone);

  app.post("/api/auth/otp", controller.otp);

  app.post("/api/auth/all_otp", [authJwt.verifyToken, authJwt.isAdmin], controller.all_otp);

  app.post("/api/auth/reset_otp", [authJwt.verifyToken, authJwt.isAdmin], controller.reset_otp);

  app.post("/api/auth/create_client", [authJwt.verifyToken, authJwt.isAdmin, verifySignUp.checkDuplicateEmail], controller.create_client);

  app.post("/api/auth/clients", [authJwt.verifyToken, authJwt.isAdmin], controller.clients);

  app.post("/api/auth/edit_client", [authJwt.verifyToken, authJwt.isAdmin], controller.edit_client);

  app.post("/api/auth/delete_client", [authJwt.verifyToken, authJwt.isAdmin], controller.delete_client);

  app.post("/api/auth/delete_all_clients", [authJwt.verifyToken, authJwt.isAdmin], controller.delete_all_clients);

};

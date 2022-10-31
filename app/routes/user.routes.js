const { authJwt } = require("../middlewares");
const controller = require("../controllers/user.controller");
const { verifySignUp } = require("../middlewares");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
      "/api/user/edit_profile", 
      [
        authJwt.verifyToken,
        verifySignUp.checkDuplicateUsernameOrEmail,
        verifySignUp.checkDuplicatePhone
      ],
      controller.edit_profile,
  );

  app.get("/api/test/locations", [authJwt.verifyToken], controller.locations);

  app.post("/api/test/del_all", [authJwt.verifyToken, authJwt.isAdmin], controller.del_all);
  
  app.get("/api/test/info", [authJwt.verifyToken], controller.info);

  app.get("/api/test/all", controller.allAccess);

  app.get("/api/test/user", [authJwt.verifyToken], controller.userBoard);

  app.get(
    "/api/test/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );
};

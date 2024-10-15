const express=require("express");
const router=express.Router();
const User=require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl }=require("../middleware.js");

const userControllers= require("../controllers/users.js");

router.route("/signup")
.get(userControllers.renderSignup)
.post(wrapAsync(userControllers.signUp));

router.route("/login")
.get(userControllers.renderLogin)
.post(saveRedirectUrl,passport.authenticate("local",{ failureRedirect: '/login',failureFlash: true}),
   userControllers.login);

router.get("/loggout",userControllers.logout);
module.exports=router;
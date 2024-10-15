if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}


const express=require("express");
const app=express();
const mongoose = require('mongoose');
const path=require("path");
const ExpressError=require("./utils/ExpressError.js");

const listingRouter=require("./routes/listings.js");
const reviewsRouter=require("./routes/reviews.js");
const userRouter=require("./routes/user.js");

const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");

const passport=require("passport");
const LocalStrategy = require("passport-local");
const User=require("./models/user.js");

app.use(express.static(path.join(__dirname,"/public")));

const ejsMate=require("ejs-mate");
app.engine("ejs",ejsMate);

const methodOverride=require("method-override");
app.use(methodOverride("_method"));

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

app.use(express.urlencoded({extended:true}));

const dbUrl = process.env.ATLASdb_URL;

main().
then(()=>{
    console.log("Connected to DB");
}).
catch(err => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
}

const port=8080;

const store= MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret: process.env.SECRET,
    },
    touchAfter:24 * 3600
});

store.on("error",()=>{
    console.log('ERROR IN MONGO SESSION STORE',err);
});
const sessionOptions={
    store,
    secret: process.env.SECRET,
    resave: "false",
    saveUninitialized: "false",
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currentUser = req.user;
    next();
});

// app.get("/demoUser",async (req,res)=>{
//     let fakeUser=new User({
//         email:"roshni@321.gmail.com",
//         username:"Roshni",
//     });
//     let registerdUser=await User.register(fakeUser,"roshni@89");
//     res.send(registerdUser);
// });

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews/",reviewsRouter);
app.use("/",userRouter);

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page not found!"));
});
app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something went wrong!"}=err;
    res.status(statusCode).render("listings/error.ejs",{message});
    // res.status(statusCode).send(message);
});
app.listen(port,()=>{
    console.log("Server is listening on port:",port);
});

// app.get("/testListing",async (req,res)=>{
//    let sample=new Listing({
//     title:"My new Villa",
//     description:"By the beach",
//     price:4000,
//     location:"Goa",
//     country:"India",
//    });
//    await sample.save();
//    console.log("Sample was saved");
//    res.send("successful testing");
// });
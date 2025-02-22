import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";
import admin from "firebase-admin";
import {getAuth} from "firebase-admin/auth";
import serviceAccountKey from "./blogging-website-2c39e-firebase-adminsdk-70cpm-0e336b0458.json" assert {type:"json"};
import aws from "aws-sdk";

//Schema below
import User from './Schema/User.js';

const app = express();
let PORT = 3000;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey)
})

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.DB_LOCATION, {
  autoIndex: true
});

//setting up s3 bucket
const s3 = new aws.S3({
  region: 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

const generateUrl = async () => {
  const date = new Date();
  const imgName = `${nanoid()}-${date.getTime()}.jpeg`
  
  return await s3.getSignedUrlPromise('putObject',{
    Bucket: 'personal-blogging-website',
    Key: imgName,
    Expires: 1000,
    ContentType: "image/jpeg"
  })
}

const generateUsername = async (email) => {
  let username = email.split("@")[0];
  console.log('username',username);
  let userNameNotUnique = await User.exists({ "personal_info.username": username }).then((result) => result);
  
  userNameNotUnique ? username += nanoid().substring(0,5) : "";

  return username;
}

const formatData = (user) => {

  const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY );

  return {
    access_token,
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname
  }
}

//upload image url route
app.get('/get-upload-url', (req, res) => {
  generateUrl()
  .then(url => res.status(200).json({ "uploadUrl":url }))
  .catch(err => {
    console.log(err.message);
    return res.status(500).json({ "error": err.message })
  })
});

app.post("/signup",(req, res) => {
  let { fullname, email, password } = req.body;

  //validating the data
  if(fullname.length < 3){
    return res.status(403).json({"error": "Fullname must be at least 3 letters long"});
  }

  if(!email.length){
    return res.status(403).json({"error": "Email is required"});
  }

  if(!emailRegex.test(email)){
    return res.status(403).json({"error": "Email is invalid"});
  }

  if(!passwordRegex.test(password)){
    return res.status(403).json({"error": "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase  letters"});
  }

  bcrypt.hash(password, 10, async (err, hashed_password) => {

    let username = await generateUsername(email);

    let user = new User({
      personal_info: { fullname, email, password: hashed_password, username }
    });

    console.log('signin',user)

    user.save().then((u) => {
      return res.status(200).json(formatData(u));
    })
    .catch(err => {
      if(err.code == 11000){
        return res.status(500).json({"error": "Email already exists"});
      }
      return res.status(500).json({"error": err.message});
    });
  });
});

app.post("/signin", (req, res) => {
  let { email, password } = req.body;

  User.findOne({ "personal_info.email": email})
  .then((user) => {
    if(!user){
      return res.status(403).json({ "error" : "Email not found" })
    }

    if(!user.google_auth){
      bcrypt.compare(password, user.personal_info.password, (err, result) => {
        if(err){
          return res.status(403).json({ "error" : "Error occured while login please try again" })
        }
  
        if(!result){
          return res.status(403).json({ "error" : "Incorrect password" })
        } else {
          return res.status(200).json(formatData(user));
        }
      });
    } else {
      return res.status(403).json({ "error" : "Account was created using google. Try logging in with google." })
    }
  })
  .catch((err) => {
    console.log(err);
    return res.status(500).json({ "error" : err.message })
  })
  
})

app.post("/google-auth", async (req, res) => {
  let { access_token } = req.body;

  getAuth()
  .verifyIdToken(access_token)
  .then(async (decodedUser) => {
    let { email, name, picture } = decodedUser;
    console.log(decodedUser)
    picture = picture.replace("s96-c", "s384-c");

    let user = await User.findOne({ "personal_info.email": email }).select("personal_info.fullname personal_info.username personal_info.profile_img google_auth")
    .then((u) => {
      return u || null
    })
    .catch(err => {
      console.log('error server',err)
      return res.status(500).json({"error": err.message})
    })

    if(user){//login
      if(!user.google_auth){
        return res.status(403).json({"error" : "This email was signed up without google. Please log in with password to access the account"})
      }
    }else{ //signup
      console.log('email',email);
      let username = await generateUsername(email);
      console.log('username',username)
      console.log('name',name)

      user = new User({
        personal_info: { fullname: name, email, username },
        google_auth: true
      })

      await user.save().then((u) => {
        user = u;
      })
      .catch(err => {
        console.log('error',err);
        return res.status(500).json({"error": err.message})
      })
    }

    return res.status(200).json(formatData(user));
  })
  .catch(err => {
    return res.status(500).json({"error": "Failed to authenticate you with google. Try with some other google account" })
  })
})

app.listen(PORT,() => {
  console.log('Listening on port -> ' + PORT);
});


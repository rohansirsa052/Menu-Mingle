const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const validator = require("validator");
const fs= require("fs");

app.get("/", (req, res) => {
  res.send("hello");
});

const mongoose = require("mongoose");

mongoose
  .connect("mongodb://127.0.0.1:27017/FoodHub")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

  const userSchema = new mongoose.Schema({
    name:{
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) throw new Error("email is invalid");
      },
    },
  
    pass: {
      type: String,
    },
    Cpass: {
      type: String,
    }
  });

  const foodMenuSchema = new mongoose.Schema({
    dish_name: [{type : String}],
    price: [{type : Number}],
  });
  
  // const foodMenuSchema = new mongoose.Schema({
  //   dishes: [dishSchema],
  // });
  
  const FoodMenu = mongoose.model('FoodMenu', foodMenuSchema);
  const jsonData = fs.readFileSync("./foodmenu.json", "utf-8");
  const parsedData = JSON.parse(jsonData);
  console.log(parsedData);

  const availableDishes = parsedData;

// FoodMenu.create(availableDishes)
//   .then(() => console.log("Dishes are addes into the database"))
//   .catch((err) => console.error("Error adding available sessions:", err));

  userSchema.pre("save", async function (next) {
    if (this.isModified("pass")) {
      //console.log(`${this.pass}`);
      this.pass = await bcrypt.hash(this.pass, 10);
      //console.log(`${this.pass}`);
    }
    next();
  });

  const Registration = new mongoose.model("Student_Registration", userSchema);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.post("/register", async (req, res) => {
    try {
      const pass = req.body.pass;
      const confirmPass = req.body.Cpass;
      if (pass === confirmPass) {
        const first_document = new Registration({
          name: req.body.name,
          email: req.body.email,
          pass: req.body.pass,
          Cpass: req.body.Cpass,
        });
  
        const result = await first_document.save(); // To save the data into database
        console.log(result);
        res.status(201).send(result);
      } else {
        res.send("Passwords are not matching");
      }
    } catch (err) {
      res.status(400).send(err);
    }
  });
  
  app.post("/login", async (req, res) => {
 
    try {
      const user = {
        Useremail: req.body.email,
        pass: req.body.password,
      };
  
      const result = await Registration.findOne({ email: user.Useremail });
      if (!result) {
        return res.status(400).send("Email not found");
      }
  
      const isMatch = await bcrypt.compare(user.pass, result.pass);
  
      if (isMatch) {
       
          res.send(result);
        
      } else {
        res.send("Passwords are not matching");
      }
    } catch (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    }
  });
  
  app.get('/menu', async (req, res) => {
   
  
    try {
     
      const user = {
        Useremail: req.body.email,
        pass: req.body.password,
      };
  
      const result = await Registration.findOne({ email: user.Useremail });
      if (!result) {
        return res.status(400).send("Email not found");
      }
      const isMatch = await bcrypt.compare(user.pass, result.pass);
      if (isMatch) {

        const menu = await FoodMenu.findOne({});

        const dishNames = menu.dish_name;
        const prices = menu.price;
        const dishesWithPrices = dishNames.map((dish_name, index) => ({
          dish_name,
          price: prices[index],
        }));
        console.log(dishesWithPrices);

       //console.log(menu);
        return res.json(dishesWithPrices);
      
    } else {
      res.send("Passwords are not matching");
    }

    } catch (error) {
      return res.status(500).json({ message: 'Error fetching food menu.' });
    }
  });
const port = process.env.PORT || 8070;
app.listen(port, () => console.log(`Server running at ${port}`));


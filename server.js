//API
const express = require("express");
const app = express();
const PORT = 8080;
const Shortcut = require("./models/shortcutModel");
//DB
const mongoose = require("mongoose");

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Get Routes
app.get("/shortcuts", async (req, res) => {
  try {
    const shortcuts = await Shortcut.find({});
    res.status(200).json(shortcuts);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

app.get("/shortcuts/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const query = { name: name };
    const shortcut = await Shortcut.findOne(query);
    res.status(200).json(shortcut);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

//Post Routes
app.post("/shortcuts", async (req, res) => {
  try {
    const shortcut = await Shortcut.create(req.body);
    res.status(200).json(shortcut);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

//Update Routes
app.put("/shortcuts/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const query = { name: name };
    var shortcut = await Shortcut.findOneAndUpdate(query, req.body);
    if (!shortcut) {
      return res
        .status(404)
        .json({ message: `Cannot find and shortcut with name ${name}` });
    }
    shortcut = await Shortcut.findOne(query);
    res.status(200).json(shortcut);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

//Delete route
app.delete("/shortcuts/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const query = { name: name };
    var shortcut = await Shortcut.findOneAndDelete(query, req.body);
    if (!shortcut) {
      return res
        .status(404)
        .json({ message: `Cannot find and shortcut with name ${name}` });
    }
    shortcut = await Shortcut.findOne(query);
    res.status(200).json(`${name} was deleted.`);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

mongoose.set("strictQuery", false);
mongoose
  .connect(
    "mongodb+srv://admin:shortcutVault!45Slzxz@my-shortcut-vault.i3ouusu.mongodb.net/shortcutsAPI?retryWrites=true&w=majority&appName=my-shortcut-vault"
  )
  .then(() => {
    console.log("Shortcut Database active (MongoDB).");
    app.listen(PORT, () =>
      console.log(`Shortcuts API Active on http://localhost:${PORT}`)
    );
  })
  .catch((error) => {
    console.log(error);
  });

const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const { body, validationResult } = require("express-validator");
const methodOverride = require("method-override");

require("./utils/db");
const Contact = require("./model/contact");

const app = express();
const port = 3002;
app.use(methodOverride("_method"));

// Setup EJS
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser("scret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "scret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

// Home Page
app.get("/", (req, res) => {
  const mahasiswa = [
    {
      name: "Kanzun",
      email: "kanzun@gmail.com",
    },
    {
      name: "Bairuha",
      email: "bairuha@gmail.com",
    },
    {
      name: "Sangar",
      email: "sangar@gmail.com",
    },
  ];

  res.render("index", {
    name: "Kanzun Bairuha",
    title: "Home Page",
    mahasiswa,
    layout: "layouts/main-layout",
  });
});

// About Page
app.get("/about", (req, res) => {
  res.render("about", {
    title: "About Page",
    layout: "layouts/main-layout",
  });
});

// Contact Page
app.get("/contact", async (req, res) => {
  const contacts = await Contact.find();
  res.render("contact", {
    title: "Contact Page",
    layout: "layouts/main-layout",
    contacts,
    msg: req.flash("msg"),
  });
});

// Add Contact Page
app.get("/contact/add", (req, res) => {
  res.render("add-contact", {
    title: "Add Contact Page",
    layout: "layouts/main-layout",
  });
});

// Proccess Add Contact Page
app.post(
  "/contact",
  [
    body().custom(async (value) => {
      const duplicateName = await Contact.findOne({ name: value.name });
      const duplicateEmail = await Contact.findOne({ email: value.email });
      const duplicatePhone = await Contact.findOne({ phone: value.phone });
      if (duplicateName || duplicateEmail || duplicatePhone) {
        throw new Error(
          "Contact already in use, Please use a different name, email, or phone number"
        );
      }
      return true;
    }),

    body("email").isEmail().withMessage("Email is invalid"),
    body("phone").isMobilePhone("id-ID").withMessage("Phone number is invalid"),
  ],
  (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.render("add-contact", {
        title: "Add Contact Page",
        layout: "layouts/main-layout",
        errors: result.array(),
      });
    } else {
      Contact.insertMany(req.body);
      req.flash("msg", "Contact added successfully!");
      res.redirect("/contact");
    }
  }
);

// Delete Contact
app.delete("/contact", (req, res) => {
  Contact.deleteOne({ _id: req.body.id }).then();
  req.flash("msg", "Deleted contact is successfully!");
  res.redirect("/contact");
});

// Edit Contact Page
app.get("/contact/edit/:id", async (req, res) => {
  const Id = req.params.id;
  const contact = await Contact.findById(Id);
  res.render("edit-contact", {
    title: "Edit Contact Page",
    layout: "layouts/main-layout",
    contact,
  });
});

// Proccess Edit Contact Page
app.put(
  "/contact",
  [
    body("name").custom(async (value, { req }) => {
      const duplicate = await Contact.findOne({ name: value });
      const chekContact = value !== req.body.oldName && duplicate;
      if (chekContact) {
        throw new Error("Name already exist, Please use a different Name");
      }
      return true;
    }),

    body("email").custom(async (value, { req }) => {
      const duplicate = await Contact.findOne({ email: value });
      const chekContact = value !== req.body.oldEmail && duplicate;
      if (chekContact) {
        throw new Error("Email already exist, Please use a different Email");
      }
      return true;
    }),

    body("phone").custom(async (value, { req }) => {
      const duplicate = await Contact.findOne({ phone: value });
      const chekContact = value !== req.body.oldPhone && duplicate;
      if (chekContact) {
        throw new Error("Phone already exist, Please use a different Phone");
      }
      return true;
    }),

    body("email").isEmail().withMessage("Email is invalid"),
    body("phone").isMobilePhone("id-ID").withMessage("Phone number is invalid"),
  ],
  (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // return res.send({ errors: result.array() });
      return res.render("edit-contact", {
        title: "Edit Contact Page",
        layout: "layouts/main-layout",
        errors: result.array(),
        contact: req.body,
      });
    } else {
      const Id = req.body.id;
      Contact.updateOne(
        { _id: Id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
          },
        }
      ).then();
      // Send flash message
      req.flash("msg", "Edit Contact successfully!");
      res.redirect("/contact");
    }
  }
);

// Detail Contact Page
app.get("/contact/:id", async (req, res) => {
  const Id = req.params.id;
  const contact = await Contact.findById(Id);
  res.render("detail", {
    title: "Detail Contact Page",
    layout: "layouts/main-layout",
    contact,
  });
});

app.listen(port, () => {
  console.log(`Mongo contact app | listening at http://localhost:${port}`);
});

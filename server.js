import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcryptjs';
import db from './db.js';
import session from 'express-session';
import { body, validationResult } from 'express-validator';


const app = express();

app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: false
}));

const registerValidation = [
    body('email').isEmail().withMessage('Invalid email format!'),
    body('password').notEmpty().withMessage('Password cannot be empty.'),
    body('name').notEmpty().withMessage('Name cannot be empty'),
    body('city').notEmpty().withMessage('City cannot be empty'),
    body('district').notEmpty().withMessage('District cannot be empty')
];

const loginValidation = [
    body('email').isEmail().withMessage('Invalid email format!'),
    body('password').notEmpty().withMessage('Password cannot be empty.')
];

app.use(express.static("public"))
app.set("view engine","ejs")
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.APP_PORT || 3000;

app.get('/',(req,res)=>{
    res.render("index")
})
app.get('/login',(req,res)=>{
    res.render('login', { error: null, formData: {} });
})


app.post('/login', loginValidation, async (req,res)=>{

const errors = validationResult(req);
if (!errors.isEmpty()) {
    return res.render('login', { error: errors.array()[0].msg, formData: req.body });
}


const email = req.body.email.trim();
const password = req.body.password.trim();

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length > 0) {
        const user = rows[0];
        console.log("DBden Gelen Hash:", user.password + " - Email: " + user.email);
        const match = await bcrypt.compare(password, user.password);
        console.log("Bcrypt: ", match);
        if (match) {

            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            };
            if(user.role === 'consumer') {
                res.redirect("/main");
            }
            else {
                res.redirect("/market/dashboard");
            }
        } else {
            res.render('login', { error: "Invalid username or password", formData: req.body });
            console.log("Invalid username or password");
        }
    //     if (password === 'password123' || password === user.password) {
    //     console.log("yess");
    //     return res.redirect("/market/dashboard");
    // } else {
    //     console.log("noo");
    //     return res.redirect("/");
    // }



    } else {
        console.log("user not found");
        res.render('login', { error: "Invalid username or password", formData: req.body });
    }




})

app.get('/register', (req, res) => {
    res.render('register', { error: null, formData: {} });
});

app.post('/register', registerValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('register', { error: errors.array()[0].msg, formData: req.body });
    }

    try {
        const { email, password, confirmPassword, role, name, city, district } = req.body;

        
        if (password !== confirmPassword) {
            console.log("Passwords do not match");
            return res.render('register', { 
            error: "passwords dont match", 
            formData: req.body 
        });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);

        await db.query("INSERT INTO users (email, password, role, name, city, district, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1)", [email.trim(), hashedPassword, role, name, city, district]);
        console.log("Kayıt Başarılı: ", email);
        res.redirect('/login');

    } catch (error) {
        console.error("Register Hatası:", error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.render('register', { 
            error: "This email is already registered!", 
            formData: req.body 
        });
        }
        res.status(500).send("Sunucu hatası oluştu.");
    }




})
app.get('/main', (req, res) => {
    res.render('consumerPage');
});
app.get('/market/dashboard',(req,res)=>{
    res.render('dashboard')
})
app.get('/market/addproduct',(req,res)=>{
    res.render('addproduct')
})
app.get('/market/product/edit',(req,res)=>{
    res.render('editproduct')
})
app.get('/cart',(req,res)=>{
    res.render('cart')
})

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${process.env.APP_PORT}`);
});
//- path import
const path = require('path')

//- express and router
const express = require('express')
const router = express.Router()
const app = express()

//- pool import
const pool = require(path.join(__basedir, 'config', 'db-config'))

const generateOTP = require(path.join(__basedir, 'utils', 'generateOTP'))

//- packages
const bcrypt = require('bcrypt')
const rateLimit = require('express-rate-limit');

const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

//- OAuth Credentials for email confirmation
const CLIENT_ID = "179230253575-l6kh9dr95m9rjgbqmjbi4j93brpju79t.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REFRESH_TOKEN = "1//04ZdxS_m4YuihCgYIARAAGAQSNwF-L9IrIhpVKaG-KELvcieAkFeKubRZN44OKE3CKWxd0lc38jxT8Ciszhu70TING5lfbodChJs";
const REDIRECT_URI = "https://developers.google.com/oauthplayground"; //DONT EDIT THIS
const MY_EMAIL = "acisfds@gmail.com";

//- Set up the OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });


//login limiter
const loginRateLimit = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 10, // Limit each IP to 10 requests per `window` (here, per 1 hour).
    message: 'Login Error: 10 Failed Login Attempts! Please try again later',
    requestWasSuccessful: (request, response) => response.statusCode > 200,
    skipSuccessfulRequests: true, 
}) 

//app.use('/', loginRateLimit) 


let otp = generateOTP();

let emailid;


//- "/login" route
router.post('/', loginRateLimit, async(req, res)=>{
    // get username and password from the request body
    const { username, password } = req.body 

    try {
        // 
        const sa_result = await pool.query('SELECT * FROM superadmin_login WHERE username = $1', [username])
        const sa_length = sa_result.rows.length

        // 
        const hsa_result = await pool.query('SELECT * FROM hoteladmin_login WHERE username = $1', [username])
        const hsa_length = hsa_result.rows.length

        //
        const r_result = await pool.query('SELECT * FROM user_login WHERE username = $1', [username])
        const r_length = r_result.rows.length

        // setting user type
        let userType;
        let user;

        // if user is sa
        if(sa_length > 0){
            userType = 'sa'
            user = sa_result.rows[0]
        }

        // if user is hsa
        if(hsa_length > 0){
            userType = 'hsa'
            user = hsa_result.rows[0]
        }

        // if user is r
        if(r_length > 0){
            userType = 'r'
            user = r_result.rows[0]
        }
        
        // Check if the username is not found in any of the tables
        if (sa_length === 0 && hsa_length === 0 && r_length === 0) {
            res.render('login/loginSA', {
                loginError: true,  // pass a flag to indicate an error
                userNotFound: true  // pass a flag to indicate username not found
            });
        }

        // handle sa login
        if(userType === 'sa'){
            // if password is correct
            if(await bcrypt.compare(password, user.hashpassword)){
                // set session
                req.session.userID = user.userid
                req.session.username = user.username

                // redirect to hotels page
                res.redirect('/hotels')
            } else{
                res.render('login/loginSA', {
                    loginError: true  // pass a flag to indicate an error
                })
            }
        }

        // handle hsa login
        if(userType === 'hsa'){
            // if password is correct
            if(await bcrypt.compare(password, user.hashpassword)){
                // set session
                req.session.userID = user.userid
                req.session.username = user.username
                req.session.hotelID = user.hotelid
                req.session.managerRole = user.role

                // redirect 
                if(user.firstlogin === false){
                    res.redirect('/setup')
                } else{
                    res.redirect('/dashboard/hsadmin')
                }
            } else{
                res.render('login/loginSA', {
                    loginError: true  // pass a flag to indicate an error
                })
            }
        }

        // handle r login
        if(userType === 'r'){
            // if password is correct
            if(await bcrypt.compare(password, user.hashpassword)){
                req.session.userID = user.userid
                req.session.username = user.username
                req.session.hotelID = user.hotelid
    
                // redirect 
                res.redirect('/dashboard/receptionist')
            } else {
                res.render('login/loginSA', {
                    loginError: true  // pass a flag to indicate an error
                })
            }
        }

    } catch (error) {
        res.send(error.message)
    }
})



router.get('/forgotpass', async(req, res)=>{
    try {
        res.render('login/forgotpass');
    } catch (error) {
        console.error(error.message);
    }
});


router.get('/otp', async(req, res)=>{
    try {
        res.render('login/otp');
    } catch (error) {
        console.error(error.message);
    }
});

router.get('/changepass', async(req, res)=>{
    try {
        res.render('login/changepass');
    } catch (error) {
        console.error(error.message);
    }
});


router.post('/forgotpass', async(req, res)=>{
    const { email } = req.body;
    emailid = email
    try {
        // Check if the email exists in any of the three tables
        const adminQuery = 'SELECT email FROM hoteladmin_login WHERE email = $1';
        const userQuery = 'SELECT email FROM user_login WHERE email = $1';
        const superadminQuery = 'SELECT email FROM superadmin_login WHERE email = $1';

        const adminResult = await pool.query(adminQuery, [email]);
        const userResult = await pool.query(userQuery, [email]);
        const superadminResult = await pool.query(superadminQuery, [email]);

        if (adminResult.rows.length === 0 && userResult.rows.length === 0 && superadminResult.rows.length === 0) {
            // Email doesn't match any registered user
            console.log("The email you entered doesn't match to any registered user");
            const errorMessage = 'The email you entered does not match to any registered user';
            return res.render('login/forgotpass', { errorMessage });
        }

        // Get the current access token
        const accessToken = oAuth2Client.credentials.access_token;

        const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: MY_EMAIL,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken,
        },
        tls: {
            rejectUnauthorized: true,
        },
        });

        const htmlContent = `
                <html>
                    <body>
                    <h1>One Time Password</h1>
                    <p>
                    This is your OTP: <strong>${otp}</strong>  
                    </body>
                </html>
                `;

        const mailOptions = {
        from: 'acisfds@gmail.com',
        to: email,
        subject: 'Password Reset',
        html: htmlContent,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email could not be sent: ' + error);
                const errorMessage = 'Email could not be sent';
                return res.render('login/forgotpass', { errorMessage });
            } else {
                console.log('Email sent: ' + info.response);
                res.redirect('/login/otp');
            }
        });

    } catch (error) {
        console.error(error.message);
        // Handle other errors if needed
        const errorMessage = 'An error occurred';
        res.render('login/forgotpass', { errorMessage });
    }
});



router.post('/otp', async (req, res) => {
    const { otpinput } = req.body;
    try {
        if (otpinput === otp) {
            // OTP is valid, render the changepass page
            res.redirect('/login/changepass');
            let newotp = generateOTP()
            otp = newotp
        } else {
            // Invalid OTP
            console.log('Invalid OTP');
            const errorMessageOTP = 'Invalid OTP';
            res.render('login/otp', { errorMessageOTP });
        }
    } catch (error) {
        console.error(error.message);
        // Handle other errors if needed
        const errorMessageOTP = 'An error occurred';
        res.render('login/otp', { errorMessageOTP });
    }
});


router.post('/changepass', async (req, res) => {
    const { pass1, pass2 } = req.body;
    try {
        // compare new and confirm password
        if (pass1 !== pass2) {
            console.log('New password and confirm password do not match');
            // Send an error response with the message
            const errorMessageChangePass = 'New password and confirm password do not match. Please try again.';
            return res.render('login/changepass', { errorMessageChangePass });
        }

        const adminQuery = 'SELECT * FROM hoteladmin_login WHERE email = $1';
        const userQuery = 'SELECT * FROM user_login WHERE email = $1';
        const superadminQuery = 'SELECT * FROM superadmin_login WHERE email = $1';

        console.log(emailid);

        const adminResult = await pool.query(adminQuery, [emailid]);
        const userResult = await pool.query(userQuery, [emailid]);
        const superadminResult = await pool.query(superadminQuery, [emailid]);

        // hash new password
        const hashedNewPassword = bcrypt.hashSync(pass2, 10);
        console.log(hashedNewPassword);

        console.log('userResult.rows:', userResult.rows);
        console.log('userResult.length:', userResult.rows.length);

        if (adminResult.rows.length > 0) {
            await pool.query('UPDATE hoteladmin_login SET hashpassword = $1 WHERE email = $2', [hashedNewPassword, emailid])
            console.log('Password updated successfully.');
            return res.redirect('/');
        }
        if (userResult.rows.length > 0) {
            await pool.query('UPDATE user_login SET hashpassword = $1 WHERE email = $2', [hashedNewPassword, emailid]);
            console.log('Password updated successfully.');
            return res.redirect('/');
        }
        if (superadminResult.rows.length > 0) {
            await pool.query('UPDATE superadmin_login SET hashpassword = $1 WHERE email = $2', [hashedNewPassword, emailid])
            console.log('Password updated successfully.');
            return res.redirect('/');
        }

    } catch (error) {
        console.error(error.message);
        // Handle other errors if needed
        const errorMessageChangePass = 'An error occurred';
        res.render('login/changepass', { errorMessageChangePass });
    }
});


module.exports = router
import puppeteer from 'puppeteer';
import axios from 'axios';
import FormData from 'form-data'; // Import FormData for building multipart requests
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const API_KEY = process.env.ANTI_CAPTCHA_API_KEY; // Use API key from environment variables

// Function to solve captcha using Anti-Captcha
const solveCaptcha = async (page) => {
  console.log('Captchas found. Sending to Anti-Captcha for solving...');
  
  // Take a screenshot of the captcha
  const captchaElement = await page.$('.captcha'); // Adjust selector as needed
  const captchaScreenshot = await captchaElement.screenshot();

  // Create a FormData object to upload the captcha image
  const formData = new FormData();
  formData.append('key', API_KEY); // Your Anti-Captcha API key
  formData.append('method', 'base64'); // Method to submit captcha as base64
  formData.append('body', captchaScreenshot.toString('base64')); // Captcha image in base64 format

  // Send the captcha image to Anti-Captcha for solving
  const { data: { taskId } } = await axios.post('https://api.anti-captcha.com/createTask', formData, {
    headers: formData.getHeaders()
  });

  console.log('Captcha task created with ID:', taskId);

  // Poll for the captcha solution
  let solution;
  while (!solution) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    const { data: { solution: { text } } } = await axios.post('https://api.anti-captcha.com/getTaskResult', {
      key: API_KEY,
      taskId
    });

    if (text) {
      solution = text; // Captcha solution found
      console.log('Captcha solved:', solution);
    }
  }

  return solution; // Return the solved captcha
};

// Function to handle login process
const login = async (email, password) => {
  console.log('Starting the browser...');
  const browser = await puppeteer.launch({
    headless: false, // Launch browser in non-headless mode
    args: ['--start-fullscreen'], // Open the browser in full-screen mode
    defaultViewport: null, // Disable the default viewport, allowing full-screen mode
  });

  console.log('Opening a new page...');
  const page = await browser.newPage(); // Open a new page in the browser

  console.log('Navigating to Internshala...');
  await page.goto('https://internshala.com/'); // Navigate to the Internshala website

  console.log('Waiting for the login button to be available...');
  await page.waitForSelector('button.login-cta'); // Ensure the login button is available

  console.log('Scrolling the login button into view...');
  const loginButton = await page.$('button.login-cta');
  await loginButton.evaluate((btn) => btn.scrollIntoView());

  console.log('Clicking the login button to open the login modal...');
  await loginButton.click(); // Click the login button

  console.log('Waiting for the login modal to appear...');
  await page.waitForSelector('#login-modal'); // Wait for the login modal to appear

  console.log('Entering login credentials...');
  await page.type('#modal_email', email); // Input email into the email field
  await page.type('#modal_password', password); // Input password into the password field

  console.log('Submitting the login form...');
  await page.click('#modal_login_submit'); // Click the login button to submit the form

  try {
    console.log('Checking for captcha...');
    await page.waitForSelector('.captcha', { timeout: 30000 }); // Wait for captcha to appear, timeout after 30 seconds
    console.log('Captcha detected.');

    // Solve the captcha
    const captchaSolution = await solveCaptcha(page);

    console.log('Entering captcha solution...');
    await page.type('#captcha_input', captchaSolution); // Input the captcha solution

    console.log('Submitting the captcha...');
    await page.click('#captcha_submit'); // Click the button to submit the captcha solution

    await page.waitForNavigation({ waitUntil: 'networkidle2' }); // Wait for navigation to complete
    console.log('Logged in successfully.');
  } catch (error) {
    console.log('No captcha detected or timeout expired.');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }); // Wait for navigation to complete if no captcha
  }

  return { browser, page }; // Return the browser and page objects for further use
};

// Example usage of the login function
(async () => {
  const email = process.env.EMAIL; // Replace with your email from environment variables
  const password = process.env.PASSWORD; // Replace with your password from environment variables

  // Call the login function and pass the credentials
  const { browser, page } = await login(email, password);

  // Additional functionality or navigation can be added here if needed

  // After logging in, close the browser
  await browser.close();
})();




// the issue with the previous version was that the login page wasnt opening because the screen was not maximized in the headless mode.


import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

(async function () {
    const url = "https://internshala.com/internship/detail/business-consultant-internship-in-jaipur-at-flying-pigeon-solutions1724839800";
    const email = process.env.EMAIL;
    const pwd = process.env.PASSWORD;

    // Start browser
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ["--start-maximized"]
    });

    const [page] = await browser.pages();

    // Go to the internship page
    
    //  Login if necessary
    // Uncomment and modify if login is required
   
    const loginUrl = "https://internshala.com/login/user";
    await page.goto(loginUrl, {
        waitUntil: 'networkidle2'
    });

    await page.waitForSelector("#email");
    await page.type("#email", email, { delay: 100 });

    await page.waitForSelector("#password");
    await page.type("#password", pwd, { delay: 100 });

    await page.waitForSelector("#login_submit");
    await page.click("#login_submit");
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
   

    await page.goto(url, {
        waitUntil: 'networkidle2'
    });


    // Wait for the Apply button to be visible
    await page.waitForSelector('.btn.btn-large'); // Adjust the selector if needed

    // Click the Apply button
    await page.click('.btn.btn-large');

    // Optionally, wait for any new content to load if needed
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('Apply Now button clicked successfully!');

    await browser.close();
})();

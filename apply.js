import fs from 'fs/promises';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import { log } from 'console';

dotenv.config();

const internshipApplyCount = 10;

(async function () {
    const loginUrl = "https://internshala.com/login/user";
    const email = process.env.EMAIL;
    const pwd = process.env.PASSWORD;
    const internshipsUrl = "https://internshala.com/internships/software-development-internship/";

    // Start browser
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ["--start-maximized"]
    });

    const [tab] = await browser.pages();

    // Login
    await tab.goto(loginUrl, {
        waitUntil: "networkidle2"
    });

    await tab.waitForSelector("#email");
    await tab.type("#email", email, { delay: 100 });

    await tab.waitForSelector("#password");
    await tab.type("#password", pwd, { delay: 100 });

    await tab.waitForSelector("#login_submit");
    await tab.click("#login_submit");

    // Go to the software development internships page
    await tab.waitForNavigation({ waitUntil: 'networkidle2' });
    await tab.goto(internshipsUrl, {
        waitUntil: "networkidle2"
    });

    // Wait for internship elements to be visible
    await tab.waitForSelector("div[id^='individual_internship_']");

    // Get all internship elements
    const internshipElements = await tab.$$("div[id^='individual_internship_']");

    // Extract links and store them in the url array
    let url = [];
    for (let i = 0; i < Math.min(internshipApplyCount, internshipElements.length); i++) {
        let internshipLink = await tab.evaluate(element => element.getAttribute('data-href'), internshipElements[i]);
        url.push('https://internshala.com' + internshipLink);
    }

    await tab.goto(url[0]);

    await tab.waitForSelector(".btn.btn-large", { visible: true });
    await tab.click(".btn.btn-large");
    console.log("apply clicked");

    await tab.waitForSelector(".btn.btn-large.education_incomplete.proceed-btn", { visible: true });

    // Scroll the button into view if necessary
    await tab.evaluate(() => {
        document.querySelector('.btn.btn-large.education_incomplete.proceed-btn').scrollIntoView();
    });

    console.log("trying to click application btn");
    await tab.click(".btn.btn-large.education_incomplete.proceed-btn");
    console.log("application btn clicked");

    // Wait for the new page to open
    const newTarget = await new Promise(resolve => browser.once('targetchanged', resolve));
    const newPage = await newTarget.page();

    // Wait for the new page to load
    await newPage.waitForNavigation({ waitUntil: 'networkidle2' });

    // Perform actions on the new page if necessary
    console.log("New page opened after clicking application button.");

    await browser.close();
})();


